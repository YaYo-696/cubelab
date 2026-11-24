import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import Dexie, { liveQuery } from 'dexie';
import { CubeDatabase, solvesForEvent, type Solve } from '../../src/core/storage/db';
import { prepareRound, rulesRevision, type Competition } from '../../src/core/competition/round';
import { cubeEvent } from '../../src/puzzles/events';
import { attemptRepository } from '../../src/core/storage/attempts';
import { sessionRepository } from '../../src/core/storage/sessions';
import { exportBackup, exportCsv, importBackup } from '../../src/core/storage/backup';
let source = new CubeDatabase('phase2-source'),
    target = new CubeDatabase('phase2-target');
afterEach(async () => {
    await source.delete();
    await target.delete();
    source = new CubeDatabase('phase2-source');
    target = new CubeDatabase('phase2-target');
});
async function seed() {
    const repo = attemptRepository(source),
        sessions = sessionRepository(source);
    const [a] = await repo.sessions('333', '333');
    const b = await sessions.create('333', '333', 'Entreno');
    const c = await sessions.create('222', '222', 'Otro');
    const records: Solve[] = [];
    for (let i = 0; i < 4; i++) {
        const row: Solve = {
            id: crypto.randomUUID(),
            eventId: '333',
            puzzleId: '333',
            sessionId: i < 3 ? a.id : b,
            createdAt: i,
            result: { kind: 'time', timeMs: 11000 + i },
            penalty: i === 0 ? '+2' : i === 1 ? 'dnf' : 'none',
            source: 'timer',
            scramble: "R U'",
            comment: 'comas, "citas"',
        };
        await repo.save(row);
        records.push(row);
    }
    return { a, b, c, records, repo, sessions };
}
it('respalda todas las tablas, restaura UUID y tolera repetir la misma importación', async () => {
    const { records } = await seed();
    await source.settings.add({ key: 'language', value: 'en' });
    await source.lessons.add({ courseId: 'intro', lessonId: 'first', revision: 1, quizScore: 0.5 });
    const data = await exportBackup(source);
    await importBackup(data, target);
    await importBackup(data, target);
    expect(JSON.parse(await exportBackup(target))).toEqual(JSON.parse(data));
    expect(await target.solves.bulkGet(records.map((s) => s.id))).toEqual(records);
    expect(await exportCsv(target)).toContain('"comas, ""citas"""');
});
it('aborta un respaldo con referencia inválida y rechaza UUID duplicados', async () => {
    await seed();
    const data = JSON.parse(await exportBackup(source));
    const invalid = structuredClone(data);
    invalid.tables.solves[3].sessionId = 'missing';
    await expect(importBackup(JSON.stringify(invalid), target)).rejects.toThrow();
    expect(await target.sessions.count()).toBe(0);
    expect(await target.solves.count()).toBe(0);
    data.tables.solves.push(data.tables.solves[0]);
    await expect(importBackup(JSON.stringify(data), target)).rejects.toThrow();
    expect(await target.solves.count()).toBe(0);
});
it('mueve y fusiona sin duplicar, conserva UUID y permite restaurar la sesión', async () => {
    const { a, b, c, records, repo, sessions } = await seed();
    await expect(sessions.move(a.id, c, [records[0].id])).rejects.toThrow();
    await expect(sessions.move(a.id, b, [records[0].id, 'missing'])).rejects.toThrow();
    expect(await repo.count(a.id)).toBe(3);
    await sessions.move(a.id, b, [records[0].id, records[0].id]);
    expect(await repo.count(a.id)).toBe(2);
    expect(await repo.count(b)).toBe(2);
    await sessions.merge(a.id, b);
    expect(await repo.count(b)).toBe(4);
    expect(await repo.count(a.id)).toBe(0);
    expect((await source.solves.toCollection().primaryKeys()).sort()).toEqual(
        records.map((s) => s.id).sort(),
    );
    expect((await source.sessions.get(a.id))?.archivedAt).toBeDefined();
    await sessions.archive(a.id, false);
    await sessions.rename(a.id, 'Otra práctica');
    expect(await source.sessions.get(a.id)).toMatchObject({ name: 'Otra práctica' });
    expect((await source.sessions.get(a.id))?.archivedAt).toBeUndefined();
});

it('restaura sesiones y solves tetraédricos en el respaldo v3', async () => {
    const repo = attemptRepository(source);
    for (const puzzleId of ['pyram', 'pyramduo']) {
        const [session] = await repo.sessions(puzzleId, puzzleId);
        await repo.save({
            id: crypto.randomUUID(),
            eventId: puzzleId,
            puzzleId,
            sessionId: session.id,
            createdAt: 10,
            result: { kind: 'time', timeMs: 1234 },
            penalty: 'none',
            source: 'timer',
            scramble: puzzleId === 'pyram' ? "U L u b l r'" : "U L'",
        });
    }
    const backup = await exportBackup(source);
    await importBackup(backup, target);
    expect(JSON.parse(await exportBackup(target))).toEqual(JSON.parse(backup));
    expect(await target.solves.where('[eventId+createdAt]').equals(['pyram', 10]).count()).toBe(1);
    expect(await target.solves.where('[eventId+createdAt]').equals(['pyramduo', 10]).count()).toBe(1);
});

it('actualiza los historiales FMC y Multi-Blind al confirmar un respaldo v4 con una competencia', async () => {
    const repo = attemptRepository(source);
    const [fmcSession] = await repo.sessions('333fm', '333');
    const [multiSession] = await repo.sessions('333mbf', '333');
    const common = { puzzleId: '333', createdAt: 42, penalty: 'none', source: 'timer' } as const;
    const fmc: Solve = {
        ...common,
        id: crypto.randomUUID(),
        eventId: '333fm',
        sessionId: fmcSession.id,
        result: { kind: 'moves', moves: 24 },
        scramble: "R' U' F R U R' U' F",
        reconstruction: "F' U R F' U' R'",
    };
    const multi: Solve = {
        ...common,
        id: crypto.randomUUID(),
        eventId: '333mbf',
        sessionId: multiSession.id,
        result: { kind: 'multiBlind', attempted: 2, solved: 2, timeMs: 90_000 },
        scramble: "R U x\nF2 R y",
    };
    await repo.save(fmc);
    await repo.save(multi);
    let mix = 0;
    const round = await prepareRound(
        { eventId: '333', format: 'ao5', timeLimitMs: 60_000 },
        cubeEvent('333'),
        async () => 'mix-' + ++mix,
        new AbortController().signal,
        () => {},
    );
    const competition: Competition = {
        id: crypto.randomUUID(),
        name: 'Práctica',
        createdAt: 42,
        rulesRevision,
        rounds: [round],
    };
    await source.competitions.add(competition);
    const backup = await exportBackup(source);
    expect(JSON.parse(backup).version).toBe(4);

    const histories = () =>
        target.transaction('r', target.sessions, target.solves, () =>
            Promise.all([solvesForEvent('333fm', target), solvesForEvent('333mbf', target)]),
        );
    let latest: Solve[][] | undefined;
    const subscription = liveQuery(histories).subscribe((value) => {
        latest = value;
    });
    try {
        await expect.poll(() => latest).toEqual([[], []]);

        // Hold the transaction open so the subscribed history spans a delayed commit.
        let commit!: () => void;
        const gate = new Promise<void>((resolve) => {
            commit = resolve;
        });
        let imported = false;
        const transaction = target.transaction('rw', target.tables, async () => {
            await importBackup(backup, target);
            imported = true;
            await Dexie.waitFor(gate);
        });
        try {
            await expect.poll(() => imported).toBe(true);
            expect(latest).toEqual([[], []]);
        } finally {
            commit();
            await transaction;
        }

        await expect.poll(() => latest).toEqual([[fmc], [multi]]);
        await expect(histories()).resolves.toEqual([[fmc], [multi]]);
        await expect(target.competitions.get(competition.id)).resolves.toEqual(competition);
    } finally {
        subscription.unsubscribe();
    }
});
