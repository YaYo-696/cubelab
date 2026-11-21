import type { Solve } from '../../src/core/storage/db';
import { formatTime } from '../../src/core/timer/times';
import { expect, test, type Page } from '@playwright/test';

async function openTimer(page: Page) {
    await page.goto('/');
    await expect(page.getByText('Mezcla generada con criterios WCA')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente mezcla' })).toBeEnabled();
}

async function pauseClock(page: Page) {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
}
async function holdSpaceWithClock(page: Page) {
    await page.keyboard.down('Space');
    await page.clock.runFor(300);
    await page.keyboard.up('Space');
    await expect(page.getByTestId('touch-zone')).toHaveAttribute('data-phase', 'running');
}
// Read from an independent connection. Resolve only on transaction completion.
async function committedSolves(page: Page): Promise<Solve[]> {
    return page.evaluate(
        () =>
            new Promise<Solve[]>((resolve, reject) => {
                const open = indexedDB.open('cubelab');
                open.onerror = () => reject(open.error);
                open.onsuccess = () => {
                    const connection = open.result;
                    const tx = connection.transaction('solves', 'readonly');
                    const request = tx.objectStore('solves').getAll();
                    tx.oncomplete = () => {
                        connection.close();
                        resolve(request.result);
                    };
                    tx.onabort = () => {
                        connection.close();
                        reject(tx.error);
                    };
                };
            }),
    );
}

test('teclado, guardado y recuperación tras recargar', async ({ page }) => {
    await openTimer(page);
    await page.getByLabel('Inspección', { exact: true }).uncheck();
    const zone = page.getByTestId('touch-zone');
    await page.keyboard.down('Space');
    await expect(zone).toHaveAttribute('data-phase', 'ready');
    await page.keyboard.up('Space');
    await expect(zone).toHaveAttribute('data-phase', 'running');
    await expect(page.getByTestId('digits')).not.toHaveText('0.00');
    await page.keyboard.press('KeyS');

    const counter = page.getByTestId('session-count');
    const row = page.getByTestId('recent').locator('li');
    await expect(counter).toHaveText('Intentos en la sesión: 1');
    await expect(zone).toHaveAttribute('data-phase', 'idle'); // saved() has run after commit
    const committed = await committedSolves(page);
    expect(committed).toHaveLength(1);
    const [solve] = committed;
    expect(solve).toMatchObject({
        sessionId: 'default:333',
        eventId: '333',
        source: 'timer',
        penalty: 'none',
    });
    if (solve.result.kind !== 'time') throw new Error('Se esperaba un intento cronometrado');
    expect(solve.result.timeMs).toBeGreaterThan(0);
    const displayed = formatTime(solve.result.timeMs);
    await expect(row).toHaveText(displayed);

    await page.reload();
    expect(await committedSolves(page)).toEqual(committed);
    await expect(counter).toHaveText('Intentos en la sesión: 1');
    await expect(row).toHaveText(displayed);
});
test('inspección de 15 segundos aplica +2 y conserva el tiempo bruto', async ({ page }) => {
    await openTimer(page);
    await pauseClock(page);
    await page.keyboard.press('Space');
    await expect(page.getByTestId('touch-zone')).toHaveAttribute('data-phase', 'inspecting');
    await page.clock.fastForward(14700);
    await holdSpaceWithClock(page);
    await page.clock.runFor(1200);
    await page.keyboard.press('Enter');
    await page.clock.resume();
    const row = page.getByTestId('recent').locator('li');
    await expect(row).toHaveText('3.20 (+2)');
    await page.getByRole('button', { name: '+2', exact: true }).click();
    await expect(row).toHaveText('1.20');
});

test('un segundo contacto o pointercancel devuelve el timer al reposo', async ({ page }) => {
    await openTimer(page);
    await page.getByLabel('Inspección', { exact: true }).uncheck();
    const zone = page.getByTestId('touch-zone');
    await pauseClock(page);
    const touch = (event: string, id: number) =>
        zone.dispatchEvent(event, {
            pointerId: id,
            pointerType: 'touch',
            bubbles: true,
            cancelable: true,
        });
    await touch('pointerdown', 1);
    await page.clock.runFor(350);
    await expect(zone).toHaveAttribute('data-phase', 'ready');
    await touch('pointerdown', 2);
    await touch('pointerup', 2);
    await touch('pointerup', 1);
    await expect(zone).toHaveAttribute('data-phase', 'idle');
    await touch('pointerdown', 3);
    await touch('pointercancel', 3);
    await page.clock.runFor(350);
    await expect(zone).toHaveAttribute('data-phase', 'idle');
    await page.clock.resume();
    await expect(page.getByTestId('recent').locator('li')).toHaveCount(0);
    expect(await committedSolves(page)).toHaveLength(0);
});
