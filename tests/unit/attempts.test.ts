import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { db, CubeDatabase, type Solve } from '../../src/core/storage/db';
import { attemptRepository, replayAttempts } from '../../src/core/storage/attempts';
const name = 'cubelab-repo-test';
let database = new CubeDatabase(name);
afterEach(async () => {
    await database.delete();
    database = new CubeDatabase(name);
});
it('sesiones idempotentes, fallo, reintento, ediciones, deshacer y reapertura', async () => {
    const repo = attemptRepository(database);
    const id = crypto.randomUUID();
    const solve: Solve = {
        id,
        puzzleId: '333',
        sessionId: 'default:333bf',
        eventId: '333bf',
        createdAt: 1,
        scramble: 'R U',
        penalty: 'none',
        result: { kind: 'time', timeMs: 12345 },
        source: 'timer',
    };
    await expect(repo.save(solve)).rejects.toThrow();
    expect(await database.solves.count()).toBe(0);
    await Promise.all([repo.sessions('333bf', '333'), repo.sessions('333bf', '333')]);
    await repo.sessions('333', '333');
    await repo.sessions('222', '222');
    expect(await database.sessions.count()).toBe(3);
    await Promise.all([repo.save(solve), repo.save(solve)]);
    expect(await database.solves.count()).toBe(1);
    await repo.edit(id, { penalty: '+2' });
    await repo.save(solve);
    expect((await repo.recent(solve.sessionId))[0].penalty).toBe('+2');
    await repo.edit(id, { penalty: 'dnf', comment: 'memoria' });
    await repo.edit(id, { deletedAt: 123 });
    await repo.save(solve);
    expect(await repo.recent(solve.sessionId)).toEqual([]);
    await repo.edit(id, { deletedAt: undefined });
    database.close();
    database = new CubeDatabase(name);
    expect(await attemptRepository(database).recent(solve.sessionId)).toEqual([
        { ...solve, penalty: 'dnf', comment: 'memoria' },
    ]);
    expect(await attemptRepository(database).recent('default:333')).toEqual([]);
});

it('conserva los doce intentos al reabrir y consulta solo los cinco últimos', async () => {
    const repo = attemptRepository(database);
    const [session] = await repo.sessions('222', '222');
    for (let i = 1; i <= 12; i++) {
        await repo.save({
            id: crypto.randomUUID(),
            createdAt: i,
            eventId: '222',
            puzzleId: '222',
            sessionId: session.id,
            result: { kind: 'time', timeMs: i * 1000 },
            scramble: 'R U F R',
            source: 'timer',
            penalty: 'none',
        });
    }
    database.close();
    database = new CubeDatabase(name);
    const recovered = attemptRepository(database);
    expect(await recovered.count(session.id)).toBe(12);
    expect((await recovered.recent(session.id)).map((s) => s.createdAt)).toEqual([12, 11, 10, 9, 8]);
});

it('recupera un pendiente huérfano en la sesión de su evento y limpia la cola tras confirmar', async () => {
    const solve: Solve = {
        id: crypto.randomUUID(),
        createdAt: 123,
        puzzleId: '333',
        eventId: '333bf',
        sessionId: 'sesion-eliminada',
        scramble: 'R U x',
        result: { kind: 'time', timeMs: 1234 },
        penalty: '+2',
        source: 'timer',
        comment: 'conservar',
    };
    const key = 'cubelab.pending.' + solve.id;
    const journal = new Map([[key, JSON.stringify(solve)]]);
    vi.stubGlobal('localStorage', {
        get length() {
            return journal.size;
        },
        key: (i: number) => [...journal.keys()][i] ?? null,
        getItem: (k: string) => journal.get(k) ?? null,
        setItem: (k: string, value: string) => journal.set(k, value),
        removeItem: (k: string) => journal.delete(k),
    });
    const failOnce = () => {
        throw new Error('write failed');
    };
    try {
        db.solves.hook('creating', failOnce);
        await expect(replayAttempts()).rejects.toThrow('write failed');
        expect(journal.has(key)).toBe(true);
        expect(await db.sessions.count()).toBe(0); // default creation rolled back too
        db.solves.hook('creating').unsubscribe(failOnce);
        await replayAttempts();
        expect(journal.has(key)).toBe(false);
        db.close();
        await db.open();
        expect(await db.sessions.get('default:333bf')).toMatchObject({
            eventId: '333bf',
            puzzleId: '333',
        });
        expect(await db.solves.get(solve.id)).toEqual({ ...solve, sessionId: 'default:333bf' });
        journal.set(key, JSON.stringify(solve)); // stale copy from another tab
        await replayAttempts();
        expect(await db.solves.count()).toBe(1);
        expect(journal.size).toBe(0);
    } finally {
        db.solves.hook('creating').unsubscribe(failOnce);
        vi.unstubAllGlobals();
        await db.delete();
    }
});
