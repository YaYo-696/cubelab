import { expect, test } from './fixtures';

test('completa un Ao5 con cutoff y una mezcla extra sin conexión y consulta la hoja', async ({
    page,
    context,
}) => {
    await page.goto('/#settings');
    await expect(page.getByText('Listo para usar sin conexión.', { exact: true })).toBeVisible({
        timeout: 30_000,
    });
    await context.setOffline(true);
    await page.getByRole('link', { name: 'Competencia', exact: true }).click();
    await page
        .getByRole('textbox', { name: 'Nombre de la competencia', exact: true })
        .fill('Práctica Ao5');
    await page.getByRole('button', { name: 'Crear competencia', exact: true }).click();
    await page.getByRole('combobox', { name: 'Evento', exact: true }).selectOption('333');
    await expect(page.getByRole('combobox', { name: 'Formato de ronda', exact: true })).toHaveValue(
        'ao5',
    );
    await page.getByRole('checkbox', { name: 'Cutoff', exact: true }).check();
    await page
        .getByRole('spinbutton', {
            name: 'Cutoff (menos de estos segundos)',
            exact: true,
        })
        .fill('3');
    await page.getByRole('button', { name: 'Crear ronda', exact: true }).click();
    const reveal = page.getByRole('button', {
        name: 'Revelar mezcla del intento',
        exact: true,
    });
    await expect(reveal).toBeEnabled({ timeout: 25_000 });
    const scramble = page.getByTestId('competition-scramble');
    const results = page.getByTestId('competition-attempt-result');
    await expect(scramble).toHaveCount(0);

    await page.clock.install();
    const timer = page.getByTestId('competition-timer');
    async function runAttempt() {
        await expect(scramble).toHaveCount(0);
        await reveal.click();
        await expect(scramble).toHaveCount(1);
        const current = await scramble.innerText();
        await timer.focus();
        await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
        await page.keyboard.press('Space');
        await expect(timer).toHaveAttribute('data-phase', 'inspecting');
        await page.keyboard.down('Space');
        await page.clock.runFor(400);
        await expect(timer).toHaveAttribute('data-phase', 'ready');
        await page.keyboard.up('Space');
        await expect(timer).toHaveAttribute('data-phase', 'running');
        await expect(scramble).toHaveCount(0);
        await page.clock.runFor(1200);
        await page.keyboard.press('KeyS');
        await page.clock.resume();
        return current;
    }

    const original = await runAttempt();
    await page.getByRole('button', { name: 'Repetir con mezcla extra', exact: true }).click();
    await expect(
        page.getByRole('heading', {
            name: 'Intento 1 · Mezcla extra',
            exact: true,
        }),
    ).toBeVisible();
    await expect(results.first()).toHaveText('—');
    const replacement = await runAttempt();
    expect(replacement).not.toBe(original);
    await page.getByRole('button', { name: 'Confirmar intento', exact: true }).click();
    await expect(results.first()).toHaveText(/^1\.\d{2}$/);

    for (let i = 1; i < 5; i++) {
        await runAttempt();
        if (i === 1)
            await page
                .getByRole('combobox', { name: 'Decisión del juez', exact: true })
                .selectOption('+2');
        await page.getByRole('button', { name: 'Confirmar intento', exact: true }).click();
        await expect(results.nth(i)).toHaveText(i === 1 ? /^3\.\d{2} \(\+2\)$/ : /^1\.\d{2}$/);
    }
    await expect(page.getByRole('heading', { name: 'Hoja de resultados', exact: true })).toBeVisible();
    await expect(page.getByTestId('competition-round-status')).toHaveText('Ronda completada');
    await expect(page.getByTestId('competition-average')).toHaveText(/^1\.\d{2}$/);
    await expect(reveal).toHaveCount(0);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar JSON', exact: true }).click();
    const stream = await (await download).createReadStream();
    let json = '';
    for await (const chunk of stream) json += chunk.toString();
    const sheet = JSON.parse(json);
    expect(sheet.round.attempts[0].attempt.scramble).toEqual([replacement]);
    expect(json).not.toContain(original);
    const csvExport = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV', exact: true }).click();
    const csvStream = await (await csvExport).createReadStream();
    let csv = '';
    for await (const chunk of csvStream) csv += chunk.toString();
    expect(csv).toContain('"Intento 1","Intento 2","Intento 3","Intento 4","Intento 5"');
    expect(csv).toContain('"Ronda completada"');
    await page.reload();
    await expect(page.getByTestId('competition-round-status')).toHaveText('Ronda completada');
    await page.getByRole('link', { name: 'Estadísticas', exact: true }).click();
    await page
        .getByRole('combobox', { name: 'Origen de resultados', exact: true })
        .selectOption('competition');
    await expect(page.getByTestId('competition-average')).toHaveText(/^1\.\d{2}$/);
});
