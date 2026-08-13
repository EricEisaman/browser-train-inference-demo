# Browser Train inference demo (TinyStories)

Independent **SvelteKit + Vite** PWA that runs the same TinyStories decoder via:

| Tab | Runtime | Package path |
|-----|---------|--------------|
| ORT | `onnxruntime-web` | `/models/ort/` |
| Transformers.js | `@huggingface/transformers` | `/models/transformers-js/` |

Installable as a Progressive Web App (manifest + service worker via `@vite-pwa/sveltekit`). Icons use the Browser Train logo.

## Prerequisites

- Node 22+
- Sibling [piston](../piston) checkout for one-time ONNX convert (`scripts/export_inference`)
- Python venv in piston with `torch` + `safetensors` (e.g. `piston/.venv-export`)

## Convert the TinyStories checkpoint

The purple-download weights live at the repo root:

- `TinyStories.inference.safetensors` (model card embedded in metadata)

```bash
chmod +x scripts/convert-models.sh
npm run convert
# → static/models/ort/
# → static/models/transformers-js/
# → TinyStories.model.json
```

ONNX artifacts are large (~tens of MB). They are **not** precached by the service worker; after first load they may be cached at runtime under `/models/`.

## Develop

```bash
npm install
npm run convert   # once, if models are missing
npm run dev
```

Open the app, pick **ORT** or **Transformers.js**, **Load model**, then **Generate**.

## Build / deploy

```bash
npm run build   # → build/ (adapter-static)
npm run preview
```

- **Netlify:** [`netlify.toml`](./netlify.toml) — publish `build`, COOP/COEP + wasm headers
- **Render:** [`render.yaml`](./render.yaml) — `npm ci && npm run build`, then `serve build --single`

Watch Netlify/Render upload limits for large ONNX files.

## PWA

- Manifest: name **Browser Train Inference**, theme `#1a0a2e`
- Icons: `static/pwa-192.png`, `static/pwa-512.png`, `favicon.ico`, `apple-touch-icon.png` (from Browser Train logo)
- Dev: service worker enabled (`devOptions.enabled`)
- Production: `registerType: autoUpdate`

## Stack

- SvelteKit + Vite 8 + `@sveltejs/adapter-static`
- `onnxruntime-web`, `@huggingface/transformers`
- `@vite-pwa/sveltekit`
