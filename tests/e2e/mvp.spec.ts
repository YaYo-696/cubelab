import { expect, test } from '@playwright/test';

test('primera apertura y ruta completa con el build de producción en modo avión', async ({
    page,
    context,
}) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Empieza en CubeLab', exact: true })).toBeVisible();
    const next = page.getByRole('button', { name: 'Continuar', exact: true });
    await next.click();
    await page.getByRole('radio', { name: '3×3', exact: true }).check();
    await next.click();
    await expect(page.getByRole('heading', { name: '¿Sabes armarlo?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sí, abrir Timer', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Timer', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
    await page.getByRole('checkbox', { name: 'Inspección', exact: true }).uncheck();
    const zone = page.getByTestId('touch-zone');
    await zone.focus();
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
    await expect(page.getByRole('textbox', { name: 'Mezcla', exact: true })).not.toHaveValue('');
    await page.getByRole('button', { name: 'Resolver', exact: true }).click();
    await expect(page.getByTestId('solver-total')).toBeVisible({ timeout: 35000 });
    await expect(page.locator('[data-visualization="3D"] twisty-player')).toHaveCount(1);

    await page.getByRole('link', { name: 'Academia', exact: true }).click();
    await page.getByRole('button', { name: 'Notación', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Notación', exact: true })).toBeVisible();
    for (const [i, answer] of ['Verdadero', 'Falso', 'Verdadero', 'Verdadero', 'Falso'].entries())
        await page
            .getByTestId('academy-question-' + i)
            .getByRole('radio', { name: answer, exact: true })
            .check();
    await page.getByRole('button', { name: 'Comprobar respuestas', exact: true }).click();
    await expect(page.getByText('5 de 5 correctas', { exact: true })).toBeVisible();
    // Seed prerequisites for the offline trainer path even in the release profile.
    await page.evaluate(
        () =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open('cubelab');
                open.onerror = () => reject(open.error);
                open.onsuccess = () => {
                    const db = open.result;
                    const tx = db.transaction('lessons', 'readwrite');
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
    await page.getByRole('link', { name: 'Entrenador', exact: true }).click();
    await page.getByRole('combobox', { name: 'Set de algoritmos', exact: true }).selectOption('fullPLL');
    await expect(page.getByTestId('trainer-scramble')).not.toBeEmpty({ timeout: 15000 });

    await page.getByRole('link', { name: 'Evaluación', exact: true }).click();
    await page.getByRole('button', { name: 'Empezar evaluación', exact: true }).click();
    const card = page.getByTestId('evaluation-question');
    for (let i = 0; i < 12; i++) {
        await card.getByRole('radio').first().check();
        await page
            .getByRole('button', { name: i === 11 ? 'Terminar evaluación' : 'Siguiente', exact: true })
            .click();
    }
    await expect(
        page.getByRole('heading', { name: 'Resultado por habilidad', exact: true }),
    ).toBeVisible();
});

test('la ruta principiante, los ajustes y el borrado funcionan desde una instalación nueva', async ({
    page,
}) => {
    await page.goto('/');
    const next = page.getByRole('button', { name: 'Continuar', exact: true });
    await next.click();
    await page.getByRole('radio', { name: '2×2', exact: true }).check();
    await next.click();
    await page.getByRole('button', { name: 'No, aprender a armarlo', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Notación', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Evento', exact: true })).toHaveValue('222');

    await page.getByRole('link', { name: 'Ajustes', exact: true }).click();
    await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('light');
    await page.getByRole('combobox', { name: 'Tamaño del timer', exact: true }).selectOption('large');
    await page
        .getByRole('combobox', { name: 'Esquema de colores del cubo', exact: true })
        .selectOption('contrast');
    await page.getByRole('combobox', { name: 'Vista previa del Timer', exact: true }).selectOption('3D');
    await page.getByRole('spinbutton', { name: 'Preparación (ms)', exact: true }).fill('450');
    await page.getByRole('checkbox', { name: 'Inspección por defecto', exact: true }).uncheck();
    await page.getByRole('checkbox', { name: 'Sonidos de inspección', exact: true }).uncheck();
    await page.getByRole('checkbox', { name: 'Vibración de inspección', exact: true }).uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-timer-size', 'large');
    await expect(page.locator('html')).toHaveAttribute('data-cube-colors', 'contrast');
    await page.getByRole('link', { name: 'Timer', exact: true }).click();
    await expect(page.locator('[data-visualization="3D"] twisty-player')).toHaveCount(1);
    await expect(page.getByRole('checkbox', { name: 'Inspección', exact: true })).not.toBeChecked();
    await expect(page.getByRole('spinbutton', { name: 'Preparación (ms)', exact: true })).toHaveValue(
        '450',
    );

    await page.getByRole('link', { name: 'Ajustes', exact: true }).click();
    await page.getByRole('button', { name: 'Borrar todos los datos', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Borrar todos los datos', exact: true });
    await expect(dialog.getByRole('button', { name: 'Exportar JSON', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Confirmar borrado', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Empieza en CubeLab', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Saltar introducción', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Timer', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test.describe('carga diferida sin precache', () => {
    test.use({ serviceWorkers: 'block' });
    test('el Timer plano solo solicita el motor 3D al activarlo', async ({ page }) => {
        const assets: string[] = [];
        page.on('request', (request) => assets.push(request.url()));
        await page.goto('/');
        await page.getByRole('button', { name: 'Saltar introducción', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled();
        expect(assets.some((url) => /twisty-dynamic-3d-/.test(url))).toBe(false);
        await page.getByRole('button', { name: 'Vista 3D', exact: true }).click();
        await expect.poll(() => assets.some((url) => /twisty-dynamic-3d-/.test(url))).toBe(true);
    });
});
