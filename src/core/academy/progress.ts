import type { Course, Lesson } from '../contracts';
import type { CubeDatabase } from '../storage/db';
export type Completion = { lessonId: string; revision: number; completedAt?: number };
export function unlocked(course: Course, lesson: Lesson, progress: readonly Completion[]) {
    return lesson.requires.every((id) =>
        progress.some(
            (row) =>
                row.lessonId === id && row.revision === course.revision && row.completedAt !== undefined,
        ),
    );
}
export function score(lesson: Lesson, answers: readonly number[]) {
    return lesson.quiz.reduce(
        (total, question, i) => total + Number(answers[i] === question.correct),
        0,
    );
}
export async function submitLesson(
    db: CubeDatabase,
    course: Course,
    lessonId: string,
    answers: readonly number[],
) {
    const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
    if (
        !lesson ||
        answers.length !== lesson.quiz.length ||
        lesson.quiz.some(
            (q, i) =>
                !Number.isInteger(answers[i]) || answers[i] < 0 || answers[i] >= q.optionKeys.length,
        )
    )
        throw new RangeError('academyAnswers');
    return db.transaction('rw', db.lessons, async () => {
        const rows = await db.lessons
            .where('[courseId+lessonId]')
            .between([course.id, ''], [course.id, '\uffff'], true, true)
            .toArray();
        if (!unlocked(course, lesson, rows)) throw new Error('academyLocked');
        const actual = score(lesson, answers);
        const previous = rows.find((r) => r.lessonId === lesson.id && r.revision === course.revision);
        const completedAt =
            previous?.completedAt ?? (actual === lesson.quiz.length ? Date.now() : undefined);
        await db.lessons.put({
            courseId: course.id,
            lessonId: lesson.id,
            revision: course.revision,
            completedAt,
            quizScore: Math.max(previous?.quizScore ?? 0, actual),
        });
        return actual;
    });
}
