import { Alg } from 'cubing/alg';
import { KPattern } from 'cubing/kpuzzle';
import type { AlgCase } from '../contracts';

export type CasePattern =
    | { kind: 'setup'; setup: string }
    | { kind: 'edges' | 'corners'; orientation: string }
    | { kind: 'cornerPerm' | 'edgePerm'; permutation: string }
    | { kind: 'pbl'; upper: string; lower: string };
export type StageGoal =
    | 'exact'
    | 'cross'
    | 'face'
    | 'first'
    | 'f2l'
    | 'edgeOrientation'
    | 'orientation'
    | 'cornerPermutation'
    | 'solved';
export type AcademyCase = AlgCase & {
    alternativeSetups?: readonly string[];
    standardName: string;
    fingertrickKey: string;
    pattern: CasePattern;
    goal: StageGoal;
};

const turns = ['', 'U', 'U2', "U'"];
function rotate(s: string, i: number) {
    return s.slice(i) + s.slice(0, i);
}
function cyclic(s: string) {
    return [0, 1, 2, 3].map((i) => rotate(s, i));
}
function permClass(s: string) {
    return cyclic(s)
        .flatMap((v) =>
            [0, 1, 2, 3].map((i) => Array.from(v, (c) => String((Number(c) + i) % 4)).join('')),
        )
        .sort()[0];
}
function same(a: KPattern, b: KPattern) {
    return Object.entries(a.patternData).every(([id, orbit]) => {
        const other = b.patternData[id];
        return orbit.pieces.every(
            (v, i) =>
                v === other.pieces[i] &&
                (id === 'CENTERS' || orbit.orientation[i] === other.orientation[i]),
        );
    });
}
function solvedAt(pattern: KPattern, orbit: string, indices: number[]) {
    const data = pattern.patternData[orbit];
    return !data || indices.every((i) => data.pieces[i] === i && data.orientation[i] === 0);
}
const bottom = [4, 5, 6, 7],
    nonTopEdges = [4, 5, 6, 7, 8, 9, 10, 11],
    top = [0, 1, 2, 3];
function cornersInLayer(p: KPattern, offset: number) {
    return p.patternData.CORNERS.pieces
        .slice(offset, offset + 4)
        .every((n) => n >= offset && n < offset + 4);
}
const patternString = (p: KPattern, orbit: string, kind: 'pieces' | 'orientation', offset = 0) =>
    p.patternData[orbit][kind]
        .slice(offset, offset + 4)
        .map((n) => (kind === 'pieces' ? n - offset : n))
        .join('');
function fixedFrame(p: KPattern) {
    return solvedAt(p, 'CENTERS', [0, 1, 2, 3, 4, 5]);
}
export function matchesStage(p: KPattern, solved: KPattern, goal: StageGoal) {
    if (goal === 'exact') return same(p, solved);
    if (!fixedFrame(p)) return false;
    const co = p.patternData.CORNERS.orientation,
        eo = p.patternData.EDGES?.orientation;
    const cross = solvedAt(p, 'EDGES', bottom);
    const first = cross && solvedAt(p, 'CORNERS', bottom);
    const twoLayers = first && solvedAt(p, 'EDGES', nonTopEdges);
    if (goal === 'cross') return cross;
    if (goal === 'face') return cornersInLayer(p, 4) && bottom.every((i) => co[i] === 0);
    if (goal === 'first') return first;
    if (goal === 'f2l') return twoLayers;
    if (goal === 'solved') return turns.some((auf) => same(p.applyAlg(auf), solved));
    const protectedLayers = eo ? twoLayers : matchesStage(p, solved, 'face');
    if (!protectedLayers || eo?.some(Boolean)) return false;
    if (goal === 'edgeOrientation') return true;
    if (co.some(Boolean)) return false;
    if (goal === 'orientation') return true;
    return permClass(patternString(p, 'CORNERS', 'pieces')) === permClass('0123');
}
export function matchesCase(p: KPattern, solved: KPattern, pattern: CasePattern) {
    if (pattern.kind === 'setup') {
        const expected = solved.applyAlg(pattern.setup);
        return turns.some(
            (auf) =>
                same(p.applyAlg(auf), expected) || same(solved.applyAlg(auf).applyAlg(pattern.setup), p),
        );
    }
    if (!fixedFrame(p)) return false;
    const c = p.patternData.CORNERS,
        e = p.patternData.EDGES;
    const layerReady = e ? matchesStage(p, solved, 'f2l') : matchesStage(p, solved, 'face');
    if (!layerReady) return false;
    if (pattern.kind === 'edges')
        return cyclic(pattern.orientation).includes(patternString(p, 'EDGES', 'orientation'));
    if (e?.orientation.some(Boolean)) return false;
    if (pattern.kind === 'corners')
        return cyclic(pattern.orientation).includes(patternString(p, 'CORNERS', 'orientation'));
    if (c.orientation.some(Boolean)) return false;
    const upper = permClass(patternString(p, 'CORNERS', 'pieces'));
    if (pattern.kind === 'pbl')
        return (
            upper === permClass(pattern.upper) &&
            permClass(patternString(p, 'CORNERS', 'pieces', 4)) === permClass(pattern.lower)
        );
    if (pattern.kind === 'cornerPerm') return upper === permClass(pattern.permutation);
    if (pattern.kind === 'edgePerm') {
        // Align corners first. The edge permutation is conjugate under a change of U frame.
        const aligned = turns.map((u) => p.applyAlg(u)).find((x) => solvedAt(x, 'CORNERS', top));
        if (!aligned) return false;
        const edges = patternString(aligned, 'EDGES', 'pieces');
        // KPuzzle EDGES order is UF, UR, UB, UL. Conjugate around this four-cycle.
        return [0, 1, 2, 3].some(
            (i) =>
                Array.from(rotate(pattern.permutation, i), (v) => String((Number(v) + 4 - i) % 4)).join(
                    '',
                ) === edges,
        );
    }
    return false;
}
export function verifyCase(solved: KPattern, entry: AcademyCase, algorithm: string) {
    const fromSetup = solved.applyAlg(caseSetup(entry, entry.algorithms.indexOf(algorithm)));
    const independent = independentCase(solved, entry.pattern);
    const fromInverse = solved.applyAlg(new Alg(algorithm).invert());
    const solves = (start: KPattern) =>
        entry.pattern.kind === 'setup'
            ? matchesStage(start.applyAlg(algorithm), solved, entry.goal)
            : turns.some((auf) =>
                  matchesStage(start.applyAlg(auf).applyAlg(algorithm), solved, entry.goal),
              );
    return (
        matchesCase(independent, solved, entry.pattern) &&
        solves(independent) &&
        matchesCase(fromSetup, solved, entry.pattern) &&
        matchesCase(fromInverse, solved, entry.pattern) &&
        solves(fromSetup)
    );
}

function digits(value: string) {
    return Array.from(value, Number);
}
function independentCase(solved: KPattern, pattern: CasePattern): KPattern {
    if (pattern.kind === 'setup') return solved.applyAlg(pattern.setup);
    const data = structuredClone(solved.patternData),
        corners = data.CORNERS,
        edges = data.EDGES;
    if (pattern.kind === 'corners') corners.orientation.splice(0, 4, ...digits(pattern.orientation));
    if (pattern.kind === 'edges') edges.orientation.splice(0, 4, ...digits(pattern.orientation));
    if (pattern.kind === 'cornerPerm') {
        corners.pieces.splice(0, 4, ...digits(pattern.permutation));
        // The corner transposition needs odd edge parity on a physical 3×3.
        edges.pieces.splice(0, 2, 1, 0);
    }
    if (pattern.kind === 'edgePerm') edges.pieces.splice(0, 4, ...digits(pattern.permutation));
    if (pattern.kind === 'pbl') {
        corners.pieces.splice(0, 4, ...digits(pattern.upper));
        corners.pieces.splice(4, 4, ...digits(pattern.lower).map((i) => i + 4));
    }
    return new KPattern(solved.kpuzzle, data);
}

export function caseSetup(entry: AlgCase, variant: number) {
    return (entry as Partial<AcademyCase>).alternativeSetups?.[variant - 1] ?? entry.referenceSetup;
}
