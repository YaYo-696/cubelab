import type { QuizQuestion } from '../contracts';

export type Skill = 'basic' | 'advanced' | 'steps' | 'oll' | 'pll' | 'ortega' | 'inspection';
export type Level = 'beginner' | 'intermediate';
export type Applicability = 'nxn' | 'nxn3' | '222' | '333';
type Picture =
    | { kind: 'move'; setup: string; moves: string[] }
    | { kind: 'case'; setId: string; ids: string[] };
export type Question = QuizQuestion & {
    id: string;
    skill: Skill;
    level: Level;
    applies: Applicability;
    lessonId: string;
    picture?: Picture;
};
type Topic = [lessonId: string, skill: Skill, level: Level, applies: Applicability, answers: boolean[]];
const topics: Topic[] = [
    ['notationB', 'basic', 'beginner', 'nxn', [true, false, true]],
    ['notationB', 'basic', 'beginner', '222', [true, false]],
    ['notationB', 'basic', 'beginner', 'nxn3', [true, false]],
    ['notationA', 'advanced', 'intermediate', 'nxn', [true, false, true]],
    ['notationA', 'advanced', 'intermediate', 'nxn3', [true, true, false]],
    ['inspectionRules', 'inspection', 'beginner', 'nxn', [true, true, false]],
    ['cross', 'steps', 'beginner', 'nxn3', [true, false, true]],
    ['corners', 'steps', 'beginner', 'nxn3', [false, true, true]],
    ['middle', 'steps', 'beginner', 'nxn3', [true, true, false]],
    ['yellowCross', 'oll', 'beginner', '333', [true, false, true]],
    ['orient', 'oll', 'beginner', '333', [false, true, true]],
    ['permCorners', 'pll', 'beginner', '333', [true, false, true]],
    ['permEdges', 'pll', 'beginner', '333', [false, true, true]],
    ['crossPlan', 'steps', 'intermediate', '333', [true, true, false]],
    ['f2l', 'steps', 'intermediate', '333', [true, false, true]],
    ['oll3', 'oll', 'intermediate', '333', [false, true, true]],
    ['pll3', 'pll', 'intermediate', '333', [true, true, false]],
    ['firstLayer', 'steps', 'beginner', '222', [true, false, true]],
    ['orient2', 'oll', 'beginner', '222', [true, true, false]],
    ['perm2', 'ortega', 'beginner', '222', [false, true, true]],
    ['firstFace', 'ortega', 'intermediate', '222', [true, false, true]],
    ['oll2', 'ortega', 'intermediate', '222', [true, false, true]],
    ['pbl2', 'ortega', 'intermediate', '222', [false, true, true]],
];
const customKey: Record<string, string> = {
    'notationB:222': 'aQBasic2',
    'notationB:nxn3': 'aQBasic3',
    'notationB:nxn': 'aQFace',
    'notationA:nxn': 'aQRotation',
    'notationA:nxn3': 'aQWide',
};
function move(
    lessonId: string,
    skill: Skill,
    level: Level,
    applies: Applicability,
    setup: string,
    moves: string[],
    correct: number,
): Question {
    return {
        id: lessonId + '-' + setup,
        lessonId,
        skill,
        level,
        applies,
        promptKey: 'aIdentifyMove',
        optionKeys: moves,
        correct,
        picture: { kind: 'move', setup, moves },
    };
}
function visual(
    lessonId: string,
    skill: Skill,
    applies: Applicability,
    setId: string,
    ids: string[],
    correct: number,
): Question {
    return {
        id: lessonId + '-case',
        lessonId,
        skill,
        applies,
        level: 'intermediate',
        promptKey: 'aIdentify',
        optionKeys: ids.map((id) => 'aCase_' + id),
        caseId: ids[correct],
        correct,
        picture: { kind: 'case', setId, ids },
    };
}
export const questionBank: Question[] = [
    ...topics.flatMap(([lessonId, skill, level, applies, answers]) =>
        answers.map((answer, i) => ({
            id: [lessonId, applies, i].join('-'),
            lessonId,
            skill,
            level,
            applies,
            promptKey: (customKey[lessonId + ':' + applies] ?? 'aQuiz_' + lessonId) + '_' + i,
            optionKeys: ['aTrue', 'aFalse'],
            correct: answer ? 0 : 1,
        })),
    ),
    move('notationB', 'basic', 'beginner', 'nxn', 'R', ['U', 'R', 'F'], 1),
    move('notationB', 'basic', 'beginner', 'nxn', "U'", ['U2', 'U', "U'"], 2),
    move('notationA', 'advanced', 'intermediate', 'nxn', 'z', ['x', 'y', 'z'], 2),
    move('notationA', 'advanced', 'intermediate', 'nxn3', 'Rw', ['R', 'Rw', 'M'], 1),
    visual('oll3', 'oll', '333', 'oll333', ['dot', 'line', 'el'], 1),
    visual('pll3', 'pll', '333', 'pll333', ['hperm', 'ua', 'zperm'], 0),
    visual('oll2', 'ortega', '222', 'oll222', ['h', 'sune', 'pi'], 2),
    visual('pbl2', 'ortega', '222', 'pbl222', ['mixed', 'bars', 'diags'], 0),
];
export function appliesTo(question: Question, puzzle: string) {
    const size = Number(/^(\d+)\1\1$/.exec(puzzle)?.[1]);
    const nxn = Number.isInteger(size) && size >= 2;
    return (
        question.applies === puzzle ||
        (nxn && (question.applies === 'nxn' || (question.applies === 'nxn3' && size >= 3)))
    );
}
export function lessonQuestions(puzzle: string, lessonId: string) {
    const matching = questionBank.filter((q) => q.lessonId === lessonId && appliesTo(q, puzzle));
    if (lessonId === 'notationB') {
        const specific = matching.filter((q) => q.applies !== 'nxn');
        return [...matching.slice(0, 3), ...specific].slice(0, 5);
    }
    if (lessonId === 'notationA') {
        const specific = matching.filter((q) => q.applies === 'nxn3' && !q.picture);
        return [...matching.slice(0, 3), ...specific.slice(0, 2)];
    }
    return matching.slice(0, 5);
}
function shuffle<T>(values: readonly T[], random: () => number) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
export function levelQuestions(puzzle: string, level: Level, random = Math.random) {
    const pool = shuffle(
        questionBank.filter(
            (q) =>
                appliesTo(q, puzzle) &&
                (q.level === level || (level === 'intermediate' && q.skill === 'basic')),
        ),
        random,
    );
    const visualQuestions = pool.filter((q) => q.picture);
    const movePicture = visualQuestions.find((q) => q.picture?.kind === 'move');
    const casePicture = visualQuestions.find((q) => q.picture?.kind === 'case');
    const take = movePicture && casePicture ? [movePicture, casePicture] : visualQuestions.slice(0, 2);
    const skills = [...new Set(pool.map((q) => q.skill))];
    while (take.length < 12) {
        const before = take.length;
        for (const skill of skills) {
            if (take.length >= 12) break;
            const next = pool.find((q) => q.skill === skill && !take.includes(q));
            if (next) take.push(next);
        }
        if (before === take.length) break;
    }
    return shuffle(take, random);
}
export async function questionSetup(
    question: Question,
    load: (id: string) => Promise<import('../contracts').AlgSet>,
) {
    const picture = question.picture;
    if (picture?.kind === 'move') return picture.setup;
    if (picture?.kind === 'case') {
        const set = await load(picture.setId);
        const selected = set.cases.find((c) => c.id === question.caseId);
        if (!selected) throw new RangeError('assessmentCase');
        return selected.referenceSetup;
    }
    return undefined;
}
