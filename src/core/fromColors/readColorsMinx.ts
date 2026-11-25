// Resolver desde colores · Megaminx (Fase 15-F). Author: Claude.
// Same idea as readColors.ts, for the 132 stickers of the cubing.js Megaminx net. The app has no Megaminx
// solver, so this returns the solution itself (cubing.js `solveMegaminx`, face turns only) and an equivalent
// scramble for the player. Kept apart from readColors.ts so the Solver does not offer Megaminx where it
// expects the app's own solvers.
import { KPattern, type KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { solveMegaminx } from 'cubing/search';

export type MinxColorName =
    | 'white'
    | 'green'
    | 'red'
    | 'purple'
    | 'yellow'
    | 'blue'
    | 'cream'
    | 'lightBlue'
    | 'orange'
    | 'pink'
    | 'lime'
    | 'gray';
const names: Record<string, MinxColorName> = {
    '#ffffff': 'white',
    '#008800': 'green',
    '#ff0000': 'red',
    '#8800dd': 'purple',
    '#f4f400': 'yellow',
    '#0000ff': 'blue',
    '#e8d0a0': 'cream',
    '#3399ff': 'lightBlue',
    '#ff8000': 'orange',
    '#ff66cc': 'pink',
    '#99ff00': 'lime',
    '#888888': 'gray',
};
const rotations = ['Uv', 'Rv', 'Fv'];

export type MinxSticker = { id: string; orbit: string; location: number; orientation: number; solved: string; aliases: string[] };
export type MinxLayout = {
    svg: string;
    stickers: MinxSticker[];
    palette: string[];
    /** i18n key `fromColorsMinxColor_<name>`. */
    names: Record<string, MinxColorName>;
    holdKey: 'fromColorsHold_minx';
};
export type MinxIssueKey =
    | 'fromColorsMissing'
    | 'fromColorsCount'
    | 'fromColorsUnknownPiece'
    | 'fromColorsDuplicatePiece'
    | 'fromColorsScheme'
    | 'fromColorsTwist'
    | 'fromColorsFlip'
    | 'fromColorsSwap';
export type MinxIssue = { key: MinxIssueKey; stickers: string[]; params?: Record<string, string | number> };
export type MinxReading =
    | {
          ok: true;
          /** Face turns from the held position (cubing.js notation: R, R2', BR…). */
          solution: string;
          /** Equivalent scramble from solved, for the player. */
          scramble: string;
          /** Whole-puzzle rotation from the painted position to the held one. */
          rotation: string;
          holdKey: 'fromColorsHold_minx';
      }
    | { ok: false; issues: MinxIssue[] };
export type Painted = Record<string, string>;

type Model = {
    kpuzzle: KPuzzle;
    layout: MinxLayout;
    slots: Map<string, MinxSticker[]>;
    solved: Map<string, string>;
    frames: { alg: string; pattern: KPattern }[];
};
const key = (orbit: string, location: number, orientation: number) => orbit + '-l' + location + '-o' + orientation;
const mod = (v: number, n: number) => ((v % n) + n) % n;

let cached: Promise<Model> | undefined;
function model() {
    return (cached ??= (async () => {
        const loader = puzzles.megaminx;
        const kpuzzle = await loader.kpuzzle();
        const svg = await loader.svg!();
        const found: (Omit<MinxSticker, 'aliases'> & { spot: string })[] = [];
        for (const m of svg.matchAll(/<[^>]*\sid="([A-Z0-9_]+)-l(\d+)-o(\d+)"[^>]*>/g)) {
            const fill = /fill:\s*([#\w]+)/.exec(m[0])?.[1];
            if (!fill || !names[fill]) throw new Error('Megaminx: unknown sticker color ' + fill);
            found.push({
                id: key(m[1], Number(m[2]), Number(m[3])),
                orbit: m[1],
                location: Number(m[2]),
                orientation: Number(m[3]),
                solved: fill,
                spot: m[1] + '-l' + m[2] + '@' + m[0].replace(/\sid="[^"]*"/, ''),
            });
        }
        const stickers: MinxSticker[] = [];
        const bySpot = new Map<string, MinxSticker>();
        for (const { spot, ...sticker } of found) {
            const first = bySpot.get(spot);
            if (first) first.aliases.push(sticker.id);
            else {
                const entry: MinxSticker = { ...sticker, aliases: [] };
                bySpot.set(spot, entry);
                stickers.push(entry);
            }
        }
        const slots = new Map<string, MinxSticker[]>();
        for (const s of stickers) {
            const slot = s.orbit + '-l' + s.location;
            slots.set(slot, [...(slots.get(slot) ?? []), s].sort((a, b) => a.orientation - b.orientation));
        }
        const frames = [{ alg: '', pattern: kpuzzle.defaultPattern() }];
        for (const { alg, pattern } of frames)
            for (const r of rotations) {
                const next = pattern.applyMove(r);
                if (!frames.some((f) => f.pattern.patternData.CENTERS.pieces.join() === next.patternData.CENTERS.pieces.join()))
                    frames.push({ alg: (alg + ' ' + r).trim(), pattern: next });
            }
        const palette = [...new Set(stickers.map((s) => s.solved))];
        return {
            kpuzzle,
            layout: {
                svg,
                stickers,
                palette,
                names: Object.fromEntries(palette.map((c) => [c, names[c]] as const)),
                holdKey: 'fromColorsHold_minx' as const,
            },
            slots,
            solved: new Map(found.map((s) => [s.id, s.solved])),
            frames,
        };
    })());
}

export async function colorLayoutMinx(): Promise<MinxLayout> {
    return (await model()).layout;
}

/** Colors a Megaminx pattern (or a scramble from solved) shows. */
export async function colorsOfMinx(pattern: KPattern | string): Promise<Painted> {
    const { kpuzzle, layout, solved } = await model();
    const state = typeof pattern === 'string' ? kpuzzle.defaultPattern().applyAlg(pattern) : pattern;
    const painted: Painted = {};
    for (const s of layout.stickers) {
        const n = kpuzzle.definition.orbits.find((o) => o.orbitName === s.orbit)!.numOrientations;
        const data = state.patternData[s.orbit];
        painted[s.id] = solved.get(key(s.orbit, data.pieces[s.location], mod(s.orientation - data.orientation[s.location], n)))!;
    }
    return painted;
}

function parity(values: readonly number[]) {
    let odd = 0;
    for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) odd ^= 1;
    return odd;
}

export async function readColorsMinx(painted: Painted): Promise<MinxReading> {
    const { kpuzzle, layout, slots, solved, frames } = await model();
    const fail = (issues: MinxIssue[]): MinxReading => ({ ok: false, issues });
    const missing = layout.stickers.filter((s) => !layout.palette.includes(painted[s.id])).map((s) => s.id);
    if (missing.length) return fail([{ key: 'fromColorsMissing', stickers: missing }]);
    const issues: MinxIssue[] = [];
    for (const color of layout.palette) {
        const used = layout.stickers.filter((s) => painted[s.id] === color);
        if (used.length !== 11)
            issues.push({
                key: 'fromColorsCount',
                stickers: used.length > 11 ? used.map((s) => s.id) : [],
                params: { color: layout.names[color], found: used.length, expected: 11 },
            });
    }
    if (issues.length) return fail(issues);

    const patternData: Record<string, { pieces: number[]; orientation: number[] }> = {};
    const owners = new Map<string, string[]>();
    for (const orbit of kpuzzle.definition.orbits) {
        const pieces: number[] = [];
        const orientation: number[] = [];
        for (let location = 0; location < orbit.numPieces; location++) {
            const visible = slots.get(orbit.orbitName + '-l' + location) ?? [];
            let match: [number, number] | undefined;
            for (let piece = 0; piece < orbit.numPieces && !match; piece++)
                for (let twist = 0; twist < orbit.numOrientations && !match; twist++)
                    if (
                        visible.every(
                            (s) =>
                                painted[s.id] ===
                                solved.get(key(orbit.orbitName, piece, mod(s.orientation - twist, orbit.numOrientations))),
                        )
                    )
                        match = [piece, twist];
            const ids = visible.map((s) => s.id);
            if (!match) {
                issues.push({ key: 'fromColorsUnknownPiece', stickers: ids });
                pieces.push(-1);
                orientation.push(0);
                continue;
            }
            pieces.push(match[0]);
            orientation.push(orbit.orbitName === 'CENTERS' ? 0 : match[1]);
            const owner = orbit.orbitName + '-' + match[0];
            owners.set(owner, [...(owners.get(owner) ?? []), ...ids]);
        }
        patternData[orbit.orbitName] = { pieces, orientation };
    }
    for (const [owner, ids] of owners) {
        const size = slots.get(owner.split('-')[0] + '-l0')?.length ?? 1;
        if (ids.length > size) issues.push({ key: 'fromColorsDuplicatePiece', stickers: ids });
    }
    if (issues.length) return fail(issues);

    const painting = new KPattern(kpuzzle, patternData);
    const frame = frames.find(({ alg }) => painting.applyAlg(alg).patternData.CENTERS.pieces.every((p, i) => p === i));
    if (!frame) return fail([{ key: 'fromColorsScheme', stickers: [] }]);
    const heldData = { ...painting.applyAlg(frame.alg).patternData };
    heldData.CENTERS = { ...heldData.CENTERS, orientation: heldData.CENTERS.orientation.map(() => 0) };
    const held = new KPattern(kpuzzle, heldData);
    const { CORNERS, EDGES } = held.patternData;
    const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
    const illegal: MinxIssue[] = [];
    if (sum(CORNERS.orientation) % 3) illegal.push({ key: 'fromColorsTwist', stickers: [] });
    if (sum(EDGES.orientation) % 2) illegal.push({ key: 'fromColorsFlip', stickers: [] });
    if (parity(CORNERS.pieces) || parity(EDGES.pieces)) illegal.push({ key: 'fromColorsSwap', stickers: [] });
    if (illegal.length) return fail(illegal);

    const found = await solveMegaminx(held);
    // Centers never move with face turns; keep only face turns so the solution starts from the held puzzle.
    const solution = found.toString();
    if (/v\b|v\d/.test(solution)) throw new Error('Megaminx: unexpected rotation in solution ' + solution);
    const scramble = found.invert().toString();
    const same = (a: KPattern, b: KPattern) =>
        ['CORNERS', 'EDGES'].every(
            (o) =>
                a.patternData[o].pieces.join() === b.patternData[o].pieces.join() &&
                a.patternData[o].orientation.join() === b.patternData[o].orientation.join(),
        ) && a.patternData.CENTERS.pieces.join() === b.patternData.CENTERS.pieces.join();
    if (!same(kpuzzle.defaultPattern().applyAlg(scramble), held) || !same(held.applyAlg(solution), kpuzzle.defaultPattern()))
        throw new Error('Megaminx: solution failed verification');
    return { ok: true, solution, scramble, rotation: frame.alg, holdKey: 'fromColorsHold_minx' };
}
