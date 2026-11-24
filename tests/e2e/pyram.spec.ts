import { expect, test } from './fixtures';
import { devFlags } from '../../src/config/devFlags';

test('cronometra Pyraminx y resuelve la mezcla del historial', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption('pyram');
    const next = page.getByRole('button', {
        name: 'Siguiente mezcla',
        exact: true,
    });
    await expect(next).toBeEnabled({ timeout: 10000 });
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-visualization', '2D');
    const scramble = (await page.getByTestId('scramble').innerText()).trim();
    expect(scramble).toMatch(/^[ULRBulrb]'?(?: [ULRBulrb]'?)*$/);
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
    const stages = page.getByTestId('solver-stage');
    await expect(stages).toHaveCount(2);
    const total = await stages.evaluateAll((rows) =>
        rows.reduce((sum, row) => sum + Number(row.getAttribute('data-moves')), 0),
    );
    expect(total).toBeGreaterThanOrEqual(6);
    await expect(page.getByTestId('solver-total')).toHaveAttribute('data-moves', String(total));
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-visualization', '3D');
    await expect(page.getByTestId('academy-player').locator('twisty-player')).toHaveJSProperty(
        'tagName',
        'TWISTY-PLAYER',
    );
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
});

test('aplica SHOW_UNOFFICIAL a Pyraminx Duo y a su lección', async ({ page }) => {
    if (!devFlags.SHOW_UNOFFICIAL) {
        await page.goto('/#academy/duo-two-steps/pyramduo');
        await expect(page.getByRole('heading', { name: 'Academia', exact: true })).toBeVisible();
        for (const section of ['Academia', 'Timer', 'Entrenador', 'Evaluación', 'Estadísticas', 'Solucionador']) {
            await page.getByRole('link', { name: section, exact: true }).click();
            const selector = page.getByRole('combobox', { name: section === 'Solucionador' ? 'Puzzle' : 'Evento', exact: true });
            await expect(selector).toBeVisible();
            await expect(selector.getByRole('option', { name: 'Pyraminx Duo', exact: true })).toHaveCount(0);
        }
        return;
    }
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption('pyramduo');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    await expect(page.getByText('Mezcla de práctica', { exact: true })).toBeVisible();
    const net = page.getByRole('img', {
        name: 'Animación del cubo',
        exact: true,
    });
    await expect(net.locator('polygon')).toHaveCount(16);
    const scramble = (await page.getByTestId('scramble').innerText()).trim();
    expect(scramble).toMatch(/^[ULRB]'?(?: [ULRB]'?){0,3}$/);

    await page.getByRole('link', { name: 'Academia', exact: true }).click();
    await page.getByRole('button', { name: 'Pyraminx Duo en dos pasos', exact: true }).click();
    await expect(
        page.getByRole('heading', {
            level: 2,
            name: 'Pyraminx Duo en dos pasos',
            exact: true,
        }),
    ).toBeVisible();
    await expect(net.locator('polygon')).toHaveCount(16);
    const before = await net
        .locator('polygon')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('fill')));
    await page.getByRole('button', { name: 'Paso siguiente', exact: true }).click();
    await expect
        .poll(() =>
            net
                .locator('polygon')
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('fill'))),
        )
        .not.toEqual(before);
});
