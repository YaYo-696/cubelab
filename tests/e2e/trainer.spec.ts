import { expect, test } from '@playwright/test';

test('registra tres prácticas de PLL completo y conserva el intento con ayuda', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    // Open the same set when the release gates are enabled.
    await page.evaluate(
        () =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open('cubelab');
                open.onerror = () => reject(open.error);
                open.onsuccess = () => {
                    const db = open.result;
                    const tx = db.transaction('lessons', 'readwrite');
                    const store = tx.objectStore('lessons');
                    for (const lessonId of ['pll3', 'notationA']) {
                        store.put({
                            courseId: 'academy-333',
                            lessonId,
                            revision: 1,
                            completedAt: 1,
                            quizScore: 3,
                        });
                    }
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                    tx.onabort = () => {
                        db.close();
                        reject(tx.error);
                    };
                };
            }),
    );
    await page.getByRole('link', { name: 'Entrenador', exact: true }).click();
    await page.getByRole('combobox', { name: 'Set de algoritmos', exact: true }).selectOption('fullPLL');
    await page.getByRole('combobox', { name: 'Caso', exact: true }).selectOption('Aa');
    const next = page.getByRole('button', { name: 'Siguiente caso', exact: true });
    const timer = page.getByTestId('trainer-timer');
    const attempts = page.getByTestId('trainer-attempt');
    for (let i = 0; i < 3; i++) {
        await next.click();
        await expect(page.getByTestId('trainer-scramble')).not.toBeEmpty({ timeout: 15000 });
        if (i === 1) {
            await page.getByRole('button', { name: 'Mostrar algoritmo', exact: true }).click();
            await expect(page.getByTestId('academy-player')).toBeVisible();
        }
        await timer.focus();
        await page.keyboard.down('Space');
        await expect(timer).toHaveAttribute('data-phase', 'ready');
        await page.keyboard.up('Space');
        await expect(timer).toHaveAttribute('data-phase', 'running');
        await expect(timer.locator('.digits')).not.toHaveText('0.00');
        await page.keyboard.press('KeyS');
        await expect(attempts).toHaveCount(i + 1);
        await expect(attempts.first()).toHaveText(
            i === 1 ? /^Aa · \d+\.\d{2} · Con ayuda$/ : /^Aa · \d+\.\d{2}$/,
        );
    }
    await page.goto('/#trainer/fullPLL/Aa');
    await expect(attempts).toHaveCount(3);
    await expect(attempts.filter({ hasText: 'Con ayuda' })).toHaveCount(1);
    await expect(
        page.getByRole('row').filter({
            has: page.getByRole('rowheader', { name: 'Aa', exact: true }),
        }),
    ).toContainText('33 %');
});
