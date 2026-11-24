import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { devFlags } from '../../src/config/devFlags';
import { registry, visibleEvent, visibleEvents, visiblePuzzle } from '../../src/puzzles/registry';
import { attemptRepository } from '../../src/core/storage/attempts';
import { exportBackup } from '../../src/core/storage/backup';
import { CubeDatabase, solvesForEvent, type Solve } from '../../src/core/storage/db';

it('oculta las rutas y selectores no oficiales sin quitar intentos ni sesiones del respaldo', async () => {
    const database = new CubeDatabase('test-unofficial-visibility');
    const previous = devFlags.SHOW_UNOFFICIAL;
    try {
        devFlags.SHOW_UNOFFICIAL = true;
        const repo = attemptRepository(database);
        const [session] = await repo.sessions('pyramduo', 'pyramduo');
        const row: Solve = {
            id: crypto.randomUUID(),
            eventId: 'pyramduo',
            puzzleId: 'pyramduo',
            sessionId: session.id,
            createdAt: 1,
            scramble: 'U L',
            result: { kind: 'time', timeMs: 2340 },
            penalty: 'none',
            source: 'timer',
        };
        await repo.save(row);
        expect(visibleEvent('pyramduo').puzzleId).toBe('pyramduo');

        devFlags.SHOW_UNOFFICIAL = false;
        expect(visibleEvents().map(({ rules }) => rules.id)).not.toContain('pyramduo');
        expect(Object.keys(registry).filter(visiblePuzzle)).not.toContain('pyramduo');
        expect(visiblePuzzle('pyramduo')).toBe(false);
        expect(visibleEvent('pyramduo').puzzleId).toBe('333');
        expect(visibleEvents().map(({ rules }) => rules.id)).toContain('pyram');

        database.close();
        await database.open();
        await expect(database.sessions.get(session.id)).resolves.toEqual(session);
        await expect(solvesForEvent('pyramduo', database)).resolves.toEqual([row]);
        const { tables } = JSON.parse(await exportBackup(database));
        expect(tables.solves).toEqual([row]);
        expect(tables.sessions).toEqual([session]);
    } finally {
        devFlags.SHOW_UNOFFICIAL = previous;
        await database.delete();
    }
});
