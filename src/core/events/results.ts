import type { Solve } from '../storage/db';
import { adjusted } from '../stats';
import { formatTime } from '../timer/times';
import { validMultiBlind } from './multiBlind';

type T = (key: string, params?: Record<string, string | number>) => string;
export function wholeSeconds(ms: number) {
    const seconds = Math.floor(ms / 1000);
    const part = (value: number) => String(value).padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    return (
        (hours
            ? hours + ':' + part(Math.floor(seconds / 60) % 60)
            : String(Math.floor(seconds / 60))) +
        ':' +
        part(seconds % 60)
    );
}

export function resultText(solve: Solve, t: T) {
    const result = solve.result;
    if (result.kind === 'multiBlind') {
        const text = t('multiScore', {
            solved: result.solved,
            attempted: result.attempted,
            points: result.solved * 2 - result.attempted,
            time: wholeSeconds(result.timeMs),
        });
        return solve.penalty === 'dnf' || !validMultiBlind(result) ? 'DNF · ' + text : text;
    }
    if (solve.penalty === 'dnf') return 'DNF';
    if (result.kind === 'moves') return moveText(result.moves, t);
    return formatTime(adjusted(solve)) + (solve.penalty === '+2' ? ' (+2)' : '');
}

export function moveText(value: number | undefined, t: T) {
    return value === undefined
        ? '—'
        : value === Infinity
          ? 'DNF'
          : t('moveResult', {
                count: value.toLocaleString(document.documentElement.lang, {
                    maximumFractionDigits: 2,
                }),
            });
}
export function fmcStats(rows: readonly Solve[]) {
    let latest: number | undefined;
    let best: number | undefined;
    let mean: number | undefined;
    let bestMean: number | undefined;
    const sessions = new Map<string, number[]>();
    for (const row of rows) {
        if (row.result.kind !== 'moves') continue;
        const values = sessions.get(row.sessionId) ?? [];
        latest = row.penalty === 'dnf' ? Infinity : row.result.moves;
        if (Number.isFinite(latest)) best = Math.min(best ?? Infinity, latest);
        values.push(latest);
        if (values.length > 3) values.shift();
        mean =
            values.length < 3
                ? undefined
                : Math.round((values.reduce((total, n) => total + n, 0) * 100) / 3) / 100;
        if (mean !== undefined && Number.isFinite(mean))
            bestMean = Math.min(bestMean ?? Infinity, mean);
        sessions.set(row.sessionId, values);
    }
    return { latest, best, mean, bestMean };
}
