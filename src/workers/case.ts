import { loadAlgSet } from '../puzzles/content';
import { modelFor } from './generate';
import type { VerifiedCase } from '../core/contracts';
import type { CubeId } from '../puzzles/events';
export async function generateCase(puzzle: CubeId, id: string, signal: AbortSignal): Promise<VerifiedCase> {
    signal.throwIfAborted();
    const entry = (await loadAlgSet('basic')).cases.find(c => c.id === id);
    if (!entry)
        throw new RangeError(id);
    const { Alg } = await import('cubing/alg');
    signal.throwIfAborted();
    const scramble = new Alg(entry.algorithms[0]).invert().toString();
    const model = modelFor(puzzle);
    if (model.apply(model.solved, scramble) !== model.apply(model.solved, entry.referenceSetup)) {
        throw new Error('caseVerification');
    }
    return { scramble, verified: true };
}
