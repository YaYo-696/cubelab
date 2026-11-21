import Dexie from 'dexie';
import { db, type CubeDatabase, type Solve } from './db';

export function attemptRepository(database: CubeDatabase) {
    async function ensureDefault(eventId: string, puzzleId: string) {
        const id = 'default:' + eventId;
        const existing = await database.sessions.get(id);
        if (!existing) {
            await database.sessions.add({ id, eventId, puzzleId, name: '', createdAt: Date.now() });
        } else if (existing.eventId !== eventId || existing.puzzleId !== puzzleId) {
            throw new Error('invalidSession');
        }
        return id;
    }
    return {
        async sessions(eventId: string, puzzleId: string) {
            return database.transaction('rw', database.sessions, async () => {
                await ensureDefault(eventId, puzzleId);
                const active = (await database.sessions.where('eventId').equals(eventId).toArray()).filter(
                    (s) => s.archivedAt === undefined,
                );
                if(active.length)return active;
                const session={id:crypto.randomUUID(),eventId,puzzleId,name:'',createdAt:Date.now()};
                await database.sessions.add(session);
                return [session];
            });
        },
        async save(solve: Solve, { recoverMissingSession = false } = {}) {
            await database.transaction('rw', database.sessions, database.solves, async () => {
                if (await database.solves.get(solve.id)) return;
                const session = await database.sessions.get(solve.sessionId);
                if (
                    session &&
                    session.puzzleId === solve.puzzleId &&
                    session.eventId === solve.eventId
                ) {
                    await database.solves.add(solve);
                    return;
                }
                if (!recoverMissingSession) throw new Error('invalidSession');
                const sessionId = await ensureDefault(solve.eventId, solve.puzzleId);
                await database.sessions.update(sessionId, { archivedAt: undefined });
                await database.solves.add({ ...solve, sessionId });
            });
        },
        count(sessionId: string) {
            return database.solves
                .where('[sessionId+createdAt]')
                .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
                .filter((s) => s.deletedAt === undefined)
                .count();
        },
        recent(sessionId: string) {
            return database.solves
                .where('[sessionId+createdAt]')
                .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
                .reverse()
                .filter((s) => s.deletedAt === undefined)
                .limit(5)
                .toArray();
        },
        async edit(id: string, changes: Partial<Pick<Solve, 'penalty' | 'comment' | 'deletedAt'>>) {
            if (!(await database.solves.update(id, changes))) throw new Error('missingSolve');
        },
    };
}
export const attempts = attemptRepository(db);

// Each UUID gets its own entry so tabs cannot overwrite each other's pending attempts.
const prefix = 'cubelab.pending.';
const pending = new Map<string, Solve>();
export async function persistAttempt(solve: Solve) {
    pending.set(solve.id, solve);
    try {
        localStorage.setItem(prefix + solve.id, JSON.stringify(solve));
    } catch {
        /* memory fallback */
    }
    await attempts.save(solve, { recoverMissingSession: true });
    pending.delete(solve.id);
    try {
        localStorage.removeItem(prefix + solve.id);
    } catch {
        /* replay is idempotent */
    }
}
export async function replayAttempts() {
    const entries = new Map(pending);
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                const value = JSON.parse(localStorage.getItem(key)!) as Solve;
                if (key === prefix + value.id) entries.set(value.id, value);
            }
        }
    } catch {
        /* also retry attempts held in memory */
    }
    await Promise.all([...entries.values()].map(persistAttempt));
}
