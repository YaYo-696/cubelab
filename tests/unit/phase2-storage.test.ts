import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { CubeDatabase, type Solve } from '../../src/core/storage/db';
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
