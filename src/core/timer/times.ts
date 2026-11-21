import type { Solve } from '../storage/db';

export function parseTime(input: string): number | null {
    const match = /^(?:(\d+):([0-5]\d)|(\d+))(?:\.(\d{1,2}))?$/.exec(input.trim());
    if (!match) return null;
    const seconds = match[3] ? Number(match[3]) : Number(match[1]) * 60 + Number(match[2]);
    const ms = seconds * 1000 + Number((match[4] ?? '').padEnd(2, '0')) * 10;
    return ms > 0 && Number.isSafeInteger(ms) ? ms : null;
}

export function formatTime(ms: number) {
    const cs = Math.floor(Math.max(0, ms) / 10);
    const sec = Math.floor(cs / 100);
    return (
        (sec >= 60 ? Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') : String(sec)) +
        '.' +
        String(cs % 100).padStart(2, '0')
    );
}
export function adjusted(solve: Solve) {
    if (solve.penalty === 'dnf' || solve.result.kind !== 'time') return Infinity;
    return Math.floor(solve.result.timeMs / 10) * 10 + (solve.penalty === '+2' ? 2000 : 0);
}
// TODO fase 2: trasladar el cálculo y el redondeo por formato de evento a core/stats.
export function currentAo5(recent: Solve[]) {
    if (recent.length < 5) return null;
    const sorted = recent
        .slice(0, 5)
        .map(adjusted)
        .sort((a, b) => a - b);
    return Math.round((sorted[1] + sorted[2] + sorted[3]) / 30) * 10;
}
