import type { Lesson, PuzzleModule } from '../contracts';
import type { SolveMethod } from '../solver/options';

export function exerciseMethod(lesson: Lesson): SolveMethod | undefined {
    if (lesson.setId === 'fullCLL') return 'cllPractice';
    if (lesson.setId === 'eg') return 'egPractice';
    if (lesson.setId === 'fullOLL' || lesson.setId === 'fullPLL') return 'cfopFull';
    if (['firstFace', 'oll2', 'pbl2'].includes(lesson.id)) return 'ortega';
    if (['crossPlan', 'f2l', 'oll3', 'pll3'].includes(lesson.id)) return 'cfop4';
    if (
        [
            'firstLayer',
            'orient2',
            'perm2',
            'cross',
            'corners',
            'middle',
            'yellowCross',
            'orient',
            'permCorners',
            'permEdges',
        ].includes(lesson.id)
    )
        return 'beginner';
}
const equivalentLessons: Record<string, string[]> = {
    oll3: ['yellowCross', 'orient'],
    pll3: ['permCorners', 'permEdges'],
};
export async function generatedPractice(
    mod: PuzzleModule<string>,
    lesson: Lesson,
    method: SolveMethod,
    signal: AbortSignal,
) {
    const solve = mod.solvers?.byMethod?.[method] ?? mod.solvers?.practice?.[method];
    if (!solve) throw new Error('Practice solver unavailable');
    const lessons = equivalentLessons[lesson.id] ?? [lesson.id];
    for (let attempt = 0; attempt < 100; attempt++) {
        signal.throwIfAborted();
        const scramble = await mod.generateScramble(mod.id, signal);
        const result = await solve(scramble, signal);
        signal.throwIfAborted();
        if (result.status !== 'solved') continue;
        const index = result.stages.findIndex(
            (stage) =>
                stage.moves > 0 &&
                stage.lessonId &&
                lessons.includes(stage.lessonId) &&
                (!stage.caseId || lesson.caseIds.includes(stage.caseId)),
        );
        if (index < 0) continue;
        const stage = result.stages[index];
        return {
            scramble,
            setup: [scramble, ...result.stages.slice(0, index).map((step) => step.alg)]
                .filter(Boolean)
                .join(' '),
            stage,
        };
    }
    throw new Error('Practice case was not sampled');
}
