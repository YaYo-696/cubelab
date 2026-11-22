import type { TrainingSet } from './catalog';
import type { Course, PuzzleModule } from '../contracts';
import { unlocked, type Completion } from '../academy/progress';
import type { Evidence } from '../academy/evaluation';

export type CaseKey = { puzzleId: string; setId: string; caseId: string };
export type TrainerStatus = 'new' | 'learning' | 'learned';
export type TrainerCase = CaseKey & {
    dueAt: number;
    status: TrainerStatus;
    attempts: number;
    correct: number;
    totalMs: number;
    validTimes: number;
    bestMs?: number;
    lastSeenAt?: number;
    timedAttempts?: number;
    assistedAttempts?: number;
    streak?: number;
    intervalDays?: number;
};
export type TrainerAttempt = CaseKey & {
    id: string;
    scramble: string;
    createdAt: number;
    correct: boolean;
} & ({ mode: 'timed'; timeMs?: number; assisted: boolean } | { mode: 'recognition'; answerId: string });

export const keyFor = ({ puzzleId, setId, caseId }: CaseKey): [string, string, string] => [
    puzzleId,
    setId,
    caseId,
];

export function fresh(key: CaseKey): TrainerCase {
    const { puzzleId, setId, caseId } = key;
    return {
        puzzleId,
        setId,
        caseId,
        dueAt: 0,
        status: 'new',
        attempts: 0,
        correct: 0,
        totalMs: 0,
        validTimes: 0,
    };
}
export function caseStats(row?: TrainerCase) {
    const attempts = row?.timedAttempts ?? row?.validTimes ?? 0;
    return {
        attempts,
        average: row && row.validTimes > 0 ? row.totalMs / row.validTimes : undefined,
        best: row?.bestMs,
        assistedRate: attempts ? (row?.assistedAttempts ?? 0) / attempts : 0,
    };
}
const day = 86400000;
const minute = 60000;

export function reviewCase(
    previous: TrainerCase,
    attempt: TrainerAttempt,
    targetMs: number,
): TrainerCase {
    const timed = attempt.mode === 'timed';
    const elapsed = timed && attempt.correct ? attempt.timeMs : undefined;
    const assisted = timed && attempt.assisted;
    const success =
        attempt.correct && !assisted && (!timed || (elapsed !== undefined && elapsed <= targetMs));
    const streak = success ? (previous.streak ?? 0) + Number(timed) : 0;
    const intervalDays = success
        ? timed
            ? Math.min(30, Math.max(1, (previous.intervalDays ?? 0) * 2))
            : (previous.intervalDays ?? 0)
        : 0;
    const wait = !attempt.correct
        ? minute
        : assisted
          ? 3 * minute
          : !success
            ? 10 * minute
            : intervalDays * day;
    const dueAt = success && !timed ? previous.dueAt : attempt.createdAt + wait;
    return {
        ...previous,
        attempts: previous.attempts + 1,
        correct: previous.correct + Number(attempt.correct),
        lastSeenAt: attempt.createdAt,
        totalMs: previous.totalMs + (elapsed ?? 0),
        validTimes: previous.validTimes + Number(elapsed !== undefined),
        bestMs: elapsed === undefined ? previous.bestMs : Math.min(previous.bestMs ?? elapsed, elapsed),
        timedAttempts: (previous.timedAttempts ?? previous.validTimes) + Number(timed),
        assistedAttempts: (previous.assistedAttempts ?? 0) + Number(assisted),
        status: success && (streak >= 3 || previous.status === 'learned') ? 'learned' : 'learning',
        dueAt,
        intervalDays,
        streak,
    };
}
export function dueChoice<T extends { id: string }>(
    entries: T[],
    rows: Map<string, TrainerCase>,
    now: number,
    random = Math.random,
) {
    const due = entries.filter((entry) => (rows.get(entry.id)?.dueAt ?? 0) <= now);
    const earliest = Math.min(...entries.map(({ id }) => rows.get(id)?.dueAt ?? 0));
    const candidates = due.length
        ? due
        : entries.filter((entry) => (rows.get(entry.id)?.dueAt ?? 0) === earliest);
    return candidates[Math.floor(random() * candidates.length)];
}
export function slowest(rows: TrainerCase[], limit = 5) {
    return rows
        .filter((row) => row.validTimes)
        .sort(
            (a, b) => caseStats(b).average! - caseStats(a).average! || a.caseId.localeCompare(b.caseId),
        )
        .slice(0, limit);
}
export function choices<T extends { id: string }>(
    entry: T,
    entries: readonly T[],
    random = Math.random,
) {
    function shuffled(pool: T[]) {
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    }
    return shuffled([entry, ...shuffled(entries.filter((item) => item.id !== entry.id)).slice(0, 3)]);
}

export function groupFor(set: TrainingSet, caseId: string) {
    return set.groups.find((group) => !group.ids || group.ids.includes(caseId));
}
export function groupOpen(course: Course, progress: readonly Completion[], lessonId: string) {
    const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
    return !!lesson && unlocked(course, lesson, progress);
}
export async function practiceEvidence(
    mod: Pick<PuzzleModule<unknown>, 'id' | 'trainingSets' | 'loadAlgSet'>,
    rows: TrainerCase[],
): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    for (const set of mod.trainingSets ?? []) {
        const [slow] = slowest(
            rows.filter((row) => row.puzzleId === mod.id && row.setId === set.id),
            1,
        );
        if (!slow) continue;
        const timeMs = caseStats(slow).average!;
        if (timeMs <= set.targetMs) continue;
        const lessonId = groupFor(set, slow.caseId)?.lessonId;
        const entry = (await mod.loadAlgSet(set.id)).cases.find((row) => row.id === slow.caseId);
        if (lessonId && entry)
            evidence.push({
                source: 'practice',
                skill: set.skill,
                lessonId,
                timeMs,
                targetMs: set.targetMs,
                caseId: entry.id,
                nameKey: entry.nameKey,
                setId: set.id,
                setNameKey: set.nameKey,
            });
    }
    return evidence;
}
