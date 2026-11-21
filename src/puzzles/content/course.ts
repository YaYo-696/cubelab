import type { Course, Lesson } from '../../core/contracts';
import type { CubeId } from '../events';
const recognition: Record<string, { caseId: string; alternatives: string[]; correct: number }> = {
    oll3: { caseId: 'line', alternatives: ['dot', 'line', 'el'], correct: 1 },
    pll3: { caseId: 'hperm', alternatives: ['hperm', 'ua', 'zperm'], correct: 0 },
    oll2: { caseId: 'pi', alternatives: ['h', 'sune', 'pi'], correct: 2 },
    pbl2: { caseId: 'mixed', alternatives: ['mixed', 'bars', 'diags'], correct: 0 },
};
type Plan = {
    id: string;
    set: string;
    cases: string[];
    answers: [boolean, boolean, boolean];
    needs?: string[];
};
const corner = ['sune', 'antisune', 'pi', 'h', 't', 'l', 'u'];
const notation: Plan = { id: 'notationB', set: 'basic', cases: ['right'], answers: [true, false, true] };
const plans: Record<CubeId, { id: string; lessons: Plan[] }[]> = {
    '333': [
        { id: 'symbols', lessons: [notation] },
        {
            id: 'layers',
            lessons: [
                { id: 'cross', set: 'drills333', cases: ['cross'], answers: [true, false, true] },
                { id: 'corners', set: 'drills333', cases: ['corners'], answers: [false, true, true] },
                { id: 'middle', set: 'drills333', cases: ['middle'], answers: [true, true, false] },
                {
                    id: 'yellowCross',
                    set: 'oll333',
                    cases: ['line', 'el', 'dot'],
                    answers: [true, false, true],
                },
                {
                    id: 'orient',
                    set: 'oll333',
                    cases: ['sune', 'antisune'],
                    answers: [false, true, true],
                },
                {
                    id: 'permCorners',
                    set: 'pll333',
                    cases: ['tperm', 'yperm'],
                    answers: [true, false, true],
                },
                {
                    id: 'permEdges',
                    set: 'pll333',
                    cases: ['ua', 'ub', 'hperm', 'zperm'],
                    answers: [false, true, true],
                },
            ],
        },
        {
            id: 'cfop',
            lessons: [
                {
                    id: 'crossPlan',
                    set: 'drills333',
                    cases: ['crossPlan'],
                    answers: [true, true, false],
                    needs: ['cross'],
                },
                {
                    id: 'f2l',
                    set: 'drills333',
                    cases: ['f2l', 'f2lJoin', 'f2lSplit'],
                    answers: [true, false, true],
                    needs: ['crossPlan', 'middle'],
                },
                {
                    id: 'oll3',
                    set: 'oll333',
                    cases: ['dot', 'el', 'line', ...corner],
                    answers: [false, true, true],
                    needs: ['f2l', 'orient'],
                },
                {
                    id: 'pll3',
                    set: 'pll333',
                    cases: ['tperm', 'yperm', 'ua', 'ub', 'hperm', 'zperm'],
                    answers: [true, true, false],
                    needs: ['oll3', 'permEdges'],
                },
            ],
        },
    ],
    '222': [
        { id: 'symbols', lessons: [notation] },
        {
            id: 'layers',
            lessons: [
                {
                    id: 'firstLayer',
                    set: 'drills222',
                    cases: ['firstLayer'],
                    answers: [true, false, true],
                },
                {
                    id: 'orient2',
                    set: 'oll222',
                    cases: ['sune', 'antisune'],
                    answers: [true, true, false],
                },
                { id: 'perm2', set: 'pbl222', cases: ['tperm', 'yperm'], answers: [false, true, true] },
            ],
        },
        {
            id: 'ortega',
            lessons: [
                {
                    id: 'firstFace',
                    set: 'drills222',
                    cases: ['firstFace'],
                    answers: [true, false, true],
                    needs: ['notationB'],
                },
                {
                    id: 'oll2',
                    set: 'oll222',
                    cases: corner,
                    answers: [true, false, true],
                    needs: ['firstFace'],
                },
                {
                    id: 'pbl2',
                    set: 'pbl222',
                    cases: ['tperm', 'yperm', 'bars', 'diags', 'mixed'],
                    answers: [false, true, true],
                    needs: ['oll2'],
                },
            ],
        },
    ],
};
export function makeCourse(puzzle: CubeId): Course {
    let previous: string | undefined;
    return {
        id: 'academy-' + puzzle,
        revision: 1,
        titleKey: 'aCourse_' + puzzle,
        modules: plans[puzzle].map((module) => ({
            id: module.id,
            titleKey: 'aModule_' + module.id,
            lessons: module.lessons.map((plan) => {
                const question = recognition[plan.id];
                const lesson: Lesson = {
                    id: plan.id,
                    titleKey: 'aTitle_' + plan.id,
                    bodyKey: 'aBody_' + plan.id,
                    objectiveKey: 'aGoal_' + plan.id,
                    exerciseKey: 'aExercise_' + plan.id,
                    setId: plan.set,
                    caseIds: plan.cases,
                    caseId: plan.cases[0],
                    requires: plan.needs ?? (previous ? [previous] : []),
                    demos: plan.id === 'notationB' ? [{ setup: '', alg: "R R' U U'" }] : [],
                    glossary: plan.id === 'notationB',
                    quiz: [
                        ...plan.answers.map((answer, index) => ({
                            promptKey: 'aQuiz_' + plan.id + '_' + index,
                            optionKeys: ['aTrue', 'aFalse'],
                            correct: answer ? 0 : 1,
                        })),
                        ...(question
                            ? [
                                  {
                                      promptKey: 'aIdentify',
                                      caseId: question.caseId,
                                      correct: question.correct,
                                      optionKeys: question.alternatives.map((id) => 'aCase_' + id),
                                  },
                              ]
                            : []),
                    ],
                };
                previous = lesson.id;
                return lesson;
            }),
        })),
    };
}
