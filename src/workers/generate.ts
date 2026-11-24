import { cubeModel, orientations } from '../puzzles/cube.ts';
import { cubeEvent, modality, type CubeId } from '../puzzles/events.ts';
const models = new Map<CubeId, ReturnType<typeof cubeModel>>();
export function modelFor(id: CubeId) {
    let model = models.get(id);
    if (!model) {
        model = cubeModel(id === '222' ? 2 : 3);
        models.set(id, model);
    }
    return model;
}
// Discard the upper incomplete interval to give every orientation equal probability.
export function randomOrientation() {
    const byte = new Uint8Array(1);
    do {
        crypto.getRandomValues(byte);
    } while (byte[0] >= 240);
    return orientations[byte[0] % 24];
}
async function randomCandidate(id: CubeId | '333fm') {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    return (await randomScrambleForEvent(id)).toString();
}
export async function generate(puzzle: CubeId, eventId: string, signal: AbortSignal, candidate = randomCandidate) {
    const rules = puzzle === '333' && (eventId === '333oh' || eventId === '333fm' || eventId === '333mbf')
        ? modality(eventId) : cubeEvent(puzzle, eventId === '333bf');
    if (rules.id !== eventId)
        throw new RangeError(eventId);
    const model = modelFor(puzzle);
    for (;;) {
        signal.throwIfAborted();
        const base = await candidate(eventId === '333fm' ? '333fm' : puzzle);
        if (eventId === '333fm' && !(base.startsWith("R' U' F ") && base.endsWith(" R' U' F")))
            throw new Error('Invalid cubing.js FMC padding');
        signal.throwIfAborted();
        if (model.tooClose(model.apply(model.solved, base), rules.minSolveDistance))
            continue;
        return rules.randomOrientation ? [base, randomOrientation()].filter(Boolean).join(' ') : base;
    }
}
