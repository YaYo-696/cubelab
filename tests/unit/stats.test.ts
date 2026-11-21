import { expect, it } from 'vitest';
import {
    adjusted,
    analyze,
    breakdown,
    eventRecords,
    metrics,
    principal,
    rounded,
    trim,
    windows,
    type Metric,
} from '../../src/core/stats';
import { cubeEvent } from '../../src/puzzles/events';
import type { Solve } from '../../src/core/storage/db';
function solve(ms: number, index = 0, penalty: Solve['penalty'] = 'none', sessionId = 'session'): Solve {
    return {
        id: 's' + index,
        sessionId,
        eventId: '333',
        puzzleId: '333',
        createdAt: index,
        scramble: 'R U',
        penalty,
        source: 'timer',
        result: { kind: 'time', timeMs: ms },
    };
}
function batch(n: number, dnfs = 0) {
    return Array.from({ length: n }, (_, i) =>
        solve(10000 + (i % 15) * 10, i, i < dnfs ? 'dnf' : 'none'),
    );
}
it.each([
    [0, 0],
    [10, 10],
    [19, 10],
    [10004, 10000],
    [10005, 10000],
    [10009, 10000],
    [599999, 599990],
    [600000, 600000],
    [600999, 600000],
    [601999, 601000],
])('single %i → %i', (ms, expected) => expect(adjusted(solve(ms))).toBe(expected));
it.each([
    [10004.99, 10000],
    [10005, 10010],
    [10015, 10020],
    [599995, 600000],
    [600001, 600000],
    [600499, 600000],
    [600500, 601000],
])('redondea %f → %i', (ms, expected) => expect(rounded(ms)).toBe(expected));
it.each(metrics)('%s no existe antes de llenar la ventana', (metric) => {
    const solves = batch(windows[metric] - 1);
    expect(breakdown(solves, metric)).toBeNull();
    expect(analyze(solves).results.find((r) => r.metric === metric)?.current).toBeNull();
});
it.each(['mo3', 'ao5', 'ao12', 'ao25', 'ao50', 'ao100', 'ao1000'] as const)(
    '%s admite exactamente los DNF recortables',
    (metric) => {
        const n = windows[metric],
            cut = trim(n);
        for (const dnfs of [0, cut, cut + 1]) {
            const solves = batch(n, dnfs),
                r = analyze(solves).results.find((r) => r.metric === metric)!;
            expect(r.current).toBe(breakdown(solves, metric)?.value);
            expect(Number.isFinite(r.current)).toBe(dnfs <= cut);
        }
    },
);
it.each([
    ['ao12', 1],
    ['ao25', 2],
    ['ao50', 3],
    ['ao100', 5],
    ['ao1000', 50],
] as const)('%s descarta %i en cada extremo', (metric, cut) => {
    const result = breakdown(batch(windows[metric]), metric)!;
    expect(result.rows.filter((r) => r.discarded)).toHaveLength(cut * 2);
});
it('voltea un PB previo al editar +2 y no une ventanas de sesiones distintas', () => {
    const solves = [10, 11, 12, 13, 14, 20].map((s, i) => solve(s * 1000, i));
    const best = (m: Metric) => analyze(solves).results.find((r) => r.metric === m)?.best?.value;
    expect(best('ao5')).toBe(12000);
    solves[1].penalty = '+2';
    expect(best('ao5')).toBe(12670);
    solves[1].penalty = 'dnf';
    expect(best('ao5')).toBe(13000);
    expect(
        eventRecords(
            solves.map((s, i) => ({ ...s, sessionId: i < 3 ? 'a' : 'b' })),
            ['ao5'],
        ),
    ).toEqual([]);
});
it('aplica +2 antes del umbral de precisión y excluye DNF de la media', () => {
    expect(adjusted(solve(598999, 0, '+2'))).toBe(600000);
    const s = [solve(10009), solve(10019, 1, 'dnf'), solve(10010, 2)];
    expect(analyze(s)).toMatchObject({ mean: 10010, bestMean: 10000 });
    expect(breakdown(s, 'mo3')?.value).toBe(Infinity);
    expect(principal(cubeEvent('333', true))).toBe('single');
});
it('dos sesiones, PB cronológico derivado y empates sin nuevo PB', () => {
    const data = [
        solve(12000, 0),
        solve(11000, 1, 'none', 'other'),
        solve(11000, 2),
        solve(10000, 3, 'none', 'other'),
    ];
    expect(eventRecords(data, ['single']).map((x) => x.solve.id)).toEqual(['s0', 's1', 's3']);
});
it('verifica ventanas móviles de 10.000 intentos en menos de 1 segundo', () => {
    const data = Array.from({ length: 10000 }, (_, i) =>
        solve(5000 + ((i * 8123) % 400000), i, i % 23 === 0 ? 'dnf' : i % 13 === 0 ? '+2' : 'none'),
    );
    const start = performance.now();
    const stats = analyze(data);
    const records = eventRecords(data);
    const elapsed = performance.now() - start;
    console.info('10.000 solves, sesión y PB de evento: ' + elapsed.toFixed(1) + ' ms');
    expect(elapsed).toBeLessThan(1000);
    expect(records.length).toBeGreaterThan(0);
    for (const r of stats.results)
        for (const end of [1000, 3999, 9999])
            expect(r.series[end]).toBe(breakdown(data.slice(0, end + 1), r.metric)?.value);
});

it('coincide con la lista de doce intentos documentada para csTimer', () => {
    const sample = [10, 12, 14, 15, 18, 11, 13, 10, 12, 9, 16, 12].map((s, i) =>
        solve(s * 1000, i, i === 4 ? 'dnf' : [1, 8].includes(i) ? '+2' : 'none'),
    );
    const stats = analyze(sample);
    expect(stats.results.slice(0, 4).map((r) => [r.current, r.best?.value])).toEqual([
        [12000, 9000],
        [12330, 11000],
        [12000, 11330],
        [12900, 12900],
    ]);
    expect(stats.mean).toBe(12550);
});
