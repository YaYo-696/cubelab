import { expect, test } from '@playwright/test';

test('selecciona un PLL por su vista superior, lo reproduce y reconoce el caso', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('cubelab.test.progressGates', 'on'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    await page.evaluate(
        () =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open('cubelab');
                open.onerror = () => reject(open.error);
                open.onsuccess = () => {
                    const db = open.result,
                        tx = db.transaction('lessons', 'readwrite');
                    for (const lessonId of ['pll3', 'notationA'])
                        tx.objectStore('lessons').put({
                            courseId: 'academy-333',
                            lessonId,
                            revision: 1,
                            completedAt: 1,
                            quizScore: 3,
                        });
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
    await page.goto('/#academy/fullPLL-corners');
    await expect(page.getByRole('heading', { name: 'PLL · Solo esquinas', exact: true })).toBeVisible();
    const aa = page.getByRole('button', { name: 'Aa', exact: true });
    await expect(aa.getByRole('img').locator('rect')).toHaveCount(21);
    await aa.click();
    const opening = page.getByRole('list', {
        name: 'Inicio del algoritmo',
        exact: true,
    });
    await expect(opening.getByRole('listitem').first()).toHaveText('Gira el cubo · x');
    await expect(page.getByTestId('academy-player')).toHaveAttribute(
        'data-alg',
        "x R' U R' D2 R U' R' D2 R2",
    );
    await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
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

    const first = page.getByTestId('academy-question-0');
    await expect(first.getByRole('img').locator('rect')).toHaveCount(21);
    await first.getByRole('radio', { name: 'Aa', exact: true }).check();
    await page.getByTestId('academy-question-1').getByRole('radio', { name: 'Ab', exact: true }).check();
    await page.getByTestId('academy-question-2').getByRole('radio', { name: 'E', exact: true }).check();
    await page.getByRole('button', { name: 'Comprobar respuestas', exact: true }).click();
    await expect(page.getByText('3 de 3 correctas', { exact: true })).toBeVisible();
});
