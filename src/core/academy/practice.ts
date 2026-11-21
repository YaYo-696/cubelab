import { caseSetup } from './cases';
import type { AlgSet, Lesson } from '../contracts';
export interface PracticePosition {
    setup: string;
    caseId: string;
}
export type PracticeProvider = (
    lesson: Lesson,
    set: AlgSet,
    caseId: string,
    variant?: number,
) => Promise<PracticePosition>;
export const predefinedPractice: PracticeProvider = async (lesson, set, caseId, variant = 0) => {
    const selected = set.cases.find((c) => c.id === caseId && lesson.caseIds.includes(c.id));
    if (!selected) throw new RangeError('academyCase');
    return { setup: caseSetup(selected, variant), caseId };
};
