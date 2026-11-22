import { afterEach, expect, it, vi } from 'vitest';
import { requestCase, requestScramble } from '../../src/workers/client';
import { serveJob, type ScrambleJob } from '../../src/workers/jobProtocol';

class WorkerStub {
    static started: WorkerStub[] = [];
    onmessage: ((response: { data: unknown }) => void) | null = null;
    onerror: ((error: { message: string }) => void) | null = null;
    onmessageerror = null;
    job: { id: number; kind: string } | undefined;
    terminate = vi.fn();

    constructor() {
        WorkerStub.started.push(this);
    }
    postMessage(job: NonNullable<WorkerStub['job']>) {
        this.job = job;
    }
}
afterEach(() => {
    WorkerStub.started = [];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

it('ignora el protocolo Comlink y los trabajos de otros workers', async () => {
    const postMessage = vi.fn();
    const addEventListener = vi.fn();
    vi.stubGlobal('self', { postMessage, addEventListener });
    const handler = vi.fn(async () => 'R U');
    serveJob<ScrambleJob, string>('scramble', handler);
    const onMessage = addEventListener.mock.calls[0][1];
    await onMessage({ data: { id: 'rpc-id', type: 'APPLY', path: ['randomScrambleStringForEvent'] } });
    await onMessage({ data: { id: 8, kind: 'case' } });
    expect(handler).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    await onMessage({ data: { id: 9, kind: 'scramble', puzzle: '333', input: '333' } });
    expect(postMessage).toHaveBeenCalledWith({ id: 9, result: 'R U' });
});

it('informa un fallo de arranque del entrenador sin interrumpir el Timer', async () => {
    vi.stubGlobal('Worker', WorkerStub);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const signal = new AbortController().signal;
    const caseJob = requestCase('333', 'fullPLL', 'Aa', signal);
    const timerJob = requestScramble('333', '333', signal);
    const [trainer, timer] = WorkerStub.started;
    expect(trainer.job?.kind).toBe('case');
    expect(timer.job?.kind).toBe('scramble');
    trainer.onerror?.({ message: 'module failed to evaluate' });
    timer.onmessage?.({ data: { id: timer.job?.id, result: 'R U' } });
    await expect(caseJob).rejects.toThrow('module failed to evaluate');
    await expect(timerJob).resolves.toBe('R U');
    expect(error).toHaveBeenCalledWith(
        'CubeLab case worker: module failed to evaluate',
        expect.any(Error),
    );
    expect(trainer.terminate).toHaveBeenCalledOnce();
    expect(timer.terminate).not.toHaveBeenCalled();
});

it('termina el worker si no responde y conserva el error al reintentar', async () => {
    vi.stubGlobal('Worker', WorkerStub);
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const signal = new AbortController().signal;
    const timedOut = expect(requestCase('222', 'fullCLL', 'CLL AS 1', signal)).rejects.toThrow('10 s');
    await vi.advanceTimersByTimeAsync(10000);
    await timedOut;
    const retry = expect(requestCase('222', 'fullCLL', 'CLL AS 1', signal)).rejects.toThrow(
        'caseVerification',
    );
    const [first, second] = WorkerStub.started;
    expect(first.terminate).toHaveBeenCalledOnce();
    second.onmessage?.({ data: { id: second.job?.id, error: { message: 'caseVerification' } } });
    await retry;
});
