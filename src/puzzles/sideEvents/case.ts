import type { VerifiedCase } from '../../core/contracts';
import type { SideEventId } from '../events';
import { loadSideContent } from './content';

export async function sideCase(
    id: SideEventId,
    setId: string,
    caseId: string,
    signal: AbortSignal,
): Promise<VerifiedCase> {
    const entry = (await loadSideContent(id)).sets
        .get(setId)
        ?.cases.find((item) => item.id === caseId);
    signal.throwIfAborted();
    if (!entry) throw new Error('Unknown training case: ' + setId + '/' + caseId);
    return { scramble: entry.referenceSetup, verified: true };
}
