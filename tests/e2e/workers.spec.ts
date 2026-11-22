import { expect, test } from './fixtures';

declare const process: { getBuiltinModule(name: 'node:fs'): { readdirSync(path: URL): string[] } };

test.use({ serviceWorkers: 'block' });

test('los workers de producción responden al primer trabajo en menos de 10 s', async ({
    page,
    context,
}) => {
    const files = process
        .getBuiltinModule('node:fs')
        .readdirSync(new URL('../../dist/assets/', import.meta.url));
    const entries = [
        { name: 'puzzle', job: { id: 1, kind: 'scramble', puzzle: '333', input: '333' } },
        { name: 'puzzle', job: { id: 2, kind: 'scramble', puzzle: '222', input: '222' } },
        { name: 'case', job: { id: 1, kind: 'case', puzzle: '333', setId: 'fullPLL', input: 'Aa' } },
        {
            name: 'solver',
            job: { kind: 'solve', puzzle: '333', method: 'shortest', input: 'R U', neutral: false },
        },
        { name: 'stats', job: { session: [], event: [] } },
    ];
    await context.route('**/__worker-check', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }),
    );
    await page.goto('/__worker-check');
    const start = entries.map(({ name, job }) => {
        const path = files.find((file) => file.startsWith(name + '.worker-') && file.endsWith('.js'));
        expect(path, 'Worker de producción ' + name).toBeDefined();
        return { url: '/assets/' + path, job };
    });
    const results = await page.evaluate(
        (jobs) =>
            Promise.all(
                jobs.map(
                    ({ url, job }) =>
                        new Promise<unknown>((resolve, reject) => {
                            const began = performance.now();
                            const worker = new Worker(url, { type: 'module' });
                            const timeout = setTimeout(() => {
                                close();
                                reject(new Error('Sin respuesta en 10 s: ' + url));
                            }, 10000);
                            function close() {
                                clearTimeout(timeout);
                                worker.terminate();
                            }
                            worker.onmessage = ({ data }) => {
                                if (data.progress) return;
                                const elapsed = performance.now() - began;
                                close();
                                if (data.error)
                                    reject(new Error(url + ': ' + (data.error.message ?? data.error)));
                                else if (elapsed >= 10000)
                                    reject(new Error(url + ': ' + elapsed + ' ms'));
                                else resolve(data);
                            };
                            worker.onerror = (event) => {
                                close();
                                reject(new Error(url + ': ' + event.message));
                            };
                            worker.onmessageerror = () => {
                                close();
                                reject(new Error('Respuesta ilegible: ' + url));
                            };
                            worker.postMessage(job);
                        }),
                ),
            ),
        start,
    );
    expect(results).toMatchObject([
        { id: 1, result: expect.stringMatching(/\S/) },
        { id: 2, result: expect.stringMatching(/\S/) },
        { id: 1, result: { verified: true, scramble: expect.stringMatching(/\S/) } },
        { result: { status: 'solved' } },
        { stats: expect.any(Object), records: expect.any(Array) },
    ]);
});

test('el Timer muestra y registra el error real de arranque y permite reintentar', async ({
    page,
    context,
}) => {
    const workerUrl = '**/assets/puzzle.worker-*.js';
    await context.route(workerUrl, (route) =>
        route.fulfill({
            contentType: 'application/javascript',
            headers: { 'cache-control': 'no-store' },
            body: 'throw new Error("arranque simulado del worker");',
        }),
    );
    const errors: string[] = [];
    page.on('console', (entry) => {
        if (entry.type() === 'error') errors.push(entry.text());
    });
    await page.goto('/');
    await expect(
        page.getByRole('alert').filter({ hasText: 'arranque simulado del worker' }),
    ).toBeVisible();
    await expect
        .poll(() =>
            errors.some(
                (line) =>
                    line.includes('CubeLab scramble worker:') &&
                    line.includes('arranque simulado del worker'),
            ),
        )
        .toBe(true);
    await expect(page.getByTestId('scramble')).toHaveText('Mezcla no disponible');
    await context.unroute(workerUrl);
    await page.getByRole('button', { name: 'Reintentar generación', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Siguiente mezcla', exact: true })).toBeEnabled({
        timeout: 10000,
    });
    await expect(
        page.getByRole('alert').filter({ hasText: 'arranque simulado del worker' }),
    ).toHaveCount(0);
});
