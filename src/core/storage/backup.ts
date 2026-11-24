import { validCompetition } from '../competition/storage';
import { db, type CubeDatabase, type Session, type Solve } from './db';

const names = [
    'sessions',
    'solves',
    'trainerCases',
    'trainerAttempts',
    'lessons',
    'rounds',
    'settings',
    'evaluations',
    'competitions',
] as const;
type TableName = (typeof names)[number];
type Row = Record<string, unknown>;
function check(condition: unknown): asserts condition {
    if (!condition) throw new Error('invalidBackup');
}
function object(value: unknown): Row {
    check(value && typeof value === 'object' && !Array.isArray(value));
    return value as Row;
}
const string = (x: unknown): x is string => typeof x === 'string';
const count = (x: unknown): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const uuid = (x: unknown): x is string =>
    string(x) && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(x);
const optional = (x: unknown, rule: (v: unknown) => boolean) => x === undefined || rule(x);
const list = (x: unknown, rule: (v: unknown) => boolean): x is unknown[] =>
    Array.isArray(x) && x.every(rule);
const textFields = (r: Row, keys: string[]) => keys.every((key) => string(r[key]));
const integerFields = (r: Row, keys: string[]) => keys.every((key) => count(r[key]));
function rowKey(name: TableName, r: Row): string | string[] {
    switch (name) {
        case 'sessions':
            check(
                textFields(r, ['eventId', 'puzzleId', 'name']) &&
                    count(r.createdAt) &&
                    optional(r.archivedAt, count),
            );
            check(uuid(r.id) || (string(r.eventId) && r.id === 'default:' + r.eventId));
            return r.id as string;
        case 'solves': {
            const v = object(r.result);
            check(
                (v.kind === 'time' && count(v.timeMs)) ||
                    (v.kind === 'moves' && count(v.moves)) ||
                    (v.kind === 'multiBlind' &&
                        count(v.timeMs) &&
                        count(v.solved) &&
                        count(v.attempted) &&
                        v.solved <= v.attempted),
            );
            check(
                uuid(r.id) &&
                    textFields(r, ['eventId', 'puzzleId', 'sessionId', 'scramble']) &&
                    count(r.createdAt) &&
                    ['none', '+2', 'dnf'].includes(r.penalty as string) &&
                    ['manual', 'timer', 'smartcube', 'stackmat'].includes(r.source as string) &&
                    optional(r.deletedAt, count) &&
                    optional(r.comment, string) &&
                    optional(r.reconstruction, string) &&
                    optional(r.splitsMs, (x) => list(x, count)),
            );
            return r.id;
        }
        case 'settings':
            check(string(r.key) && string(r.value));
            return r.key;
        case 'trainerCases':
            check(
                textFields(r, ['puzzleId', 'setId', 'caseId']) &&
                    integerFields(r, ['dueAt', 'attempts', 'correct', 'totalMs', 'validTimes']) &&
                    ['new', 'learning', 'learned'].includes(r.status as string) &&
                    optional(r.bestMs, count) &&
                    optional(r.lastSeenAt, count) &&
                    ['timedAttempts', 'assistedAttempts', 'streak', 'intervalDays'].every((key) =>
                        optional(r[key], count),
                    ) &&
                    (!count(r.timedAttempts) ||
                        (count(r.validTimes) &&
                            count(r.attempts) &&
                            r.timedAttempts >= r.validTimes &&
                            r.timedAttempts <= r.attempts)) &&
                    (!count(r.assistedAttempts) ||
                        (count(r.timedAttempts) && r.assistedAttempts <= r.timedAttempts)),
            );
            return [r.puzzleId, r.setId, r.caseId] as string[];
        case 'trainerAttempts':
            check(
                uuid(r.id) &&
                    textFields(r, ['puzzleId', 'setId', 'caseId', 'scramble']) &&
                    count(r.createdAt) &&
                    typeof r.correct === 'boolean',
            );
            check(
                (r.mode === 'timed' &&
                    typeof r.assisted === 'boolean' &&
                    (r.correct ? count(r.timeMs) : optional(r.timeMs, count))) ||
                    (r.mode === 'recognition' &&
                        string(r.answerId) &&
                        r.correct === (r.answerId === r.caseId)),
            );
            return r.id;
        case 'lessons':
            check(
                textFields(r, ['courseId', 'lessonId']) &&
                    count(r.revision) &&
                    optional(r.completedAt, count) &&
                    optional(r.quizScore, number),
            );
            return [r.courseId, r.lessonId] as string[];
        case 'evaluations':
            check(
                uuid(r.id) &&
                    string(r.puzzleId) &&
                    count(r.createdAt) &&
                    ['beginner', 'intermediate', 'advanced'].includes(r.level as string) &&
                    list(r.questionIds, string) &&
                    list(r.answers, count) &&
                    r.questionIds.length >= 10 &&
                    r.questionIds.length <= 15 &&
                    new Set(r.questionIds).size === r.questionIds.length &&
                    r.answers.length === r.questionIds.length &&
                    list(r.skills, (entry) => {
                        const skill = object(entry);
                        return (
                            [
                                'basic',
                                'advanced',
                                'steps',
                                'oll',
                                'pll',
                                'ortega',
                                'cll',
                                'inspection',
                            ].includes(skill.skill as string) &&
                            count(skill.correct) &&
                            count(skill.total) &&
                            skill.correct <= skill.total
                        );
                    }),
            );
            return r.id;
        case 'competitions':
            check(validCompetition(r));
            return r.id;
        case 'rounds':
            check(
                uuid(r.id) &&
                    textFields(r, ['eventId', 'rulesRevision', 'format']) &&
                    count(r.createdAt) &&
                    list(r.scrambles, string) &&
                    list(r.solveIds, uuid) &&
                    optional(r.cutoffMs, count) &&
                    optional(r.timeLimitMs, count),
            );
            return r.id;
    }
}
export async function exportBackup(database = db) {
    return database.transaction(
        'r',
        names.map((name) => database.table(name)),
        async () => {
            const data = await Promise.all(
                names.map(async (name) => [name, await database.table(name).toArray()]),
            );
            return JSON.stringify({ version: 4, tables: Object.fromEntries(data) }, null, 2);
        },
    );
}
export async function importBackup(source: string, database = db) {
    const file = object(JSON.parse(source));
    check([1, 2, 3, 4].includes(file.version as number));
    const tables = object(file.tables);
    const rows = new Map(
        names.map((name) => {
            const input =
                (file.version === 1 && name === 'evaluations') ||
                ((file.version === 1 || file.version === 2) && name === 'trainerAttempts') ||
                (file.version !== 4 && name === 'competitions')
                    ? []
                    : tables[name];
            check(Array.isArray(input));
            const seen = new Set<string>();
            const values = input.map((value) => {
                const row = object(value),
                    key = rowKey(name, row),
                    serialized = JSON.stringify(key);
                check(!seen.has(serialized));
                seen.add(serialized);
                return { row, key };
            });
            return [name, values] as const;
        }),
    );
    await database.transaction(
        'rw',
        names.map((name) => database.table(name)),
        async () => {
            for (const name of names) {
                const table = database.table(name);
                const additions = [];
                for (const { key, row } of rows.get(name)!) {
                    if (name === 'solves') {
                        const session = await database.sessions.get(row.sessionId as string);
                        check(
                            session &&
                                session.eventId === row.eventId &&
                                session.puzzleId === row.puzzleId,
                        );
                    }
                    if (name === 'trainerAttempts') {
                        check(
                            await database.trainerCases.get([
                                row.puzzleId,
                                row.setId,
                                row.caseId,
                            ] as string[]),
                        );
                    }
                    if (name === 'rounds') {
                        const solves = await database.solves.bulkGet(row.solveIds as string[]);
                        check(solves.every((solve) => solve?.eventId === row.eventId));
                    }
                    const existing = await table.get(key);
                    if (existing) {
                        if (name === 'settings') {
                            await table.put(row);
                            continue;
                        }
                        check(canonical(existing) === canonical(row));
                    } else additions.push(row);
                }
                await table.bulkAdd(additions);
            }
        },
    );
}
function canonical(value: unknown): string {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object')
        return (
            '{' +
            Object.entries(value)
                .filter(([, v]) => v !== undefined)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, v]) => JSON.stringify(key) + ':' + canonical(v))
                .join(',') +
            '}'
        );
    return JSON.stringify(value);
}
export function solvesCsv(solves: Solve[], sessions: Session[]) {
    const byId = new Map(sessions.map((s) => [s.id, s.name || s.id]));
    const escape = (value: string | number) => {
        const str = String(value);
        return (
            '"' + (/^[\s]*[=+@-]/.test(str) && str !== '+2' ? "'" : '') + str.replaceAll('"', '""') + '"'
        );
    };
    return [
        ['date', 'event', 'session', 'time_ms', 'penalty', 'scramble', 'comment', 'moves', 'solved', 'attempted', 'points', 'solution'],
        ...solves
            .filter((s) => s.deletedAt === undefined)
            .map((s) => [
                new Date(s.createdAt).toISOString(),
                s.eventId,
                byId.get(s.sessionId) ?? s.sessionId,
                s.result.kind === 'moves' ? '' : s.result.timeMs,
                s.penalty,
                s.scramble,
                s.comment ?? '',
                s.result.kind === 'moves' ? s.result.moves : '',
                s.result.kind === 'multiBlind' ? s.result.solved : '',
                s.result.kind === 'multiBlind' ? s.result.attempted : '',
                s.result.kind === 'multiBlind' ? s.result.solved * 2 - s.result.attempted : '',
                s.reconstruction ?? '',
            ]),
    ]
        .map((row) => row.map(escape).join(','))
        .join('\r\n');
}
export async function exportCsv(database: CubeDatabase = db) {
    return database.transaction('r', database.sessions, database.solves, async () =>
        solvesCsv(await database.solves.toArray(), await database.sessions.toArray()),
    );
}
