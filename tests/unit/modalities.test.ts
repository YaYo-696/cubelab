import { expect, it } from 'vitest';
import { evaluateFmc, fmcTimeLimit, parseFmc } from '../../src/core/events/fmc';
import {
    compareMultiBlind,
    multiBlindLimit,
    scoreMultiBlind,
} from '../../src/core/events/multiBlind';
import { fmcStats } from '../../src/core/events/results';
import { modality } from '../../src/puzzles/events';
import { generate } from '../../src/workers/generate';
import { scrambleBigCube } from '../../src/puzzles/bigCube/scramble';
import { principal } from '../../src/core/stats';
import { TimerMachine } from '../../src/core/timer/machine';
import type { Solve } from '../../src/core/storage/db';

it('counts FMC with OBTM and enforces the 80-move ETM limit', async () => {
    expect(parseFmc("[X] uw' 2Rw2' r F2 y2")).toEqual({
        alg: "x Uw' 2Rw2 R F2 y2",
        moves: 4,
        execution: 6,
    });
    for (const token of ['M', 'R3', '3Rw', '1Rw', "R'2", '2U'])
        expect(() => parseFmc(token)).toThrow();
    const rotations = 'x '.repeat(79);
    expect(await evaluateFmc('R', "R' " + rotations, 12)).toMatchObject({ moves: 1, reason: null });
    expect(await evaluateFmc('R', "R' " + rotations + 'x', 12)).toMatchObject({
        reason: 'fmcTooLong',
    });
});
it('checks KPuzzle including wide moves and marks unsolved, bad notation or timeout', async () => {
    expect(await evaluateFmc('R U', "U' R' z", fmcTimeLimit - 1)).toMatchObject({
        moves: 2,
        reason: null,
    });
    expect(await evaluateFmc('Rw', "Rw'", 10)).toMatchObject({ moves: 1, reason: null });
    expect(await evaluateFmc('R U', "U' R' z", fmcTimeLimit)).toMatchObject({
        reason: 'fmcTimeout',
    });
    expect(await evaluateFmc('R U', "U' x", 10)).toMatchObject({ reason: 'fmcUnsolved' });
    expect(await evaluateFmc('R', 'R M', 10)).toMatchObject({ reason: 'fmcNotation', position: 3 });
});
it('caps MBLD at the official limit and includes cumulative penalties', () => {
    expect([2, 5, 6, 20].map(multiBlindLimit)).toEqual([1200000, 3000000, 3600000, 3600000]);
    expect(scoreMultiBlind(3, 5, 3002000, 2)).toEqual({
        points: 1,
        missed: 2,
        timeMs: 3004000,
        dnf: false,
    });
    expect(scoreMultiBlind(1, 2, 500)).toMatchObject({ dnf: true, points: 0 });
    expect(scoreMultiBlind(2, 4, 500)).toMatchObject({ dnf: false, points: 0 });
    expect(scoreMultiBlind(2, 5, 500)).toMatchObject({ dnf: true, points: -1 });
    expect(() => scoreMultiBlind(5, 4, 500)).toThrow();
    expect(() => scoreMultiBlind(1, 1, 500)).toThrow();
});
it('ranks MBLD by points, truncated seconds, then fewer missed cubes', () => {
    const a = { solved: 4, attempted: 5, timeMs: 10499 };
    expect(compareMultiBlind(a, { solved: 4, attempted: 6, timeMs: 9000 })).toBeLessThan(0);
    expect(compareMultiBlind(a, { solved: 3, attempted: 3, timeMs: 11999 })).toBeLessThan(0);
    expect(compareMultiBlind(a, { solved: 3, attempted: 3, timeMs: 10999 })).toBeGreaterThan(0);
    expect(compareMultiBlind(a, { ...a, timeMs: 10999 })).toBe(0);
});
it('uses the WCA practice formats and keeps FMC means inside sessions', () => {
    expect(modality('333oh')).toMatchObject({ officialFormats: ['ao5'], inspectionSeconds: 15 });
    expect(modality('333fm')).toMatchObject({
        officialFormats: ['mo3', 'bo1', 'bo2'],
        inspectionSeconds: null,
    });
    for (const id of ['444bf', '555bf'] as const) {
        expect(modality(id)).toMatchObject({
            officialFormats: ['bo3'],
            inspectionSeconds: null,
            randomOrientation: true,
        });
        expect(principal(modality(id))).toBe('single');
    }
    expect(modality('333mbf')).toMatchObject({
        officialFormats: ['bo1', 'bo2', 'bo3'],
        randomOrientation: true,
    });
    const row = (moves: number, sessionId = 'a', penalty: Solve['penalty'] = 'none'): Solve => ({
        id: String(moves),
        sessionId,
        penalty,
        createdAt: 0,
        puzzleId: '333',
        eventId: '333fm',
        scramble: 'R',
        result: { kind: 'moves', moves },
        source: 'timer',
    });
    expect(fmcStats([row(24), row(20, 'b'), row(27)]).bestMean).toBeUndefined();
    expect(fmcStats([row(24), row(26), row(30), row(31, 'a', 'dnf')])).toMatchObject({
        best: 24,
        bestMean: 26.67,
        mean: Infinity,
    });
});
it('splits memory and execution inside the same blind timer', () => {
    let now = 0;
    const machine = new TimerMachine(() => now);
    machine.down('start', modality('555bf'), true, 300);
    now = 300;
    machine.up('start');
    expect(machine.phase).toBe('running');
    now = 1400;
    machine.markExecution();
    now = 1800;
    machine.markExecution();
    now = 2200;
    machine.down('end', modality('555bf'), true, 300);
    expect(machine.result).toEqual({ timeMs: 1900, penalty: 'none', splitsMs: [1100, 800] });
});
it('uses cubing.js FMC padding and generates both big blindfolded modalities', async () => {
    const signal = new AbortController().signal;
    const mix = await generate('333', '333fm', signal);
    expect(mix).toMatch(/^R' U' F .+ R' U' F$/);
    for (const event of ['444bf', '555bf'] as const)
        expect(
            (await scrambleBigCube(event === '444bf' ? '444' : '555', signal, event)).split(' ')
                .length,
        ).toBeGreaterThan(20);
}, 30000);
