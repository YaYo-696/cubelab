import type { VerifiedCase } from '../core/contracts';
import type { PuzzleId } from '../puzzles/events';
import type { CaseJob, JobReply, ScrambleJob } from './jobProtocol';

const timeoutMs = 10000;

function workerTask<Job extends { id: number }, Result>(name: string, create: () => Worker) {
    // Each pool retains at most one idle worker. Active jobs can be terminated independently.
    let spare: Worker | undefined;
    let nextId = 0;
    return (job: Omit<Job, 'id'>, signal: AbortSignal) =>
        new Promise<Result>((resolve, reject) => {
            signal.throwIfAborted();
            function report(caught: unknown) {
                const error = caught instanceof Error ? caught : new Error(String(caught));
                console.error('CubeLab ' + name + ' worker: ' + error.message, error);
                reject(error);
            }
            let worker: Worker;
            try {
                worker = spare ?? create();
                spare = undefined;
            } catch (error) {
                report(error);
                return;
            }
            const id = nextId++;
            const timeout = setTimeout(
                () => fail(new Error('Worker response timed out (10 s)')),
                timeoutMs,
            );
            function cleanup() {
                clearTimeout(timeout);
                signal.removeEventListener('abort', abort);
                worker.onmessage = null;
                worker.onerror = null;
                worker.onmessageerror = null;
            }
            function fail(error: unknown) {
                cleanup();
                worker.terminate();
                report(error);
            }
            function abort() {
                cleanup();
                worker.terminate();
                reject(signal.reason);
            }
            signal.addEventListener('abort', abort, { once: true });
            worker.onerror = (event) =>
                fail(
                    event.error ??
                        new Error(
                            event.message ||
                                (event.filename
                                    ? 'Worker failed to load: ' + event.filename
                                    : 'Worker failed to start'),
                        ),
                );
            worker.onmessageerror = () => fail(new Error('Worker reply could not be deserialized'));
            worker.onmessage = ({ data }: MessageEvent<JobReply<Result>>) => {
                if (data?.id !== id) return;
                if ('error' in data) {
                    const error = new Error(data.error.message);
                    if (data.error.stack) error.stack = data.error.stack;
                    fail(error);
                    return;
                }
                cleanup();
                spare?.terminate();
                spare = worker;
                resolve(data.result);
            };
            try {
                worker.postMessage({ ...job, id });
            } catch (error) {
                fail(error);
            }
        });
}

const scrambleTask = workerTask<ScrambleJob, string>(
    'scramble',
    () => new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' }),
);
const caseTask = workerTask<CaseJob, VerifiedCase>(
    'case',
    () => new Worker(new URL('./case.worker.ts', import.meta.url), { type: 'module' }),
);

export const requestScramble = (puzzle: PuzzleId, input: string, signal: AbortSignal) =>
    scrambleTask({ kind: 'scramble', puzzle, input }, signal);
export const requestCase = (puzzle: PuzzleId, setId: string, input: string, signal: AbortSignal) =>
    caseTask({ kind: 'case', puzzle, setId, input }, signal);
