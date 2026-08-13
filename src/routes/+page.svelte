<script lang="ts">
	import {
		cleanupBpeText,
		completeIds,
		generateTjs,
		loadOrtModel,
		loadTjsModel,
		tokenizePrompt,
		type LoadedOrtModel,
		type LoadedTjsModel
	} from '$lib';
	import '$lib/transformersEnv';
	import TutorialPanel from '$lib/tutorial/TutorialPanel.svelte';
	import { AutoTokenizer, type PreTrainedTokenizer } from '@huggingface/transformers';

	type Tab = 'ort' | 'tjs' | 'tutorial';

	let tab = $state<Tab>('ort');
	let prompt = $state('Once upon a time');
	let maxNewTokens = $state(24);
	let status = $state('Load a model to begin.');
	let isError = $state(false);
	let output = $state('');
	let loading = $state(false);
	let running = $state(false);

	let ortModel = $state<LoadedOrtModel | null>(null);
	let ortTokenizer = $state<PreTrainedTokenizer | null>(null);
	let tjsModel = $state<LoadedTjsModel | null>(null);

	const setStatus = (msg: string, error = false) => {
		status = msg;
		isError = error;
	};

	const load = async () => {
		loading = true;
		running = false;
		setStatus(tab === 'ort' ? 'Loading ORT package…' : 'Loading Transformers.js package…');
		try {
			if (tab === 'ort') {
				ortModel = await loadOrtModel('/models/ort/');
				ortTokenizer = await AutoTokenizer.from_pretrained('ort');
				setStatus(
					`ORT ready · ${ortModel.architecture} · vocab ${ortModel.manifest.vocabSize}` +
						` · context ${ortModel.blockSize}` +
						(ortModel.manifest.dataset ? ` · ${ortModel.manifest.dataset}` : '')
				);
			} else {
				tjsModel = await loadTjsModel('transformers-js');
				setStatus(
					`Transformers.js ready · ${tjsModel.modelType} · context ${tjsModel.blockSize}`
				);
			}
		} catch (err) {
			if (tab === 'ort') {
				ortModel = null;
				ortTokenizer = null;
			} else {
				tjsModel = null;
			}
			setStatus(err instanceof Error ? err.message : String(err), true);
		} finally {
			loading = false;
		}
	};

	const generate = async () => {
		running = true;
		setStatus('Generating…');
		try {
			if (tab === 'ort') {
				if (!ortModel || !ortTokenizer) {
					throw new Error('Load the ORT model first');
				}
				const ids = await tokenizePrompt(ortTokenizer, prompt);
				const outIds = await completeIds(ortModel, ids, {
					maxNewTokens,
					eosId: ortModel.eosId
				});
				output = cleanupBpeText(
					ortTokenizer.decode(outIds, { skip_special_tokens: true })
				);
			} else {
				if (!tjsModel) {
					throw new Error('Load the Transformers.js model first');
				}
				output = await generateTjs(tjsModel, prompt, { maxNewTokens });
			}
			setStatus('Done');
		} catch (err) {
			setStatus(err instanceof Error ? err.message : String(err), true);
		} finally {
			running = false;
		}
	};

	const ready = $derived(
		tab === 'ort' ? ortModel != null && ortTokenizer != null : tjsModel != null
	);

	const showGenerate = $derived(tab === 'ort' || tab === 'tjs');
</script>

<main class:main-tutorial={tab === 'tutorial'}>
	<header class="brand">
		<img src="/brand-icon.png" width="48" height="48" alt="Browser Train" class="brand-icon" />
		<div>
			<h1>Browser Train inference demo: TinyStories</h1>
			<p class="lede">
				Installable PWA. Same converted checkpoint via
				<strong>onnxruntime-web</strong>
				or
				<strong>Transformers.js</strong>.
				See the
				<strong>Tutorial</strong>
				tab for train → convert → deploy (all topologies).
			</p>
		</div>
	</header>

	<div class="tabs" role="tablist">
		<button
			type="button"
			class:active={tab === 'ort'}
			role="tab"
			aria-selected={tab === 'ort'}
			onclick={() => {
				tab = 'ort';
				setStatus(
					ortModel
						? `ORT ready · vocab ${ortModel.manifest.vocabSize} · context ${ortModel.blockSize}`
						: 'Load the ORT model to begin.'
				);
			}}
		>
			ORT
		</button>
		<button
			type="button"
			class:active={tab === 'tjs'}
			role="tab"
			aria-selected={tab === 'tjs'}
			onclick={() => {
				tab = 'tjs';
				setStatus(
					tjsModel
						? `Transformers.js ready · ${tjsModel.modelType} · context ${tjsModel.blockSize}`
						: 'Load the Transformers.js model to begin.'
				);
			}}
		>
			Transformers.js
		</button>
		<button
			type="button"
			class:active={tab === 'tutorial'}
			role="tab"
			aria-selected={tab === 'tutorial'}
			onclick={() => {
				tab = 'tutorial';
			}}
		>
			Tutorial
		</button>
	</div>

	{#if tab === 'tutorial'}
		<TutorialPanel />
	{:else if showGenerate}
		<p class="status" class:error={isError}>{status}</p>

		<label for="prompt">Prompt</label>
		<textarea id="prompt" bind:value={prompt}></textarea>

		<div class="row">
			<div>
				<label for="maxNew">Max new tokens</label>
				<input id="maxNew" type="number" min="1" max="256" bind:value={maxNewTokens} />
			</div>
			<div>
				<label for="backend">Backend</label>
				<input
					id="backend"
					readonly
					value={tab === 'ort' ? 'onnxruntime-web' : '@huggingface/transformers'}
				/>
			</div>
		</div>

		<div class="actions">
			<button type="button" disabled={loading} onclick={load}>
				{loading ? 'Loading…' : 'Load model'}
			</button>
			<button
				type="button"
				class="secondary"
				disabled={!ready || running || loading}
				onclick={generate}
			>
				{running ? 'Generating…' : 'Generate'}
			</button>
		</div>

		<label for="output">Output</label>
		<div id="output" class="out">{output || '-'}</div>

		<p class="lede" style="margin-top: 1.5rem; font-size: 0.9rem">
			Packages served from
			<code>/models/ort/</code>
			and
			<code>/models/transformers-js/</code>.
			TinyStories context is 32 tokens; generation uses a sliding window so longer outputs stay valid.
		</p>
	{/if}
</main>
