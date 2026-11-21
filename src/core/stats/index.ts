import type { Solve } from '../storage/db';
import type { EventRules } from '../contracts';
export const windows = {
    single: 1,
    mo3: 3,
    ao5: 5,
    ao12: 12,
    ao25: 25,
    ao50: 50,
    ao100: 100,
    ao1000: 1000,
} as const;
export type Metric = keyof typeof windows;
export type RecordMetric = Metric | 'sessionMean';
export const metrics = Object.keys(windows) as Metric[];
export const trim = (size: number) => (size <= 3 ? 0 : Math.ceil(size / 20));
export function principal(rules: EventRules): Metric {
    return rules.officialFormats.includes('bo5')
        ? 'single'
        : rules.officialFormats.includes('mo3')
          ? 'mo3'
          : 'ao5';
}
// WCA 9f1–9f2: truncate singles and round means at their respective precision.
// https://www.worldcubeassociation.org/regulations/#9f1
export function adjusted(solve: Solve) {
    if (solve.penalty === 'dnf' || solve.result.kind !== 'time') return Infinity;
    const ms = solve.result.timeMs + (solve.penalty === '+2' ? 2000 : 0);
    const step = ms >= 600000 ? 1000 : 10;
    return Math.floor(ms / step) * step;
}
export function rounded(mean: number) {
    const step = mean >= 600000 ? 1000 : 10;
    return Math.round(mean / step) * step;
}
export function breakdown(solves: readonly Solve[], metric: Metric) {
    const size = windows[metric];
    if (solves.length < size) return null;
    const rows = solves
        .slice(-size)
        .map((solve) => ({ solve, value: adjusted(solve), discarded: false }));
    const sorted = [...rows].sort((a, b) => (a.value === b.value ? 0 : a.value - b.value));
    const cut = trim(size);
    sorted.forEach((row, i) => {
        row.discarded = i < cut || i >= size - cut;
    });
    const kept = sorted.filter((row) => !row.discarded);
    const value =
        metric === 'single'
            ? kept[0].value
            : rounded(kept.reduce((sum, row) => sum + row.value, 0) / kept.length);
    return { rows, value };
}

// Fenwick trees track counts and sums by ranked time for the active window.
class RankedWindow {
    private counts: Float64Array;
    private sums: Float64Array;
    constructor(private values: number[]) {
        this.counts = new Float64Array(values.length + 1);
        this.sums = new Float64Array(values.length + 1);
    }
    change(rank: number, delta: number) {
        for (let i = rank + 1; i < this.counts.length; i += i & -i) {
            this.counts[i] += delta;
            this.sums[i] += delta * (Number.isFinite(this.values[rank]) ? this.values[rank] : 0);
        }
    }
    smallest(count: number) {
        if (!count) return 0;
        let index = 0,
            sum = 0;
        for (let bit = 2 ** Math.floor(Math.log2(this.values.length)); bit >= 1; bit >>= 1) {
            const next = index + bit;
            if (next < this.counts.length && this.counts[next] < count) {
                count -= this.counts[next];
                sum += this.sums[next];
                index = next;
            }
        }
        return sum + count * this.values[index];
    }
}
type Entry = { value: number; end: number };
export function analyze(solves: readonly Solve[]) {
    const times = solves.map(adjusted);
    const unique = [...new Set(times)].sort((a, b) => a - b);
    const ranks = new Map(unique.map((value, i) => [value, i]));
    const ranked = times.map((time) => ranks.get(time)!);
    const results = metrics.map((metric) => {
        const size = windows[metric],
            cut = trim(size),
            tree = new RankedWindow(unique);
        const series: (number | null)[] = Array(times.length).fill(null);
        let dnfs = 0,
            best: Entry | null = null;
        const records: Entry[] = [];
        for (let i = 0; i < times.length; i++) {
            tree.change(ranked[i], 1);
            if (times[i] === Infinity) dnfs++;
            if (i >= size) {
                tree.change(ranked[i - size], -1);
                if (times[i - size] === Infinity) dnfs--;
            }
            if (i + 1 < size) continue;
            const value =
                metric === 'single'
                    ? times[i]
                    : dnfs > cut
                      ? Infinity
                      : rounded((tree.smallest(size - cut) - tree.smallest(cut)) / (size - 2 * cut));
            series[i] = value;
            if (!best || value < best.value) {
                best = { value, end: i };
                if (Number.isFinite(value)) records.push(best);
            }
        }
        return { metric, series, best, records, current: series.at(-1) ?? null };
    });
    let count = 0,
        total = 0,
        mean: number | null = null,
        bestMean: number | null = null;
    const meanRecords: Entry[] = [];
    for (const [end, time] of times.entries())
        if (Number.isFinite(time)) {
            total += time;
            count++;
            mean = rounded(total / count);
            if (mean < (bestMean ?? Infinity)) {
                bestMean = mean;
                meanRecords.push({ value: mean, end });
            }
        }
    return { results, mean, bestMean, meanRecords, times };
}
export function eventRecords(
    solves: readonly Solve[],
    only: readonly RecordMetric[] = [...metrics, 'sessionMean'],
) {
    const groups = new Map<string, Solve[]>();
    const position = new Map(solves.map((s, i) => [s.id, i]));
    for (const solve of solves) {
        const group = groups.get(solve.sessionId) ?? [];
        group.push(solve);
        groups.set(solve.sessionId, group);
    }
    const candidates: { metric: RecordMetric; value: number; solve: Solve }[] = [];
    for (const group of groups.values()) {
        const statistics = analyze(group);
        for (const { metric, records } of [
            ...statistics.results,
            { metric: 'sessionMean' as const, records: statistics.meanRecords },
        ]) {
            if (only.includes(metric))
                for (const entry of records)
                    candidates.push({ metric, value: entry.value, solve: group[entry.end] });
        }
    }
    candidates.sort((a, b) => position.get(a.solve.id)! - position.get(b.solve.id)!);
    const best = new Map<RecordMetric, number>();
    return candidates.filter(({ metric, value }) => {
        if (value >= (best.get(metric) ?? Infinity)) return false;
        best.set(metric, value);
        return true;
    });
}
