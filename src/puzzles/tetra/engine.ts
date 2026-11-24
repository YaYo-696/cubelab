import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { minimumDistances } from '../events';
import type { SearchResult, Stage } from '../../core/contracts';
import type { SolveMethod, SolveProgress } from '../../core/solver/options';
import { axes, inverse, moves, normalizeTetra, tetraModel, turns, type TetraId } from './model';

const edgeOrders: number[][] = [];
function permutations(prefix: number[], remaining: number[]) {
    if (!remaining.length) edgeOrders.push(prefix);
    remaining.forEach((edge) =>
        permutations(
            [...prefix, edge],
            remaining.filter((item) => item !== edge),
        ),
    );
}
permutations([], [0, 1, 2, 3, 4, 5]);
const edgeIndex = new Map(edgeOrders.map((order, id) => [order.join(''), id]));
const base = 32 * 81;
const encode = (values: readonly number[], radix: number) =>
    values.reduceRight((code, value) => code * radix + value, 0);
const decode = (code: number, radix: number, size: number) =>
    Array.from({ length: size }, () => {
        const value = code % radix;
        code = Math.floor(code / radix);
        return value;
    });
const layerKey = ({ patternData: { EDGES, CORNERS } }: KPattern) =>
    edgeIndex.get(EDGES.pieces.join(''))! * base +
    encode(EDGES.orientation.slice(0, 5), 2) * 81 +
    encode(CORNERS.orientation, 3);

// The sixth edge flip is determined by parity. A layer turn changes its axial
// corner and its tip by the same amount, leaving the relative tip offset intact.
function layerTable(model: KPuzzle) {
    const transformations = moves.map(
        (move) => model.moveToTransformation(move).transformationData,
    );
    const permutations = edgeOrders.map((order) =>
        transformations.map(
            ({ EDGES }) => edgeIndex.get(EDGES.permutation.map((i) => order[i]).join(''))! * base,
        ),
    );
    const flips = Array.from({ length: 32 }, (_, code) => {
        const previous = decode(code, 2, 5);
        previous.push(previous.reduce((sum, val) => sum ^ val, 0));
        return transformations.map(
            ({ EDGES }) =>
                encode(
                    EDGES.permutation
                        .slice(0, 5)
                        .map((old, i) => previous[old] ^ EDGES.orientationDelta[i]),
                    2,
                ) * 81,
        );
    });
    const axial = Array.from({ length: 81 }, (_, code) => {
        const previous = decode(code, 3, 4);
        return transformations.map(({ CORNERS }) =>
            encode(
                CORNERS.permutation.map(
                    (old, i) => (previous[old] + CORNERS.orientationDelta[i]) % 3,
                ),
                3,
            ),
        );
    });
    const next = (key: number, move: number) =>
        permutations[Math.floor(key / base)][move] +
        flips[Math.floor(key / 81) % 32][move] +
        axial[key % 81][move];
    const distance = new Uint8Array(edgeOrders.length * base).fill(255);
    const queue = new Uint32Array(distance.length);
    distance[0] = 0;
    let size = 1;
    for (let read = 0; read < size; read++) {
        const key = queue[read];
        for (let move = 0; move < moves.length; move++) {
            const child = next(key, move);
            if (distance[child] !== 255) continue;
            distance[child] = distance[key] + 1;
            queue[size++] = child;
        }
    }
    if (size !== 933120) throw new Error('Unexpected Pyraminx layer state count: ' + size);
    return { distance, next };
}

let pyrTable: ReturnType<typeof layerTable> | undefined;
function pyrDistance(pattern: KPattern) {
    const table = (pyrTable ??= layerTable(pattern.kpuzzle));
    const { CORNERS, CORNERS2 } = pattern.patternData;
    const tips = CORNERS2.orientation.filter(
        (value, index) => value !== CORNERS.orientation[index],
    ).length;
    return table.distance[layerKey(pattern)] + tips;
}

function pyrStages(pattern: KPattern): Stage[] {
    const { distance, next } = (pyrTable ??= layerTable(pattern.kpuzzle));
    let key = layerKey(pattern);
    const layer: string[] = [];
    while (key !== 0) {
        const index = moves.findIndex((_, i) => distance[next(key, i)] + 1 === distance[key]);
        if (index < 0) throw new Error('Unreachable Pyraminx position');
        layer.push(moves[index]);
        key = next(key, index);
    }
    const aligned = pattern.applyAlg(layer.join(' '));
    if (layerKey(aligned) !== 0) throw new Error('Pyraminx layers failed verification');
    const tips = turns.flatMap((axis, i) => {
        const orientation = aligned.patternData.CORNERS2.orientation[axes[i]];
        return orientation ? [axis.toLowerCase() + (orientation === 1 ? "'" : '')] : [];
    });
    return [stage('pyramLayers', layer), stage('pyramTips', tips)];
}

const duoKey = (pattern: KPattern) => JSON.stringify(pattern.patternData);
function duoTable(model: KPuzzle) {
    const patterns = [model.defaultPattern()];
    const solutions = new Map([[duoKey(patterns[0]), '']]);
    for (const pattern of patterns)
        for (const move of moves) {
            const next = pattern.applyMove(move);
            const key = duoKey(next);
            if (solutions.has(key)) continue;
            solutions.set(
                key,
                [inverse(move), solutions.get(duoKey(pattern))].filter(Boolean).join(' '),
            );
            patterns.push(next);
        }
    if (patterns.length !== 324) throw new Error('Unexpected Duo state count: ' + patterns.length);
    return { patterns, solutions };
}
let duo: ReturnType<typeof duoTable> | undefined;

function stage(id: string, moves: string[]): Stage {
    return {
        id,
        nameKey: id,
        alg: moves.join(' '),
        moves: moves.length,
        explanationKey: id + 'Help',
        explanationParams: {},
        ...(id.startsWith('duo') && id !== 'duoOptimal' ? { lessonId: 'duo-two-steps' } : {}),
    };
}

function duoStages(pattern: KPattern, method: SolveMethod): Stage[] {
    if (method === 'shortest') {
        const table = (duo ??= duoTable(pattern.kpuzzle));
        const solution = table.solutions.get(duoKey(pattern));
        if (solution === undefined) throw new Error('Unreachable Duo position');
        return [stage('duoOptimal', solution.split(' ').filter(Boolean))];
    }
    const corners = turns.flatMap((axis, i) => {
        const orientation = pattern.patternData.CORNERS.orientation[axes[i]];
        return orientation ? [axis + (orientation === 1 ? "'" : '')] : [];
    });
    const aligned = pattern.applyAlg(corners.join(' '));
    if (aligned.patternData.CORNERS.orientation.some(Boolean))
        throw new Error('Duo corners failed verification');
    if (aligned.isIdentical(pattern.kpuzzle.defaultPattern()))
        return [stage('duoCorners', corners), stage('duoCenters', [])];
    for (const a of turns)
        for (const b of turns) {
            if (a === b) continue;
            const centers = [a, b + "'", a + "'", b];
            if (aligned.applyAlg(centers.join(' ')).isIdentical(pattern.kpuzzle.defaultPattern()))
                return [stage('duoCorners', corners), stage('duoCenters', centers)];
        }
    throw new Error('Duo centers failed verification');
}

export async function solveTetra(
    id: TetraId,
    input: string,
    method: SolveMethod,
    progress?: (value: SolveProgress) => void,
    signal?: AbortSignal,
): Promise<SearchResult> {
    if (signal?.aborted) return { status: 'cancelled' };
    let alg: string;
    try {
        alg = input.trim() ? normalizeTetra(input, id === 'pyram') : '';
    } catch {
        return { status: 'invalidInput' };
    }
    progress?.({ key: 'solveSearching', value: 0.15 });
    const model = await tetraModel(id);
    if (signal?.aborted) return { status: 'cancelled' };
    const pattern = model.defaultPattern().applyAlg(alg);
    const stages = id === 'pyram' ? pyrStages(pattern) : duoStages(pattern, method);
    const result = stages
        .map((part) => part.alg)
        .filter(Boolean)
        .join(' ');
    if (!pattern.applyAlg(result).isIdentical(model.defaultPattern()))
        throw new Error('Tetrahedral solution failed verification');
    progress?.({ key: 'solveSearching', value: 1 });
    return {
        status: 'solved',
        alg: result,
        metric: 'htm',
        quality: method === 'shortest' ? 'provenOptimal' : 'heuristic',
        moves: stages.reduce((sum, item) => sum + item.moves, 0),
        stages,
    };
}

export async function tetraDistance(id: TetraId, input: string) {
    const model = await tetraModel(id);
    const pattern = model.defaultPattern().applyAlg(input);
    if (id === 'pyram') return pyrDistance(pattern);
    const solution = (duo ??= duoTable(model)).solutions.get(duoKey(pattern))!;
    return solution ? solution.split(' ').length : 0;
}

export async function filterPyraminx(candidate: () => Promise<string>, signal: AbortSignal) {
    const model = await tetraModel('pyram');
    for (;;) {
        signal.throwIfAborted();
        const alg = await candidate();
        signal.throwIfAborted();
        // WCA 4b3f. TNoodle uses SCRAMBLE_LENGTH_INCLUDES_TIPS for solveIn.
        if (pyrDistance(model.defaultPattern().applyAlg(alg)) >= minimumDistances.pyram)
            return normalizeTetra(alg, true);
    }
}
export async function scrambleTetra(id: TetraId, signal: AbortSignal) {
    if (id === 'pyram') {
        const { randomScrambleForEvent } = await import('cubing/scramble');
        return filterPyraminx(
            async () => (await randomScrambleForEvent('pyram')).toString(),
            signal,
        );
    }
    const model = await tetraModel(id);
    const { patterns, solutions } = (duo ??= duoTable(model));
    // Rejection of the solved state gives a uniform draw over the other 323 positions.
    let index = 0;
    const draw = new Uint32Array(1);
    const limit = 2 ** 32 - (2 ** 32 % patterns.length);
    while (index === 0) {
        signal.throwIfAborted();
        crypto.getRandomValues(draw);
        if (draw[0] < limit) index = draw[0] % patterns.length;
    }
    return inverse(solutions.get(duoKey(patterns[index]))!);
}
