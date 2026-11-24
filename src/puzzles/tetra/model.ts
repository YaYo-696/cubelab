import { KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { NotationError } from '../notation';

import type { TetraId } from '../events';
export type { TetraId } from '../events';
export const turns = ['U', 'L', 'R', 'B'] as const;
export const axes = [0, 3, 2, 1] as const;
export const moves = turns.flatMap((turn) => [turn, turn + "'"]);

export function normalizeTetra(input: string, tips: boolean) {
    const tokens = Array.from(input.matchAll(/\S+/g), (token) => {
        const move = token[0].replace(/[’′]/g, "'");
        const prefix = (tips ? /^[ULRBulrb]'?/ : /^[ULRB]'?/).exec(move)?.[0] ?? '';
        if (prefix !== move) throw new NotationError(token.index + prefix.length);
        return move;
    });
    if (!tokens.length) throw new NotationError(0);
    return tokens.join(' ');
}

export function inverse(alg: string) {
    return alg
        .split(/\s+/)
        .filter(Boolean)
        .reverse()
        .map((move) => (move.endsWith("'") ? move.slice(0, -1) : move + "'"))
        .join(' ');
}

export const pyrModel = () => puzzles.pyraminx.kpuzzle();

async function createDuo() {
    const pyr = await pyrModel();
    const zero = [0, 0, 0, 0];
    const identity = [0, 1, 2, 3];
    const definition = Object.fromEntries(
        turns.flatMap((turn) => {
            const axial = pyr.moveToTransformation(turn).transformationData.CORNERS;
            const grip = pyr.moveToTransformation(turn + 'v').transformationData.CORNERS;
            const centers = { permutation: grip.permutation, orientationDelta: zero };
            return [
                [turn, { CORNERS: axial, CENTERS: centers }],
                [turn + 'v', { CORNERS: grip, CENTERS: centers }],
            ];
        }),
    );
    return new KPuzzle({
        name: 'Pyraminx Duo',
        orbits: [
            { orbitName: 'CORNERS', numPieces: 4, numOrientations: 3 },
            { orbitName: 'CENTERS', numPieces: 4, numOrientations: 1 },
        ],
        defaultPattern: {
            CORNERS: { pieces: identity, orientation: zero },
            CENTERS: { pieces: identity, orientation: zero },
        },
        moves: definition,
    });
}

let duo: Promise<KPuzzle> | undefined;
export function tetraModel(id: TetraId) {
    return id === 'pyram' ? pyrModel() : (duo ??= createDuo());
}

export function solvedGrips(model: KPuzzle) {
    const solved = [model.defaultPattern()];
    for (const pattern of solved)
        for (const axis of ['Uv', 'Lv']) {
            const next = pattern.applyMove(axis);
            if (!solved.some((other) => next.isIdentical(other))) solved.push(next);
        }
    return solved;
}
