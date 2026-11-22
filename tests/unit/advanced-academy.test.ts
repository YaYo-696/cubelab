import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { Alg, Move } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import { finalRotation, openingMoves } from '../../src/core/academy/execution';
import { registry } from '../../src/puzzles/registry';
import {
    isFullPattern,
    lastLayerKey,
    lastLayerStickers,
    patternFromVectors,
} from '../../src/core/academy/lastLayer';
import { matchesCase, verifyCase, type AcademyCase } from '../../src/core/academy/cases';
import { levelQuestions, questionBank, questionSetup } from '../../src/core/academy/questions';
import { answersToEvidence, recommendations, saveEvaluation } from '../../src/core/academy/evaluation';
import { exportBackup, importBackup } from '../../src/core/storage/backup';
import { CubeDatabase } from '../../src/core/storage/db';

const catalog = [
    {
        set: 'fullOLL',
        cube: '333',
        names: Array.from({ length: 57 }, (_, i) => 'OLL ' + (i + 1)),
        alternatives: 109,
    },
    {
        set: 'fullPLL',
        cube: '333',
        names: 'Aa Ab E F Ga Gb Gc Gd H Ja Jb Na Nb Ra Rb T Ua Ub V Y Z'.split(' '),
        alternatives: 41,
    },
    {
        set: 'fullCLL',
        cube: '222',
        names: ['AS', 'H', 'L', 'Pi', 'Sune', 'T', 'U']
            .flatMap((g) =>
                Array.from({ length: g === 'H' ? 4 : 6 }, (_, i) => 'CLL ' + g + ' ' + (i + 1)),
            )
            .concat('CLL O Adj', 'CLL O Diag'),
        alternatives: 80,
    },
    { set: 'eg', cube: '222', names: ['EG1 AS 2', 'EG1 AS 3', 'EG2 AS 1', 'EG2 AS 2'], alternatives: 0 },
] as const;
for (const config of catalog) {
    it(config.set + ' cubre patrones únicos y algoritmos completos', async () => {
        const mod = await registry[config.cube](),
            set = await mod.loadAlgSet(config.set);
        const solved = (
            await puzzles[config.cube === '222' ? '2x2x2' : '3x3x3'].kpuzzle()
        ).defaultPattern();
        const cases = set.cases as AcademyCase[];
        expect(cases.map((c) => c.id).sort()).toEqual([...config.names].sort());
        const keys = new Set<string>();
        let alternatives = 0;
        for (const entry of cases) {
            const { pattern } = entry;
            if (!isFullPattern(pattern)) throw new Error(entry.id);
            const independent = patternFromVectors(solved, pattern);
            const key = lastLayerKey(independent, pattern.kind);
            expect(keys.has(key), entry.id).toBe(false);
            keys.add(key);
            const initial = lastLayerStickers(solved.applyAlg(entry.referenceSetup));
            expect(initial.top).toHaveLength(config.cube === '222' ? 4 : 9);
            expect(
                initial.strips.every((side) => side.length === initial.size && !side.includes('?')),
            ).toBe(true);
            expect(entry.algorithms.length, entry.id).toBeGreaterThanOrEqual(1);
            expect(entry.algorithms.length, entry.id).toBeLessThanOrEqual(3);
            for (const algorithm of entry.algorithms)
                expect(verifyCase(solved, entry, algorithm), entry.id + ' ' + algorithm).toBe(true);
            if (config.set !== 'eg') {
                const moves = [...new Alg(entry.algorithms[0]).experimentalExpand()];
                const backOrWideLeft = moves.filter(
                    (move) => move instanceof Move && /^(B|b|Bw|l|Lw)$/.test(move.quantum.toString()),
                );
                // FUENTES.md lists zero source exceptions. Future exceptions need an exact
                // case and sequence allowlist here and a source citation there.
                expect(backOrWideLeft.map(String), entry.id + ' / ' + entry.algorithms[0]).toEqual([]);
            }
            alternatives += entry.algorithms.length - 1;
        }
        expect(alternatives).toBe(config.alternatives);
        if (config.set !== 'eg') {
            const represented = questionBank.filter(
                (q) => q.picture?.kind === 'case' && q.picture.setId === config.set,
            );
            expect(represented.map((q) => q.caseId).sort()).toEqual([...config.names].sort());
        }
        for (const entry of cases) {
            const state = solved.applyAlg(entry.referenceSetup);
            expect(
                cases.filter((other) => matchesCase(state, solved, other.pattern)).map((c) => c.id),
            ).toEqual([entry.id]);
        }
    });
}
it('conserva el agarre publicado y resuelve Aa sin una rotación de retorno', async () => {
    const mod = await registry['333']();
    const set = await mod.loadAlgSet('fullPLL');
    const aa = set.cases.find((entry) => entry.id === 'Aa') as AcademyCase;
    const sequence = "x R' U R' D2 R U' R' D2 R2";
    expect(aa.algorithms[0]).toBe(sequence);
    const solved = (await puzzles['3x3x3'].kpuzzle()).defaultPattern();
    const previous = new Alg("R' F R' B2 R F' R' B2 R2").invert();
    const initial = solved.applyAlg(aa.referenceSetup);
    expect(initial.isIdentical(solved.applyAlg(previous))).toBe(true);
    const end = initial.applyAlg(sequence);
    expect(end.isIdentical(solved)).toBe(false);
    expect(end.applyAlg(finalRotation(new Alg(sequence)).invert()).isIdentical(solved)).toBe(true);
    expect(verifyCase(solved, aa, sequence + ' R')).toBe(false);
});
it('distingue ajustes U y giros de agarre sin tocar el resto de la notación', () => {
    expect(openingMoves("U' y z R U (R' U')")).toEqual({
        steps: [
            { key: 'aAdjustUpper', move: "U'" },
            { key: 'aRotateCube', move: 'y' },
            { key: 'aRotateCube', move: 'z' },
        ],
        body: "R U (R' U')",
    });
    expect(openingMoves("R U R' U'").steps).toEqual([]);
});

it('evalua casos por grupo y devuelve recomendaciones por grupo en ambos cubos', async () => {
    for (const cube of ['222', '333'] as const) {
        const mod = await registry[cube](),
            questions = levelQuestions(cube, 'advanced', () => 0.33);
        expect(questions).toHaveLength(12);
        for (const skill of cube === '222' ? ['cll'] : ['oll', 'pll'])
            expect(questions.some((q) => q.skill === skill && q.picture)).toBe(true);
        const miss = questions.findIndex((q) => q.picture?.kind === 'case' && q.picture.top);
        const answers = questions.map((q, i) =>
            i === miss ? (q.correct + 1) % q.optionKeys.length : q.correct,
        );
        expect(recommendations(answersToEvidence(questions, answers))).toMatchObject([
            { lessonId: questions[miss].lessonId },
        ]);
        expect(await questionSetup(questions[miss], mod.loadAlgSet)).toBeTruthy();
    }
});
it('importa un respaldo v1 con sesiones, solve, progreso y ajustes', async () => {
    const db = new CubeDatabase('academy-legacy-backup');
    const id = '11111111-1111-4111-8111-111111111111';
    const solve = {
        id,
        eventId: '333',
        puzzleId: '333',
        sessionId: 'default:333',
        createdAt: 1,
        penalty: '+2',
        source: 'timer',
        scramble: 'R U',
        result: { kind: 'time', timeMs: 12345 },
        comment: 'v1',
    };
    const lesson = {
        courseId: 'academy-333',
        lessonId: 'notationB',
        revision: 1,
        quizScore: 3,
        completedAt: 2,
    };
    const settings = { key: 'language', value: 'es' };
    const old = {
        version: 1,
        tables: {
            sessions: [{ id: 'default:333', eventId: '333', puzzleId: '333', name: '', createdAt: 0 }],
            solves: [solve],
            trainerCases: [],
            lessons: [lesson],
            rounds: [],
            settings: [settings],
        },
    };
    try {
        await importBackup(JSON.stringify(old), db);
        expect(await db.solves.get(id)).toEqual(solve);
        expect(await db.lessons.get(['academy-333', 'notationB'])).toEqual(lesson);
        expect(await db.settings.get('language')).toEqual(settings);
        expect(await db.evaluations.count()).toBe(0);
    } finally {
        await db.delete();
    }
});

it('preserva una evaluacion avanzada de CLL al exportar e importar', async () => {
    const source = new CubeDatabase('academy-cll-source'),
        target = new CubeDatabase('academy-cll-target');
    const questions = levelQuestions('222', 'advanced', () => 0.4);
    const answers = questions.map((q) => q.correct);
    try {
        const result = await saveEvaluation(source, '222', 'advanced', questions, answers);
        expect(result.skills.some((skill) => skill.skill === 'cll')).toBe(true);
        await importBackup(await exportBackup(source), target);
        expect(await target.evaluations.get(result.id)).toEqual(result);
    } finally {
        await source.delete();
        await target.delete();
    }
});
