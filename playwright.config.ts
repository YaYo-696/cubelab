import { defineConfig } from '@playwright/test';
declare const process: { platform: string; env: { CUBELAB_E2E_BROWSER?: string } };

const browser = process.env.CUBELAB_E2E_BROWSER ?? (process.platform === 'win32' ? 'msedge' : 'chromium');
if (browser !== 'msedge' && browser !== 'chromium') {
    throw new Error('CUBELAB_E2E_BROWSER debe ser msedge o chromium');
}

export default defineConfig({
    testDir: 'tests/e2e',
    use: {
        browserName: 'chromium',
        channel: browser === 'msedge' ? 'msedge' : undefined,
        baseURL: 'http://localhost:4173',
    },
    webServer: {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
    },
    timeout: 90000,
});
