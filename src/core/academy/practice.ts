import type { AlgSet, Lesson } from '../contracts';
export interface PracticePosition {
    setup: string;
    caseId: string;
}
export type PracticeProvider = (
    lesson: Lesson,
    set: AlgSet,
    caseId: string,
) => Promise<PracticePosition>;
export const predefinedPractice: PracticeProvider = async (lesson, set, caseId) => {
    const selected = set.cases.find((c) => c.id === caseId && lesson.caseIds.includes(c.id));
    if (!selected) throw new RangeError('academyCase');
    return { setup: selected.referenceSetup, caseId };
};
