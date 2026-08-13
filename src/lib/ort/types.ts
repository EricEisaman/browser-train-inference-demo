export type OrtManifest = {
	architecture: 'decoder' | 'encoder-decoder' | 'encoder';
	onnx: string;
	inputs: Array<{ name: string; dtype: string }>;
	outputs: Array<{ name: string; dtype: string }>;
	vocabSize: number;
	embeddingSize: number;
	tokenizer: {
		kind: 'char' | 'hf';
		vocabFile?: string;
		specialTokensFile?: string;
		tokenizerFile?: string;
	};
	dataset?: string;
};

export type LoadedOrtModel = {
	architecture: OrtManifest['architecture'];
	manifest: OrtManifest;
	session: import('onnxruntime-web').InferenceSession;
	/** EOS id from model card / special tokens when known */
	eosId: number | null;
	/** Learned PE / context length from model card (TinyStories onnx = 32) */
	blockSize: number;
};
