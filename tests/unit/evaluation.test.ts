import 'fake-indexeddb/auto';
import { Alg, Move } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import { expect, it } from 'vitest';
import { registry } from '../../src/puzzles/registry';
import { family, taughtFamilies } from '../../src/core/academy/glossary';
import { matchesCase, type AcademyCase } from '../../src/core/academy/cases';
import {
    appliesTo,
    levelQuestions,
    lessonQuestions,
    questionBank,
    questionSetup,
} from '../../src/core/academy/questions';
import {
    answersToEvidence,
    recommendations,
    saveEvaluation,
    skillScores,
} from '../../src/core/academy/evaluation';
import { CubeDatabase } from '../../src/core/storage/db';
import { exportBackup, importBackup } from '../../src/core/storage/backup';
import { translate } from '../../src/i18n/translate';

for (const [id, puzzle] of [
    ['222', '2x2x2'],
    ['333', '3x3x3'],
] as const) {
    it(id + ' enseña todos los movimientos antes de usarlos', async () => {
        const mod = await registry[id](),
            course = await mod.loadCourse(mod.courses[0]);
        const lessons = course.modules.flatMap((m) => m.lessons);
        const taught = new Map<string, Set<string>>();
        for (const lesson of lessons) {
            if (['fullOLL', 'fullPLL', 'fullCLL', 'eg'].includes(lesson.setId))
                expect(lesson.requires, lesson.id).toContain('notationA');
            const moves = new Set(
                lesson.requires.flatMap((prerequisite) => [...taught.get(prerequisite)!]),
            );
            if (lesson.glossary) for (const move of taughtFamilies(id, lesson.glossary)) moves.add(move);
            taught.set(lesson.id, moves);
            const set = await mod.loadAlgSet(lesson.setId);
            const material = [
                ...lesson.demos.flatMap((d) => [d.setup, d.alg]),
                ...set.cases
                    .filter((c) => lesson.caseIds.includes(c.id))
                    .flatMap((raw) => {
                        const c = raw as AcademyCase;
                        return [c.referenceSetup, ...c.algorithms, ...(c.alternativeSetups ?? [])];
                    }),
            ];
            for (const source of material)
                for (const move of new Alg(source).expand().childAlgNodes()) {
                    expect(move).toBeInstanceOf(Move);
                    expect(
                        moves.has(family((move as Move).quantum.toString())),
                        lesson.id + ' / ' + source + ' / ' + move,
                    ).toBe(true);
                }
        }
        expect(lessons.find((l) => l.id === 'notationB')?.glossary).toBe('basic');
    });
    it(id + ' tiene preguntas verificables, aplicables y evaluaciones mixtas', async () => {
        const mod = await registry[id](),
            course = await mod.loadCourse(mod.courses[0]);
        const kp = await puzzles[puzzle].kpuzzle(),
            solved = kp.defaultPattern();
        const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const pool = questionBank.filter((q) => appliesTo(q, id));
        expect(new Set(pool.map((q) => q.id)).size).toBe(pool.length);
        for (const q of pool) {
            expect(lessonIds, q.id).toContain(q.lessonId);
            expect(q.correct).toBeGreaterThanOrEqual(0);
            expect(q.correct).toBeLessThan(q.optionKeys.length);
            expect(new Set(q.optionKeys).size).toBe(q.optionKeys.length);
            for (const lang of ['es', 'en'] as const) {
                expect(translate(lang, q.promptKey)).not.toBe(q.promptKey);
                if (q.picture?.kind !== 'move')
                    for (const key of q.optionKeys) expect(translate(lang, key)).not.toBe(key);
            }
            const setup = await questionSetup(q, mod.loadAlgSet);
            if (q.picture?.kind === 'move') {
                const pattern = solved.applyAlg(setup!);
                expect(
                    q.picture.moves.map((move) => solved.applyAlg(move).isIdentical(pattern)),
                ).toEqual(q.optionKeys.map((_, i) => i === q.correct));
            }
            if (q.picture?.kind === 'case') {
                const set = await mod.loadAlgSet(q.picture.setId);
                const state = solved.applyAlg(setup!);
                expect(
                    q.picture.ids.map((id) =>
                        matchesCase(
                            state,
                            solved,
                            (set.cases.find((c) => c.id === id) as AcademyCase).pattern,
                        ),
                    ),
                ).toEqual(q.optionKeys.map((_, i) => i === q.correct));
            }
        }
        for (const level of ['beginner', 'intermediate'] as const) {
            const first = levelQuestions(id, level, () => 0.1),
                second = levelQuestions(id, level, () => 0.9);
            expect(first).toHaveLength(12);
            expect(second).toHaveLength(12);
            expect(first.map((q) => q.id)).not.toEqual(second.map((q) => q.id));
            expect(first.some((q) => q.picture)).toBe(true);
            expect(first.some((q) => q.skill === 'basic')).toBe(true);
            expect(first.every((q) => appliesTo(q, id))).toBe(true);
        }
        if (id === '333')
            expect(kp.algToTransformation('Rw').isIdentical(kp.algToTransformation('L x'))).toBe(true);
    });
}
it('diferencia preguntas 2×2, 3×3 y NxN y recomienda por habilidad y práctica', () => {
    expect(lessonQuestions('222', 'notationB').map((q) => q.id)).not.toEqual(
        lessonQuestions('333', 'notationB').map((q) => q.id),
    );
    expect(questionBank.filter((q) => appliesTo(q, '444')).some((q) => q.applies === 'nxn3')).toBe(true);
    expect(questionBank.filter((q) => appliesTo(q, '101010')).some((q) => q.applies === 'nxn3')).toBe(
        true,
    );
    const questions = lessonQuestions('333', 'notationB');
    const answers = questions.map((q) => 1 - q.correct);
    const evidence = answersToEvidence(questions, answers);
    expect(skillScores(evidence)).toEqual([{ skill: 'basic', correct: 0, total: 5 }]);
    expect(
        recommendations([
            ...evidence,
            { source: 'practice', skill: 'pll', lessonId: 'pll3', timeMs: 500, targetMs: 300 },
        ]),
    ).toEqual([
        { skill: 'basic', lessonId: 'notationB', missed: 5 },
        { skill: 'pll', lessonId: 'pll3', missed: 1 },
    ]);
    expect(
        recommendations([
            { source: 'practice', skill: 'pll', lessonId: 'pll3', timeMs: 300, targetMs: 300 },
        ]),
    ).toEqual([]);
});
it('conserva historial tras reabrir y en un respaldo; acepta respaldos v1', async () => {
    const source = new CubeDatabase('assessment-source'),
        target = new CubeDatabase('assessment-target');
    try {
        const questions = levelQuestions('333', 'intermediate', () => 0.2);
        await expect(saveEvaluation(source, '333', 'intermediate', questions, [])).rejects.toThrow();
        const attempt = await saveEvaluation(
            source,
            '333',
            'intermediate',
            questions,
            questions.map((q) => q.correct),
        );
        source.close();
        await source.open();
        expect(await source.evaluations.toArray()).toEqual([attempt]);
        const old = JSON.parse(await exportBackup(source));
        old.version = 1;
        delete old.tables.evaluations;
        await importBackup(JSON.stringify(old), target);
        expect(await target.evaluations.count()).toBe(0);
        await importBackup(await exportBackup(source), target);
        expect(await target.evaluations.toArray()).toEqual([attempt]);
    } finally {
        await source.delete();
        await target.delete();
    }
});
