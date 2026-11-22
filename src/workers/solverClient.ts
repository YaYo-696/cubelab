import type { SearchResult } from '../core/contracts';
import type { CubeId } from '../puzzles/events';
import type { SolveMethod, SolveOptions, SolveProgress } from '../core/solver/options';

export type SolverJob = { puzzle: CubeId; input: string; method: SolveMethod; neutral: boolean };
type Reply = { progress: SolveProgress } | { result: SearchResult } | { error: string };

let spare: Worker | undefined;
export function requestSolution(
    puzzle: CubeId,
    method: SolveMethod,
    input: string,
    signal: AbortSignal,
    options?: SolveOptions,
): Promise<SearchResult> {
    if (signal.aborted) return Promise.resolve({ status: 'cancelled' });
    return new Promise((resolve, reject) => {
        const worker =
            spare ?? new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
        spare = undefined;
        const timeout = setTimeout(() => finish({ status: 'timeout' }, false), 30000);
        const abort = () => finish({ status: 'cancelled' }, false);
        function cleanup() {
            clearTimeout(timeout);
            signal.removeEventListener('abort', abort);
            worker.onmessage = null;
            worker.onerror = null;
            worker.onmessageerror = null;
        }
        function finish(result: SearchResult, reuse: boolean) {
            cleanup();
            if (reuse) {
                spare?.terminate();
                spare = worker;
            } else worker.terminate();
            resolve(result);
        }
        function fail(error: Error) {
            cleanup();
            worker.terminate();
            reject(error);
        }
        signal.addEventListener('abort', abort, { once: true });
        worker.onerror = (event) => fail(new Error(event.message));
        worker.onmessageerror = () => fail(new Error('Invalid solver worker message'));
        worker.onmessage = ({ data }: MessageEvent<Reply>) => {
            if ('progress' in data) options?.onProgress?.(data.progress);
            else if ('error' in data) fail(new Error(data.error));
            else finish(data.result, true);
        };
        try {
            worker.postMessage({
                puzzle,
                method,
                input,
                neutral: options?.neutral ?? false,
            } satisfies SolverJob);
        } catch (error) {
            fail(error instanceof Error ? error : new Error(String(error)));
        }
    });
}
