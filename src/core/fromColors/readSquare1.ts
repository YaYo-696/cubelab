// Resolver desde colores · Square-1 (Fase 15-D). Author: Claude.
// The user lists the pieces of each layer and says whether the middle layer is square. The state uses the
// app's slice model (src/puzzles/sideEvents/square1.ts): 24 wedges, a corner covers two adjacent wedges,
// '/' is only legal when no corner is cut, plus the middle layer (0 = square, 1 = flipped).
// Positions 0–11 are the top layer and 12–23 the bottom; '/' swaps 0–5 with 12–17; (1, 0) moves the piece
// at position 11 to position 0.
// Three exact stages, each with its own distance table:
//   A. cube shape with even piece-order parity (moves that keep the cube shape never change that parity),
//   B. every corner in place and every edge in its layer (40,320 × 70 states),
//   C. edges inside their layers plus the middle layer (576 states with even parity).
// Stages B and C only use moves that start and end in the cube shape.

export const SQUARE1_SOLVED = 'AABCCDEEFGGHIJJKLLMNNOPP';
const ORDER = 'ABCDEFGHIJKLMNOP';
const CORNERS = 'ACEGJLNP';
const EDGES = 'BDFHIKMO';
/** Colors of each piece as cubing.js draws the solved Square-1 (top yellow, bottom white). */
export const square1Pieces: { id: string; kind: 'corner' | 'edge'; colors: string[] }[] = (
    [
        ['A', ['yellow', 'red', 'blue']],
        ['B', ['yellow', 'blue']],
        ['C', ['yellow', 'blue', 'orange']],
        ['D', ['yellow', 'orange']],
        ['E', ['yellow', 'orange', 'green']],
        ['F', ['yellow', 'green']],
        ['G', ['yellow', 'green', 'red']],
        ['H', ['yellow', 'red']],
        ['I', ['white', 'red']],
        ['J', ['white', 'red', 'green']],
        ['K', ['white', 'green']],
        ['L', ['white', 'green', 'orange']],
        ['M', ['white', 'orange']],
        ['N', ['white', 'orange', 'blue']],
        ['O', ['white', 'blue']],
        ['P', ['white', 'blue', 'red']],
    ] as const
).map(([id, colors]) => ({ id, kind: CORNERS.includes(id) ? 'corner' : 'edge', colors: [...colors] }));

export type Square1Input = {
    /**
     * Top layer pieces in the order of positions 0–11. The first piece must start at position 0, so the user
     * first turns the layer until a gap between two pieces sits at that end of the slice line.
     */
    top: string[];
    /** Bottom layer pieces in the order of positions 12–23, first piece starting at position 12. */
    bottom: string[];
    /** True when the middle layer forms a square (its solved shape). */
    middleSquare: boolean;
};
export type Square1IssueKey = 'sq1Unknown' | 'sq1Duplicate' | 'sq1Missing' | 'sq1LayerSize';
export type Square1Issue = { key: Square1IssueKey; pieces: string[]; params?: Record<string, number | string> };
export type Square1Reading =
    | {
          ok: true;
          /** WCA notation, e.g. "(1, 0) / (-3, 3) /". Empty when already solved. */
          solution: string;
          /** Equivalent scramble from solved, for the player. */
          scramble: string;
          /** The state in the slice model: 24 wedges plus the middle layer. */
          state: string;
      }
    | { ok: false; issues: Square1Issue[] };

type Step = { t: number; b: number } | '/';
const pos = (v: number) => ((v % 12) + 12) % 12;
const signed = (v: number) => (pos(v) > 6 ? pos(v) - 12 : pos(v));
const rot = <T>(layer: T[], shift: number) => layer.slice(12 - pos(shift)).concat(layer.slice(0, 12 - pos(shift)));
const turn = <T>(a: T[], t: number, b: number) => [...rot(a.slice(0, 12), t), ...rot(a.slice(12), b)];
const slash = <T>(a: T[]) => [...a.slice(0, 6), ...a.slice(12, 18), ...a.slice(6, 12), ...a.slice(18, 24)];
const split = (layer: string[]) => layer[0] !== layer[11] && layer[5] !== layer[6];
const canSlash = (a: string[]) => split(a.slice(0, 12)) && split(a.slice(12));
function run<T>(a: T[], m: number, steps: Step[]): [T[], number] {
    for (const step of steps)
        if (step === '/') {
            a = slash(a);
            m ^= 1;
        } else a = turn(a, step.t, step.b);
    return [a, m];
}
function maskOf(layer: string[]) {
    let mask = 0;
    for (let i = 0; i < 12; i++)
        if (layer[i] === layer[(i + 1) % 12] && layer[i] !== layer[(i + 11) % 12]) mask |= 1 << i;
    return mask;
}
/** Parity of the pieces read in position order (top, then bottom) against A…P. */
function parityOf(a: string[]) {
    const seq: number[] = [];
    for (const base of [0, 12]) {
        const layer = a.slice(base, base + 12);
        for (let i = 0; i < 12; i++) if (layer[i] !== layer[(i + 11) % 12]) seq.push(ORDER.indexOf(layer[i]));
    }
    let odd = 0;
    for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) odd ^= 1;
    return odd;
}
const nodeOf = (a: string[]) => (maskOf(a.slice(0, 12)) * 4096 + maskOf(a.slice(12))) * 2 + parityOf(a);
const rotl = (mask: number, t: number) => ((mask << pos(t)) | (mask >> (12 - pos(t)))) & 0xfff;

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
function encode(p: number[]) {
    let r = 0;
    for (let i = 0; i < 8; i++) {
        let c = 0;
        for (let j = i + 1; j < 8; j++) if (p[j] < p[i]) c++;
        r += c * FACT[7 - i];
    }
    return r;
}
function decode(r: number) {
    const left = [0, 1, 2, 3, 4, 5, 6, 7];
    const out: number[] = [];
    for (let i = 0; i < 8; i++) {
        const k = Math.floor(r / FACT[7 - i]);
        r %= FACT[7 - i];
        out.push(left.splice(k, 1)[0]);
    }
    return out;
}

type Generator = { steps: Step[]; perm: number[]; m: number };
type Effect = { steps: Step[]; edges: number[]; m: number };
type Tables = {
    shape: Map<number, number>;
    target: number;
    gens: Generator[];
    cornerSlots: number[];
    edgeSlots: number[];
    maskIndex: Int16Array;
    cornerMove: Uint16Array;
    maskMove: Uint8Array;
    stageB: Uint8Array;
    effects: Effect[];
    stageC: Map<string, number>;
};

let cache: Tables | undefined;
function build(): Tables {
    if (cache) return cache;
    const solved = [...SQUARE1_SOLVED];
    const ids = [...Array(24).keys()];
    const rest = solved.map((c, i) => {
        const base = i < 12 ? 0 : 12;
        const j = i - base;
        return c === solved[base + ((j + 1) % 12)] ? 'C' : c === solved[base + ((j + 11) % 12)] ? 'c' : 'e';
    });
    const restTop = maskOf(solved.slice(0, 12));
    const restBottom = maskOf(solved.slice(12));
    const target = nodeOf(solved);

    // Stage A: 0–1 breadth-first search over (exact shape, parity); turns are free, each '/' costs one.
    // A node is (top corner-start mask, bottom corner-start mask, parity). Parity changes are computed from
    // the masks: turning a layer of n pieces so that k of them wrap past position 0 is a cyclic shift with
    // parity k·(n−k); '/' turns the order [TA TB BA BB] into [BA TB TA BB].
    const shape = new Map<number, number>([[target, 0]]);
    const starts = (mask: number) => mask | (~(mask | rotl(mask, 1)) & 0xfff);
    const ones = (x: number) => {
        let n = 0;
        for (; x; x &= x - 1) n++;
        return n;
    };
    const turnNode = (top: number, bottom: number, parity: number, t: number, b: number) => {
        let p = parity;
        for (const [mask, shift] of [
            [top, t],
            [bottom, b],
        ]) {
            const s = starts(mask);
            const k = ones(s & ((0xfff << (12 - shift)) & 0xfff));
            p ^= (k * (ones(s) - k)) & 1;
        }
        return [rotl(top, t), rotl(bottom, b), p];
    };
    const key = (top: number, bottom: number, parity: number) => (top * 4096 + bottom) * 2 + parity;
    let current: number[][] = [[restTop, restBottom, 0]];
    for (let d = 0; current.length; d++) {
        for (let head = 0; head < current.length; head++)
            for (let t = 0; t < 12; t++)
                for (let b = 0; b < 12; b++) {
                    const n = turnNode(current[head][0], current[head][1], current[head][2], t, b);
                    const k = key(n[0], n[1], n[2]);
                    if (!shape.has(k)) {
                        shape.set(k, d);
                        current.push(n);
                    }
                }
        const next: number[][] = [];
        for (const [top, bottom, parity] of current) {
            if (top & 0x820 || bottom & 0x820) continue; // a corner starts at 5 or 11: '/' would cut it
            const ta = ones(starts(top) & 0x3f);
            const tb = ones(starts(top) & 0xfc0);
            const ba = ones(starts(bottom) & 0x3f);
            const p = parity ^ ((ba * ta + ba * tb + ta * tb) & 1);
            const n = [(top & 0xfc0) | (bottom & 0x3f), (bottom & 0xfc0) | (top & 0x3f), p];
            const k = key(n[0], n[1], n[2]);
            if (!shape.has(k)) {
                shape.set(k, d + 1);
                next.push(n);
            }
        }
        current = next;
    }

    // Moves from the cube shape to the cube shape: (t, b) / (t2, b2), their inverses, and turns by 3s.
    const gens: Generator[] = [];
    const isRest = (a: number[]) =>
        maskOf(a.slice(0, 12).map((i) => solved[i])) === restTop &&
        maskOf(a.slice(12).map((i) => solved[i])) === restBottom;
    const add = (steps: Step[]) => {
        const [perm, m] = run(ids, 0, steps);
        if (!gens.some((g) => g.m === m && g.perm.every((v, i) => v === perm[i]))) gens.push({ steps, perm, m });
    };
    for (let t = 0; t < 12; t++)
        for (let b = 0; b < 12; b++) {
            if (!canSlash(turn(solved, t, b))) continue;
            const after = slash(turn(ids, t, b));
            let best: [number, number] | undefined;
            let cost = Infinity;
            for (let t2 = 0; t2 < 12; t2++)
                for (let b2 = 0; b2 < 12; b2++)
                    if (isRest(turn(after, t2, b2))) {
                        const c = Math.abs(signed(t2)) + Math.abs(signed(b2));
                        if (c < cost) [cost, best] = [c, [t2, b2]];
                    }
            if (!best) continue;
            add([{ t, b }, '/', { t: best[0], b: best[1] }]);
            add([{ t: -best[0], b: -best[1] }, '/', { t: -t, b: -b }]);
        }
    for (const t of [0, 3, 6, 9]) for (const b of [0, 3, 6, 9]) if (t || b) add([{ t, b }]);
    const G = gens.length;

    // Slots of the cube shape: corners start where rest has 'C', edges where it has 'e'.
    const cornerSlots = ids.filter((i) => rest[i] === 'C');
    const edgeSlots = ids.filter((i) => rest[i] === 'e');
    const slotOf = new Map<number, number>();
    cornerSlots.forEach((w, s) => {
        slotOf.set(w, s);
        slotOf.set(w + 1, s);
    });
    edgeSlots.forEach((w, s) => slotOf.set(w, s));
    const cornerFrom = gens.map((g) => cornerSlots.map((w) => slotOf.get(g.perm[w])!));
    const edgeFrom = gens.map((g) => edgeSlots.map((w) => slotOf.get(g.perm[w])!));

    // Stage B: corner permutation (8!) × which edge slots hold top edges (C(8,4) = 70).
    const masks: number[] = [];
    for (let m = 0; m < 256; m++) {
        let bits = 0;
        for (let i = 0; i < 8; i++) bits += (m >> i) & 1;
        if (bits === 4) masks.push(m);
    }
    const maskIndex = new Int16Array(256).fill(-1);
    masks.forEach((m, i) => (maskIndex[m] = i));
    const cornerMove = new Uint16Array(40320 * G);
    for (let x = 0; x < 40320; x++) {
        const p = decode(x);
        for (let g = 0; g < G; g++) cornerMove[x * G + g] = encode(cornerFrom[g].map((s) => p[s]));
    }
    const maskMove = new Uint8Array(70 * G);
    for (let i = 0; i < 70; i++)
        for (let g = 0; g < G; g++) {
            let out = 0;
            edgeFrom[g].forEach((s, d) => {
                if ((masks[i] >> s) & 1) out |= 1 << d;
            });
            maskMove[i * G + g] = maskIndex[out];
        }
    const stageB = new Uint8Array(40320 * 70).fill(255);
    const startB = maskIndex[0b00001111];
    stageB[startB] = 0;
    for (let depth = 0, layer = [startB]; layer.length; depth++) {
        const next: number[] = [];
        for (const x of layer) {
            const c = Math.floor(x / 70);
            const k = x % 70;
            for (let g = 0; g < G; g++) {
                const y = cornerMove[c * G + g] * 70 + maskMove[k * G + g];
                if (stageB[y] === 255) {
                    stageB[y] = depth + 1;
                    next.push(y);
                }
            }
        }
        layer = next;
    }

    // Stage C moves: up to three cube-shape moves, then back to stage-B solved. Shortest per effect.
    const best = new Map<string, Effect & { slashes: number }>();
    const visit = (c: number, k: number, edges: number[], m: number, seq: number[]) => {
        const path = [...seq];
        while (stageB[c * 70 + k]) {
            const d = stageB[c * 70 + k];
            let g = 0;
            while (stageB[cornerMove[c * G + g] * 70 + maskMove[k * G + g]] !== d - 1) g++;
            c = cornerMove[c * G + g];
            k = maskMove[k * G + g];
            edges = edgeFrom[g].map((s) => edges[s]);
            m ^= gens[g].m;
            path.push(g);
        }
        if (!path.length) return;
        const key = edges.join('') + m;
        const slashes = path.reduce((n, g) => n + gens[g].m, 0);
        const old = best.get(key);
        if (!old || old.slashes > slashes) best.set(key, { steps: path.flatMap((g) => gens[g].steps), edges, m, slashes });
    };
    const walk = (c: number, k: number, edges: number[], m: number, seq: number[], depth: number) => {
        visit(c, k, edges, m, seq);
        if (depth)
            for (let g = 0; g < G; g++)
                walk(
                    cornerMove[c * G + g],
                    maskMove[k * G + g],
                    edgeFrom[g].map((s) => edges[s]),
                    m ^ gens[g].m,
                    [...seq, g],
                    depth - 1,
                );
    };
    walk(0, startB, [0, 1, 2, 3, 4, 5, 6, 7], 0, [], 3);
    const effects: Effect[] = [...best.values()].map(({ steps, edges, m }) => ({ steps, edges, m }));
    // Distance to solved: a state s is one effect away from f applied to s.
    const stageC = new Map<string, number>([['012345670', 0]]);
    const inverse = (p: number[]) => p.map((_, i) => p.indexOf(i));
    for (let depth = 0, layer = [{ edges: [0, 1, 2, 3, 4, 5, 6, 7], m: 0 }]; layer.length; depth++) {
        const next: typeof layer = [];
        for (const s of layer)
            for (const f of effects) {
                const back = inverse(f.edges);
                const edges = back.map((i) => s.edges[i]);
                const m = s.m ^ f.m;
                const key = edges.join('') + m;
                if (!stageC.has(key)) {
                    stageC.set(key, depth + 1);
                    next.push({ edges, m });
                }
            }
        layer = next;
    }
    cache = { shape, target, gens, cornerSlots, edgeSlots, maskIndex, cornerMove, maskMove, stageB, effects, stageC };
    return cache;
}

/** Sizes of the tables, for tests. */
export function square1TableSizes() {
    const t = build();
    let b = 0;
    for (const v of t.stageB) if (v !== 255) b++;
    return { shapeNodes: t.shape.size, moves: t.gens.length, stageB: b, effects: t.effects.length, stageC: t.stageC.size };
}

function format(steps: Step[]) {
    // Merge neighbouring turns, drop (0, 0) and cancel '/ /' until nothing changes.
    const keep = (list: Step[]) => list.filter((step) => step === '/' || pos(step.t) || pos(step.b));
    let list = keep(steps);
    for (let changed = true; changed; ) {
        changed = false;
        const out: Step[] = [];
        for (const step of list) {
            const last = out[out.length - 1];
            if (step === '/' && last === '/') {
                out.pop();
                changed = true;
            } else if (step !== '/' && last !== undefined && last !== '/') {
                out[out.length - 1] = { t: last.t + step.t, b: last.b + step.b };
                changed = true;
            } else out.push(step);
        }
        list = keep(out);
    }
    return list.map((step) => (step === '/' ? '/' : '(' + signed(step.t) + ', ' + signed(step.b) + ')')).join(' ');
}

function solveState(start: string[], middle: number): Step[] {
    const t = build();
    const steps: Step[] = [];
    let a = start;
    let m = middle;
    const go = (part: Step[]) => {
        [a, m] = run(a, m, part);
        steps.push(...part);
    };
    // Stage A.
    for (;;) {
        const d = t.shape.get(nodeOf(a));
        if (d === undefined) throw new Error('Square-1: unknown shape');
        let move: Step[] | undefined;
        for (let x = 0; x < 12 && !move; x++)
            for (let y = 0; y < 12 && !move; y++) {
                const turned = turn(a, x, y);
                if (nodeOf(turned) === t.target) move = [{ t: x, b: y }];
                else if (d > 0 && canSlash(turned) && t.shape.get(nodeOf(slash(turned))) === d - 1)
                    move = [{ t: x, b: y }, '/'];
            }
        if (!move) throw new Error('Square-1: no shape move');
        go(move);
        if (move.length === 1) break;
    }
    // Stage B.
    const G = t.gens.length;
    const coordinateB = () => {
        const c = encode(t.cornerSlots.map((w) => CORNERS.indexOf(a[w])));
        let mask = 0;
        t.edgeSlots.forEach((w, s) => {
            if (EDGES.indexOf(a[w]) < 4) mask |= 1 << s;
        });
        return c * 70 + t.maskIndex[mask];
    };
    while (t.stageB[coordinateB()]) {
        const x = coordinateB();
        const c = Math.floor(x / 70);
        const k = x % 70;
        let g = 0;
        while (t.stageB[t.cornerMove[c * G + g] * 70 + t.maskMove[k * G + g]] !== t.stageB[x] - 1) g++;
        go(t.gens[g].steps);
    }
    // Stage C.
    const keyC = (x: string[], mid: number) => t.edgeSlots.map((w) => EDGES.indexOf(x[w])).join('') + mid;
    while (t.stageC.get(keyC(a, m))) {
        const d = t.stageC.get(keyC(a, m))!;
        const effect = t.effects.find((f) => t.stageC.get(keyC(...run(a, m, f.steps))) === d - 1);
        if (!effect) throw new Error('Square-1: no edge move');
        go(effect.steps);
    }
    if (a.join('') !== SQUARE1_SOLVED || m !== 0) throw new Error('Square-1: solution failed verification');
    return steps;
}

/** Solution in WCA notation for a slice-model state (24 wedges + middle '0'/'1'). */
export function square1Solution(state: string) {
    return format(solveState([...state.slice(0, 24)], state[24] === '1' ? 1 : 0));
}

function invert(solution: string) {
    const tokens = solution.match(/\/|\(-?\d+,\s*-?\d+\)/g) ?? [];
    return tokens
        .reverse()
        .map((token) => {
            const match = /\((-?\d+),\s*(-?\d+)\)/.exec(token);
            return match ? '(' + signed(-Number(match[1])) + ', ' + signed(-Number(match[2])) + ')' : '/';
        })
        .join(' ');
}

export function readSquare1(input: Square1Input): Square1Reading {
    const issues: Square1Issue[] = [];
    const all = [...input.top, ...input.bottom];
    const unknown = all.filter((id) => id.length !== 1 || !ORDER.includes(id));
    if (unknown.length) issues.push({ key: 'sq1Unknown', pieces: unknown });
    const repeated = [...new Set(all.filter((id, i) => all.indexOf(id) !== i))];
    if (repeated.length) issues.push({ key: 'sq1Duplicate', pieces: repeated });
    const missing = [...ORDER].filter((id) => !all.includes(id));
    if (missing.length) issues.push({ key: 'sq1Missing', pieces: missing });
    const width = (layer: string[]) => layer.reduce((sum, id) => sum + (CORNERS.includes(id) ? 2 : 1), 0);
    for (const [name, layer] of [
        ['top', input.top],
        ['bottom', input.bottom],
    ] as const)
        if (width(layer) !== 12)
            issues.push({ key: 'sq1LayerSize', pieces: [...layer], params: { layer: name, width: width(layer) } });
    if (issues.length) return { ok: false, issues };
    const wedges = (layer: string[]) => layer.flatMap((id) => (CORNERS.includes(id) ? [id, id] : [id])).join('');
    const state = wedges(input.top) + wedges(input.bottom) + (input.middleSquare ? '0' : '1');
    const solution = square1Solution(state);
    return { ok: true, solution, scramble: invert(solution), state };
}
