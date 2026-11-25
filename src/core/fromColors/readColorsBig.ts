// Resolver desde colores · cubos grandes reducidos (4x4 a 7x7) (Fase 15-H). Author: Claude.
// Generalizes readColors444.ts: the user reduces the cube (centers built, edges grouped) and paints it; the cube
// is read as a 3x3. Even cubes can show OLL and PLL parity, fixed with pure algorithms checked in cubing.js.
// Odd cubes cannot: a reduced odd cube is a real 3x3, so an impossible flip or swap is a painting mistake.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { colorLayout, readColors, type ColorIssue, type ColorIssueKey, type ColorName, type Painted } from './readColors.ts'; // explicit extension: the verification scripts run it directly with Node

export type BigSize = 4 | 5 | 6 | 7;
/** Parity algorithms by size. App notation: 2R = second layer, 2-3Rw = layers 2 and 3, 3Rw = three outer layers. */
export const bigParity: Record<4 | 6, { oll: string; pll: string }> = {
    4: { oll: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2", pll: 'Uw2 Rw2 U2 2R2 U2 Rw2 Uw2' },
    6: {
        oll: "2-3Rw2 B2 U2 2-3Lw U2 2-3Rw' U2 2-3Rw U2 F2 2-3Rw F2 2-3Lw' B2 2-3Rw2",
        pll: '3Uw2 3Rw2 U2 2-3Rw2 U2 3Rw2 3Uw2',
    },
};

export type BigIssueKey = ColorIssueKey | 'fromColorsBigCenters' | 'fromColorsBigEdges';
export type BigIssue = { key: BigIssueKey; stickers: string[]; params?: ColorIssue['params'] };
export type BigReading =
    | {
          ok: true;
          /** Parity steps, in order, done with the cube held as it was painted. */
          parity: { key: 'fromColorsBigOll' | 'fromColorsBigPll'; alg: string }[];
          /** Whole-cube rotation after the parity steps, before the 3x3 solution. */
          rotation: string;
          /** 3x3 scramble for the existing solver; its moves are outer-layer turns on the big cube. */
          scramble333: string;
          holdKey: string;
      }
    | { ok: false; issues: BigIssue[] };
export type BigLayout = {
    size: BigSize;
    svg: string;
    /** Paintable stickers. `aliases` are other elements drawn on the same spot: paint them too. */
    stickers: { id: string; solved: string; aliases: string[] }[];
    palette: string[];
    names: Record<string, ColorName>;
};

const faceOf: Record<ColorName, string> = { white: 'U', yellow: 'D', green: 'F', blue: 'B', red: 'R', orange: 'L' };
const hexNames: Record<string, ColorName> = {
    '#ffffff': 'white',
    '#f4f400': 'yellow',
    '#44ee00': 'green',
    '#2266ff': 'blue',
    '#ff0000': 'red',
    '#ff8000': 'orange',
};
const loaders = { 4: '4x4x4', 5: '5x5x5', 6: '6x6x6', 7: '7x7x7' } as const;
type Model = {
    size: BigSize;
    kpuzzle: KPuzzle;
    layout: BigLayout;
    at: Map<string, string>;
    main: Map<string, string>;
    solved: Map<string, string>;
    orientations: Map<string, number>;
    to333: Map<string, string[]>;
    names333: Map<ColorName, string>;
};
const spot = (face: string, row: number, col: number) => face + ':' + row + ':' + col;
const models = new Map<BigSize, Promise<Model>>();

function grid<T extends { solved: string; x: number; y: number }>(stickers: T[], name: (c: string) => ColorName) {
    const out: (T & { face: string; row: number; col: number })[] = [];
    for (const color of new Set(stickers.map((s) => s.solved))) {
        const face = stickers.filter((s) => s.solved === color);
        const xs = [...new Set(face.map((s) => s.x.toFixed(1)))].sort((a, b) => Number(a) - Number(b));
        const ys = [...new Set(face.map((s) => s.y.toFixed(1)))].sort((a, b) => Number(a) - Number(b));
        for (const s of face)
            out.push({ ...s, face: faceOf[name(color)], row: ys.indexOf(s.y.toFixed(1)), col: xs.indexOf(s.x.toFixed(1)) });
    }
    return out;
}

function model(size: BigSize) {
    let entry = models.get(size);
    if (entry) return entry;
    entry = (async () => {
        const loader = puzzles[loaders[size]];
        const kpuzzle = await loader.kpuzzle();
        const svg = await loader.svg!();
        const raw = [...svg.matchAll(/<[^>]*\sid="([A-Z0-9_]+-l\d+-o\d+)"[^>]*>/g)].map((m) => {
            const points = /points="([^"]+)"/.exec(m[0])![1].trim().split(/\s+/).map(Number);
            const xs = points.filter((_, i) => i % 2 === 0);
            const ys = points.filter((_, i) => i % 2 === 1);
            return {
                id: m[1],
                solved: /fill:\s*([#\w]+)/.exec(m[0])![1],
                x: xs.reduce((a, b) => a + b) / xs.length,
                y: ys.reduce((a, b) => a + b) / ys.length,
            };
        });
        const names = Object.fromEntries([...new Set(raw.map((s) => s.solved))].map((c) => [c, hexNames[c]] as const));
        if (Object.values(names).some((n) => !n)) throw new Error('Big cube: unknown palette color');
        const placed = grid(raw, (c) => names[c]);
        const at = new Map<string, string>();
        const main = new Map<string, string>();
        const aliases = new Map<string, string[]>();
        for (const s of placed) {
            const key = spot(s.face, s.row, s.col);
            const first = at.get(key);
            if (first) {
                main.set(s.id, first);
                aliases.get(first)!.push(s.id);
            } else {
                at.set(key, s.id);
                main.set(s.id, s.id);
                aliases.set(s.id, []);
            }
        }
        if (at.size !== 6 * size * size) throw new Error('Big cube: unexpected net');

        const layout3 = await colorLayout('333');
        const translate = new Map<string, { x: number; y: number }>();
        for (const m of layout3.svg.matchAll(/<[^>]*\sid="([A-Z0-9_]+-l\d+-o\d+)"[^>]*translate\(([-\d.]+),([-\d.]+)\)/g))
            translate.set(m[1], { x: Number(m[2]), y: Number(m[3]) });
        const spots3 = grid(
            layout3.stickers.map((s) => ({ ...s, ...translate.get(s.id)! })),
            (c) => layout3.names[c],
        );
        const near = [[0], [...Array(size - 2).keys()].map((i) => i + 1), [size - 1]];
        const to333 = new Map(
            spots3.map((s) => [
                s.id,
                near[s.row].flatMap((row) => near[s.col].map((col) => at.get(spot(s.face, row, col))!)),
            ]),
        );
        const stickers = [...at.values()].map((id) => ({ id, solved: raw.find((s) => s.id === id)!.solved, aliases: aliases.get(id)! }));
        return {
            size,
            kpuzzle,
            layout: { size, svg, stickers, palette: Object.keys(names), names },
            at,
            main,
            solved: new Map(raw.map((s) => [s.id, s.solved])),
            orientations: new Map(kpuzzle.definition.orbits.map((o) => [o.orbitName, o.numOrientations])),
            to333,
            names333: new Map(Object.entries(layout3.names).map(([c, n]) => [n, c])),
        };
    })();
    models.set(size, entry);
    return entry;
}

export async function colorLayoutBig(size: BigSize): Promise<BigLayout> {
    return (await model(size)).layout;
}
/** Sticker id at a face position (rows and columns 0…size−1 as drawn on the net). */
export async function stickerAtBig(size: BigSize, face: string, row: number, col: number) {
    return (await model(size)).at.get(spot(face, row, col));
}

const parse = (id: string) => {
    const [, orbit, location, orientation] = /^([A-Z0-9_]+)-l(\d+)-o(\d+)$/.exec(id)!;
    return { orbit, location: Number(location), orientation: Number(orientation) };
};

/** Colors a pattern (or a scramble from solved) shows, on the paintable stickers. */
export async function colorsOfBig(size: BigSize, pattern: KPattern | string): Promise<Painted> {
    const m = await model(size);
    const state = typeof pattern === 'string' ? m.kpuzzle.defaultPattern().applyAlg(pattern) : pattern;
    const painted: Painted = {};
    for (const { id } of m.layout.stickers) {
        const { orbit, location, orientation } = parse(id);
        const data = state.patternData[orbit];
        const n = m.orientations.get(orbit)!;
        const shown = (((orientation - data.orientation[location]) % n) + n) % n;
        painted[id] = m.solved.get(orbit + '-l' + data.pieces[location] + '-o' + shown)!;
    }
    return painted;
}

/** Colors after doing `alg` on a cube that shows `painted`. */
async function turnColors(m: Model, painted: Painted, alg: string): Promise<Painted> {
    const t = m.kpuzzle.algToTransformation(alg).transformationData;
    const out: Painted = {};
    for (const { id } of m.layout.stickers) {
        const { orbit, location, orientation } = parse(id);
        const n = m.orientations.get(orbit)!;
        const from = (((orientation - t[orbit].orientationDelta[location]) % n) + n) % n;
        out[id] = painted[m.main.get(orbit + '-l' + t[orbit].permutation[location] + '-o' + from)!];
    }
    return out;
}

export async function readColorsBig(size: BigSize, painted: Painted): Promise<BigReading> {
    const m = await model(size);
    const { layout, at } = m;
    const fail = (issues: BigIssue[]): BigReading => ({ ok: false, issues });
    const missing = layout.stickers.filter((s) => !layout.palette.includes(painted[s.id])).map((s) => s.id);
    if (missing.length) return fail([{ key: 'fromColorsMissing', stickers: missing }]);
    const perColor = size * size;
    const counts: BigIssue[] = [];
    for (const color of layout.palette) {
        const used = layout.stickers.filter((s) => painted[s.id] === color);
        if (used.length !== perColor)
            counts.push({
                key: 'fromColorsCount',
                stickers: used.length > perColor ? used.map((s) => s.id) : [],
                params: { color: layout.names[color], found: used.length, expected: perColor },
            });
    }
    if (counts.length) return fail(counts);

    const id = (face: string, row: number, col: number) => at.get(spot(face, row, col))!;
    const inner = [...Array(size - 2).keys()].map((i) => i + 1);
    const centers: string[] = [];
    const edges: string[] = [];
    for (const face of ['U', 'D', 'F', 'B', 'R', 'L']) {
        const block = inner.flatMap((r) => inner.map((c) => id(face, r, c)));
        if (new Set(block.map((s) => painted[s])).size > 1) centers.push(...block);
        for (const side of [
            inner.map((c) => id(face, 0, c)),
            inner.map((c) => id(face, size - 1, c)),
            inner.map((r) => id(face, r, 0)),
            inner.map((r) => id(face, r, size - 1)),
        ])
            if (new Set(side.map((s) => painted[s])).size > 1) edges.push(...side);
    }
    const unreduced: BigIssue[] = [];
    if (centers.length) unreduced.push({ key: 'fromColorsBigCenters', stickers: centers });
    if (edges.length) unreduced.push({ key: 'fromColorsBigEdges', stickers: edges });
    if (unreduced.length) return fail(unreduced);

    const as333 = (colors: Painted) => {
        const out: Painted = {};
        for (const [id3, ids] of m.to333) out[id3] = m.names333.get(layout.names[colors[ids[0]]])!;
        return out;
    };
    const keysOf = (r: Awaited<ReturnType<typeof readColors>>) => new Set(r.ok ? [] : r.issues.map((i) => i.key));
    const first = await readColors('333', as333(painted));
    const keys = keysOf(first);
    const even = size % 2 === 0;
    const parityOnly = [...keys].every((k) => k === 'fromColorsFlip' || k === 'fromColorsSwap');
    if (!first.ok && (!even || !parityOnly))
        return fail(first.issues.map((issue) => ({ ...issue, stickers: issue.stickers.flatMap((s) => m.to333.get(s) ?? []) })));
    const parity: { key: 'fromColorsBigOll' | 'fromColorsBigPll'; alg: string }[] = [];
    let colors = painted;
    let reading = first;
    if (even) {
        const algs = bigParity[size as 4 | 6];
        if (keys.has('fromColorsFlip')) {
            parity.push({ key: 'fromColorsBigOll', alg: algs.oll });
            colors = await turnColors(m, colors, algs.oll);
            reading = await readColors('333', as333(colors));
        }
        if (keysOf(reading).has('fromColorsSwap')) {
            parity.push({ key: 'fromColorsBigPll', alg: algs.pll });
            colors = await turnColors(m, colors, algs.pll);
            reading = await readColors('333', as333(colors));
        }
    }
    if (!reading.ok) throw new Error('Big cube: parity fix did not give a legal 3x3');
    return { ok: true, parity, rotation: reading.rotation, scramble333: reading.scramble, holdKey: reading.holdKey };
}
