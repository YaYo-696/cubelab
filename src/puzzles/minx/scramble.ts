import type { KPattern } from 'cubing/kpuzzle';
import { minxFaces, minxModel, normalizeMinxScramble, visibleMinx } from './model';

function centerKey(pattern: KPattern) {
    return pattern.patternData.CENTERS.pieces.join(',');
}

async function makeCutoff() {
    const model = await minxModel();
    const solved = visibleMinx(model.defaultPattern());
    const frame = new Map<string, ReturnType<typeof model.moveToTransformation>>();
    const queue = [{ pattern: solved, rotation: model.algToTransformation('') }];
    frame.set(centerKey(solved), queue[0].rotation);
    for (const { pattern, rotation } of queue)
        for (const axis of ['Uv', 'Fv']) {
            const move = model.moveToTransformation(axis);
            const next = pattern.applyTransformation(move);
            const key = centerKey(next);
            if (frame.has(key)) continue;
            const composed = rotation.applyTransformation(move);
            queue.push({ pattern: next, rotation: composed });
            frame.set(key, composed.invert());
        }
    if (frame.size !== 60) throw new Error('Unexpected Megaminx rotation group');
    function normalize(pattern: KPattern) {
        const rotation = frame.get(centerKey(pattern));
        return rotation && pattern.applyTransformation(rotation);
    }
    // WCA 4b3e and TNoodle MegaminxPuzzle.getSuccessorsByName: face and
    // Pochmann block turns each count as one. Check only the ball of radius one.
    const states = [
        solved,
        ...minxFaces.flatMap((face) =>
            ['', "'", '2', "2'"].map((suffix) => solved.applyMove(face + suffix)),
        ),
        ...['R++', 'D++'].flatMap((move) => {
            const double = model.moveToTransformation(move);
            return [1, 2, 3, 4].map((power) =>
                solved.applyTransformation(double.selfMultiply(power)),
            );
        }),
    ].map((pattern) => {
        const normalized = normalize(pattern);
        if (!normalized) throw new Error('Megaminx move could not be normalized');
        return normalized;
    });
    return (alg: string) => {
        const pattern = normalize(solved.applyAlg(alg));
        return !!pattern && states.some((state) => pattern.isIdentical(state));
    };
}

let cutoff: ReturnType<typeof makeCutoff> | undefined;
export async function minxTooClose(input: string) {
    return (await (cutoff ??= makeCutoff()))(input);
}

export async function filterMinx(pick: () => Promise<string>, signal: AbortSignal) {
    for (;;) {
        signal.throwIfAborted();
        const candidate = normalizeMinxScramble(await pick());
        if (!(await minxTooClose(candidate))) {
            signal.throwIfAborted();
            return candidate;
        }
    }
}

export async function scrambleMinx(signal: AbortSignal) {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    return filterMinx(async () => (await randomScrambleForEvent('minx')).toString(), signal);
}
