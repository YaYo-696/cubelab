import { useEffect, useRef, useState } from 'react';
import type { StatsRequest, StatsResponse } from '../workers/stats.worker';

export function useStatistics(input: StatsRequest | undefined, sessionId = '') {
    const cache = useRef<{ event: SolveEvent | undefined; sessions: Map<string, StatsResponse> }>({
        event: undefined,
        sessions: new Map(),
    });
    const [result, setResult] = useState<{ input: StatsRequest; response: StatsResponse }>();
    useEffect(() => {
        if (!input) return;
        const current = cache.current;
        if (current.event !== input.event) {
            current.sessions.clear();
            current.event = input.event;
        }
        const hit = current.sessions.get(sessionId);
        if (hit) {
            setResult({ input, response: hit });
            return;
        }
        const worker = new Worker(new URL('../workers/stats.worker.ts', import.meta.url), {
            type: 'module',
        });
        worker.onmessage = ({ data }: { data: StatsResponse }) => {
            if (current.sessions.size >= 3)
                current.sessions.delete(current.sessions.keys().next().value!);
            current.sessions.set(sessionId, data);
            setResult({ input, response: data });
        };
        worker.postMessage(input);
        return () => worker.terminate();
    }, [input, sessionId]);
    return result?.input === input ? result?.response : undefined;
}
type SolveEvent = StatsRequest['event'];
