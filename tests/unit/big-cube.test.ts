import { KPattern } from 'cubing/kpuzzle';
import { expect, it } from 'vitest';
import { principal, breakdown } from '../../src/core/stats';
import type { Solve } from '../../src/core/storage/db';
import { bigCubeEvent, bigCubeSize, type BigCubeId } from '../../src/puzzles/events';
import { case444 } from '../../src/puzzles/bigCube/case';
import { parse444Drop, load444Content } from '../../src/puzzles/bigCube/content';
import { bigCubeModel } from '../../src/puzzles/bigCube/model';
import { normalizeBigCube } from '../../src/puzzles/bigCube/notation';
import {
    bigCubeTooClose,
    filterBigCube,
    scrambleBigCube,
} from '../../src/puzzles/bigCube/scramble';
import sets from '../fixtures/444/algsets.json';
import lessons from '../fixtures/444/lessons.json';

const ids = Object.keys(bigCubeSize) as BigCubeId[];
const signal = new AbortController().signal;

it('validates the first invalid offset, widths and the two notation contexts', async () => {
    expect(normalizeBigCube('444', "  Rw' 2Rw2'\n3Fw′ ")).toBe("Rw' 2Rw2 3Fw'");
    expect(normalizeBigCube('777', '6Bw F2')).toBe('6Bw F2');
    for (const [id, alg, offset] of [
        ['444', 'U 4Rw', 2],
        ['555', 'R 2R', 4],
        ['666', 'Rw x', 3],
        ['777', 'U 1Rw', 2],
        ['444', 'R3', 1],
        ['444', 'U fw', 2],
    ] as const) {
        expect(() => normalizeBigCube(id, alg)).toThrow(expect.objectContaining({ offset }));
    }
    for (const id of ids) {
        const { model } = await bigCubeModel(id);
        const size = bigCubeSize[id];
        for (const axis of 'RLUDFB') {
            for (let i = 2; i < size; i++) {
                for (const move of [
                    i + axis,
                    i + axis + 'w',
                    ...(i < size - 1 ? [i + '-' + (size - 1) + axis + 'w'] : []),
                ]) {
                    expect(normalizeBigCube(id, move, true)).toBe(move);
                    expect(
                        model.moveToTransformation(move).repetitionOrder(),
                        id + ':' + move,
                    ).toBe(4);
                }
            }
            expect(
                model
                    .moveToTransformation(axis.toLowerCase())
                    .isIdentical(model.moveToTransformation(axis + 'w')),
            ).toBe(true);
        }
        expect(normalizeBigCube(id, "x y2 z'", true)).toBe("x y2 z'");
        if (size % 2) expect(normalizeBigCube(id, "M E' S2", true)).toBe("M E' S2");
        else expect(() => normalizeBigCube(id, 'M', true)).toThrow();
    }
});

it.each(ids)(
    'applies the WCA distance floor to %s states in any grip',
    async (id) => {
        const lastWidth = bigCubeSize[id] - 1;
        for (const seq of ["R R'", 'x y', "R2 z'", `${lastWidth}Rw y`])
            expect(await bigCubeTooClose(id, seq), seq).toBe(true);
        const candidates = ["R R'", 'Rw2', 'R U'];
        expect(await filterBigCube(id, async () => candidates.shift()!, signal)).toBe('R U');
        expect(candidates).toHaveLength(0);
        const scramble = await scrambleBigCube(id, signal);
        if (id !== '444') expect(scramble.split(' ')).toHaveLength((bigCubeSize[id] - 2) * 20);
        expect(normalizeBigCube(id, scramble)).toBe(scramble);
        expect(await bigCubeTooClose(id, scramble)).toBe(false);
    },
    30000,
);

it('uses colors when same-face center pieces are swapped', async () => {
    const { model, solved, colorKey, isSolved } = await bigCubeModel('444');
    const centers = solved.patternData.CENTERS;
    // cubing.js already coalesces solved centers, so assign unique IDs to test the color comparison.
    const original = Array.from({ length: centers.pieces.length }, (_, i) => i);
    const identical = original
        .flatMap((_, a) =>
            original.slice(a + 1).flatMap((_, b) => {
                const pieces = [...original];
                [pieces[a], pieces[a + b + 1]] = [pieces[a + b + 1], pieces[a]];
                return [
                    new KPattern(model, { ...solved.patternData, CENTERS: { ...centers, pieces } }),
                ];
            }),
        )
        .filter((pattern) => colorKey(pattern) === colorKey(solved));
    // Four indistinguishable centers on each of six faces yield 6 * choose(4,2) swaps.
    expect(identical).toHaveLength(36);
    expect(identical.every((pattern) => !pattern.isIdentical(solved) && isSolved(pattern))).toBe(
        true,
    );
});

it('uses Mo3 with no trimming for 6×6 and 7×7 and Ao5 for 4×4 and 5×5', () => {
    for (const id of ids) {
        const rules = bigCubeEvent(id);
        expect(rules.inspectionSeconds).toBe(15);
        expect(rules.minSolveDistance).toBe(2);
        expect(rules.officialFormats).toEqual([id === '666' || id === '777' ? 'mo3' : 'ao5']);
    }
    for (const id of ['666', '777'] as const) {
        const rows = [10000, 20000, 60000].map(
            (ms, i): Solve => ({
                id: String(i),
                sessionId: 'default:' + id,
                puzzleId: id,
                eventId: id,
                createdAt: i,
                result: { kind: 'time', timeMs: ms },
                penalty: 'none',
                source: 'timer',
                scramble: 'R U',
            }),
        );
        const metric = principal(bigCubeEvent(id));
        expect(breakdown(rows, metric)?.value).toBe(30000);
        rows[2].penalty = 'dnf';
        expect(breakdown(rows, metric)?.value).toBe(Infinity);
    }
});

it('validates the 4×4 fixture and case generation from the active drop', async () => {
    const fixture = await parse444Drop(sets, lessons, true);
    expect(fixture.sets.get('444-fixture')?.cases[0].algorithms).toHaveLength(2);
    const active = await load444Content();
    for (const [id, set] of active.sets)
        for (const entry of set.cases) {
            await expect(case444(id, entry.id, signal)).resolves.toEqual({
                scramble: entry.referenceSetup,
                verified: true,
            });
        }
});

it('rejects an incorrect 4×4 variant and malformed set IDs', async () => {
    const bad = structuredClone(sets);
    bad.sets[0].cases[0].algs[1] = "U' 3R' z";
    await expect(parse444Drop(bad, lessons)).rejects.toThrow(
        /444-fixture\/444-fixture-case alg #2.*does not solve/,
    );
    bad.sets[0].id = '555-fixture';
    await expect(parse444Drop(bad, lessons)).rejects.toThrow(
        /555-fixture.*unknown or duplicate set/,
    );
});
