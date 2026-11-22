import { expect, test } from '@playwright/test';

test('abre un solve del timer en CFOP y reproduce etapas con el total comprobado', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    const scramble = await page.getByTestId('scramble').innerText();
    await page.getByLabel('Inspección', { exact: true }).uncheck();
    const zone = page.getByTestId('touch-zone');
    await page.keyboard.down('Space');
    await expect(zone).toHaveAttribute('data-phase', 'ready');
    await page.keyboard.up('Space');
    await expect(zone).toHaveAttribute('data-phase', 'running');
    await expect(page.getByTestId('digits')).not.toHaveText('0.00');
    await page.keyboard.press('KeyS');
    await expect(page.getByTestId('session-count')).toHaveText('Intentos en la sesión: 1');
    await expect(zone).toHaveAttribute('data-phase', 'idle');
    await page.getByRole('link', { name: 'Estadísticas', exact: true }).click();
    await page.getByTestId('history-solve').locator('summary').click();
    await page.getByRole('link', { name: 'Ver en el solucionador', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Mezcla', exact: true })).toHaveValue(
        scramble.trim(),
    );
    await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('cfopFull');
    await page.getByRole('button', { name: 'Resolver', exact: true }).click();
    const stages = page.getByTestId('solver-stage');
    const total = page.getByTestId('solver-total');
    await expect(stages).toHaveCount(7, { timeout: 35000 });
    const numbers = await stages.evaluateAll((rows) =>
        rows.map((row) => Number(row.getAttribute('data-moves'))),
    );
    await expect(total).toHaveAttribute('data-moves', String(numbers.reduce((a, b) => a + b, 0)));
    const firstMovable = numbers.findIndex((n) => n > 0);
    expect(firstMovable).toBeGreaterThanOrEqual(0);
    await stages.nth(firstMovable).getByRole('button').click();
    await page.getByRole('button', { name: 'Paso siguiente', exact: true }).click();
    await expect
        .poll(() =>
            page.evaluate(async () => {
                const player = document.querySelector<HTMLElementTagNameMap['twisty-player']>(
                    '[data-visualization="3D"] twisty-player',
                );
                return player ? Number(await player.experimentalGet.timestamp()) : 0;
            }),
        )
        .toBeGreaterThan(0);
    await expect(page.getByTestId('academy-net').locator('twisty-player')).toHaveCount(1);
});
