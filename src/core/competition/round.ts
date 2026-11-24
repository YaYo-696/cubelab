import type { EventRules } from '../contracts';
import { multiBlindLimit, rankedMultiBlind, validMultiBlind } from '../events/multiBlind';
import { fmcTimeLimit } from '../events/fmc';
import { adjusted, breakdown } from '../stats';
import type { Solve } from '../storage/db';

export type RoundFormat = EventRules['officialFormats'][number];
export const attemptCount: Record<RoundFormat, number> = {
    ao5: 5,
    mo3: 3,
    bo1: 1,
    bo2: 2,
    bo3: 3,
    bo5: 5,
};
export const extraCount = 2;
export const rulesRevision = '2026-04-01';

export interface RoundConfig {
    eventId: string;
    format: RoundFormat;
    cutoff?: { attempts: number; threshold: number };
    timeLimitMs?: number;
    cumulativeMs?: number;
    cubes?: number[];
}

export interface RoundAttempt {
    scramble: string[];
    result: Solve['result'];
    elapsedMs: number;
    additions: number;
    dnf: boolean;
    dns?: boolean;
    reconstruction?: string;
}

export interface CompetitionRound extends RoundConfig {
    id: string;
    scrambles: string[][];
    attempts: RoundAttempt[];
    extrasUsed: number;
    currentExtra?: number;
}

export interface Competition {
    id: string;
    name: string;
    createdAt: number;
    rulesRevision: typeof rulesRevision;
    rounds: CompetitionRound[];
}

// WCA 9b1b, 9b2b, 9b4b, 9b5b.
export function cutoffOptions(format: RoundFormat, scoring: EventRules['scoring']) {
    if (format === 'ao5') return [2];
    if (scoring === 'time') return format === 'mo3' ? [1] : [];
    if (format === 'bo2') return [1];
    if (format === 'mo3' || (format === 'bo3' && scoring === 'multiBlind')) return [1, 2];
    return [];
}

export function validConfig(config: RoundConfig, rules: EventRules) {
    const positive = (n: number) => Number.isSafeInteger(n) && n > 0;
    const { format, cutoff, timeLimitMs, cumulativeMs, cubes } = config;
    return (
        !!rules.wcaEventId &&
        config.eventId === rules.id &&
        rules.officialFormats.includes(format) &&
        (cutoff === undefined ||
            (cutoff !== null &&
                cutoffOptions(format, rules.scoring).includes(cutoff.attempts) &&
                (rules.scoring === 'multiBlind'
                    ? Number.isSafeInteger(cutoff.threshold) && cutoff.threshold >= 0
                    : positive(cutoff.threshold)))) &&
        (rules.scoring === 'time'
            ? (timeLimitMs !== undefined || cumulativeMs !== undefined) &&
              [timeLimitMs, cumulativeMs].every((limit) => limit === undefined || positive(limit)) &&
              (timeLimitMs === undefined || cumulativeMs === undefined || timeLimitMs <= cumulativeMs)
            : timeLimitMs === undefined && cumulativeMs === undefined) &&
        (rules.scoring === 'multiBlind'
            ? cubes?.length === attemptCount[format] &&
              cubes.every((n) => Number.isSafeInteger(n) && n >= 2 && n <= 100)
            : cubes === undefined)
    );
}

export async function prepareRound(
    config: RoundConfig,
    rules: EventRules,
    mix: () => Promise<string>,
    signal: AbortSignal,
    progress: (done: number, total: number) => void,
): Promise<CompetitionRound> {
    if (!validConfig(config, rules)) throw new Error('competitionInvalid');
    const attempts = attemptCount[config.format];
    // Extras must cover any of the cube counts declared for this round.
    const extraSize = Math.max(1, ...(config.cubes ?? []));
    const sizes = [...(config.cubes ?? Array<number>(attempts).fill(1)), extraSize, extraSize];
    const total = sizes.reduce((sum, size) => sum + size, 0);
    const used = new Set<string>();
    const scrambles: string[][] = [];
    let done = 0;
    for (const size of sizes) {
        const batch: string[] = [];
        for (let i = 0; i < size; i++) {
            signal.throwIfAborted();
            for (let retry = 0; retry < 20; retry++) {
                const sequence = (await mix()).trim();
                signal.throwIfAborted();
                if (!sequence || used.has(sequence)) continue;
                used.add(sequence);
                batch.push(sequence);
                break;
            }
            if (batch.length !== i + 1) throw new Error('competitionGenerateError');
            progress(++done, total);
        }
        scrambles.push(batch);
    }
    return {
        ...config,
        id: crypto.randomUUID(),
        scrambles,
        attempts: [],
        extrasUsed: 0,
    };
}

export function elapsedCharge(attempt: RoundAttempt) {
    if (attempt.dns) return 0;
    return attempt.dnf ? attempt.elapsedMs : adjusted(asSolve(attempt));
}

export function remainingTime(round: CompetitionRound) {
    return round.cumulativeMs === undefined
        ? Infinity
        : Math.max(
              0,
              round.cumulativeMs -
                  round.attempts.reduce((sum, attempt) => sum + elapsedCharge(attempt), 0),
          );
}

export function attemptLimit(round: CompetitionRound) {
    if (round.cubes) return multiBlindLimit(round.cubes[round.attempts.length]);
    if (round.eventId === '333fm') return fmcTimeLimit;
    return Math.min(round.timeLimitMs ?? Infinity, remainingTime(round));
}

export function asSolve(attempt: RoundAttempt, round?: CompetitionRound, index = 0): Solve {
    const { result, additions } = attempt;
    return {
        id: (round?.id ?? '') + '/' + index,
        sessionId: round?.id ?? '',
        puzzleId: '',
        eventId: round?.eventId ?? '',
        createdAt: 0,
        scramble: attempt.scramble.join('\n'),
        result:
            result.kind === 'time' && additions > 1
                ? { kind: 'time', timeMs: result.timeMs + 2000 * additions }
                : result,
        source: 'timer',
        penalty:
            attempt.dnf || attempt.dns
                ? 'dnf'
                : additions === 1 && result.kind === 'time'
                  ? '+2'
                  : 'none',
        reconstruction: attempt.reconstruction,
    };
}

function passesCutoff(round: CompetitionRound) {
    const cutoff = round.cutoff;
    if (!cutoff) return true;
    return round.attempts.slice(0, cutoff.attempts).some((attempt) => {
        if (attempt.dnf || attempt.dns) return false;
        const result = attempt.result;
        if (result.kind === 'multiBlind')
            return validMultiBlind(result) && result.solved * 2 - result.attempted > cutoff.threshold;
        const score = result.kind === 'moves' ? result.moves : adjusted(asSolve(attempt));
        return score < cutoff.threshold;
    });
}

export function roundStatus(round: CompetitionRound): 'active' | 'complete' | 'cutoff' | 'limit' {
    if (round.attempts.length >= attemptCount[round.format]) return 'complete';
    if (round.cutoff && round.attempts.length >= round.cutoff.attempts && !passesCutoff(round))
        return 'cutoff';
    return remainingTime(round) === 0 ? 'limit' : 'active';
}

export function currentScrambles(round: CompetitionRound) {
    if (roundStatus(round) !== 'active') return [];
    return round.scrambles[round.currentExtra ?? round.attempts.length].slice(
        0,
        round.cubes?.[round.attempts.length] ?? 1,
    );
}

export function nextExtra(round: CompetitionRound): CompetitionRound {
    if (roundStatus(round) !== 'active' || round.extrasUsed >= extraCount)
        throw new Error('competitionNoExtra');
    return {
        ...round,
        currentExtra: attemptCount[round.format] + round.extrasUsed,
        extrasUsed: round.extrasUsed + 1,
    };
}

export function judgeAttempt(
    round: CompetitionRound,
    attempt: Omit<RoundAttempt, 'scramble'>,
    judge: 'none' | '+2' | 'dnf',
): CompetitionRound {
    if (roundStatus(round) !== 'active') throw new Error('competitionInvalid');
    const row = { ...attempt, scramble: currentScrambles(round) };
    if (judge === '+2' && row.result.kind === 'time') row.additions++;
    if (judge === '+2' && row.result.kind === 'multiBlind')
        row.result = { ...row.result, timeMs: row.result.timeMs + 2000 };
    if (judge === 'dnf') row.dnf = true;
    // WCA A1a4–5 and E2b. Multi-Blind is scored at the cap under H1b1.
    const limit = attemptLimit(round);
    if (row.result.kind === 'time' && (row.elapsedMs >= limit || adjusted(asSolve(row)) >= limit))
        row.dnf = true;
    if (row.result.kind === 'moves' && row.elapsedMs >= limit) row.dnf = true;
    return {
        ...round,
        currentExtra: undefined,
        attempts: [...round.attempts, row],
    };
}

export function roundResults(round: CompetitionRound) {
    const attempts = [...round.attempts];
    if (roundStatus(round) === 'limit') {
        const eligible = passesCutoff(round) ? attemptCount[round.format] : round.cutoff!.attempts;
        while (attempts.length < eligible)
            attempts.push({
                scramble: [],
                result: { kind: 'time', timeMs: 0 },
                elapsedMs: 0,
                additions: 0,
                dnf: false,
                dns: true,
            });
    }
    const rows = attempts.map((row, i) => asSolve(row, round, i));
    const time = !round.cubes && round.eventId !== '333fm';
    const values = rows.map((row) =>
        time
            ? adjusted(row)
            : row.penalty === 'dnf' || row.result.kind !== 'moves'
              ? Infinity
              : row.result.moves,
    );
    const best = round.cubes
        ? (rankedMultiBlind(rows)[0]?.solve ?? rows[0])
        : rows.length
          ? rows[values.indexOf(Math.min(...values))]
          : undefined;
    const average =
        round.format === 'ao5' || round.format === 'mo3'
            ? time
                ? breakdown(rows, round.format)?.value
                : rows.length === 3
                  ? Math.round((values.reduce((a, b) => a + b, 0) * 100) / 3) / 100
                  : undefined
            : undefined;
    return {
        attempts,
        best: best ? attempts[rows.indexOf(best)] : undefined,
        average,
    };
}
