import type { CubeId } from '../puzzles/events';

export type ScrambleJob = { id: number; kind: 'scramble'; puzzle: CubeId; input: string };
export type CaseJob = { id: number; kind: 'case'; puzzle: CubeId; input: string; setId: string };
type Job = ScrambleJob | CaseJob;
export type JobReply<T> = { id: number } & (
    | { result: T }
    | { error: { message: string; stack?: string } }
);

export function serveJob<J extends Job, T>(
    kind: J['kind'],
    handler: (data: J, signal: AbortSignal) => Promise<T>,
) {
    self.addEventListener('message', async ({ data }: MessageEvent<J>) => {
        // Rollup may share this entry with cubing.js's nested Comlink worker.
        // Its RPC packets are outside CubeLab's protocol and need no reply here.
        if (data?.kind !== kind || !Number.isSafeInteger(data.id)) return;
        const { id } = data;
        try {
            const result = await handler(data, new AbortController().signal);
            self.postMessage({ id, result } satisfies JobReply<T>);
        } catch (caught) {
            const error = caught instanceof Error ? caught : new Error(String(caught));
            self.postMessage({
                id,
                error: { message: error.message, stack: error.stack },
            } satisfies JobReply<T>);
        }
    });
}
