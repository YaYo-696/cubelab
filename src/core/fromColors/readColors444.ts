// Resolver desde colores · 4x4 reducido y paridades (Fase 15-E). Author: Claude.
// The user reduces the 4x4 (centers built, edges paired) and paints it. The 4x4 is read as a 3x3:
// an impossible flip is OLL parity and an impossible swap is PLL parity. Each parity gets its algorithm,
// and the rest is the 3x3 solution that the existing solver explains with any method.
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import {
    colorLayout,
    readColors,
    type ColorIssue,
    type ColorIssueKey,
    type ColorName,
    type Painted,
} from './readColors.ts'; // explicit extension: the verification scripts run it directly with Node

// Both are pure on a reduced cube (verified with cubing.js: only the stickers of those dedges change).
// App notation: 2R = second layer only, Rw = the two outer layers.
/** Flips the UF dedge in place. */
export const ollParity = "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2";
/** Swaps the UF and UB dedges. */
export const pllParity = 'Uw2 Rw2 U2 2R2 U2 Rw2 Uw2';

export type Issue444Key = ColorIssueKey | 'fromColors444Centers' | 'fromColors444Pairs';
export type Issue444 = { key: Issue444Key; stickers: string[]; params?: ColorIssue['params'] };
export type Reading444 =
    | {
          ok: true;
          /** Parity steps, in order, done before anything else with the puzzle held as it was painted. */
          parity: { key: 'fromColors444Oll' | 'fromColors444Pll'; alg: string }[];
          /** Whole-cube rotation after the parity steps, before the 3x3 solution. */
          rotation: string;
          /** 3x3 scramble for the existing solver; its moves are outer-layer turns on the 4x4. */
          scramble333: string;
          holdKey: string;
      }
    | { ok: false; issues: Issue444[] };
export type Layout444 = {
    svg: string;
    stickers: { id: string; solved: string }[];
    palette: string[];
    names: Record<string, ColorName>;
};

const faceOf: Record<ColorName, 'U' | 'D' | 'F' | 'B' | 'R' | 'L'> = {
    white: 'U',
    yellow: 'D',
    green: 'F',
    blue: 'B',
    red: 'R',
    orange: 'L',
};
const hexNames: Record<string, ColorName> = {
    '#ffffff': 'white',
    '#f4f400': 'yellow',
    '#44ee00': 'green',
    '#2266ff': 'blue',
    '#ff0000': 'red',
    '#ff8000': 'orange',
};
type Spot = { id: string; solved: string; face: string; row: number; col: number };
type Model = {
    layout: Layout444;
    spots: Spot[];
    at: Map<string, string>;
    to333: Map<string, string[]>;
    names333: Map<ColorName, string>;
    solved: Map<string, string>;
    orientations: Map<string, number>;
    kpuzzle: KPuzzle;
};
const key = (face: string, row: number, col: number) => face + row + col;

function grid<T extends { solved: string; x: number; y: number }>(stickers: T[], name: (color: string) => ColorName) {
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

let cached: Promise<Model> | undefined;
function model() {
    return (cached ??= (async () => {
        const loader = puzzles['4x4x4'];
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
        const names = Object.fromEntries(
            [...new Set(raw.map((s) => s.solved))].map((color) => [color, hexNames[color]] as const),
        );
        if (Object.values(names).some((name) => !name)) throw new Error('4x4: unknown palette color');
        const spots: Spot[] = grid(raw, (color) => names[color]).map(({ id, solved, face, row, col }) => ({
            id,
            solved,
            face,
            row,
            col,
        }));
        const at = new Map(spots.map((s) => [key(s.face, s.row, s.col), s.id]));

        const layout3 = await colorLayout('333');
        const placed = new Map<string, { x: number; y: number }>();
        for (const m of layout3.svg.matchAll(/<[^>]*\sid="([A-Z0-9_]+-l\d+-o\d+)"[^>]*translate\(([-\d.]+),([-\d.]+)\)/g))
            placed.set(m[1], { x: Number(m[2]), y: Number(m[3]) });
        const spots3 = grid(
            layout3.stickers.map((s) => ({ ...s, ...placed.get(s.id)! })),
            (color) => layout3.names[color],
        );
        const near = [[0], [1, 2], [3]];
        const to333 = new Map(
            spots3.map((s) => [
                s.id,
                near[s.row].flatMap((row) => near[s.col].map((col) => at.get(key(s.face, row, col))!)),
            ]),
        );
        const names333 = new Map(Object.entries(layout3.names).map(([color, name]) => [name, color]));

        const kpuzzle = await loader.kpuzzle();
        const orientations = new Map(kpuzzle.definition.orbits.map((o) => [o.orbitName, o.numOrientations]));
        const solved = new Map(raw.map((s) => [s.id, s.solved]));
        return {
            layout: { svg, stickers: spots.map(({ id, solved }) => ({ id, solved })), palette: Object.keys(names), names },
            spots,
            at,
            to333,
            names333,
            solved,
            orientations,
            kpuzzle,
        };
    })());
}

/** Sticker id at a face position (rows and columns 0–3 as drawn on the net). */
export async function stickerAt444(face: string, row: number, col: number) {
    return (await model()).at.get(key(face, row, col));
}

export async function colorLayout444(): Promise<Layout444> {
    return (await model()).layout;
}

/** Colors a 4x4 pattern (or a scramble from solved) shows. */
export async function colorsOf444(pattern: KPattern | string): Promise<Painted> {
    const m = await model();
    const kpuzzle = await puzzles['4x4x4'].kpuzzle();
    const state = typeof pattern === 'string' ? kpuzzle.defaultPattern().applyAlg(pattern) : pattern;
    const painted: Painted = {};
    for (const { id } of m.spots) {
        const [, orbit, location, orientation] = /^([A-Z0-9_]+)-l(\d+)-o(\d+)$/.exec(id)!;
        const data = state.patternData[orbit];
        const n = m.orientations.get(orbit)!;
        const shown = (((Number(orientation) - data.orientation[Number(location)]) % n) + n) % n;
        painted[id] = m.solved.get(orbit + '-l' + data.pieces[Number(location)] + '-o' + shown)!;
    }
    return painted;
}

/** Colors after doing `alg` on a puzzle that shows `painted`: every sticker moves as the alg moves it. */
async function turnColors(painted: Painted, alg: string): Promise<Painted> {
    const m = await model();
    const t = m.kpuzzle.algToTransformation(alg).transformationData;
    const out: Painted = {};
    for (const { id } of m.spots) {
        const [, orbit, location, orientation] = /^([A-Z0-9_]+)-l(\d+)-o(\d+)$/.exec(id)!;
        const n = m.orientations.get(orbit)!;
        const { permutation, orientationDelta } = t[orbit];
        const from = (((Number(orientation) - orientationDelta[Number(location)]) % n) + n) % n;
        out[id] = painted[orbit + '-l' + permutation[Number(location)] + '-o' + from];
    }
    return out;
}

export async function readColors444(painted: Painted): Promise<Reading444> {
    const m = await model();
    const { layout, at } = m;
    const fail = (issues: Issue444[]): Reading444 => ({ ok: false, issues });
    const missing = layout.stickers.filter((s) => !layout.palette.includes(painted[s.id])).map((s) => s.id);
    if (missing.length) return fail([{ key: 'fromColorsMissing', stickers: missing }]);
    const counts: Issue444[] = [];
    for (const color of layout.palette) {
        const used = layout.stickers.filter((s) => painted[s.id] === color);
        if (used.length !== 16)
            counts.push({
                key: 'fromColorsCount',
                stickers: used.length > 16 ? used.map((s) => s.id) : [],
                params: { color: layout.names[color], found: used.length, expected: 16 },
            });
    }
    if (counts.length) return fail(counts);

    const color = (face: string, row: number, col: number) => painted[at.get(key(face, row, col))!];
    const centers: string[] = [];
    const pairs: string[] = [];
    for (const face of ['U', 'D', 'F', 'B', 'R', 'L']) {
        const inner = [
            [1, 1],
            [1, 2],
            [2, 1],
            [2, 2],
        ];
        if (new Set(inner.map(([r, c]) => color(face, r, c))).size > 1)
            centers.push(...inner.map(([r, c]) => at.get(key(face, r, c))!));
        for (const [a, b] of [
            [[0, 1], [0, 2]],
            [[3, 1], [3, 2]],
            [[1, 0], [2, 0]],
            [[1, 3], [2, 3]],
        ])
            if (color(face, a[0], a[1]) !== color(face, b[0], b[1]))
                pairs.push(at.get(key(face, a[0], a[1]))!, at.get(key(face, b[0], b[1]))!);
    }
    const unreduced: Issue444[] = [];
    if (centers.length) unreduced.push({ key: 'fromColors444Centers', stickers: centers });
    if (pairs.length) unreduced.push({ key: 'fromColors444Pairs', stickers: pairs });
    if (unreduced.length) return fail(unreduced);

    const as333 = (colors: Painted) => {
        const out: Painted = {};
        for (const [id3, ids4] of m.to333) out[id3] = m.names333.get(layout.names[colors[ids4[0]]])!;
        return out;
    };
    const issueKeys = (r: Awaited<ReturnType<typeof readColors>>) =>
        new Set(r.ok ? [] : r.issues.map((issue) => issue.key));
    const first = await readColors('333', as333(painted));
    const keys = issueKeys(first);
    if (!first.ok && [...keys].some((k) => k !== 'fromColorsFlip' && k !== 'fromColorsSwap'))
        return fail(
            first.issues.map((issue) => ({
                ...issue,
                stickers: issue.stickers.flatMap((id) => m.to333.get(id) ?? []),
            })),
        );
    const parity: { key: 'fromColors444Oll' | 'fromColors444Pll'; alg: string }[] = [];
    let colors = painted;
    let reading = first;
    if (keys.has('fromColorsFlip')) {
        parity.push({ key: 'fromColors444Oll', alg: ollParity });
        colors = await turnColors(colors, ollParity);
        reading = await readColors('333', as333(colors));
    }
    if (issueKeys(reading).has('fromColorsSwap')) {
        parity.push({ key: 'fromColors444Pll', alg: pllParity });
        colors = await turnColors(colors, pllParity);
        reading = await readColors('333', as333(colors));
    }
    if (!reading.ok) throw new Error('4x4: parity fix did not give a legal 3x3: ' + JSON.stringify(reading.issues));
    return { ok: true, parity, rotation: reading.rotation, scramble333: reading.scramble, holdKey: reading.holdKey };
}
