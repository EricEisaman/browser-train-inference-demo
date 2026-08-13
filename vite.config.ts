import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

const coopHeaders = {
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Opener-Policy': 'same-origin'
};

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			manifest: {
				name: 'Browser Train Inference',
				short_name: 'BT Infer',
				description:
					'TinyStories inference demo: onnxruntime-web and Transformers.js in the browser',
				theme_color: '#1a0a2e',
				background_color: '#1a0a2e',
				lang: 'en',
				categories: ['education', 'developer'],
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/pwa-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/pwa-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// App shell only — ONNX packages are too large to precache
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}'],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				navigateFallback: undefined,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
						handler: 'CacheFirst',
						options: {
							cacheName: 'browser-train-inference-models',
							expiration: {
								maxEntries: 64,
								maxAgeSeconds: 60 * 60 * 24 * 30
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
	server: {
		headers: coopHeaders
	},
	preview: {
		headers: coopHeaders
	},
	optimizeDeps: {
		exclude: ['onnxruntime-web']
	},
	assetsInclude: ['**/*.onnx', '**/*.wasm']
});
