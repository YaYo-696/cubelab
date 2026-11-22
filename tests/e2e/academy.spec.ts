import { expect, test } from './fixtures';
import { questionBank } from '../../src/core/academy/questions';

test('completa notación 3×3 y desbloquea cruz después de recargar', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('cubelab.test.progressGates', 'on'));
    await page.goto('/#academy');
    await page.getByLabel('Evento').selectOption('333');
    const notation = page.getByRole('button', { name: 'Notación', exact: true });
    const cross = page.getByRole('button', { name: 'Cruz de la primera capa', exact: true });
    await expect(cross).toBeDisabled();
    await notation.click();
    await page.getByRole('button', { name: 'R', exact: true }).click();
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-alg', 'R');
    await expect(page.locator('[data-visualization="3D"] twisty-player')).toHaveCount(1);
    await expect(page.getByTestId('academy-net').locator('twisty-player')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Rw', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await page.getByRole('button', { name: 'Volver al inicio', exact: true }).click();
    await page.getByRole('button', { name: 'Paso siguiente', exact: true }).click();
    await expect
        .poll(() =>
            page.evaluate(async () => {
                const primary = document.querySelector<HTMLElementTagNameMap['twisty-player']>(
                    '[data-visualization="3D"] twisty-player',
                );
                const secondary = document.querySelector<HTMLElementTagNameMap['twisty-player']>(
                    '[data-testid=academy-net] twisty-player',
                );
                if (!primary || !secondary) return false;
                const [a, b] = await Promise.all([
                    primary.experimentalGet.timestamp(),
                    secondary.experimentalGet.timestamp(),
                ]);
                return a > 0 && a === b;
            }),
        )
        .toBe(true);
    for (const [i, answer] of ['Verdadero', 'Falso', 'Verdadero', 'Verdadero', 'Falso'].entries()) {
        await page
            .getByTestId('academy-question-' + i)
            .getByRole('radio', { name: answer })
            .check();
    }
    await page.getByRole('button', { name: 'Comprobar respuestas' }).click();
    await expect(page.getByText('5 de 5 correctas')).toBeVisible();
    await expect(cross).toBeEnabled();
    await page.getByRole('button', { name: 'Notación avanzada', exact: true }).click();
    await page.getByRole('button', { name: 'Rw', exact: true }).click();
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-alg', 'Rw');
    await page.reload();
    await expect(cross).toBeEnabled();
    await notation.click();
    await expect(page.getByRole('status').filter({ hasText: 'Lección completada' })).toBeVisible();
});

test('evalúa notación, recomienda la lección y guarda el historial', async ({ page }) => {
    await page.goto('/#evaluation');
    await page.getByLabel('Evento').selectOption('333');
    await page.getByRole('button', { name: 'Empezar evaluación' }).click();
    const card = page.getByTestId('evaluation-question');
    for (let i = 0; i < 12; i++) {
        await expect(page.getByText('Pregunta ' + (i + 1) + ' de 12')).toBeVisible();
        const id = await card.getAttribute('data-question-id');
        const q = questionBank.find((value) => value.id === id)!;
        if (q.picture)
            await expect(card.locator('[data-visualization="3D"] twisty-player')).toHaveCount(1);
        await card
            .getByRole('radio')
            .nth(q.skill === 'basic' ? (q.correct + 1) % q.optionKeys.length : q.correct)
            .check();
        await page
            .getByRole('button', { name: i === 11 ? 'Terminar evaluación' : 'Siguiente', exact: true })
            .click();
    }
    await expect(page.getByRole('heading', { name: 'Resultado por habilidad' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Repasa Notación', exact: true })).toHaveAttribute(
        'href',
        '#academy/notationB',
    );
    await page.reload();
    await page.getByRole('button', { name: /Principiante ·/ }).click();
    await page.getByRole('link', { name: 'Repasa Notación', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Notación', exact: true })).toBeVisible();
});
