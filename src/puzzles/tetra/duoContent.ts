import type { AlgSet, Course } from '../../core/contracts';

export const duoSet: AlgSet = {
    id: 'duoBasics',
    revision: 1,
    nameKey: 'duoLesson',
    cases: [
        {
            id: 'duo-corner',
            nameKey: 'duoCorners',
            referenceSetup: 'U',
            algorithms: ["U'"],
        },
        {
            id: 'duo-centers',
            nameKey: 'duoCenters',
            referenceSetup: "L' U L U'",
            algorithms: ["U L' U' L"],
        },
    ],
};
export const duoCourse: Course = {
    id: 'academy-pyramduo',
    revision: 1,
    titleKey: 'pyramduo',
    modules: [
        {
            id: 'duoBasics',
            titleKey: 'solveMethod_beginner',
            lessons: [
                {
                    id: 'duo-two-steps',
                    titleKey: 'duoLesson',
                    objectiveKey: 'duoGoal',
                    bodyKey: 'duoBody',
                    markdown: true,
                    practiceMethod: 'beginner',
                    exerciseKey: 'duoExercise',
                    requires: [],
                    demos: [
                        { setup: "L' U L U' R", alg: "R' U L' U' L" },
                        { setup: "L' U L U'", alg: "U L' U' L" },
                    ],
                    setId: 'duoBasics',
                    caseIds: duoSet.cases.map((item) => item.id),
                    quiz: [
                        {
                            promptKey: 'duoQuestion1',
                            optionKeys: ['duoCorners', 'duoCenters'],
                            correct: 0,
                        },
                        {
                            promptKey: 'duoQuestion2',
                            optionKeys: ['duoFaceAnswer', 'duoVertexAnswer'],
                            correct: 1,
                        },
                        {
                            promptKey: 'duoQuestion3',
                            optionKeys: ['duoResetAnswer', 'duoCommutatorAnswer'],
                            correct: 1,
                        },
                    ],
                },
            ],
        },
    ],
};
