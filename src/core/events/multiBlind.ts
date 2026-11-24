import type { Solve } from '../storage/db';

export const multiBlindLimit = (attempted: number) => Math.min(attempted, 6) * 600000;

export function scoreMultiBlind(
    solved: number,
    attempted: number,
    elapsedMs: number,
    penalties = 0,
) {
    if (
        !Number.isSafeInteger(attempted) ||
        attempted < 2 ||
        !Number.isSafeInteger(solved) ||
        solved < 0 ||
        solved > attempted ||
        !Number.isFinite(elapsedMs) ||
        elapsedMs < 0 ||
        !Number.isSafeInteger(penalties) ||
        penalties < 0 ||
        !Number.isSafeInteger(penalties * 2000 + 3600000)
    )
        throw new RangeError('invalidMultiBlind');
    const missed = attempted - solved;
    const points = solved - missed;
    // H1b1/H1d: the base clock stops at the limit, then any penalties are added.
    const timeMs = Math.floor(Math.min(elapsedMs, multiBlindLimit(attempted))) + penalties * 2000;
    return { points, missed, timeMs, dnf: points < 0 || solved < 2 };
}

type Row = { timeMs: number; solved: number; attempted: number };
export function validMultiBlind(row: Row) {
    return (
        row.attempted >= 2 &&
        row.solved >= 2 &&
        row.solved <= row.attempted &&
        row.solved * 2 >= row.attempted
    );
}
export function compareMultiBlind(a: Row, b: Row) {
    return (
        b.solved * 2 - b.attempted - (a.solved * 2 - a.attempted) ||
        Math.floor(a.timeMs / 1000) - Math.floor(b.timeMs / 1000) ||
        a.attempted - a.solved - (b.attempted - b.solved)
    );
}

export function rankedMultiBlind(solves: readonly Solve[]) {
    return solves
        .flatMap((solve) =>
            solve.result.kind === 'multiBlind' &&
            solve.penalty !== 'dnf' &&
            validMultiBlind(solve.result)
                ? [{ solve, result: solve.result }]
                : [],
        )
        .sort((a, b) => compareMultiBlind(a.result, b.result));
}
