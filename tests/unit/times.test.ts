import { expect, it } from 'vitest';
import { parseTime, formatTime, currentAo5 } from '../../src/core/timer/times';
import type { Solve } from '../../src/core/storage/db';
it.each([
    ['12.34', 12340],
    ['1:02.34', 62340],
    ['62.34', 62340],
    ['0:59.99', 59990],
    ['0.01', 10],
    [' 7.1 ', 7100],
    ['12', 12000],
] as const)('acepta %s', (s, ms) => expect(parseTime(s)).toBe(ms));
it.each([
    '',
    ' ',
    '0',
    '0.00',
    '1:60.00',
    '1:2.34',
    '-1',
    'Infinity',
    '1e2',
    '00:00.000',
    '12.',
    '1:02:03',
    '1,23',
    '12s',
    '9007199254740992',
])('rechaza %j', (s) => expect(parseTime(s)).toBeNull());
it('trunca la visualización a centésimas', () => expect(formatTime(62349)).toBe('1:02.34'));
it('ao5 descarta extremos y admite un DNF', () => {
    const solves = [1, 2, 3, 4, 5].map(
        (n): Solve => ({
            id: String(n),
            sessionId: 's',
            eventId: '333',
            puzzleId: '333',
            createdAt: n,
            scramble: 'R',
            source: 'timer',
            result: { kind: 'time', timeMs: n * 1000 },
            penalty: 'none',
        }),
    );
    expect(currentAo5(solves.slice(1))).toBeNull();
    solves[4].penalty = 'dnf';
    solves[2].penalty = '+2';
    expect(currentAo5(solves)).toBe(3670);
    solves[2].penalty = 'dnf';
    expect(currentAo5(solves)).toBe(Infinity);
});
