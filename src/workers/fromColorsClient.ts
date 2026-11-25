import type { ClockDials, ClockReading } from '../core/fromColors/readClock';
import type { ColorPuzzle, ColorReading, Painted } from '../core/fromColors/readColors';
import type { Reading444 } from '../core/fromColors/readColors444';

type Jobs = {
    readColors: { puzzle: ColorPuzzle; painted: Painted };
    readClock: { dials: ClockDials };
    readColors444: { painted: Painted };
};

type Readings = {
    readColors: ColorReading;
    readClock: ClockReading;
    readColors444: Reading444;
};

type Kind = keyof Jobs;
export type ColorJob<K extends Kind = Kind> = {
    [P in K]: { kind: P } & Jobs[P]
}[K];
export type ColorReply<K extends Kind = Kind> = { result: Readings[K] } | { error: string };

let spare: Worker | undefined;

export function requestColorReading<K extends Kind>(
    job: ColorJob<K> & { kind: K },
    signal: AbortSignal,
): Promise<Readings[K]> {
    if (signal.aborted) return Promise.reject(signal.reason);
    return new Promise((resolve, reject) => {
        const worker =
            spare ?? new Worker(new URL('./fromColors.worker.ts', import.meta.url), { type: 'module' });
        spare = undefined;
        const timeout = setTimeout(() => fail(new Error('Color reading worker timed out after 30 s')), 30_000);
        const abort = () => fail(signal.reason);
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
            reject(error);
        }
        signal.addEventListener('abort', abort, { once: true });
        worker.onerror = (event) => fail(new Error(event.message || 'Color reading worker failed to start'));
        worker.onmessageerror = () => fail(new Error('Invalid color reading worker message'));
        worker.onmessage = ({ data }: MessageEvent<ColorReply<K>>) => {
            if ('error' in data) {
                fail(new Error(data.error));
                return;
            }
            cleanup();
            spare?.terminate();
            spare = worker;
            resolve(data.result);
        };
        try {
            worker.postMessage(job);
        } catch (error) {
            fail(error);
        }
    });
}
