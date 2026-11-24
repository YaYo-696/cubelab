import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { NotationError } from '../notation';

export const minxModel = () => puzzles.megaminx.kpuzzle();
export const minxFaces = [
    'U',
    'F',
    'R',
    'L',
    'BR',
    'BL',
    'D',
    'B',
    'FL',
    'FR',
    'DR',
    'DL',
] as const;
export const minxRotations = [
    'y',
    'Uv',
    'Fv',
    'Rv',
    'Lv',
    'BRv',
    'BLv',
    'Dv',
    'Bv',
    'FLv',
    'FRv',
    'DRv',
    'DLv',
    'U_F_Rv',
    'U_L_Fv',
    'FL_F_Lv',
    'U_BL_Lv',
    'DL_L_BLv',
    'U_BR_BLv',
    'B_BL_BRv',
    'U_R_BRv',
    'FR_R_Fv',
    'DR_BR_Rv',
    'U_Fv',
    'U_Lv',
    'F_Lv',
    'U_BLv',
    'BL_Lv',
    'U_BRv',
    'F_Rv',
    'BR_BLv',
    'U_Rv',
    'FR_Fv',
    'FL_Lv',
    'BR_Rv',
    'FR_Rv',
    'F_FLv',
    'DL_Lv',
] as const;
const amounts = ['', "'", '1', "1'", '2', "2'"];
const contentTokens = [...minxFaces, ...minxRotations].flatMap((axis) =>
    amounts.map((suffix) => axis + suffix),
);
const pochmannTokens = ['R++', 'R--', 'D++', 'D--', 'U', "U'"];

function normalize(input: string, legal: readonly string[], preserveLines: boolean) {
    const lines: string[][] = [[]];
    let end = 0;
    for (const match of input.matchAll(/\S+/g)) {
        const token = match[0].replace(/[’′]/g, "'");
        if (!legal.includes(token)) {
            let prefix = 0;
            while (
                prefix < token.length &&
                legal.some((move) => move.startsWith(token.slice(0, prefix + 1)))
            )
                prefix++;
            throw new NotationError(match.index + prefix);
        }
        if (preserveLines && lines.at(-1)!.length && /[\r\n]/.test(input.slice(end, match.index)))
            lines.push([]);
        lines.at(-1)!.push(token);
        end = match.index + token.length;
    }
    if (!end) throw new NotationError(0);
    return lines.map((line) => line.join(' ')).join('\n');
}

export const normalizeMinxScramble = (input: string) => normalize(input, pochmannTokens, true);
export const normalizeMinxContent = (input: string) => normalize(input, contentTokens, false);
export const hasMinxRotation = (alg: string) => alg.split(' ').some((move) => /[vy]/.test(move));

export function visibleMinx(pattern: KPattern) {
    const { CENTERS, ...other } = pattern.patternData;
    return new KPattern(pattern.kpuzzle, {
        ...other,
        CENTERS: {
            pieces: CENTERS.pieces,
            orientation: Array(12).fill(0),
            orientationMod: Array(12).fill(1),
        },
    });
}

export function minxSolvedGrips(solved: KPattern) {
    const grips = [solved];
    for (const pattern of grips)
        for (const axis of ['Uv', 'Fv']) {
            const next = pattern.applyMove(axis);
            if (!grips.some((other) => next.isIdentical(other))) grips.push(next);
        }
    return grips;
}
