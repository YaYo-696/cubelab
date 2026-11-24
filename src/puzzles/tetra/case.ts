import type { VerifiedCase } from '../../core/contracts';
import { loadPyramContent } from './content';
import { solveTetra } from './engine';
import { inverse, tetraModel, type TetraId } from './model';

export async function tetraCase(
    id: TetraId,
    set: string,
    caseId: string,
    signal: AbortSignal,
): Promise<VerifiedCase> {
    const catalog =
        id === 'pyram'
            ? (await loadPyramContent()).sets.get(set)
            : set === 'duoBasics'
              ? (await import('./duoContent')).duoSet
              : undefined;
    const entry = catalog?.cases.find((item) => item.id === caseId);
    if (!entry) throw new Error('Unknown training case: ' + set + '/' + caseId);
    const result = await solveTetra(id, entry.referenceSetup, 'shortest', undefined, signal);
    signal.throwIfAborted();
    if (result.status !== 'solved') throw new Error('Could not solve training case: ' + caseId);
    const scramble = inverse(result.alg);
    const solved = (await tetraModel(id)).defaultPattern();
    if (!solved.applyAlg(scramble).isIdentical(solved.applyAlg(entry.referenceSetup)))
        throw new Error('Training case verification failed: ' + caseId);
    return { scramble, verified: true };
}
