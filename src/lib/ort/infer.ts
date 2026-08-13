import * as ort from 'onnxruntime-web';

import type { LoadedOrtModel, OrtManifest } from './types';

const DEFAULT_BLOCK_SIZE = 32;

const joinUrl = (base: string, path: string): string => {
	const normalized = base.endsWith('/') ? base : `${base}/`;
	return `${normalized}${path.replace(/^\//, '')}`;
};

const loadJson = async <T>(url: string): Promise<T> => {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status}`);
	}
	return (await res.json()) as T;
};

/**
 * Load an ONNX package from a directory URL (e.g. `/models/ort/`).
 */
export const loadOrtModel = async (baseUrl: string): Promise<LoadedOrtModel> => {
	const manifest = await loadJson<OrtManifest>(joinUrl(baseUrl, 'ort-manifest.json'));
	const onnxUrl = joinUrl(baseUrl, manifest.onnx);
	const session = await ort.InferenceSession.create(onnxUrl, {
		executionProviders: ['wasm']
	});

	let eosId: number | null = null;
	let blockSize = DEFAULT_BLOCK_SIZE;
	try {
		const card = await loadJson<{
			blockSize?: number | { source?: number; target?: number };
			tokenizer?: { eosId?: number | null };
		}>(joinUrl(baseUrl, 'model.json'));
		eosId = card.tokenizer?.eosId ?? null;
		if (typeof card.blockSize === 'number' && card.blockSize > 0) {
			blockSize = card.blockSize;
		} else if (card.blockSize && typeof card.blockSize === 'object') {
			const n = card.blockSize.target ?? card.blockSize.source;
			if (typeof n === 'number' && n > 0) {
				blockSize = n;
			}
		}
	} catch {
		/* optional */
	}

	return {
		architecture: manifest.architecture,
		manifest,
		session,
		eosId,
		blockSize
	};
};

const argmaxLast = (logits: Float32Array, vocabSize: number, seqLen: number): number => {
	const offset = (seqLen - 1) * vocabSize;
	let best = 0;
	let bestVal = -Infinity;
	for (let i = 0; i < vocabSize; i++) {
		const v = logits[offset + i]!;
		if (v > bestVal) {
			bestVal = v;
			best = i;
		}
	}
	return best;
};

/**
 * Autoregressive completion for decoder-only ONNX models.
 * Pass token ids (from HF AutoTokenizer) — TinyStories is BPE, not char.
 *
 * Uses a sliding window of `blockSize` so generation can continue past the
 * learned position-embedding length without ORT broadcast errors (32 vs 33).
 */
export const completeIds = async (
	model: LoadedOrtModel,
	promptIds: number[],
	options: { maxNewTokens?: number; eosId?: number | null; blockSize?: number } = {}
): Promise<number[]> => {
	if (model.architecture !== 'decoder') {
		throw new Error('completeIds() requires a decoder model');
	}
	const maxNew = options.maxNewTokens ?? 32;
	const eos = options.eosId ?? model.eosId;
	const blockSize = options.blockSize ?? model.blockSize ?? DEFAULT_BLOCK_SIZE;
	const ids = [...promptIds];
	const inputNames = new Set(model.manifest.inputs.map((i) => i.name));

	for (let step = 0; step < maxNew; step++) {
		const window = ids.length > blockSize ? ids.slice(ids.length - blockSize) : ids;
		const feeds: Record<string, ort.Tensor> = {
			input_ids: new ort.Tensor('int64', BigInt64Array.from(window.map(BigInt)), [
				1,
				window.length
			])
		};
		if (inputNames.has('attention_mask')) {
			feeds.attention_mask = new ort.Tensor(
				'int64',
				BigInt64Array.from(window.map(() => 1n)),
				[1, window.length]
			);
		}
		const out = await model.session.run(feeds);
		const logits = out.logits.data as Float32Array;
		const next = argmaxLast(logits, model.manifest.vocabSize, window.length);
		ids.push(next);
		if (eos != null && next === eos) {
			break;
		}
	}
	return ids;
};
