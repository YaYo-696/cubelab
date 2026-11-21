import { puzzles } from 'cubing/puzzles';
import type { KPattern } from 'cubing/kpuzzle';

// For ordinary stickered cubes, the axial rotation of a centre is invisible.
function key(pattern: KPattern) {
    return JSON.stringify(Object.entries(pattern.patternData).map(([orbit, data]) =>
        orbit === 'CENTERS' ? [orbit, data.pieces] : [orbit, data.pieces, data.orientation]));
}

export const faceTurns = [...'UDFBLR'].flatMap(face => ['', "'", '2'].map(power => face + power));

export async function makeOracle(puzzle: '222' | '333') {
    const kp = await puzzles[puzzle === '222' ? '2x2x2' : '3x3x3'].kpuzzle();
    const solved = kp.defaultPattern();
    const minimum = puzzle === '222' ? 4 : 2;
    const distances = new Map([[key(solved), 0]]);
    const roots = [{ pattern: solved, rotation: '' }];
    for (const { pattern, rotation } of roots) {
        for (const move of ['x', 'y']) {
            const next = pattern.applyAlg(move);
            const id = key(next);
            if (distances.has(id)) continue;
            distances.set(id, 0);
            roots.push({ pattern: next, rotation: (rotation + ' ' + move).trim() });
        }
    }
    if (roots.length !== 24) throw new Error('KPuzzle: se esperaban 24 orientaciones');
    let frontier = roots.map(root => root.pattern);
    for (let depth = 1; depth < minimum; depth++) {
        const nextLayer: KPattern[] = [];
        for (const pattern of frontier) {
            for (const move of faceTurns) {
                const next = pattern.applyAlg(move);
                const id = key(next);
                if (distances.has(id)) continue;
                distances.set(id, depth);
                nextLayer.push(next);
            }
        }
        frontier = nextLayer;
    }
    return {
        rotations: roots.map(root => root.rotation),
        below: (alg: string) => distances.has(key(solved.applyAlg(alg))),
        distanceAtBoundary(alg: string) {
            const pattern = solved.applyAlg(alg);
            const distance = distances.get(key(pattern));
            if (distance !== undefined) return distance;
            // A neighbour in the last layer certifies an exact distance of minimum.
            if (faceTurns.some(turn => distances.get(key(pattern.applyAlg(turn))) === minimum - 1)) return minimum;
            return Infinity;
        },
    };
}
