import { events } from '../../puzzles/registry';
import { db, type CubeDatabase } from '../storage/db';
import {
    attemptCount,
    extraCount,
    roundStatus,
    rulesRevision,
    validConfig,
    type Competition,
    type CompetitionRound,
    type RoundAttempt,
} from './round';

export const competitionEvents = events.filter(({ rules }) => rules.wcaEventId);
const rulesById = new Map<string, (typeof events)[number]['rules']>(
    competitionEvents.map(({ rules }) => [rules.id, rules]),
);

export function availableRound(competition: Competition, round: CompetitionRound) {
    const position = competition.rounds.findIndex(({ id }) => id === round.id);
    return (
        position >= 0 &&
        !competition.rounds
            .slice(0, position)
            .some((prior) => prior.eventId === round.eventId && roundStatus(prior) === 'active')
    );
}

export async function updateCompetition(
    id: string,
    update: (current: Competition) => Competition,
    database: CubeDatabase = db,
) {
    return database.transaction('rw', database.competitions, async () => {
        const current = await database.competitions.get(id);
        if (!current) throw new Error('competitionChanged');
        const next = update(current);
        await database.competitions.put(next);
        return next;
    });
}

export function updateRound(
    id: string,
    expected: CompetitionRound,
    update: (round: CompetitionRound) => CompetitionRound,
    database = db,
) {
    return updateCompetition(
        id,
        (current) => {
            const round = current.rounds.find(({ id }) => id === expected.id);
            if (
                !round ||
                !availableRound(current, round) ||
                round.attempts.length !== expected.attempts.length ||
                round.extrasUsed !== expected.extrasUsed
            )
                throw new Error('competitionChanged');
            return {
                ...current,
                rounds: current.rounds.map((item) => (item.id === round.id ? update(round) : item)),
            };
        },
        database,
    );
}

const integer = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const uuid = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const sequences = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && !!entry.trim());

function validAttempt(attempt: RoundAttempt, round: CompetitionRound, index: number) {
    if (
        !attempt ||
        !sequences(attempt.scramble) ||
        !integer(attempt.elapsedMs) ||
        !integer(attempt.additions) ||
        attempt.additions > 2 ||
        typeof attempt.dnf !== 'boolean' ||
        attempt.dns !== undefined ||
        (attempt.reconstruction !== undefined && typeof attempt.reconstruction !== 'string')
    )
        return false;
    const result = attempt.result;
    if (!result) return false;
    if (round.cubes) {
        if (
            result.kind !== 'multiBlind' ||
            !integer(result.timeMs) ||
            !integer(result.solved) ||
            result.attempted !== round.cubes[index] ||
            result.solved > result.attempted
        )
            return false;
    } else if (round.eventId === '333fm') {
        if (result.kind !== 'moves' || !integer(result.moves)) return false;
    } else if (result.kind !== 'time' || !integer(result.timeMs) || result.timeMs !== attempt.elapsedMs)
        return false;
    return attempt.scramble.length === (round.cubes?.[index] ?? 1);
}

export function validCompetition(value: unknown): value is Competition {
    if (!value || typeof value !== 'object') return false;
    const competition = value as Competition;
    if (
        !uuid(competition.id) ||
        typeof competition.name !== 'string' ||
        !competition.name.trim() ||
        competition.name.length > 100 ||
        !integer(competition.createdAt) ||
        competition.rulesRevision !== rulesRevision ||
        !Array.isArray(competition.rounds)
    )
        return false;
    const ids = new Set<string>();
    const perEvent = new Map<string, number>();
    return competition.rounds.every((round) => {
        if (
            !round ||
            !uuid(round.id) ||
            ids.has(round.id) ||
            !Array.isArray(round.scrambles) ||
            !Array.isArray(round.attempts) ||
            !integer(round.extrasUsed) ||
            round.extrasUsed > extraCount ||
            (round.cubes !== undefined && !Array.isArray(round.cubes))
        )
            return false;
        const rules = rulesById.get(round.eventId);
        if (!rules || !validConfig(round, rules)) return false;
        ids.add(round.id);
        const count = attemptCount[round.format];
        const eventCount = (perEvent.get(round.eventId) ?? 0) + 1;
        perEvent.set(round.eventId, eventCount);
        if (
            eventCount > 4 ||
            round.attempts.length > count ||
            round.scrambles.length !== count + extraCount ||
            !round.scrambles.every(
                (batch, i) =>
                    sequences(batch) &&
                    batch.length === (round.cubes?.[i] ?? Math.max(1, ...(round.cubes ?? []))),
            ) ||
            new Set(round.scrambles.flat()).size !== round.scrambles.flat().length ||
            (round.currentExtra !== undefined &&
                (round.extrasUsed === 0 || round.currentExtra !== count + round.extrasUsed - 1))
        )
            return false;

        const used = new Set<number>();
        return round.attempts.every((attempt, i) => {
            if (
                !validAttempt(attempt, round, i) ||
                roundStatus({ ...round, attempts: round.attempts.slice(0, i) }) !== 'active'
            )
                return false;
            const candidates = [
                i,
                ...Array.from({ length: round.extrasUsed }, (_, index) => count + index),
            ];
            const batch = candidates.find(
                (number) =>
                    !used.has(number) &&
                    number !== round.currentExtra &&
                    attempt.scramble.every((mix, j) => mix === round.scrambles[number][j]),
            );
            if (batch === undefined) return false;
            used.add(batch);
            return true;
        });
    });
}
