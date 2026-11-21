import groups from '../../puzzles/content/full/groups';
import type { Question, Applicability, Skill } from './questions';

const options = ['aTrue', 'aFalse'];
export const advancedTheory = {
    '333': [
        'advancedF2L',
        'crossDown',
        'lookahead',
        'fingertricks',
        'inspectionPair',
        'roux',
        'zz',
        'goals333',
    ],
    '222': ['goals222'],
} as const;
export const advancedGroups = groups;
const quizCorrect: Record<string, readonly number[]> = {
    advancedF2L: [0, 1, 0],
    crossDown: [0, 1, 0],
    lookahead: [1, 0, 0],
    fingertricks: [0, 1, 0],
    inspectionPair: [0, 1, 0],
    roux: [0, 1, 0],
    zz: [0, 1, 0],
    goals333: [1, 0, 0],
    goals222: [1, 0, 0],
    egConcept: [0, 1, 0],
};
function theory(lessonId: string, applies: Applicability, skill: Skill = 'steps'): Question[] {
    return quizCorrect[lessonId].map((correct, i) => ({
        id: lessonId + '-' + i,
        lessonId,
        skill,
        applies,
        level: 'advanced',
        promptKey: 'aQuiz_' + lessonId + '_' + i,
        optionKeys: options,
        correct,
    }));
}

export function caseLabel(id: string) {
    return 'case.' + id;
}
export const advancedQuestions: Question[] = [
    ...advancedTheory['333'].flatMap((id) =>
        theory(id, '333', id === 'inspectionPair' ? 'inspection' : 'steps'),
    ),
    ...advancedTheory['222'].flatMap((id) => theory(id, '222')),
    ...theory('egConcept', '222', 'cll'),
    ...(['fullOLL', 'fullPLL', 'fullCLL'] as const).flatMap((setId) => {
        const collection = groups[setId],
            all = collection.flatMap((g) => g.ids);
        const skill: Skill = setId === 'fullOLL' ? 'oll' : setId === 'fullPLL' ? 'pll' : 'cll';
        const applies: Applicability = setId === 'fullCLL' ? '222' : '333';
        return collection.flatMap((group) =>
            group.ids
                .map((id, index): Question => {
                    const wrong = [...group.ids, ...all].filter(
                        (value, i, list) => value !== id && list.indexOf(value) === i,
                    );
                    const ids = wrong.slice(0, 2);
                    const correct = index % 3;
                    ids.splice(correct, 0, id);
                    return {
                        id: group.id + '-' + index,
                        lessonId: group.id,
                        skill,
                        applies,
                        level: 'advanced',
                        promptKey: 'aIdentify',
                        optionKeys: ids.map(caseLabel),
                        caseId: id,
                        correct,
                        picture: { kind: 'case', setId, ids, top: true },
                    };
                })
                .concat(
                    group.ids.length === 2
                        ? [
                              {
                                  id: group.id + '-concept',
                                  lessonId: group.id,
                                  skill,
                                  applies,
                                  level: 'advanced',
                                  promptKey: 'aConfirm_' + skill,
                                  optionKeys: options,
                                  correct: 0,
                              },
                          ]
                        : [],
                ),
        );
    }),
];
