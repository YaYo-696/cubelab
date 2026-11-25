import { expect, test } from './fixtures';

for (const [id, name, puzzle] of [
    ['sq1', 'Square-1', 'square1'],
    ['clock', 'Clock', 'clock'],
] as const) {
    test('cronometra ' + name + ' y consulta el intento en Estadísticas', async ({ page }) => {
        await page.goto('/');
        const event = page.getByRole('combobox', { name: 'Evento', exact: true });
        const scramble = page.getByTestId('scramble');
        const squareOne = /\(-?[0-6], -?[0-6]\).*\//;
        const timeout = id === 'sq1' ? 30_000 : 10_000;
        await expect(event.getByRole('option', { name, exact: true })).toBeAttached();
        const selectedAt = performance.now();
        await event.selectOption(id);
        if (id === 'sq1') {
            await expect(scramble.filter({ hasText: squareOne })).toBeVisible({ timeout });
            const elapsed = Math.round(performance.now() - selectedAt);
            test.info().annotations.push({ type: 'sq1-primera-mezcla-ms', description: String(elapsed) });
            console.log(`[sq1] primera mezcla: ${elapsed} ms`);
        }
        await expect(
            page.getByRole('button', { name: 'Siguiente mezcla', exact: true }),
        ).toBeEnabled({ timeout });
        const mix = (await scramble.innerText()).trim();
        expect(mix).toMatch(id === 'sq1' ? squareOne : /(?:[A-Z]+[0-6][+-]).*y2/);

        const player = page.getByTestId('academy-player');
        await expect(player).toHaveAttribute('data-visualization', '2D');
        await expect(page.getByRole('button', { name: 'Vista 3D', exact: true })).toHaveCount(0);
        await expect
            .poll(() =>
                player.locator('twisty-player').evaluate(async (node) => {
                    const twisty = node as HTMLElementTagNameMap['twisty-player'];
                    return (await twisty.experimentalModel.puzzleLoader.get()).id;
                }),
            )
            .toBe(puzzle);

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
        await expect(event).toHaveValue(id);
        const solve = page.getByTestId('history-solve');
        await expect(solve).toHaveCount(1);
        await solve.locator('summary').click();
        await page.getByRole('link', { name: 'Ver en el solucionador', exact: true }).click();
        await expect(page.getByRole('textbox', { name: 'Mezcla', exact: true })).toHaveValue(mix);
        await page.getByRole('button', { name: 'Resolver', exact: true }).click();
        await expect(page.getByTestId('side-solution')).toBeVisible({ timeout: 35_000 });
    });
}
