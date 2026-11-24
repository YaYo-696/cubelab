import { expect, test } from './fixtures';

test('cronometra Megaminx y consulta el intento en Estadísticas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption('minx');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled({
        timeout: 10000,
    });
    const scramble = (await page.getByTestId('scramble').textContent())!.trim();
    expect(scramble.split(/\s+/).every((move) => /^(?:[RD](?:\+\+|--)|U'?)$/.test(move))).toBe(
        true,
    );
    const player = page.getByTestId('academy-player');
    await expect(player).toHaveAttribute('data-visualization', '2D');
    await expect
        .poll(() =>
            player.locator('twisty-player').evaluate(async (node) => {
                const twisty = node as HTMLElementTagNameMap['twisty-player'];
                return (await twisty.experimentalModel.puzzleLoader.get()).id;
            }),
        )
        .toBe('megaminx');

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
    await expect(page.getByRole('combobox', { name: 'Evento', exact: true })).toHaveValue('minx');
    const solve = page.getByTestId('history-solve');
    await expect(solve).toHaveCount(1);
    await solve.locator('summary').click();
    await page.getByRole('link', { name: 'Ver en el solucionador', exact: true }).click();
    await expect(
        page.getByText('El solucionador de Megaminx aún no está disponible.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mezcla', exact: true })).toHaveValue(scramble);
    await expect(page.getByRole('button', { name: 'Resolver', exact: true })).toBeDisabled();
});
