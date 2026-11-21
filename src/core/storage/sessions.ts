import Dexie from 'dexie';
import { db, type CubeDatabase, type Session } from './db';
export function sessionSolves(database: CubeDatabase, id: string) {
    return database.solves
        .where('[sessionId+createdAt]')
        .between([id, Dexie.minKey], [id, Dexie.maxKey]);
}
export function sessionRepository(database: CubeDatabase) {
    const { sessions, solves } = database;
    async function pair(from: string, to: string) {
        const [a, b] = await sessions.bulkGet([from, to]);
        if (
            !a ||
            !b ||
            a.id === b.id ||
            a.eventId !== b.eventId ||
            a.puzzleId !== b.puzzleId ||
            b.archivedAt !== undefined
        )
            throw new Error('invalidSession');
    }
    function nameOf(name: string) {
        const trimmed = name.trim();
        if (!trimmed) throw new Error('sessionName');
        return trimmed;
    }
    return {
        create(eventId: string, puzzleId: string, name: string) {
            const session: Session = {
                id: crypto.randomUUID(),
                eventId,
                puzzleId,
                name: nameOf(name),
                createdAt: Date.now(),
            };
            return sessions.add(session);
        },
        async rename(id: string, name: string) {
            if (!(await sessions.update(id, { name: nameOf(name) }))) throw new Error('invalidSession');
        },
        async archive(id: string, archive: boolean) {
            if (!(await sessions.update(id, { archivedAt: archive ? Date.now() : undefined })))
                throw new Error('invalidSession');
        },
        move(from: string, to: string, ids: string[]) {
            return database.transaction('rw', sessions, solves, async () => {
                await pair(from, to);
                const selected = await solves.bulkGet([...new Set(ids)]);
                if (selected.some((s) => !s || s.sessionId !== from || s.deletedAt !== undefined))
                    throw new Error('invalidSolve');
                await solves.bulkPut(selected.map((s) => ({ ...s!, sessionId: to })));
            });
        },
        merge(from: string, to: string) {
            return database.transaction('rw', sessions, solves, async () => {
                await pair(from, to);
                await sessionSolves(database, from).modify({ sessionId: to });
                await sessions.update(from, { archivedAt: Date.now() });
            });
        },
    };
}
export const sessionActions = sessionRepository(db);
