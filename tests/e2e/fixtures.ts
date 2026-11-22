import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export const test = base.extend({
    page: async ({ page }, use) => {
        await page.addInitScript(() => {
            try {
                localStorage.setItem('cubelab.onboarded', 'yes');
            } catch {
                /* documents without an origin */
            }
        });
        await use(page);
    },
});
