import { expect, test } from './fixtures';

test('cinco solves, edición histórica, respaldo y restauración', async ({ page }, testInfo) => {
    await page.goto('/');
    const next = page.getByRole('button', { name: 'Siguiente mezcla' });
    const inspection = page.getByLabel('Inspección', { exact: true });
    const zone = page.getByTestId('touch-zone');
    await expect(next).toBeEnabled();
    await inspection.uncheck();
    await page.clock.install();
    for (let i = 1; i <= 5; i++) {
        await expect(next).toBeEnabled();
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        await page.keyboard.down('Space');
        await page.clock.runFor(310);
        await page.keyboard.up('Space');
        await expect(zone).toHaveAttribute('data-phase', 'running');
        await page.clock.runFor(i * 1000);
        await page.keyboard.press('Enter');
        await page.clock.resume();
        await expect(page.getByTestId('session-count')).toHaveText('Intentos en la sesión: ' + i);
        await expect(zone).toHaveAttribute('data-phase', 'idle');
    }
    await page.getByRole('link', { name: 'Estadísticas' }).click();
    const ao5 = page.getByTestId('current-ao5');
    await expect(ao5).toHaveText('3.00');
    const solves = page.getByTestId('history-solve');
    await expect(solves).toHaveCount(5);
    const old = solves.nth(3);
    await old.locator('summary').click();
    await old.getByRole('button', { name: '+2', exact: true }).click();
    await expect(ao5).toHaveText('3.67');
    await ao5.getByRole('button').click();
    await expect(page.locator('.stats-breakdown')).toContainText('(1.00)');
    await expect(page.locator('.stats-breakdown')).toContainText('(5.00)');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar JSON' }).click();
    const file = testInfo.outputPath('cubelab.json');
    await (await download).saveAs(file);
    await page.evaluate(
        () =>
            new Promise<void>((resolve, reject) => {
                const open = indexedDB.open('cubelab');
                open.onerror = () => reject(open.error);
                open.onsuccess = () => {
                    const db = open.result,
                        tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
                    for (const name of db.objectStoreNames) tx.objectStore(name).clear();
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
    await page.reload();
    await expect(page.getByText('Aún no hay intentos en esta sesión.')).toBeVisible();
    await expect(solves).toHaveCount(0);
    await page.getByLabel('Importar JSON').setInputFiles(file);
    await expect(page.getByRole('status')).toHaveText('Respaldo importado.');
    await expect(solves).toHaveCount(5);
    await expect(ao5).toHaveText('3.67');
});
