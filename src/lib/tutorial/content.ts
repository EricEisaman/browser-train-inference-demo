export type TutorialWhere = 'browser' | 'local' | 'deploy';

export type TutorialStep = {
	id: string;
	n: number;
	title: string;
	where: TutorialWhere;
	body: string;
};

export type TopologyRow = {
	topology: string;
	presets: string;
	ort: string;
	transformersJs: string;
};

export const TUTORIAL_INTRO =
	'This walkthrough applies to every exportable Browser Train route: decoder language models, encoder-decoder toys, and encoder (Dyck) MLM. This demo ships a TinyStories decoder checkpoint; the same pipeline works for the other topologies.';

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: 'preset',
		n: 1,
		title: 'Pick an exportable preset in Browser Train',
		where: 'browser',
		body: 'Prefer a *-onnx sibling (tinystories-onnx, sort-characters-onnx, reverse-sequence-onnx, two-sum-onnx, dyck-encoder-onnx, fineweb-onnx, lil-siggy-onnx) or apply the ONNX export-friendly overlay. Purple ONNX download is blocked by GQA, attention gating, qkNorm, RoPE, ALiBi, sinks, softcap, or RNN.'
	},
	{
		id: 'train',
		n: 2,
		title: 'Train until metrics look good',
		where: 'browser',
		body: 'Run training and watch validation loss and in-app completions. Export captures weights as they are now; undertrained models produce fluent-looking but wrong outputs. See Training advice below.'
	},
	{
		id: 'purple',
		n: 3,
		title: 'Purple ONNX download',
		where: 'browser',
		body: 'While the run is active, download {run}.inference.safetensors and {run}.model.json. For HF BPE (TinyStories, FineWeb, Lil Siggy), also keep {run}.tokenizer.json beside them. This is not the gray full checkpoint used to resume training.'
	},
	{
		id: 'toolkit',
		n: 4,
		title: 'Get the conversion toolkit',
		where: 'browser',
		body: 'In Browser Train Docs, download browser-train-onnx-toolkit.zip (also /browser-train-onnx-toolkit.zip on the site). Unzip on your machine; no piston clone required.'
	},
	{
		id: 'setup',
		n: 5,
		title: 'Local setup (once)',
		where: 'local',
		body: 'Run ./setup.sh (macOS/Linux) or setup.bat (Windows). Creates a local .venv and installs PyTorch. Re-run only on a new machine; do not redistribute the venv.'
	},
	{
		id: 'convert',
		n: 6,
		title: 'Convert',
		where: 'local',
		body: './convert.sh path/to/run.inference.safetensors -o ./out writes out/ort/ (onnxruntime-web) and out/transformers-js/ (Hub-style folder). Matching .model.json next to the safetensors file is picked up automatically.'
	},
	{
		id: 'topology',
		n: 7,
		title: 'Choose a runtime and API by topology',
		where: 'deploy',
		body: 'Use the table below. ORT and Transformers.js consume the same converted checkpoint with different APIs and packaging.'
	},
	{
		id: 'wire',
		n: 8,
		title: 'Wire into an app',
		where: 'deploy',
		body: 'Copy out/ort/* into a static folder (this demo: /models/ort/) and/or out/transformers-js/* into /models/transformers-js/. Load the model, then complete / encodeDecode / encodeMasked (ORT) or CausalLM / Seq2SeqLM / MaskedLM (Transformers.js). Respect context length (blockSize); use a sliding window if needed. For NL BPE text, strip the leading-space marker Ġ after decode.'
	},
	{
		id: 'host',
		n: 9,
		title: 'Deploy',
		where: 'deploy',
		body: 'Host the static build (Netlify, Render, or similar). Set COOP/COEP headers and correct Content-Type for .wasm when using ORT. This demo is also an installable PWA.'
	}
];

export const TOPOLOGY_ROWS: TopologyRow[] = [
	{
		topology: 'decoder',
		presets: 'TinyStories / FineWeb / Lil Siggy *-onnx',
		ort: 'complete',
		transformersJs: 'CausalLM (gpt2)'
	},
	{
		topology: 'encoder-decoder',
		presets: 'sort / reverse / two-sum *-onnx',
		ort: 'encodeDecode',
		transformersJs: 'Seq2SeqLM (BART)'
	},
	{
		topology: 'encoder',
		presets: 'dyck-encoder-onnx',
		ort: 'encodeMasked',
		transformersJs: 'MaskedLM (BERT)'
	}
];

export const TRAINING_ADVICE: { title: string; body: string }[] = [
	{
		title: 'Train on the export sibling from the start',
		body: 'Use tinystories-onnx, sort-characters-onnx, dyck-encoder-onnx, and similar from the first step. Overlaying ONNX-friendly after a GQA or gating run does not rematerialize correct export weights.'
	},
	{
		title: 'Match the task format at inference',
		body: 'Use the same prompt separators (for example CBA: for sort), the same tokenizer and vocab, and the same special tokens (<mask> for Dyck). Mismatched formats look like model failure.'
	},
	{
		title: 'Respect context length',
		body: 'blockSize / context is fixed at export. Short prompts leave room for completion. Long prompts need truncation or a sliding window so position embeddings do not overflow.'
	},
	{
		title: 'Watch val loss and completions before export',
		body: 'Purple-download only after Browser Train completions look right on held-out examples. Undertrained toys can still emit long text that is wrong.'
	},
	{
		title: 'Batch size and VRAM',
		body: 'Use smaller batches for large NL presets so steps actually finish. Inference quality tracks learning steps, not UI polish.'
	},
	{
		title: 'Keep tokenizer sidecars',
		body: 'For HF BPE, keep {run}.tokenizer.json next to the inference safetensors so convert installs a real tokenizer.json (avoid ending up with tokenizer.note.json only).'
	},
	{
		title: 'Purple packages do not resume training',
		body: 'Use the gray full .safetensors checkpoint to resume inside Browser Train. Inference packages are weights-only for deploy.'
	},
	{
		title: 'If purple download is blocked',
		body: 'Switch to a *-onnx preset or apply ONNX export-friendly, then retrain. Export refuses RoPE, ALiBi, GQA, gating, qkNorm, sinks, softcap, and RNN.'
	}
];

export const WHERE_LABEL: Record<TutorialWhere, string> = {
	browser: 'In Browser Train',
	local: 'On your machine',
	deploy: 'In your app'
};
