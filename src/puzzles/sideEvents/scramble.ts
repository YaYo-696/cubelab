import { puzzles } from 'cubing/puzzles';
import type { SideEventId } from '../events';
import { clockCutoff, normalizeClock } from './clock';
import { normalizeSquare1, square1State, square1TooClose } from './square1';

let clock: Promise<ReturnType<typeof clockCutoff>> | undefined;
export async function filterSideEvent(
    id: SideEventId,
    pick: () => Promise<string>,
    signal: AbortSignal,
) {
    const tooClose =
        id === 'sq1'
            ? (alg: string) => square1TooClose(square1State(alg))
            : await (clock ??= puzzles.clock.kpuzzle().then(clockCutoff));
    for (;;) {
        signal.throwIfAborted();
        const raw = await pick();
        const candidate =
            id === 'sq1' ? normalizeSquare1(raw, { generated: true }) : normalizeClock(raw);
        signal.throwIfAborted();
        if (!tooClose(candidate)) return candidate;
    }
}
export async function scrambleSideEvent(id: SideEventId, signal: AbortSignal) {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    return filterSideEvent(id, async () => (await randomScrambleForEvent(id)).toString(), signal);
}
