import { Alg } from 'cubing/alg';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const choose = async (page: Page, id: string) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption(id);
};
const history = async (page: Page) => {
    await page.getByRole('link', { name: 'Estadísticas', exact: true }).click();
    const attempt = page.getByTestId('history-solve');
    await expect(attempt).toHaveCount(1);
    return attempt;
};
const ready = async (page: Page) => {
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled({
        timeout: 15000,
    });
};

for (const id of ['333oh', '444bf', '555bf'] as const) {
    test('cronometra y registra ' + id, async ({ page }) => {
        await choose(page, id);
        await ready(page);
        const inspection = page.getByRole('checkbox', { name: 'Inspección', exact: true });
        if (id === '333oh') {
            await expect(inspection).toBeChecked();
            await inspection.uncheck();
        } else {
            await expect(inspection).toBeDisabled();
            await page
                .getByRole('checkbox', { name: 'Separar memoria y ejecución', exact: true })
                .check();
        }
        const zone = page.getByTestId('touch-zone');
        await page.keyboard.down('Space');
        await expect(zone).toHaveAttribute('data-phase', 'ready');
        await page.keyboard.up('Space');
        await expect(zone).toHaveAttribute('data-phase', 'running');
        await expect(page.getByTestId('digits')).not.toHaveText('0.00');
        if (id !== '333oh') {
            await page.keyboard.press('m');
            await expect(page.getByText('Ejecución', { exact: true })).toBeVisible();
        }
        await page.keyboard.press('KeyS');
        await expect(page.getByTestId('session-count')).toHaveText('Intentos en la sesión: 1');
        await expect(zone).toHaveAttribute('data-phase', 'idle');
        const attempt = await history(page);
        if (id !== '333oh') {
            await expect(page.getByRole('rowheader', { name: /Bo3/ })).toBeVisible();
            await attempt.locator('summary').click();
            await expect(attempt.getByText(/Memoria .* · Ejecución /)).toBeVisible();
        }
    });
}

test('entrega FMC y registra el conteo OBTM', async ({ page }) => {
    await choose(page, '333fm');
    await page.getByRole('button', { name: 'Preparar intento', exact: true }).click();
    await expect(page.getByTestId('modality-countdown')).toHaveText('1:00:00', { timeout: 15000 });
    await expect(page.getByTestId('scramble')).toHaveCount(0);
    await page.getByRole('button', { name: 'Iniciar intento', exact: true }).click();
    const scramble = (await page.getByTestId('scramble').innerText()).trim();
    expect(scramble).toMatch(/^R' U' F .+ R' U' F$/);
    // A synthetic solution for checking the verifier, not a judged competition attempt.
    const inverse = new Alg(scramble).invert().toString();
    await page.getByRole('textbox', { name: 'Solución escrita', exact: true }).fill(inverse + ' x');
    await page.getByRole('button', { name: 'Entregar solución', exact: true }).click();
    const score = inverse.trim().split(/\s+/).length + ' mov.';
    await expect(page.getByTestId('modality-result')).toHaveText(score);
    await expect((await history(page)).locator('summary')).toContainText(score);
});

test('genera dos mezclas de Multi-Blind y registra el resultado al límite', async ({ page }) => {
    await choose(page, '333mbf');
    await page.getByRole('spinbutton', { name: 'Cubos a intentar', exact: true }).fill('2');
    await page.getByRole('button', { name: 'Preparar intento', exact: true }).click();
    await expect(page.getByTestId('multi-scrambles').locator('li')).toHaveCount(2);
    await expect(page.getByTestId('modality-countdown')).toHaveText('20:00');
    await page.clock.install();
    await page.getByRole('button', { name: 'Iniciar intento', exact: true }).click();
    await expect(page.getByTestId('multi-scrambles')).toHaveCount(0);
    await page.clock.fastForward(1200000);
    await page.getByRole('spinbutton', { name: 'Cubos resueltos', exact: true }).fill('2');
    await page.getByRole('button', { name: 'Guardar resultado', exact: true }).click();
    await expect(page.getByTestId('modality-result')).toHaveText('2/2 · 2 pts · 20:00');
    await expect((await history(page)).locator('summary')).toContainText('2/2 · 2 pts · 20:00');
    await expect(page.getByText('Clasificación del evento', { exact: true })).toBeVisible();
});
