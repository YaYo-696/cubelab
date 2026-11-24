import { expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { sideEvent } from '../../src/puzzles/events';
import { clockCutoff, normalizeClock } from '../../src/puzzles/sideEvents/clock';
import { parseSideDrop, loadSideContent } from '../../src/puzzles/sideEvents/content';
import { sideCase } from '../../src/puzzles/sideEvents/case';
import { filterSideEvent, scrambleSideEvent } from '../../src/puzzles/sideEvents/scramble';
import {
    applySquare1,
    canSlash,
    inverseSquare1,
    normalizeSquare1,
    square1State,
    square1PatternState,
    square1TooClose,
} from '../../src/puzzles/sideEvents/square1';
import sq1Sets from '../fixtures/sq1/algsets.json';
import sq1Lessons from '../fixtures/sq1/lessons.json';
import clockSets from '../fixtures/clock/algsets.json';
import clockLessons from '../fixtures/clock/lessons.json';

const signal = new AbortController().signal;

it('normalizes Square-1 tuples and points at the first notation or mechanical error', () => {
    expect(normalizeSquare1('  ( 1,0)/\n(-1,0) ')).toBe('(1, 0) / (-1, 0)');
    expect(normalizeSquare1('(6,-5)')).toBe('(6, -5)');
    expect(inverseSquare1('(6, -5)')).toBe('(6, 5)');
    for (const [text, offset] of [
        ['(0,0)', 1],
        ['(1, 8)', 4],
        ['(-6, 0)', 2],
        ['(1 0)', 3],
        ['(-1, 0) / wrong', 8],
        ['(1,0)x', 5],
        ['', 0],
    ] as const)
        expect(() => normalizeSquare1(text)).toThrow(expect.objectContaining({ offset }));
});

it('normalizes Clock pins, wheel turns and the flip, with exact error offsets', () => {
    expect(normalizeClock('UR DL5- y2  ALL0- U6- L')).toBe('UR DL5- y2 ALL0+ U6+ L');
    for (const [text, offset] of [
        ['UR7+', 2],
        ['R3', 2],
        ['L1+ y3', 5],
        ['D1?+', 2],
        ['LU', 1],
        ['+1', 0],
        ['', 0],
    ] as const)
        expect(() => normalizeClock(text)).toThrow(expect.objectContaining({ offset }));
});

it('checks the Square-1 cutoff and equivalence with KPuzzle on generated scrambles', async () => {
    const solved = (await puzzles.square1.kpuzzle()).defaultPattern();
    const short = '(1, 0) /';
    expect(square1TooClose(square1State(short))).toBe(true);
    expect(canSlash(square1State('(-1, 0)'))).toBe(false);
    expect(square1TooClose(square1State('(-1, 0)'))).toBe(true);
    for (let i = 0; i < 8; i++) {
        const scramble = await scrambleSideEvent('sq1', signal);
        const state = square1State(scramble);
        expect(normalizeSquare1(scramble)).toBe(scramble);
        expect(canSlash(state)).toBe(true);
        expect(square1TooClose(state)).toBe(false);
        const pattern = applySquare1(solved, scramble);
        expect(square1PatternState(pattern)).toBe(state);
        expect(applySquare1(pattern, inverseSquare1(scramble)).isIdentical(solved)).toBe(true);
        if (!i) {
            const prefix = scramble
                .match(/\([^)]+\)|\//g)!
                .slice(0, 10)
                .join(' ');
            expect(canSlash(square1State(prefix))).toBe(true);
            expect(square1TooClose(square1State(prefix))).toBe(true);
            const samples = [short, '(-1, 0)', prefix, scramble];
            expect(await filterSideEvent('sq1', async () => samples.shift()!, signal)).toBe(
                scramble,
            );
            expect(samples).toHaveLength(0);
        }
    }
}, 30000);

it('checks the Clock cutoff on both faces with pins and flips costing zero', async () => {
    const cutoff = clockCutoff(await puzzles.clock.kpuzzle());
    for (const text of ['ALL UR y2', 'UR1+ y2', 'y2 DL6-', 'ALL5+ ALL5-', 'y2 L0+'])
        expect(cutoff(text), text).toBe(true);
    expect(cutoff('UR1+ UL1+')).toBe(false);
    const candidates = ['ALL UR y2', 'y2 DL6-', 'UR1+ UL1+'];
    expect(await filterSideEvent('clock', async () => candidates.shift()!, signal)).toBe(
        'UR1+ UL1+',
    );
    expect(candidates).toHaveLength(0);
    const generated = await scrambleSideEvent('clock', signal);
    expect(normalizeClock(generated)).toBe(generated);
    expect(cutoff(generated)).toBe(false);
});

const fixtures = [
    ['sq1', sq1Sets, sq1Lessons, '/ (0, 1)'],
    ['clock', clockSets, clockLessons, 'UL1- y2'],
] as const;

it.each(fixtures)(
    'verifies the %s fixture, active worker cases and rejects a broken variant',
    async (id, sets, lessons, wrong) => {
        const fixture = await parseSideDrop(id, sets, lessons, true);
        expect(fixture.sets.size).toBe(1);
        const active = await loadSideContent(id);
        for (const [setId, set] of active.sets)
            for (const entry of set.cases) {
                expect(await sideCase(id, setId, entry.id, signal)).toEqual({
                    scramble: entry.referenceSetup,
                    verified: true,
                });
            }
        const bad = structuredClone(sets);
        bad.sets[0].cases[0].algs.push(wrong);
        await expect(parseSideDrop(id, bad, lessons)).rejects.toThrow(
            new RegExp(id + '-fixture/' + id + '-fixture-case alg #2.*does not solve'),
        );
        bad.sets[0].id = 'wrong-fixture';
        await expect(parseSideDrop(id, bad, lessons)).rejects.toThrow(/unknown or duplicate set/);
        expect(sideEvent(id)).toMatchObject({ officialFormats: ['ao5'], inspectionSeconds: 15 });
    },
);

it('rejects a syntactically valid Square-1 algorithm that would cut a corner', async () => {
    const bad = structuredClone(sq1Sets);
    bad.sets[0].cases[0].algs.push('/ (-2, 0) /');
    await expect(parseSideDrop('sq1', bad, sq1Lessons)).rejects.toThrow(/alg #2.*illegal move/);
});
