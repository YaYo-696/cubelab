// Resolver desde colores (Fase 15). Author: Claude.
// Turns the stickers a user paints into an equivalent scramble that the existing solver understands.
// The sticker ids come from the cubing.js 2D net ("ORBIT-l<location>-o<orientation>"), so the
// mapping from colors to pieces is the same one cubing.js uses to draw a pattern.
import { Alg } from 'cubing/alg';
import { KPattern, type KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import {
    experimentalSolve2x2x2,
    experimentalSolve3x3x3IgnoringCenters,
    solvePyraminx,
    solveSkewb,
} from 'cubing/search';

export const colorPuzzles = ['333', '222', 'pyram', 'skewb'] as const;
export type ColorPuzzle = (typeof colorPuzzles)[number];
export function isColorPuzzle(id: string): id is ColorPuzzle {
    return (colorPuzzles as readonly string[]).includes(id);
}

type Config = {
    cubing: '3x3x3' | '2x2x2' | 'pyraminx' | 'skewb';
    /** Moves of the app's notation: the frame is whatever these moves never move. */
    moves: string[];
    /** Whole-puzzle rotations that cubing.js understands for this puzzle. */
    rotations: string[];
    /** Order of a single move (4 for cubes, 3 for Pyraminx and Skewb). */
    order: 3 | 4;
    solve: (pattern: KPattern) => Promise<Alg>;
};
const configs: Record<ColorPuzzle, Config> = {
    '333': {
        cubing: '3x3x3',
        moves: ['U', 'D', 'L', 'R', 'F', 'B'],
        rotations: ['x', 'y', 'z'],
        order: 4,
        solve: experimentalSolve3x3x3IgnoringCenters,
    },
    '222': {
        cubing: '2x2x2',
        moves: ['U', 'R', 'F'],
        rotations: ['x', 'y', 'z'],
        order: 4,
        solve: experimentalSolve2x2x2,
    },
    pyram: {
        cubing: 'pyraminx',
        moves: ['U', 'L', 'R', 'B', 'u', 'l', 'r', 'b'],
        rotations: ['Uv', 'Lv', 'Rv', 'Bv'],
        order: 3,
        solve: solvePyraminx,
    },
    skewb: {
        cubing: 'skewb',
        moves: ['R', 'U', 'L', 'B'],
        rotations: ['x', 'y', 'z'],
        order: 3,
        solve: solveSkewb,
    },
};

export type ColorName = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';
const colorNames: Record<string, ColorName> = {
    white: 'white',
    '#ffffff': 'white',
    yellow: 'yellow',
    '#f4f400': 'yellow',
    limegreen: 'green',
    '#44ee00': 'green',
    '#26f': 'blue',
    '#2266ff': 'blue',
    red: 'red',
    '#ff0000': 'red',
    orange: 'orange',
    '#ff8000': 'orange',
};

export type Sticker = {
    /** Id of the element in `svg` that the user paints. */
    id: string;
    orbit: string;
    location: number;
    orientation: number;
    /** Color of this sticker on the solved puzzle (one of `palette`). */
    solved: string;
    /** Other element ids drawn on the same spot (center overlays). Paint them with the same color. */
    aliases: string[];
};
export type ColorLayout = {
    puzzle: ColorPuzzle;
    /** cubing.js 2D net. Elements with `data-copy-id` mirror the sticker they name. */
    svg: string;
    stickers: Sticker[];
    /** Colors in the order they first appear on the solved net. */
    palette: string[];
    /** Name of each palette color, for labels and messages (i18n key `fromColorsColor_<name>`). */
    names: Record<string, ColorName>;
    /** i18n key that tells how to hold the puzzle while following the solution. */
    holdKey: string;
};
/** Sticker id → palette color. */
export type Painted = Record<string, string>;
export type ColorIssueKey =
    | 'fromColorsMissing'
    | 'fromColorsCount'
    | 'fromColorsUnknownPiece'
    | 'fromColorsDuplicatePiece'
    | 'fromColorsScheme'
    | 'fromColorsTwist'
    | 'fromColorsFlip'
    | 'fromColorsSwap';
export type ColorIssue = {
    key: ColorIssueKey;
    /** Stickers to highlight. Empty when the problem has no single location. */
    stickers: string[];
    params?: Record<string, string | number>;
};
export type ColorReading =
    | {
          ok: true;
          /** Equivalent scramble in the app's notation, without rotations. Feed it to the solver. */
          scramble: string;
          /** Whole-puzzle rotation from the way it was painted to the way the solution expects it. */
          rotation: string;
          holdKey: string;
      }
    | { ok: false; issues: ColorIssue[] };

type Model = {
    config: Config;
    kpuzzle: KPuzzle;
    layout: ColorLayout;
    /** Visible orientations of each slot, ordered, with their sticker ids. */
    slots: Map<string, Sticker[]>;
    /** Solved color of each (orbit, piece, orientation). */
    solved: Map<string, string>;
    /** Slots no app move permutes; `twists` is true when a move may still twist them. */
    fixed: { orbit: string; location: number; twists: boolean }[];
    rotations: { alg: string; pattern: KPattern }[];
};
const models = new Map<ColorPuzzle, Promise<Model>>();
const key = (orbit: string, location: number, orientation: number) =>
    orbit + '-l' + location + '-o' + orientation;
const mod = (value: number, n: number) => ((value % n) + n) % n;

async function createModel(puzzle: ColorPuzzle): Promise<Model> {
    const config = configs[puzzle];
    const loader = puzzles[config.cubing];
    const kpuzzle = await loader.kpuzzle();
    const svg = await loader.svg!();
    const found: (Omit<Sticker, 'aliases'> & { spot: string })[] = [];
    for (const match of svg.matchAll(/<[^>]*\sid="([A-Z0-9_]+)-l(\d+)-o(\d+)"[^>]*>/g)) {
        const fill = /fill:\s*([#\w]+)/.exec(match[0])?.[1];
        if (!fill) throw new Error('Sticker without color: ' + match[1]);
        found.push({
            id: key(match[1], Number(match[2]), Number(match[3])),
            orbit: match[1],
            location: Number(match[2]),
            orientation: Number(match[3]),
            solved: fill,
            // Overlays of one center differ only in their id: everything else is the drawn spot.
            spot: match[1] + '-l' + match[2] + '@' + match[0].replace(/\sid="[^"]*"/, ''),
        });
    }
    const stickers: Sticker[] = [];
    const bySpot = new Map<string, Sticker>();
    for (const { spot, ...sticker } of found) {
        const first = bySpot.get(spot);
        if (first) first.aliases.push(sticker.id);
        else {
            const entry: Sticker = { ...sticker, aliases: [] };
            bySpot.set(spot, entry);
            stickers.push(entry);
        }
    }
    const palette = [...new Set(stickers.map((sticker) => sticker.solved))];
    const names = Object.fromEntries(
        palette.map((color) => {
            const name = colorNames[color];
            if (!name) throw new Error('Unknown palette color ' + color);
            return [color, name] as const;
        }),
    );
    const slots = new Map<string, Sticker[]>();
    for (const sticker of stickers) {
        const slot = sticker.orbit + '-l' + sticker.location;
        slots.set(slot, [...(slots.get(slot) ?? []), sticker].sort((a, b) => a.orientation - b.orientation));
    }
    const solved = new Map(found.map((sticker) => [sticker.id, sticker.solved]));
    const fixed: Model['fixed'] = [];
    for (const orbit of kpuzzle.definition.orbits)
        for (let location = 0; location < orbit.numPieces; location++) {
            const data = config.moves.map((move) => kpuzzle.moveToTransformation(move).transformationData);
            if (data.every((t) => t[orbit.orbitName].permutation[location] === location))
                fixed.push({
                    orbit: orbit.orbitName,
                    location,
                    twists: data.some((t) => t[orbit.orbitName].orientationDelta[location] !== 0),
                });
        }
    const rotations = [{ alg: '', pattern: kpuzzle.defaultPattern() }];
    for (const { alg, pattern } of rotations)
        for (const rotation of config.rotations) {
            const next = pattern.applyMove(rotation);
            if (!rotations.some((entry) => entry.pattern.isIdentical(next)))
                rotations.push({ alg: (alg + ' ' + rotation).trim(), pattern: next });
        }
    const holdKey = 'fromColorsHold_' + puzzle;
    return {
        config,
        kpuzzle,
        layout: { puzzle, svg, stickers, palette, names, holdKey },
        slots,
        solved,
        fixed,
        rotations,
    };
}
function model(puzzle: ColorPuzzle) {
    let entry = models.get(puzzle);
    if (!entry) {
        entry = createModel(puzzle);
        models.set(puzzle, entry);
    }
    return entry;
}

export async function colorLayout(puzzle: ColorPuzzle): Promise<ColorLayout> {
    return (await model(puzzle)).layout;
}

/** Colors a pattern would show. Used by tests and to paint a known position. */
export async function colorsOf(puzzle: ColorPuzzle, pattern: KPattern | string): Promise<Painted> {
    const { kpuzzle, layout, solved } = await model(puzzle);
    const state = typeof pattern === 'string' ? kpuzzle.defaultPattern().applyAlg(pattern) : pattern;
    const painted: Painted = {};
    for (const sticker of layout.stickers) {
        const orbit = kpuzzle.definition.orbits.find((o) => o.orbitName === sticker.orbit)!;
        const data = state.patternData[sticker.orbit];
        const piece = data.pieces[sticker.location];
        const shown = mod(sticker.orientation - data.orientation[sticker.location], orbit.numOrientations);
        painted[sticker.id] = solved.get(key(sticker.orbit, piece, shown))!;
    }
    return painted;
}

function parity(values: readonly number[]) {
    let odd = 0;
    for (let i = 0; i < values.length; i++)
        for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) odd ^= 1;
    return odd;
}

const cornerStates = new Map<ColorPuzzle, Set<string>>();
/** Reachable CORNERS states of the Skewb in the app frame (8748 states). */
function skewbCorners({ kpuzzle, config }: Model) {
    let states = cornerStates.get('skewb');
    if (states) return states;
    const moves = config.moves.map(
        (move) => kpuzzle.moveToTransformation(move).transformationData.CORNERS,
    );
    const start = { pieces: [0, 1, 2, 3, 4, 5, 6, 7], orientation: [0, 0, 0, 0, 0, 0, 0, 0] };
    const name = (s: typeof start) => s.pieces.join('') + s.orientation.join('');
    states = new Set([name(start)]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++)
        for (const t of moves) {
            const next = {
                pieces: t.permutation.map((from) => queue[i].pieces[from]),
                orientation: t.permutation.map((from, to) =>
                    mod(queue[i].orientation[from] + t.orientationDelta[to], 3),
                ),
            };
            const id = name(next);
            if (!states.has(id)) {
                states.add(id);
                queue.push(next);
            }
        }
    cornerStates.set('skewb', states);
    return states;
}

function legality(puzzle: ColorPuzzle, pattern: KPattern, m: Model): ColorIssue[] {
    const data = pattern.patternData;
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const issue = (key: ColorIssueKey): ColorIssue => ({ key, stickers: [] });
    const issues: ColorIssue[] = [];
    if (puzzle === '333') {
        if (sum(data.CORNERS.orientation) % 3) issues.push(issue('fromColorsTwist'));
        if (sum(data.EDGES.orientation) % 2) issues.push(issue('fromColorsFlip'));
        if (parity(data.CORNERS.pieces) !== parity(data.EDGES.pieces)) issues.push(issue('fromColorsSwap'));
    } else if (puzzle === '222') {
        if (sum(data.CORNERS.orientation) % 3) issues.push(issue('fromColorsTwist'));
    } else if (puzzle === 'pyram') {
        if (parity(data.EDGES.pieces)) issues.push(issue('fromColorsSwap'));
        if (sum(data.EDGES.orientation) % 2) issues.push(issue('fromColorsFlip'));
    } else {
        if (parity(data.CENTERS.pieces)) issues.push(issue('fromColorsSwap'));
        const corners = data.CORNERS.pieces.join('') + data.CORNERS.orientation.join('');
        if (!skewbCorners(m).has(corners)) {
            const permutations = new Set([...skewbCorners(m)].map((state) => state.slice(0, 8)));
            issues.push(issue(permutations.has(corners.slice(0, 8)) ? 'fromColorsTwist' : 'fromColorsSwap'));
        }
    }
    return issues;
}

/** Writes `alg` with the moves the app's notation accepts (no rotations, no redundant amounts). */
function appNotation(alg: Alg, order: 3 | 4) {
    return alg
        .toString()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => {
            const move = /^([A-Za-z]+)(\d*)('?)$/.exec(token);
            if (!move) throw new Error('Unexpected move ' + token);
            const amount = mod((Number(move[2] || 1)) * (move[3] ? -1 : 1), order);
            if (amount === 0) return '';
            if (order === 3) return move[1] + (amount === 2 ? "'" : '');
            return move[1] + (amount === 2 ? '2' : amount === 3 ? "'" : '');
        })
        .filter(Boolean)
        .join(' ');
}

/** Same position, ignoring center twists that the stickers cannot show. */
function samePosition(puzzle: ColorPuzzle, a: KPattern, b: KPattern) {
    return Object.keys(a.patternData).every((orbit) => {
        const x = a.patternData[orbit];
        const y = b.patternData[orbit];
        if (x.pieces.some((piece, i) => piece !== y.pieces[i])) return false;
        if (orbit === 'CENTERS' && (puzzle === '333' || puzzle === 'skewb')) return true;
        return x.orientation.every((value, i) => value === y.orientation[i]);
    });
}

export async function readColors(puzzle: ColorPuzzle, painted: Painted): Promise<ColorReading> {
    const m = await model(puzzle);
    const { layout, kpuzzle, solved, slots, config } = m;
    const fail = (issues: ColorIssue[]): ColorReading => ({ ok: false, issues });

    const missing = layout.stickers
        .filter((sticker) => !layout.palette.includes(painted[sticker.id]))
        .map((sticker) => sticker.id);
    if (missing.length) return fail([{ key: 'fromColorsMissing', stickers: missing }]);

    const issues: ColorIssue[] = [];
    for (const color of layout.palette) {
        const expected = layout.stickers.filter((sticker) => sticker.solved === color).length;
        const used = layout.stickers.filter((sticker) => painted[sticker.id] === color);
        if (used.length !== expected)
            issues.push({
                key: 'fromColorsCount',
                stickers: used.length > expected ? used.map((sticker) => sticker.id) : [],
                params: { color: layout.names[color], found: used.length, expected },
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
                            (sticker) =>
                                painted[sticker.id] ===
                                solved.get(
                                    key(
                                        orbit.orbitName,
                                        piece,
                                        mod(sticker.orientation - twist, orbit.numOrientations),
                                    ),
                                ),
                        )
                    )
                        match = [piece, twist];
            const ids = visible.map((sticker) => sticker.id);
            if (!match) {
                issues.push({ key: 'fromColorsUnknownPiece', stickers: ids });
                pieces.push(-1);
                orientation.push(0);
                continue;
            }
            pieces.push(match[0]);
            orientation.push(match[1]);
            const owner = orbit.orbitName + '-' + match[0];
            owners.set(owner, [...(owners.get(owner) ?? []), ...ids]);
        }
        patternData[orbit.orbitName] = { pieces, orientation };
    }
    for (const [owner, ids] of owners) {
        const [orbit] = owner.split('-');
        const size = slots.get(orbit + '-l0')?.length ?? 1;
        if (ids.length > size) issues.push({ key: 'fromColorsDuplicatePiece', stickers: ids });
    }
    if (issues.length) return fail(issues);

    const painting = new KPattern(kpuzzle, patternData);
    const frame = m.rotations.find(({ alg }) => {
        const held = painting.applyAlg(alg).patternData;
        return m.fixed.every(
            ({ orbit, location, twists }) =>
                held[orbit].pieces[location] === location &&
                (twists || held[orbit].orientation[location] === 0),
        );
    });
    if (!frame) return fail([{ key: 'fromColorsScheme', stickers: [] }]);
    const heldData = { ...painting.applyAlg(frame.alg).patternData };
    if (heldData.CENTERS && (puzzle === '333' || puzzle === 'skewb'))
        heldData.CENTERS = { ...heldData.CENTERS, orientation: heldData.CENTERS.orientation.map(() => 0) };
    const held = new KPattern(kpuzzle, heldData);

    const illegal = legality(puzzle, held, m);
    if (illegal.length) return fail(illegal);

    const solution = await config.solve(held);
    const scramble = appNotation(solution.invert(), config.order);
    if (!samePosition(puzzle, kpuzzle.defaultPattern().applyAlg(scramble), held))
        throw new Error('fromColors: the scramble does not rebuild the painted position');
    return { ok: true, scramble, rotation: frame.alg, holdKey: layout.holdKey };
}
