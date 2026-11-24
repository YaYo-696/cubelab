import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { NotationError } from '../notation';

export const skewbModel = () => puzzles.skewb.kpuzzle();
export const skewbMoves = ['R', "R'", 'U', "U'", 'L', "L'", 'B', "B'"] as const;

export function normalizeSkewb(input: string, allowRotations = false) {
    const tokens = Array.from(input.matchAll(/\S+/g), (token) => {
        const move = token[0].replace(/[’′]/g, "'");
        const prefix =
            (allowRotations ? /^(?:[RULB]'?|[xyz]['2]?)/ : /^[RULB]'?/).exec(move)?.[0] ?? '';
        if (prefix !== move) throw new NotationError(token.index + prefix.length);
        return move;
    });
    if (!tokens.length) throw new NotationError(0);
    return tokens.join(' ');
}

// The standard Skewb has one solid color on each center, with no visible twist.
export function visibleSkewb(pattern: KPattern) {
    const { CORNERS, CENTERS } = pattern.patternData;
    return new KPattern(pattern.kpuzzle, {
        CORNERS,
        CENTERS: {
            pieces: CENTERS.pieces,
            orientation: [0, 0, 0, 0, 0, 0],
            orientationMod: [1, 1, 1, 1, 1, 1],
        },
    });
}

export function skewbSolvedGrips(solved: KPattern) {
    const grips = [solved];
    for (const pattern of grips)
        for (const axis of ['x', 'y']) {
            const next = pattern.applyMove(axis);
            if (!grips.some((candidate) => candidate.isIdentical(next))) grips.push(next);
        }
    return grips;
}
