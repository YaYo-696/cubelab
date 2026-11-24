import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import type { SearchResult, Stage } from '../../core/contracts';
import type { SolveMethod, SolveProgress } from '../../core/solver/options';
import { minimumDistances } from '../events';
import { normalizeSkewb, skewbModel, skewbMoves, visibleSkewb } from './model';

const unknownDistance = 255;
const centerCount = 360;
const stateCount = 3149280;
// The academy keeps WCA face U solved (white in the cubing.js palette).
const topCorners = [0, 1, 3, 6];
const topCenter = 3;

function cornersMatch(pattern: KPattern, slots: readonly number[]) {
    const { pieces, orientation } = pattern.patternData.CORNERS;
    return slots.every((slot) => pieces[slot] === slot && orientation[slot] === 0);
}
export function firstLayerSolved(pattern: KPattern) {
    return (
        cornersMatch(pattern, topCorners) &&
        pattern.patternData.CENTERS.pieces[topCenter] === topCenter
    );
}
export function cornersStageSolved(pattern: KPattern) {
    return (
        cornersMatch(pattern, [0, 1, 2, 3, 4, 5, 6, 7]) &&
        pattern.patternData.CENTERS.pieces[topCenter] === topCenter
    );
}

function cornerKey(pattern: KPattern) {
    const { pieces, orientation } = pattern.patternData.CORNERS;
    return pieces.reduce((key, piece, i) => key * 24 + piece * 3 + orientation[i], 0);
}
const centerKey = (pattern: KPattern) =>
    pattern.patternData.CENTERS.pieces.reduce((key, piece) => key * 6 + piece, 0);

function projection(solved: KPattern, model: KPuzzle, key: (pattern: KPattern) => number) {
    const transforms = skewbMoves.map((move) => model.moveToTransformation(move));
    const patterns = [solved];
    const ids = new Map([[key(solved), 0]]);
    const moves: number[] = [];
    for (const pattern of patterns)
        for (const transform of transforms) {
            const next = pattern.applyTransformation(transform);
            const value = key(next);
            if (!ids.has(value)) {
                ids.set(value, patterns.length);
                patterns.push(next);
            }
            moves.push(ids.get(value)!);
        }
    return { ids, patterns, moves: Uint16Array.from(moves) };
}

function makeTable(model: KPuzzle) {
    const solved = visibleSkewb(model.defaultPattern());
    // The four WCA axes fix the position and twist of the reference corner.
    // Only color permutations and corner twists belong in the quotient.
    const corners = projection(solved, model, cornerKey);
    const centers = projection(solved, model, centerKey);
    if (
        centers.patterns.length !== centerCount ||
        corners.patterns.length * centerCount !== stateCount
    )
        throw new Error('Unexpected Skewb coordinate size');

    const next = (state: number, move: number) =>
        corners.moves[Math.floor(state / centerCount) * 8 + move] * centerCount +
        centers.moves[(state % centerCount) * 8 + move];
    const fromPattern = (pattern: KPattern) => {
        const corner = corners.ids.get(cornerKey(pattern));
        const center = centers.ids.get(centerKey(pattern));
        if (corner === undefined || center === undefined)
            throw new Error('Unreachable Skewb position');
        return corner * centerCount + center;
    };

    function distances(seeds: readonly number[]) {
        const distance = new Uint8Array(stateCount).fill(unknownDistance);
        const queue = new Uint32Array(stateCount);
        for (const seed of seeds) distance[seed] = 0;
        queue.set(seeds);
        let size = seeds.length;
        for (let read = 0; read < size; read++) {
            const state = queue[read];
            const depth = distance[state] + 1;
            for (let move = 0; move < 8; move++) {
                const child = next(state, move);
                if (distance[child] !== unknownDistance) continue;
                distance[child] = depth;
                queue[size++] = child;
            }
        }
        if (size !== stateCount) throw new Error('Unexpected reachable Skewb state count: ' + size);
        return distance;
    }

    const exact = distances([0]);
    let beginner: [Uint8Array, Uint8Array] | undefined;
    function beginnerDistances() {
        if (beginner) return beginner;
        const alignedCenters = centers.patterns.flatMap((p, i) =>
            p.patternData.CENTERS.pieces[topCenter] === topCenter ? [i] : [],
        );
        const layer = corners.patterns.flatMap((p, i) =>
            cornersMatch(p, topCorners)
                ? alignedCenters.map((center) => i * centerCount + center)
                : [],
        );
        // Corner coordinate zero denotes all eight correct corners.
        beginner = [distances(layer), distances(alignedCenters)];
        return beginner;
    }

    function descend(state: number, distance: Uint8Array) {
        const output: string[] = [];
        while (distance[state] > 0) {
            const move = skewbMoves.findIndex(
                (_, index) => distance[next(state, index)] + 1 === distance[state],
            );
            if (move < 0) throw new Error('Could not reconstruct a Skewb shortest path');
            output.push(skewbMoves[move]);
            state = next(state, move);
        }
        return { state, output };
    }
    return { exact, fromPattern, descend, beginnerDistances };
}

let table: ReturnType<typeof makeTable> | undefined;
const tableFor = (model: KPuzzle) => (table ??= makeTable(model));
export async function skewbDistance(input: string) {
    const model = await skewbModel();
    const paths = tableFor(model);
    return paths.exact[paths.fromPattern(model.defaultPattern().applyAlg(input))];
}

export async function filterSkewb(candidate: () => Promise<string>, signal: AbortSignal) {
    const model = await skewbModel();
    const paths = tableFor(model);
    for (;;) {
        signal.throwIfAborted();
        const input = normalizeSkewb(await candidate());
        signal.throwIfAborted();
        // WCA 4b3c: TNoodle calls solveIn(6), counting each 120° R/U/L/B turn as one.
        if (
            paths.exact[paths.fromPattern(model.defaultPattern().applyAlg(input))] >=
            minimumDistances.skewb
        )
            return input;
    }
}

export async function scrambleSkewb(signal: AbortSignal) {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    return filterSkewb(async () => (await randomScrambleForEvent('skewb')).toString(), signal);
}

export async function solveSkewb(
    input: string,
    method: SolveMethod,
    progress?: (p: SolveProgress) => void,
): Promise<SearchResult> {
    if (method !== 'shortest' && method !== 'beginner') return { status: 'invalidInput' };
    let scramble: string;
    try {
        scramble = input.trim() ? normalizeSkewb(input) : '';
    } catch {
        return { status: 'invalidInput' };
    }
    progress?.({ key: 'solveSearching', value: 0.15 });
    const model = await skewbModel();
    const solved = visibleSkewb(model.defaultPattern());
    let pattern = solved.applyAlg(scramble);
    const paths = tableFor(model);
    let state = paths.fromPattern(pattern);
    if (method === 'beginner') progress?.({ key: 'solveSearching', value: 0.5 });
    const stages: Stage[] = [];
    function append(id: string, distance: Uint8Array, verify: (p: KPattern) => boolean) {
        const step = paths.descend(state, distance);
        state = step.state;
        const alg = step.output.join(' ');
        pattern = pattern.applyAlg(alg);
        if (!verify(pattern)) throw new Error('Skewb solution failed KPuzzle verification: ' + id);
        stages.push({
            id,
            nameKey: id,
            alg,
            moves: step.output.length,
            explanationKey: id + 'Help',
            explanationParams: {},
        });
    }
    if (method === 'beginner') {
        const [layer, corners] = paths.beginnerDistances();
        append('skewbLayer', layer, firstLayerSolved);
        append('skewbCorners', corners, cornersStageSolved);
    }
    append(method === 'shortest' ? 'skewbOptimal' : 'skewbCenters', paths.exact, (p) =>
        p.isIdentical(solved),
    );
    progress?.({ key: 'solveSearching', value: 1 });
    return {
        status: 'solved',
        alg: stages
            .map((part) => part.alg)
            .filter(Boolean)
            .join(' '),
        metric: '120°',
        moves: stages.reduce((total, stage) => total + stage.moves, 0),
        quality: method === 'shortest' ? 'provenOptimal' : 'heuristic',
        stages,
    };
}
