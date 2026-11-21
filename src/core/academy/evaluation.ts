import type { CubeDatabase } from '../storage/db';
import type { Level, Question, Skill } from './questions';
export type SkillScore = { skill: Skill; correct: number; total: number };
export type Evidence =
    | { source: 'answer'; skill: Skill; lessonId: string; correct: boolean }
    | { source: 'practice'; skill: Skill; lessonId: string; timeMs: number; targetMs: number };
export type EvaluationAttempt = {
    id: string;
    puzzleId: string;
    level: Level;
    createdAt: number;
    questionIds: string[];
    answers: number[];
    skills: SkillScore[];
};

export function answersToEvidence(
    questions: readonly Question[],
    answers: readonly number[],
): Evidence[] {
    return questions.map((q, i) => ({
        source: 'answer',
        skill: q.skill,
        lessonId: q.lessonId,
        correct: q.correct === answers[i],
    }));
}
function successful(e: Evidence) {
    return e.source === 'answer' ? e.correct : e.timeMs >= 0 && e.timeMs <= e.targetMs;
}
export function skillScores(evidence: readonly Evidence[]) {
    const skills = new Map<Skill, SkillScore>();
    for (const e of evidence) {
        const row = skills.get(e.skill) ?? { skill: e.skill, correct: 0, total: 0 };
        row.total++;
        row.correct += Number(successful(e));
        skills.set(e.skill, row);
    }
    return [...skills.values()];
}
export function recommendations(evidence: readonly Evidence[]) {
    const failures = new Map<string, { skill: Skill; lessonId: string; missed: number }>();
    for (const e of evidence)
        if (!successful(e)) {
            const { skill, lessonId } = e;
            const row = failures.get(lessonId) ?? { skill, lessonId, missed: 0 };
            row.missed++;
            failures.set(lessonId, row);
        }
    return [...failures.values()].sort(
        (a, b) => b.missed - a.missed || a.lessonId.localeCompare(b.lessonId),
    );
}
export async function saveEvaluation(
    db: CubeDatabase,
    puzzleId: string,
    level: Level,
    questions: readonly Question[],
    answers: number[],
) {
    if (
        questions.length < 10 ||
        questions.length > 15 ||
        answers.length !== questions.length ||
        questions.some(
            (q, i) =>
                !Number.isInteger(answers[i]) || answers[i] < 0 || answers[i] >= q.optionKeys.length,
        )
    )
        throw new RangeError('assessmentAnswers');
    const attempt: EvaluationAttempt = {
        id: crypto.randomUUID(),
        puzzleId,
        level,
        createdAt: Date.now(),
        questionIds: questions.map((q) => q.id),
        answers: [...answers],
        skills: skillScores(answersToEvidence(questions, answers)),
    };
    await db.evaluations.add(attempt);
    return attempt;
}
