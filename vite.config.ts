import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [react(), VitePWA({
            registerType: 'autoUpdate',
            manifest: { name: 'CubeLab', short_name: 'CubeLab', lang: 'es', display: 'standalone',
                theme_color: '#111a22', background_color: '#111a22', start_url: './',
                icons: [192, 512].map(n => ({ src: 'icon-' + n + '.png', sizes: n + 'x' + n, type: 'image/png' })) },
            workbox: { globPatterns: ['**/*.{html,js,css,wasm,json,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 25 * 1024 * 1024 }
        })],
    optimizeDeps: { exclude: ['cubing'] },
    build: { target: 'es2022' }, worker: { format: 'es' }
});
