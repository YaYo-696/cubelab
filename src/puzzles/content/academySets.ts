import { standardHalfTurns } from '../notation';
import { Alg } from 'cubing/alg';
import type { AlgSet } from '../../core/contracts';
import type { AcademyCase, CasePattern, StageGoal } from '../../core/academy/cases';
import sequences from './academySequences.json';

const corners: Record<string, string> = {
    sune: '0222',
    antisune: '0111',
    pi: '1122',
    h: '1212',
    t: '0021',
    l: '0102',
    u: '0012',
};
const edgeOrientation: Record<string, string> = { dot: '1111', el: '0011', line: '0101' };
const cornerPermutation: Record<string, string> = { tperm: '1023', yperm: '2103' };
const edgePermutation: Record<string, string> = { ua: '1320', ub: '3021', zperm: '1032', hperm: '2301' };
const both: Record<string, [string, string]> = {
    bars: ['0213', '0132'],
    diags: ['0321', '0321'],
    mixed: ['0213', '0321'],
    tperm: ['1023', '0123'],
    yperm: ['2103', '0123'],
};
const alternatives2: Record<string, string> = {
    sune: "R U R2 U' R2 U R",
    h: 'R2 U2 R U2 R2',
    pi: "F R U R' U' R U R' U' F'",
    u: "F R U R' U' F'",
    tperm: "R' F R F' R U2 R' U R U2 R'",
};
const alternatives3: Record<string, string> = {
    antisune: "R' U' R U' R' U2 R",
    zperm: "M' U' M2 U' M2 U' M' U2 M2",
};
const cornerIds = Object.keys(corners);
function reference(id: string, size: 2 | 3) {
    const [key, name, raw] = sequences.find((row) => row[0] === id)!;
    const twoCube: Record<string, string> = { t: "R U R' U' R' F R F'", l: "F R' F' R U R U' R'" };
    const standard =
        size === 2 && id === 'tperm'
            ? 'Adjacent / Solved'
            : size === 2 && id === 'yperm'
              ? 'Diagonal / Solved'
              : name;
    return { id: key, name: standard, alg: size === 2 ? (twoCube[id] ?? raw) : raw };
}
function lastLayer(id: string, size: 2 | 3, pattern: CasePattern, goal: StageGoal): AcademyCase {
    const { name, alg } = reference(id, size);
    const alternative = (size === 2 ? alternatives2 : alternatives3)[id];
    return {
        id,
        nameKey: 'aCase_' + (size === 2 && ['tperm', 'yperm'].includes(id) ? id + '222' : id),
        standardName: name,
        referenceSetup: standardHalfTurns(new Alg(alg).invert().expand().toString()),
        algorithms: alternative ? [alg, alternative] : [alg],
        alternativeSetups: alternative ? [standardHalfTurns(new Alg(alternative).invert().expand().toString())] : undefined,
        fingertrickKey:
            id === 'zperm' || id === 'hperm'
                ? 'fingerSlice'
                : id === 'diags'
                  ? 'fingerHalf'
                  : 'fingerUpper',
        goal,
        pattern,
    };
}
const set = (id: string, cases: AcademyCase[]) =>
    ({ id, nameKey: id, revision: 2, cases }) satisfies AlgSet;
function drill(id: string, setup: string, goal: StageGoal, main: string): AcademyCase {
    return {
        id,
        nameKey: 'aTitle_' + id,
        standardName: id,
        referenceSetup: setup,
        pattern: { kind: 'setup', setup },
        goal,
        algorithms: [main],
        fingertrickKey: main.includes('U') ? 'fingerUpper' : 'fingerHalf',
    };
}
const early3 = [
    drill('cross', 'F2', 'cross', 'F2'),
    drill('crossPlan', 'F2 R2', 'cross', 'R2 F2'),
    drill('corners', "R U R'", 'first', "R U' R'"),
    drill('middle', "F' U' F U R U R' U'", 'f2l', "U R U' R' U' F' U F"),
    drill('f2l', "R U2 R'", 'f2l', "R U2 R'"),
    drill('f2lJoin', "R U R' U2", 'f2l', "U2 R U' R'"),
    drill('f2lSplit', "R U' R'", 'f2l', "R U R'"),
    drill('cornersRepeat', "U R U' R' U R U' R' U R U' R'", 'first', "R U R' U' R U R' U' R U R' U'"),
    drill('middleLeft', "F U F' U' L' U' L U", 'f2l', "U' L' U L U F U' F'"),
    drill('ycLine', "F U R U' R' F'", 'edgeOrientation', "F R U R' U' F'"),
    drill('ycL', "f U R U' R' f'", 'edgeOrientation', "U2 F R U R' U' F' F R U R' U' F'"),
    drill('ycDot', "f U R U' R' f' F U R U' R' F'", 'edgeOrientation', "F R U R' U' F' U2 F R U R' U' F' F R U R' U' F'"),
    drill('orientSune', "R U2 R' U' R U' R'", 'orientation', "R U R' U R U2 R'"),
    drill('orientAnti', "R U R' U R U2 R'", 'orientation', "R U2 R' U' R U' R'"),
    drill('orientZero', "R' U2 R2 U R2 U R2 U2 R'", 'orientation', "R U R' U R U2 R' U' R U R' U R U2 R'"),
    drill('orientTwo', "F R' F' r U R U' r'", 'orientation', "R U R' U R U2 R' U R U R' U R U2 R' U2 R U R' U R U2 R'"),
    drill('cornersAdj', "R2 B2 R F R' B2 R F' R", 'cornerPermutation', "R' F R' B2 R F' R' B2 R2"),
    drill('cornersDiag', "F R' F' R U R U' R' F R U' R' U R U R' F'", 'cornerPermutation', "R' F R' B2 R F' R' B2 R2 U R' F R' B2 R F' R' B2 R2"),
    drill('edgesUa', "R2 U R U R' U' R' U' R' U R'", 'solved', "R U' R U R U R U' R' U' R2"),
    drill('edgesUb', "R U' R U R U R U' R' U' R2", 'solved', "R U' R U R U R U' R' U' R2 R U' R U R U R U' R' U' R2"),
    drill('edgesH', "M2 U' M2 U2 M2 U' M2", 'solved', "R U' R U R U R U' R' U' R2 y R U' R U R U R U' R' U' R2 y'"),
    drill('edgesZ', "U2 M U2 M2 U2 M U' M2 U' M2", 'solved', "R U' R U R U R U' R' U' R2 y' R U' R U R U R U' R' U' R2 y"),
];
export const sets3 = [
    set('drills333', early3),
    set('oll333', [
        ...Object.entries(edgeOrientation).map(([id, orientation]) =>
            lastLayer(id, 3, { kind: 'edges', orientation }, 'edgeOrientation'),
        ),
        ...cornerIds.map((id) =>
            lastLayer(id, 3, { kind: 'corners', orientation: corners[id] }, 'orientation'),
        ),
    ]),
    set('pll333', [
        ...Object.entries(cornerPermutation).map(([id, permutation]) =>
            lastLayer(id, 3, { kind: 'cornerPerm', permutation }, 'cornerPermutation'),
        ),
        ...Object.entries(edgePermutation).map(([id, permutation]) =>
            lastLayer(id, 3, { kind: 'edgePerm', permutation }, 'solved'),
        ),
    ]),
];
export const sets2 = [
    set('drills222', [
        drill('firstFace', 'F2', 'face', 'F2'),
        drill('firstLayer', "R U R'", 'first', "R U' R'"),
        drill('orient2Sune', "R U2 R' U' R U' R'", 'orientation', "R U R' U R U2 R'"),
        drill('orient2Anti', "R U R' U R U2 R'", 'orientation', "R U2 R' U' R U' R'"),
        drill('orient2Zero', "R' U2 R2 U R2 U R2 U2 R'", 'orientation', "R U R' U R U2 R' U' R U R' U R U2 R'"),
        drill('orient2Two', "F R' F' R U R U' R'", 'orientation', "R U R' U R U2 R' U R U R' U R U2 R' U2 R U R' U R U2 R'"),
        drill('firstLayerRepeat', "U R U' R' U R U' R' U R U' R'", 'first', "R U R' U' R U R' U' R U R' U'"),
    ]),
    set(
        'oll222',
        cornerIds.map((id) =>
            lastLayer(id, 2, { kind: 'corners', orientation: corners[id] }, 'orientation'),
        ),
    ),
    set(
        'pbl222',
        Object.entries(both).map(([id, [upper, lower]]) =>
            lastLayer(id, 2, { kind: 'pbl', upper, lower }, 'solved'),
        ),
    ),
];
