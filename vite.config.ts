import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            injectRegister: null,
            registerType: 'autoUpdate',
            manifest: {
                id: './',
                name: 'CubeLab',
                short_name: 'CubeLab',
                lang: 'es',
                description: 'Timer, academia, solucionador y entrenador de cubos.',
                display: 'standalone',
                start_url: './',
                scope: './',
                theme_color: '#111a22',
                background_color: '#111a22',
                icons: [192, 512].map((size) => ({
                    src: 'icon-' + size + '.png',
                    sizes: size + 'x' + size,
                    type: 'image/png',
                    purpose: 'any',
                })),
            },
            workbox: {
                globPatterns: ['**/*.{html,js,css,wasm,json,svg,png,woff2}'],
                maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
            },
        }),
    ],
    optimizeDeps: { exclude: ['cubing'] },
    build: { target: 'es2022' },
    worker: { format: 'es' },
});
