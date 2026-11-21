import type { Course, Lesson } from '../../core/contracts';
import type { CubeId } from '../events';
import { lessonQuestions } from '../../core/academy/questions';
type Plan = {
    id: string;
    set: string;
    cases: string[];
    needs?: string[];
};
const corner = ['sune', 'antisune', 'pi', 'h', 't', 'l', 'u'];
const notation: Plan = { id: 'notationB', set: 'basic', cases: ['right'] };
const advanced: Plan = { id: 'notationA', set: 'basic', cases: [], needs: ['notationB'] };
const inspection: Plan = { id: 'inspectionRules', set: 'basic', cases: [], needs: ['notationB'] };
const plans: Record<CubeId, { id: string; lessons: Plan[] }[]> = {
    '333': [
        { id: 'symbols', lessons: [notation, advanced, inspection] },
        {
            id: 'layers',
            lessons: [
                { id: 'cross', set: 'drills333', cases: ['cross'], needs: ['notationB'] },
                { id: 'corners', set: 'drills333', cases: ['corners'] },
                { id: 'middle', set: 'drills333', cases: ['middle'] },
                {
                    id: 'yellowCross',
                    set: 'oll333',
                    cases: ['line', 'el', 'dot'],
                    needs: ['middle', 'notationA'],
                },
                {
                    id: 'orient',
                    set: 'oll333',
                    cases: ['sune', 'antisune'],
                },
                {
                    id: 'permCorners',
                    set: 'pll333',
                    cases: ['tperm', 'yperm'],
                },
                {
                    id: 'permEdges',
                    set: 'pll333',
                    cases: ['ua', 'ub', 'hperm', 'zperm'],
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
                    needs: ['cross'],
                },
                {
                    id: 'f2l',
                    set: 'drills333',
                    cases: ['f2l', 'f2lJoin', 'f2lSplit'],
                    needs: ['crossPlan', 'middle'],
                },
                {
                    id: 'oll3',
                    set: 'oll333',
                    cases: ['dot', 'el', 'line', ...corner],
                    needs: ['f2l', 'orient'],
                },
                {
                    id: 'pll3',
                    set: 'pll333',
                    cases: ['tperm', 'yperm', 'ua', 'ub', 'hperm', 'zperm'],
                    needs: ['oll3', 'permEdges'],
                },
            ],
        },
    ],
    '222': [
        { id: 'symbols', lessons: [notation, advanced, inspection] },
        {
            id: 'layers',
            lessons: [
                {
                    id: 'firstLayer',
                    set: 'drills222',
                    cases: ['firstLayer'],
                    needs: ['notationB'],
                },
                {
                    id: 'orient2',
                    set: 'oll222',
                    cases: ['sune', 'antisune'],
                },
                { id: 'perm2', set: 'pbl222', cases: ['tperm', 'yperm'] },
            ],
        },
        {
            id: 'ortega',
            lessons: [
                {
                    id: 'firstFace',
                    set: 'drills222',
                    cases: ['firstFace'],
                    needs: ['notationB'],
                },
                {
                    id: 'oll2',
                    set: 'oll222',
                    cases: corner,
                    needs: ['firstFace'],
                },
                {
                    id: 'pbl2',
                    set: 'pbl222',
                    cases: ['tperm', 'yperm', 'bars', 'diags', 'mixed'],
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
                const lesson: Lesson = {
                    id: plan.id,
                    titleKey: 'aTitle_' + plan.id,
                    bodyKey:
                        'aBody_' + plan.id + (plan.id === 'notationA' && puzzle === '222' ? '2' : ''),
                    objectiveKey: 'aGoal_' + plan.id,
                    exerciseKey:
                        'aExercise_' +
                        plan.id +
                        (plan.id === 'notationA' && puzzle === '222' ? '2' : ''),
                    setId: plan.set,
                    caseIds: plan.cases,
                    caseId: plan.cases[0],
                    requires: plan.needs ?? (previous ? [previous] : []),
                    demos:
                        plan.id === 'notationB'
                            ? [{ setup: '', alg: "R R' U U'" }]
                            : plan.id === 'notationA'
                              ? [{ setup: '', alg: "x x' y y' z z'" }]
                              : [],
                    glossary:
                        plan.id === 'notationB'
                            ? 'basic'
                            : plan.id === 'notationA'
                              ? 'advanced'
                              : undefined,
                    quiz: lessonQuestions(puzzle, plan.id),
                };
                previous = lesson.id;
                return lesson;
            }),
        })),
    };
}
