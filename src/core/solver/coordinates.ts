import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { standardHalfTurns } from '../../puzzles/notation';

export const turns = ['', 'U', 'U2', "U'"];
export const frames = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((x) =>
    ['', 'y', 'y2', "y'"].map((y) => [x, y].filter(Boolean).join(' ')),
);
export const sequence = (...parts: string[]) => standardHalfTurns(parts.filter(Boolean).join(' '));
export const movesFor = (faces: string) => [...faces].flatMap((face) => [face, face + '2', face + "'"]);

export type Piece = { orbit: 'EDGES' | 'CORNERS'; id: number };
export const edges = (...ids: number[]): Piece[] => ids.map((id) => ({ orbit: 'EDGES', id }));
export const corners = (...ids: number[]): Piece[] => ids.map((id) => ({ orbit: 'CORNERS', id }));
export const cross = edges(4, 5, 6, 7);
export const lowerCorners = corners(4, 5, 6, 7);
export const middle = edges(8, 9, 10, 11);
export const slotEdges = [8, 9, 11, 10]; // DFR, DLF, DBL, DRB in KPuzzle order

export function coordinate(pattern: KPattern, piece: Piece) {
    const data = pattern.patternData[piece.orbit];
    const slot = data.pieces.indexOf(piece.id);
    return slot * (piece.orbit === 'EDGES' ? 2 : 3) + data.orientation[slot];
}
export function atHome(pattern: KPattern, pieces: readonly Piece[]) {
    return pieces.every(({ orbit, id }) => {
        const data = pattern.patternData[orbit];
        return data.pieces[id] === id && data.orientation[id] === 0;
    });
}

export function transition(kp: KPuzzle, alg: string, orbit: Piece['orbit']) {
    const { permutation, orientationDelta } = kp.algToTransformation(alg).transformationData[orbit];
    const radix = orbit === 'EDGES' ? 2 : 3;
    return Uint8Array.from({ length: permutation.length * radix }, (_, value) => {
        const to = permutation.indexOf(Math.floor(value / radix));
        return to * radix + (((value % radix) + orientationDelta[to]) % radix);
    });
}
const ORBITS = ['EDGES', 'CORNERS'] as const;
export function actions(kp: KPuzzle, algorithms: string[]) {
    return algorithms.map((alg) => ({
        alg,
        cost: alg.split(' ').length,
        tables: Object.fromEntries(
            ORBITS.filter((orbit) => kp.defaultPattern().patternData[orbit]).map((orbit) => [
                orbit,
                transition(kp, alg, orbit),
            ]),
        ) as Record<Piece['orbit'], Uint8Array>,
    }));
}
type Action = ReturnType<typeof actions>[number];
const radix = 24;
const pack = (values: readonly number[]) => values.reduce((n, value) => n * radix + value, 0);

export function distanceTable(pieces: Piece[], moves: Action[], goals: number[][]) {
    const size = radix ** pieces.length;
    const table = new Uint8Array(size).fill(255);
    const queue = new Uint32Array(size);
    let read = 0,
        write = 0;
    for (const state of goals) {
        const key = pack(state);
        if (table[key] === 255) {
            queue[write++] = key;
            table[key] = 0;
        }
    }
    const coords = new Uint8Array(pieces.length);
    const transitions = moves.map((move) => pieces.map((piece) => move.tables[piece.orbit]));
    while (read < write) {
        const state = queue[read++];
        let remaining = state;
        for (let i = pieces.length - 1; i >= 0; i--) {
            coords[i] = remaining % radix;
            remaining = Math.floor(remaining / radix);
        }
        for (const move of transitions) {
            let next = 0;
            for (let i = 0; i < pieces.length; i++) next = next * radix + move[i][coords[i]];
            if (table[next] !== 255) continue;
            table[next] = table[state] + 1;
            queue[write++] = next;
        }
    }
    const estimate = (values: readonly number[]) => table[pack(values)];
    function solve(pattern: KPattern) {
        let values = pieces.map((piece) => coordinate(pattern, piece));
        const result: string[] = [];
        while (estimate(values) > 0 && estimate(values) < 255) {
            const selected = moves.find(
                (move) =>
                    estimate(values.map((v, i) => move.tables[pieces[i].orbit][v])) ===
                    estimate(values) - 1,
            );
            if (!selected) throw new Error('distance descent');
            values = values.map((v, i) => selected.tables[pieces[i].orbit][v]);
            result.push(selected.alg);
        }
        if (estimate(values) !== 0) throw new Error('unreachable piece coordinates');
        return result;
    }
    return { solve, estimate };
}

export function slotSearch(pattern: KPattern, target: Piece[], locked: Piece[], candidates: Action[]) {
    const moves = candidates.filter(({ tables }) =>
        locked.every(({ orbit, id }) => {
            const home = id * (orbit === 'CORNERS' ? 3 : 2);
            return tables[orbit][home] === home;
        }),
    );
    const size = radix ** target.length;
    const best = new Uint16Array(size).fill(65535);
    const previous = new Int32Array(size).fill(-1);
    const via = new Uint16Array(size);
    const states: number[][] = Array.from({ length: size }, (_, key) =>
        target.map((_, i) => Math.floor(key / radix ** (target.length - 1 - i)) % radix),
    );
    const start = pack(target.map((piece) => coordinate(pattern, piece)));
    const goal = pack(target.map(({ orbit, id }) => id * (orbit === 'CORNERS' ? 3 : 2)));
    const pending: number[][] = [[start]];
    best[start] = 0;
    for (let cost = 0; cost < pending.length; cost++) {
        for (const key of pending[cost] ?? []) {
            if (cost !== best[key]) continue;
            if (key === goal) {
                const result: string[] = [];
                for (let at = key; at !== start; at = previous[at]) result.push(moves[via[at]].alg);
                return result.reverse().join(' ');
            }
            for (const [i, move] of moves.entries()) {
                const next = pack(states[key].map((v, j) => move.tables[target[j].orbit][v]));
                const nextCost = cost + move.cost;
                if (nextCost >= best[next]) continue;
                best[next] = nextCost;
                previous[next] = key;
                via[next] = i;
                (pending[nextCost] ??= []).push(next);
            }
        }
    }
}

export function idaPieces(
    pattern: KPattern,
    pieces: Piece[],
    moves: Action[],
    estimate: (values: readonly number[]) => number,
    limit: number,
    deadline: number,
) {
    const first = pieces.map((piece) => coordinate(pattern, piece));
    const transitions = moves.map((move) => pieces.map((piece) => move.tables[piece.orbit]));
    const levels = Array.from({ length: limit + 1 }, () => new Array<number>(pieces.length));
    levels[0] = first;
    const path = new Array<number>(limit);
    let visited = 0;
    let timedOut = false;
    function search(depth: number, left: number, last: string): boolean {
        if ((visited++ & 255) === 0 && performance.now() > deadline) timedOut = true;
        if (timedOut) return false;
        const values = levels[depth];
        const bound = estimate(values);
        if (bound > left) return false;
        if (bound === 0)
            return pieces.every(
                ({ orbit, id }, index) => values[index] === id * (orbit === 'CORNERS' ? 3 : 2),
            );
        for (const [i, move] of moves.entries()) {
            if (move.alg[0] === last) continue;
            const next = levels[depth + 1];
            for (let j = 0; j < pieces.length; j++) next[j] = transitions[i][j][values[j]];
            path[depth] = i;
            if (search(depth + 1, left - 1, move.alg[0])) return true;
            if (timedOut) return false;
        }
        return false;
    }
    for (let bound = estimate(first); bound <= limit && !timedOut; bound++)
        if (search(0, bound, ''))
            return path
                .slice(0, bound)
                .map((i) => moves[i].alg)
                .join(' ');
}
