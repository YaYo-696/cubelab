import { afterEach, expect, it, vi } from 'vitest';
import { requestSolution } from '../../src/workers/solverClient';

class SearchWorker {
    static last: SearchWorker;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror = null;
    onmessageerror = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() {
        SearchWorker.last = this;
    }
}
afterEach(() => vi.unstubAllGlobals());
it('aborta una búsqueda activa y desecha el worker y las respuestas parciales', async () => {
    vi.stubGlobal('Worker', SearchWorker);
    const controller = new AbortController();
    const onProgress = vi.fn();
    const result = requestSolution('222', 'shortest', 'R U', controller.signal, { onProgress });
    const worker = SearchWorker.last;
    worker.onmessage?.({ data: { progress: { key: 'solveProgressTable', value: 35 } } });
    expect(onProgress).toHaveBeenCalledOnce();
    controller.abort();
    expect(await result).toEqual({ status: 'cancelled' });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(await requestSolution('222', 'shortest', 'R U', controller.signal)).toEqual({
        status: 'cancelled',
    });
    expect(SearchWorker.last).toBe(worker);
});
