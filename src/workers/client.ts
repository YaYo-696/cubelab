import type { Job } from './puzzle.worker';
import type { VerifiedCase } from '../core/contracts';
import type { CubeId } from '../puzzles/events';
let nextId = 0;
// Each active task owns a worker so cancellation also stops CPU-bound searches.
// Reuse finished workers to retain the bounded distance table and puzzle engine.
let spare: Worker | undefined;
function run(kind: 'scramble', puzzle: CubeId, input: string, signal: AbortSignal): Promise<string>;
function run(kind: 'case', puzzle: CubeId, input: string, signal: AbortSignal): Promise<VerifiedCase>;
function run(kind: Job['kind'], puzzle: CubeId, input: string, signal: AbortSignal) {
    return new Promise<string | VerifiedCase>((resolve, reject) => {
        signal.throwIfAborted();
        const worker = spare ?? new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' });
        spare = undefined;
        const id = nextId++;
        const cleanup = () => { signal.removeEventListener('abort', abort); worker.onmessage = null; worker.onerror = null; };
        const fail = (e: unknown) => { cleanup(); worker.terminate(); reject(e); };
        const abort = () => fail(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', abort, { once: true });
        worker.onerror = e => fail(new Error(e.message));
        worker.onmessage = ({ data }) => {
            if (data.id !== id)
                return;
            if (data.error) {
                fail(new Error(data.error));
                return;
            }
            cleanup();
            spare?.terminate();
            spare = worker;
            resolve(data.result);
        };
        worker.postMessage({ id, kind, puzzle, input } satisfies Job);
    });
}
export { run };
