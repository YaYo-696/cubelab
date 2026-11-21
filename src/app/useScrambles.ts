import { useEffect, useRef, useState } from 'react';
import type { PuzzleModule } from '../core/contracts';

type Mix = { text: string; generated: boolean };

export function useScrambles(mod: PuzzleModule<string>, eventId: string) {
    const [queue, setQueue] = useState<Mix[]>([]);
    const [failed, setFailed] = useState(false);
    const items = useRef<Mix[]>([]);
    const fill = useRef<() => void>(() => {});

    useEffect(() => {
        const control = new AbortController();
        let loading = false;
        items.current = [];
        setQueue([]);
        async function replenish() {
            if (loading || control.signal.aborted) return;
            loading = true;
            setFailed(false);
            try {
                while (items.current.length < 2) {
                    const text = await mod.generateScramble(eventId, control.signal);
                    if (control.signal.aborted) return;
                    items.current = [...items.current, { text, generated: true }];
                    setQueue(items.current);
                }
            } catch {
                if (!control.signal.aborted) setFailed(true);
            } finally {
                loading = false;
            }
        }
        fill.current = replenish;
        void replenish();
        return () => control.abort();
    }, [mod, eventId]);

    function replace(itemsAfterAction: Mix[]) {
        items.current = itemsAfterAction;
        setQueue(items.current);
        fill.current();
    }
    return {
        current: queue[0],
        hasNext: queue.length > 1,
        failed,
        retry: () => fill.current(),
        next: () => replace(items.current.slice(1)),
        custom: (text: string) => replace([{ text, generated: false }, ...items.current.slice(1)]),
    };
}
