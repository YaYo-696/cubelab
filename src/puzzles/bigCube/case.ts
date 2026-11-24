import type { VerifiedCase } from '../../core/contracts';
import { load444Content } from './content';

export async function case444(
    setId: string,
    caseId: string,
    signal: AbortSignal,
): Promise<VerifiedCase> {
    const entry = (await load444Content()).sets
        .get(setId)
        ?.cases.find((item) => item.id === caseId);
    signal.throwIfAborted();
    if (!entry) throw new Error('Unknown training case: ' + setId + '/' + caseId);
    // The importer verifies every setup before the catalog is visible to the trainer.
    return { scramble: entry.referenceSetup, verified: true };
}
