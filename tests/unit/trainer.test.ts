import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import {
    caseStats,
    choices,
    dueChoice,
    fresh,
    groupOpen,
    practiceEvidence,
    reviewCase,
    slowest,
    type TrainerAttempt,
} from '../../src/core/trainer/model';
import { saveTrainingAttempt, setTrainingStatus, trainingCases } from '../../src/core/trainer/storage';
import { CubeDatabase } from '../../src/core/storage/db';
import { recommendations } from '../../src/core/academy/evaluation';
import { exportBackup, importBackup } from '../../src/core/storage/backup';
import { registry } from '../../src/puzzles/registry';
import { devFlags } from '../../src/config/devFlags';

const key = { puzzleId: '333', setId: 'fullPLL', caseId: 'Gb' };
const day = 86400000;
const developmentUnlock = devFlags.UNLOCK_ALL;
afterEach(() => {
    devFlags.UNLOCK_ALL = developmentUnlock;
});
const timed = (overrides: Partial<Extract<TrainerAttempt, { mode: 'timed' }>> = {}): TrainerAttempt => ({
    ...key,
    id: crypto.randomUUID(),
    scramble: 'R U',
    createdAt: 1000,
    correct: true,
    mode: 'timed',
    timeMs: 3000,
    assisted: false,
    ...overrides,
});
const recognized = (answerId: string): TrainerAttempt => ({
    ...key,
    id: crypto.randomUUID(),
    scramble: 'R U',
    createdAt: 1000,
    correct: answerId === key.caseId,
    mode: 'recognition',
    answerId,
});
it('programa repaso temprano para fallos, ayuda y lentitud y expande el intervalo si hay dominio', () => {
    const start = fresh(key);
    const update = (row = start, attempt = timed()) => reviewCase(row, attempt, 4500);
    expect(update(start, timed({ correct: false, timeMs: undefined })).dueAt).toBe(61000);
    expect(update(start, timed({ assisted: true })).dueAt).toBe(181000);
    expect(update(start, timed({ timeMs: 6000 })).dueAt).toBe(601000);
    const first = update();
    const second = update(first);
    const third = update(second);
    expect([first, second, third].map((r) => r.intervalDays)).toEqual([1, 2, 4]);
    expect(third.status).toBe('learned');
    expect(third.dueAt).toBe(1000 + 4 * day);
    expect(update({ ...third, intervalDays: 30 }).intervalDays).toBe(30);
    const missed = update(third, recognized('Aa'));
    expect(missed).toMatchObject({ status: 'learning', intervalDays: 0, streak: 0, dueAt: 61000 });
    expect(update(third, recognized('Gb'))).toMatchObject({ dueAt: third.dueAt, streak: third.streak });
});

it('selecciona casos que ya vencieron y ofrece cuatro respuestas distintas', () => {
    const ids = ['Gb', 'Aa', 'Ab', 'Z'].map((id) => ({ id }));
    const rows = new Map(
        ids.map(({ id }, i) => [
            id,
            { ...fresh({ ...key, caseId: id }), dueAt: [300, 500, 200, 400][i] },
        ]),
    );
    expect(dueChoice(ids, rows, 250, () => 0)?.id).toBe('Ab');
    expect(dueChoice(ids, rows, 10, () => 0)?.id).toBe('Ab');
    expect(new Set(choices(ids[0], ids, () => 0).map((entry) => entry.id))).toEqual(
        new Set(ids.map(({ id }) => id)),
    );
});

it('respeta las puertas de Academia cuando UNLOCK_ALL está apagado', async () => {
    const mod = await registry['333']();
    const course = await mod.loadCourse(mod.courses[0]);
    devFlags.UNLOCK_ALL = false;
    expect(groupOpen(course, [], 'fullPLL-corners')).toBe(false);
    const progress = ['pll3', 'notationA'].map((lessonId) => ({
        lessonId,
        revision: course.revision,
        completedAt: 1,
    }));
    expect(groupOpen(course, progress, 'fullPLL-corners')).toBe(true);
    devFlags.UNLOCK_ALL = true;
    expect(groupOpen(course, [], 'fullPLL-corners')).toBe(true);
});

it('registra cada intento una sola vez y recomienda el caso más lento de cada set', async () => {
    const db = new CubeDatabase('trainer-review');
    try {
        const first = timed({ timeMs: 9000 });
        await saveTrainingAttempt(first, 4500, db);
        await saveTrainingAttempt(first, 4500, db);
        await saveTrainingAttempt(timed({ timeMs: 7000, assisted: true }), 4500, db);
        await saveTrainingAttempt(timed({ correct: false, timeMs: undefined }), 4500, db);
        await saveTrainingAttempt(recognized('Gb'), 4500, db);
        await saveTrainingAttempt(timed({ caseId: 'Aa', timeMs: 6200 }), 4500, db);
        expect(await db.trainerAttempts.count()).toBe(5);
        const rows = await trainingCases(db, '333', 'fullPLL');
        expect(slowest(rows).map((row) => row.caseId)).toEqual(['Gb', 'Aa']);
        expect(caseStats(rows.find((r) => r.caseId === 'Gb'))).toEqual({
            average: 8000,
            best: 7000,
            attempts: 3,
            assistedRate: 1 / 3,
        });
        const evidence = await practiceEvidence(await registry['333'](), rows);
        expect(evidence).toMatchObject([
            { source: 'practice', caseId: 'Gb', timeMs: 8000, targetMs: 4500 },
        ]);
        expect(recommendations(evidence)).toEqual([
            { skill: 'pll', lessonId: 'fullPLL-adj-swap', missed: 1 },
        ]);
        await setTrainingStatus(key, 'learned', db);
        expect((await db.trainerCases.get(['333', 'fullPLL', 'Gb']))?.status).toBe('learned');
    } finally {
        await db.delete();
    }
});

it('respalda los intentos y conserva el agregado de respaldos v1 y v2', async () => {
    const source = new CubeDatabase('trainer-backup-from');
    const target = new CubeDatabase('trainer-backup-to');
    const old = new CubeDatabase('trainer-backup-old');
    const invalid = new CubeDatabase('trainer-backup-invalid');
    try {
        await saveTrainingAttempt(timed({ assisted: true }), 4500, source);
        await saveTrainingAttempt(recognized('Aa'), 4500, source);
        const data = JSON.parse(await exportBackup(source));
        expect(data.version).toBe(4);
        await importBackup(JSON.stringify(data), target);
        expect(await target.trainerAttempts.toArray()).toEqual(await source.trainerAttempts.toArray());
        expect(await target.trainerCases.toArray()).toEqual(await source.trainerCases.toArray());
        for (const version of [1, 2]) {
            const previous = structuredClone(data);
            previous.version = version;
            delete previous.tables.trainerAttempts;
            if (version === 1) delete previous.tables.evaluations;
            previous.tables.trainerCases = previous.tables.trainerCases.map(
                (row: Record<string, unknown>) => {
                    const {
                        puzzleId,
                        setId,
                        caseId,
                        dueAt,
                        status,
                        attempts,
                        correct,
                        totalMs,
                        validTimes,
                        bestMs,
                        lastSeenAt,
                    } = row;
                    return {
                        puzzleId,
                        setId,
                        caseId,
                        dueAt,
                        status,
                        attempts,
                        correct,
                        totalMs,
                        validTimes,
                        bestMs,
                        lastSeenAt,
                    };
                },
            );
            await importBackup(JSON.stringify(previous), old);
            expect(await old.trainerAttempts.count()).toBe(0);
            expect(caseStats((await old.trainerCases.toArray())[0]).average).toBe(3000);
        }
        const orphan = structuredClone(data);
        orphan.tables.trainerAttempts[0].caseId = 'unknown';
        await expect(importBackup(JSON.stringify(orphan), invalid)).rejects.toThrow('invalidBackup');
        expect(await invalid.trainerAttempts.count()).toBe(0);
        expect(await invalid.trainerCases.count()).toBe(0);
    } finally {
        await source.delete();
        await target.delete();
        await old.delete();
        await invalid.delete();
    }
});
