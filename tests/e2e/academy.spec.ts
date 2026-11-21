import { expect, test } from '@playwright/test';
test('completa notación 3×3 y desbloquea cruz después de recargar', async ({ page }) => {
    await page.goto('/#academy');
    await page.getByLabel('Evento').selectOption('333');
    const notation = page.getByRole('button', { name: 'Notación', exact: true });
    const cross = page.getByRole('button', { name: 'Cruz de la primera capa', exact: true });
    await expect(cross).toBeDisabled();
    await notation.click();
    await page.getByRole('button', { name: 'Rw', exact: true }).click();
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-alg', 'Rw');
    await expect(page.locator('twisty-player')).toHaveCount(1);
    for (const [i, answer] of ['Verdadero', 'Falso', 'Verdadero'].entries()) {
        await page
            .getByTestId('academy-question-' + i)
            .getByRole('radio', { name: answer })
            .check();
    }
    await page.getByRole('button', { name: 'Comprobar respuestas' }).click();
    await expect(page.getByText('3 de 3 correctas')).toBeVisible();
    await expect(cross).toBeEnabled();
    await page.reload();
    await expect(cross).toBeEnabled();
    await notation.click();
    await expect(page.getByRole('status').filter({ hasText: 'Lección completada' })).toBeVisible();
});
