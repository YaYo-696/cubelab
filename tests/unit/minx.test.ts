import { expect, it } from 'vitest';
import { parseMinxDrop, loadMinxContent } from '../../src/puzzles/minx/content';
import { minxCase } from '../../src/puzzles/minx/case';
import { filterMinx, minxTooClose, scrambleMinx } from '../../src/puzzles/minx/scramble';
import {
    minxFaces,
    minxModel,
    minxRotations,
    minxSolvedGrips,
    normalizeMinxContent,
    normalizeMinxScramble,
    visibleMinx,
} from '../../src/puzzles/minx/model';
import sets from '../fixtures/minx/algsets.json';
import lessons from '../fixtures/minx/lessons.json';

const signal = new AbortController().signal;

it('normalizes the six Pochmann tokens and identifies the first invalid offset', () => {
    expect(normalizeMinxScramble(' R++   D-- U′\r\n R-- D++ U  ')).toBe("R++ D-- U'\nR-- D++ U");
    for (const [input, offset] of [
        ['R++ D+- U', 6],
        ["R++ U2'", 5],
        ['R++\nF', 4],
        ['D+++ U', 3],
        ['U r++', 2],
        ['R+', 2],
        ['', 0],
    ] as const) {
        expect(() => normalizeMinxScramble(input)).toThrow(expect.objectContaining({ offset }));
    }
});

it('accepts cubing.js face turns and only supported whole-puzzle rotations in the drop', async () => {
    const model = await minxModel();
    expect(minxSolvedGrips(visibleMinx(model.defaultPattern()))).toHaveLength(60);
    for (const face of minxFaces) {
        const move = face + "2'";
        expect(normalizeMinxContent(move)).toBe(move);
        expect(model.moveToTransformation(move).repetitionOrder()).toBe(5);
    }
    for (const rotation of minxRotations) {
        expect(normalizeMinxContent(rotation + "'")).toBe(rotation + "'");
        expect(model.moveToTransformation(rotation).repetitionOrder()).toBeGreaterThan(1);
    }
    expect(normalizeMinxContent("U1’ BL2 D' DR FL y U_Rv")).toBe("U1' BL2 D' DR FL y U_Rv");
    for (const value of ['R++', 'x', 'z', 'U3', 'C'])
        expect(() => normalizeMinxContent(value)).toThrow();
});

it('checks the two-move WCA floor without a full solver', async () => {
    for (const seq of ["U U'", 'U2', 'F2', 'R++', "D-- Uv Fv'", 'y'])
        expect(await minxTooClose(seq), seq).toBe(true);
    const candidates = ["U U'", 'D++', 'R++ D--'];
    expect(await filterMinx(async () => candidates.shift()!, signal)).toBe('R++ D--');
    expect(candidates).toHaveLength(0);
    for (let i = 0; i < 6; i++) {
        const scramble = await scrambleMinx(signal);
        expect(normalizeMinxScramble(scramble)).toBe(scramble);
        expect(await minxTooClose(scramble)).toBe(false);
    }
});

it('loads fixture variants and verifies every active training setup', async () => {
    const fixture = await parseMinxDrop(sets, lessons, true);
    expect(fixture.sets.get('minx-fixture')?.cases[0].algorithms).toEqual([
        "F' BR2'",
        "F' BR2' Uv",
    ]);
    const active = await loadMinxContent();
    for (const [id, set] of active.sets)
        for (const entry of set.cases) {
            await expect(minxCase(id, entry.id, signal)).resolves.toEqual({
                scramble: entry.referenceSetup,
                verified: true,
            });
        }
});

it('rejects an unrelated algorithm and points to the set, case and variant', async () => {
    const bad = structuredClone(sets);
    bad.sets[0].cases[0].algs[1] = "R2' Uv";
    await expect(parseMinxDrop(bad, lessons)).rejects.toThrow(
        /minx-fixture\/minx-fixture-case alg #2.*does not solve/,
    );
    const wrongId = structuredClone(sets);
    wrongId.sets[0].id = 'minx_fixture';
    await expect(parseMinxDrop(wrongId, lessons)).rejects.toThrow(
        /minx_fixture.*unknown or duplicate set/,
    );
    const wrongSource = structuredClone(sets);
    wrongSource.sets[0].cases[0].source = 'file:///algorithm';
    await expect(parseMinxDrop(wrongSource, lessons)).rejects.toThrow(
        /HTTP\(S\) URL or generated:/,
    );
});
