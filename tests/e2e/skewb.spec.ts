import { expect, test } from './fixtures';

test('cronometra Skewb y reproduce la solución del intento', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption('skewb');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled({
        timeout: 10000,
    });
    const scramble = (await page.getByTestId('scramble').innerText()).trim();
    expect(scramble).toMatch(/^[RULB]'?(?: [RULB]'?)*$/);
    const player = page.getByTestId('academy-player');
    await expect(player).toHaveAttribute('data-visualization', '2D');
    await expect.poll(() => player.locator('twisty-player').evaluate(async (node) => {
        const twisty = node as HTMLElementTagNameMap['twisty-player'];
        const model = twisty.experimentalModel;
        return [(await model.puzzleLoader.get()).id, await model.visualizationStrategy.get()];
    })).toEqual(['skewb', '2D']);

    await page.getByRole('checkbox', { name: 'Inspección', exact: true }).uncheck();
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
    await expect(page.getByRole('textbox', { name: 'Mezcla', exact: true })).toHaveValue(scramble);
    await page.getByRole('button', { name: 'Resolver', exact: true }).click();
    await expect(page.getByTestId('solver-stage')).toHaveCount(1);
    await expect(player).toHaveAttribute('data-visualization', '3D');
    await page.getByRole('button', { name: 'Paso siguiente', exact: true }).click();
    await expect
        .poll(() =>
            player.locator('twisty-player').evaluate(async (node) => {
                const twisty = node as HTMLElementTagNameMap['twisty-player'];
                return Number(await twisty.experimentalGet.timestamp());
            }),
        )
        .toBeGreaterThan(0);
});
