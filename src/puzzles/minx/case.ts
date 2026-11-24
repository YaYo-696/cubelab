import type { VerifiedCase } from '../../core/contracts';
import { loadMinxContent } from './content';
import { hasMinxRotation, minxModel, minxSolvedGrips, visibleMinx } from './model';

export async function minxCase(
    setId: string,
    caseId: string,
    signal: AbortSignal,
): Promise<VerifiedCase> {
    const entry = (await loadMinxContent()).sets
        .get(setId)
        ?.cases.find((item) => item.id === caseId);
    signal.throwIfAborted();
    if (!entry) throw new Error('Unknown training case: ' + setId + '/' + caseId);
    // Megaminx has no search solver. Use the verified setup supplied by the catalog.
    const solved = visibleMinx((await minxModel()).defaultPattern());
    const target = solved.applyAlg(entry.referenceSetup);
    const alg = entry.algorithms[0];
    const final = target.applyAlg(alg);
    const frames = hasMinxRotation(alg) ? minxSolvedGrips(solved) : [solved];
    signal.throwIfAborted();
    if (!frames.some((grip) => grip.isIdentical(final)))
        throw new Error('Training case verification failed: ' + caseId);
    return { scramble: entry.referenceSetup, verified: true };
}
