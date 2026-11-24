import { devFlags, unlockAllProgress } from '../../src/config/devFlags';
import 'fake-indexeddb/auto';
import { expect, it, beforeEach, afterEach } from 'vitest';
import beginnerDrills from '../../content-drop/333-222/drills-nuevos.json';
const developmentUnlock = devFlags.UNLOCK_ALL;
beforeEach(() => { devFlags.UNLOCK_ALL = false; });
afterEach(() => { devFlags.UNLOCK_ALL = developmentUnlock; });
import { puzzles } from 'cubing/puzzles';
import { registry } from '../../src/puzzles/registry';
import { matchesStage, matchesCase, verifyCase, type AcademyCase } from '../../src/core/academy/cases';
import { submitLesson, unlocked } from '../../src/core/academy/progress';
import { predefinedPractice } from '../../src/core/academy/practice';
import { glossary } from '../../src/core/academy/glossary';
import { CubeDatabase } from '../../src/core/storage/db';
import { translate } from '../../src/i18n/translate';

for (const [id, puzzle] of [
    ['222', '2x2x2'],
    ['333', '3x3x3'],
] as const) {
    it(id + ' verifica el 100% de los algoritmos y el objetivo de cada lección', async () => {
        const mod = await registry[id]();
        const course = await mod.loadCourse(mod.courses[0]);
        const drills = await mod.loadAlgSet('drills' + id);
        const supplied = id === '222' ? beginnerDrills.drills222 : beginnerDrills.drills333;
        expect(drills.cases.slice(-supplied.length).map((raw) => {
            const entry = raw as AcademyCase;
            return { id: entry.id, setup: entry.referenceSetup, goal: entry.goal, alg: entry.algorithms[0] };
        })).toEqual(supplied);
        const kp = await puzzles[puzzle].kpuzzle(),
            solved = kp.defaultPattern();
        const covered = new Set<string>();
        for (const setId of mod.algSets) {
            const set = await mod.loadAlgSet(setId);
            let passed = 0;
            for (const raw of set.cases)
                for (const algorithm of raw.algorithms) {
                    const a = raw as AcademyCase;
                    expect(
                        verifyCase(solved, a, algorithm),
                        [id, setId, a.id, algorithm].join(' / '),
                    ).toBe(true);
                    passed++;
                }
            console.info(id + ' ' + setId + ': ' + passed + ' secuencias verificadas');
        }
        for (const lesson of course.modules.flatMap((m) => m.lessons)) {
            expect(lesson.requires.every((required) => covered.has(required))).toBe(true);
            covered.add(lesson.id);
            const set = await mod.loadAlgSet(lesson.setId);
            for (const caseId of lesson.caseIds) {
                const { setup } = await predefinedPractice(lesson, set, caseId);
                const entry = set.cases.find((c) => c.id === caseId) as AcademyCase;
                expect(
                    matchesStage(solved.applyAlg(setup), solved, entry.goal),
                    lesson.id + '/' + caseId,
                ).toBe(false);
                for (const lang of ['es', 'en'] as const) {
                    for (const key of [entry.nameKey, entry.fingertrickKey])
                        expect(translate(lang, key), key).not.toBe(key);
                }
            }
            expect(lesson.quiz.length).toBeGreaterThanOrEqual(3);
            expect(lesson.quiz.length).toBeLessThanOrEqual(5);
            for (const lang of ['es', 'en'] as const) {
                for (const key of [
                    lesson.titleKey,
                    lesson.bodyKey,
                    lesson.objectiveKey,
                    lesson.exerciseKey,
                    ...lesson.quiz.flatMap((q) => [q.promptKey, ...q.optionKeys]),
                ])
                    expect(translate(lang, key), key).not.toBe(key);
            }
            // The notation animation explicitly demonstrates a move and its cancellation.
            for (const demo of lesson.demos)
                expect(
                    matchesStage(solved.applyAlg(demo.setup).applyAlg(demo.alg), solved, 'exact'),
                ).toBe(true);
        }
    });
    it(id + ' anima las caras, giros y equivalencias del glosario', async () => {
        const kp = await puzzles[puzzle].kpuzzle();
        const expected = [
            'R',
            'L',
            'U',
            'D',
            'F',
            'B',
            "R'",
            'R2',
            'x',
            'y',
            'z',
            ...(id === '333' ? ['Rw', 'r', 'M', 'E', 'S'] : []),
        ];
        expect(glossary(id).map((x) => x.move)).toEqual(expected);
        for (const x of glossary(id)) {
            expect(
                kp.algToTransformation(x.alg).isIdentical(kp.moveToTransformation(x.move)),
                x.move,
            ).toBe(true);
            for (const lang of ['es', 'en'] as const)
                expect(translate(lang, x.descriptionKey)).not.toBe(x.descriptionKey);
        }
        if (id === '333')
            expect(kp.algToTransformation('Rw').isIdentical(kp.algToTransformation('r'))).toBe(true);
    });
}
it('rechaza un algoritmo que resuelve otro caso', async () => {
    const p = (await puzzles['3x3x3'].kpuzzle()).defaultPattern();
    const set = await (await registry['333']()).loadAlgSet('oll333');
    const sune = set.cases.find((c) => c.id === 'sune') as AcademyCase;
    const anti = set.cases.find((c) => c.id === 'antisune') as AcademyCase;
    expect(matchesCase(p.applyAlg(anti.referenceSetup), p, sune.pattern)).toBe(false);
    expect(verifyCase(p, sune, anti.algorithms[0])).toBe(false);
});
it('guarda el progreso por puzzle y revisión y valida los prerrequisitos al escribir', async () => {
    const db = new CubeDatabase('academy-test');
    try {
        const course = await (await registry['333']()).loadCourse('notation');
        const [first, next] = course.modules.flatMap((m) => m.lessons);
        const correct = (id: typeof first) => id.quiz.map((q) => q.correct);
        await expect(submitLesson(db, course, next.id, correct(next))).rejects.toThrow('academyLocked');
        await expect(submitLesson(db, course, first.id, [])).rejects.toThrow('academyAnswers');
        expect(
            await submitLesson(
                db,
                course,
                first.id,
                correct(first).map((x) => 1 - x),
            ),
        ).toBe(0);
        expect(unlocked(course, next, await db.lessons.toArray())).toBe(false);
        expect(await submitLesson(db, course, first.id, correct(first))).toBe(first.quiz.length);
        db.close();
        await db.open();
        const progress = await db.lessons.toArray();
        expect(unlocked(course, next, progress)).toBe(true);
        expect(unlocked({ ...course, revision: 2 }, next, progress)).toBe(false);
        expect(await db.lessons.get(['academy-222', first.id])).toBeUndefined();
        await submitLesson(
            db,
            course,
            first.id,
            correct(first).map((x) => 1 - x),
        );
        expect(await db.lessons.get([course.id, first.id])).toMatchObject({
            quizScore: first.quiz.length,
        });
    } finally {
        await db.delete();
    }
});

it('UNLOCK_ALL permite entrar y guardar avance sin completar los prerrequisitos', async () => {
    const m = await registry['333']();
    const course = await m.loadCourse(m.courses[0]);
    const lesson = course.modules.flatMap((item) => item.lessons).find((item) => item.id === 'cross')!;
    expect(unlockAllProgress()).toBe(false);
    expect(unlocked(course, lesson, [])).toBe(false);
    devFlags.UNLOCK_ALL = true;
    const db = new CubeDatabase('development-progress');
    try {
        expect(unlocked(course, lesson, [])).toBe(true);
        await submitLesson(db, course, lesson.id, lesson.quiz.map((question) => question.correct));
        expect((await db.lessons.get([course.id, lesson.id]))?.completedAt).toBeTypeOf('number');
    } finally { await db.delete(); }
});
