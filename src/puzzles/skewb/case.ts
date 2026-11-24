import { Alg } from 'cubing/alg';
import type { VerifiedCase } from '../../core/contracts';
import { loadSkewbContent } from './content';
import { solveSkewb } from './engine';
import { skewbModel, visibleSkewb } from './model';

export async function skewbCase(
    setId: string,
    caseId: string,
    signal: AbortSignal,
): Promise<VerifiedCase> {
    const entry = (await loadSkewbContent()).sets
        .get(setId)
        ?.cases.find((item) => item.id === caseId);
    if (!entry) throw new Error('Unknown training case: ' + setId + '/' + caseId);
    signal.throwIfAborted();
    const result = await solveSkewb(entry.referenceSetup, 'shortest');
    signal.throwIfAborted();
    if (result.status !== 'solved') throw new Error('Could not solve training case: ' + caseId);
    const scramble = new Alg(result.alg).invert().toString();
    const solved = visibleSkewb((await skewbModel()).defaultPattern());
    if (!solved.applyAlg(scramble).isIdentical(solved.applyAlg(entry.referenceSetup)))
        throw new Error('Training case verification failed: ' + caseId);
    return { scramble, verified: true };
}
