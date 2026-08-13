import {
	AutoModelForCausalLM,
	AutoTokenizer,
	Tensor,
	type PreTrainedModel,
	type PreTrainedTokenizer
} from '@huggingface/transformers';

import { cleanupBpeText } from '$lib/decodeText';
import '$lib/transformersEnv';

const DEFAULT_BLOCK_SIZE = 32;

export type LoadedTjsModel = {
	tokenizer: PreTrainedTokenizer;
	model: PreTrainedModel;
	modelType: string;
	blockSize: number;
};

/**
 * Load a Hub-style Transformers.js package under /models/<id>/.
 * Default id `transformers-js` → static/models/transformers-js/
 */
export const loadTjsModel = async (modelId = 'transformers-js'): Promise<LoadedTjsModel> => {
	const tokenizer = await AutoTokenizer.from_pretrained(modelId);
	const model = await AutoModelForCausalLM.from_pretrained(modelId, { dtype: 'fp32' });
	const cfg = (
		model as {
			config?: { model_type?: string; n_positions?: number; max_position_embeddings?: number };
		}
	).config;
	const blockSize = cfg?.n_positions ?? cfg?.max_position_embeddings ?? DEFAULT_BLOCK_SIZE;
	return {
		tokenizer,
		model,
		modelType: cfg?.model_type ?? 'gpt2',
		blockSize
	};
};

const idsToTensor = (ids: number[]): Tensor =>
	new Tensor(
		'int64',
		BigInt64Array.from(ids.map((id) => BigInt(id))),
		[1, ids.length]
	);

const onesMask = (length: number): Tensor =>
	new Tensor('int64', BigInt64Array.from({ length }, () => 1n), [1, length]);

const sequenceFromGenerate = (
	out: { tolist?: () => number[][] | bigint[][] } | number[][] | bigint[][]
): number[] => {
	const sequences =
		typeof (out as { tolist?: () => number[][] }).tolist === 'function'
			? (out as { tolist: () => number[][] | bigint[][] }).tolist()
			: (out as number[][] | bigint[][]);
	const row = sequences[0] ?? [];
	return row.map((t) => Number(t));
};

/**
 * Greedy decode with a sliding window capped at the model's position length.
 * Uses Tensor inputs (required by Transformers.js ONNX sessions).
 */
export const generateTjs = async (
	loaded: LoadedTjsModel,
	prompt: string,
	options: { maxNewTokens?: number; blockSize?: number } = {}
): Promise<string> => {
	const maxNew = options.maxNewTokens ?? 48;
	const blockSize = options.blockSize ?? loaded.blockSize ?? DEFAULT_BLOCK_SIZE;
	const ids = [...(await tokenizePrompt(loaded.tokenizer, prompt))];

	const anyModel = loaded.model as PreTrainedModel & {
		generate?: (opts: Record<string, unknown>) => Promise<
			{ tolist?: () => number[][] | bigint[][] } | number[][] | bigint[][]
		>;
	};

	if (typeof anyModel.generate !== 'function') {
		throw new Error('Model has no generate(); check @huggingface/transformers version');
	}

	for (let step = 0; step < maxNew; step++) {
		const window = ids.length > blockSize ? ids.slice(ids.length - blockSize) : ids;
		const out = await anyModel.generate!({
			input_ids: idsToTensor(window),
			attention_mask: onesMask(window.length),
			max_new_tokens: 1,
			do_sample: false
		});
		const seq = sequenceFromGenerate(out);
		const next = seq[seq.length - 1];
		if (next === undefined) {
			break;
		}
		ids.push(next);
		const eos = (loaded.tokenizer as { eos_token_id?: number | null }).eos_token_id;
		if (eos != null && next === eos) {
			break;
		}
	}

	return cleanupBpeText(loaded.tokenizer.decode(ids, { skip_special_tokens: true }));
};

/** Tokenize with the same HF tokenizer used by TJS (also for ORT BPE prompts). */
export const tokenizePrompt = async (
	tokenizer: PreTrainedTokenizer,
	prompt: string
): Promise<number[]> => {
	const encoded = await tokenizer(prompt, { return_tensor: false });
	const ids = encoded.input_ids;
	if (Array.isArray(ids?.[0])) {
		return (ids as number[][])[0]!;
	}
	return ids as number[];
};
