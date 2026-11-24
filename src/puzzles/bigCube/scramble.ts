import { bigCubeSize, type BigCubeId } from '../events';
import { bigCubeModel } from './model';
import { normalizeBigCube, outerBlocks, suffixes } from './notation';

async function makeCutoff(id: BigCubeId) {
    const { model, grips, colorKey, solved } = await bigCubeModel(id);
    const near = new Set<string>();
    // WCA 4b3 / 4b3e and TNoodle Puzzle.generateWcaScramble reject solveIn(1).
    // Block turns wider than half a cube are the complementary block plus a free rotation.
    const turns = outerBlocks(Math.floor(bigCubeSize[id] / 2)).flatMap((axis) =>
        suffixes.map((suffix) => model.moveToTransformation(axis + suffix)),
    );
    for (const grip of grips) {
        near.add(colorKey(grip));
        for (const turn of turns) near.add(colorKey(grip.applyTransformation(turn)));
    }
    return (input: string) => near.has(colorKey(solved.applyAlg(input)));
}

const cutoffs = new Map<BigCubeId, ReturnType<typeof makeCutoff>>();
export async function bigCubeTooClose(id: BigCubeId, input: string) {
    let cutoff = cutoffs.get(id);
    if (!cutoff) {
        cutoff = makeCutoff(id);
        cutoffs.set(id, cutoff);
    }
    return (await cutoff)(input);
}

export async function filterBigCube(
    id: BigCubeId,
    pick: () => Promise<string>,
    signal: AbortSignal,
) {
    for (;;) {
        signal.throwIfAborted();
        const candidate = normalizeBigCube(id, await pick());
        const tooClose = await bigCubeTooClose(id, candidate);
        signal.throwIfAborted();
        if (!tooClose) return candidate;
    }
}

export async function scrambleBigCube(id: BigCubeId, signal: AbortSignal) {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    return filterBigCube(id, async () => (await randomScrambleForEvent(id)).toString(), signal);
}
