// Fase 15 · Resolver desde colores. Author: Claude.
import { describe, expect, it } from 'vitest';
import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import {
    colorLayout,
    colorPuzzles,
    colorsOf,
    readColors,
    type ColorPuzzle,
    type Painted,
} from '../../src/core/fromColors/readColors';

const names = { '333': '3x3x3', '222': '2x2x2', pyram: 'pyraminx', skewb: 'skewb' } as const;
const moves = {
    '333': ['U', 'D', 'L', 'R', 'F', 'B'],
    '222': ['U', 'R', 'F'],
    pyram: ['U', 'L', 'R', 'B', 'u', 'l', 'r', 'b'],
    skewb: ['R', 'U', 'L', 'B'],
};
const rotations = {
    '333': ['x', 'y', 'z'],
    '222': ['x', 'y', 'z'],
    pyram: ['Uv', 'Lv', 'Rv', 'Bv'],
    skewb: ['x', 'y', 'z'],
};
const notation = {
    '333': /^[RLUDFB](?:2|')?$/,
    '222': /^[RLUDFB](?:2|')?$/,
    pyram: /^[ULRBulrb]'?$/,
    skewb: /^[RULB]'?$/,
};
function random(seed: number) {
    return (n: number) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return Math.floor((seed / 2 ** 32) * n);
    };
}
const sameColors = (a: Painted, b: Painted) => Object.keys(a).every((id) => a[id] === b[id]);

describe.each(colorPuzzles)('resolver desde colores · %s', (puzzle: ColorPuzzle) => {
    it('reconstruye posiciones reales pintadas en cualquier orientación', async () => {
        const kpuzzle = await puzzles[names[puzzle]].kpuzzle();
        const rnd = random(4021);
        for (let i = 0; i < 60; i++) {
            const scramble = Array.from(
                { length: 25 },
                () => moves[puzzle][rnd(moves[puzzle].length)] + ['', "'"][rnd(2)],
            ).join(' ');
            const grip = Array.from({ length: rnd(4) }, () => rotations[puzzle][rnd(3)]).join(' ');
            const held = kpuzzle.defaultPattern().applyAlg(scramble).applyAlg(grip);
            const result = await readColors(puzzle, await colorsOf(puzzle, held));
            expect(result.ok, grip).toBe(true);
            if (!result.ok) return;
            for (const move of result.scramble.split(' ').filter(Boolean))
                expect(move).toMatch(notation[puzzle]);
            expect(
                sameColors(
                    await colorsOf(puzzle, result.scramble),
                    await colorsOf(puzzle, held.applyAlg(result.rotation)),
                ),
            ).toBe(true);
        }
    }, 60_000);

    it('explica los errores de pintado', async () => {
        const layout = await colorLayout(puzzle);
        const kpuzzle = await puzzles[names[puzzle]].kpuzzle();
        const base = await colorsOf(puzzle, kpuzzle.defaultPattern().applyAlg(moves[puzzle].join(' ')));
        const keys = async (painted: Painted) => {
            const result = await readColors(puzzle, painted);
            return result.ok ? [] : result.issues.map((issue) => issue.key);
        };
        const slot = (orbit: string, location: number) =>
            layout.stickers
                .filter((s) => s.orbit === orbit && s.location === location)
                .sort((a, b) => a.orientation - b.orientation)
                .map((s) => s.id);
        const twist = (orbit: string) => {
            const ids = slot(orbit, 0);
            return { ...base, ...Object.fromEntries(ids.map((id, i) => [id, base[ids[(i + 1) % ids.length]]])) };
        };
        const swap = (orbit: string) => {
            const [a, b] = [slot(orbit, 0), slot(orbit, 1)];
            return {
                ...base,
                ...Object.fromEntries(a.map((id, i) => [id, base[b[i]]])),
                ...Object.fromEntries(b.map((id, i) => [id, base[a[i]]])),
            };
        };
        const missing = { ...base };
        delete missing[layout.stickers[0].id];
        expect(await keys(missing)).toEqual(['fromColorsMissing']);
        const extra = { ...base, [layout.stickers.find((s) => base[s.id] !== layout.palette[0])!.id]: layout.palette[0] };
        expect(await keys(extra)).toContain('fromColorsCount');
        if (puzzle === '333' || puzzle === '222') expect(await keys(twist('CORNERS'))).toEqual(['fromColorsTwist']);
        if (puzzle === '333' || puzzle === 'pyram') {
            expect(await keys(twist('EDGES'))).toEqual(['fromColorsFlip']);
            expect(await keys(swap('EDGES'))).toEqual(['fromColorsSwap']);
        }
        if (puzzle === 'skewb') {
            expect(await keys(swap('CENTERS'))).toEqual(['fromColorsSwap']);
            expect(await keys(twist('CORNERS'))).toEqual(['fromColorsTwist']);
        }
    }, 60_000);

    it('acepta y rechaza estados armados al azar según las reglas del puzzle', async () => {
        const kpuzzle = await puzzles[names[puzzle]].kpuzzle();
        const rnd = random(77);
        const parity = (v: number[]) => {
            let odd = 0;
            for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[i] > v[j]) odd ^= 1;
            return odd;
        };
        const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
        let accepted = 0;
        for (let i = 0; i < 80; i++) {
            const data: Record<string, { pieces: number[]; orientation: number[] }> = {};
            for (const orbit of kpuzzle.definition.orbits) {
                const keep =
                    (puzzle === '333' && orbit.orbitName === 'CENTERS') ||
                    (puzzle === 'pyram' && orbit.orbitName !== 'EDGES') ||
                    puzzle === 'skewb';
                const pieces = [...Array(orbit.numPieces).keys()];
                if (!keep)
                    for (let j = pieces.length - 1; j > 0; j--) {
                        const k = rnd(j + 1);
                        [pieces[j], pieces[k]] = [pieces[k], pieces[j]];
                    }
                const still = orbit.orbitName === 'CENTERS';
                data[orbit.orbitName] = {
                    pieces,
                    orientation: pieces.map(() => (still ? 0 : rnd(orbit.numOrientations))),
                };
            }
            if (puzzle === '222') {
                const at = data.CORNERS.pieces.indexOf(6);
                [data.CORNERS.pieces[at], data.CORNERS.pieces[6]] = [data.CORNERS.pieces[6], 6];
                data.CORNERS.orientation[6] = 0;
            }
            if (puzzle === 'skewb') data.CORNERS.orientation[3] = 0;
            const expected =
                puzzle === '333'
                    ? sum(data.CORNERS.orientation) % 3 === 0 &&
                      sum(data.EDGES.orientation) % 2 === 0 &&
                      parity(data.CORNERS.pieces) === parity(data.EDGES.pieces)
                    : puzzle === '222'
                      ? sum(data.CORNERS.orientation) % 3 === 0
                      : puzzle === 'pyram'
                        ? parity(data.EDGES.pieces) === 0 && sum(data.EDGES.orientation) % 2 === 0
                        : undefined;
            const result = await readColors(puzzle, await colorsOf(puzzle, new KPattern(kpuzzle, data)));
            if (expected !== undefined) expect(result.ok).toBe(expected);
            if (result.ok) accepted++;
        }
        expect(accepted).toBeGreaterThan(0);
    }, 60_000);
});
