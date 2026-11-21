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
// View the same verified case from the right side, then restore the original frame.
function sideGrip(alg: string) {
    const mapped: Record<string, string> = {
        R: 'F',
        L: 'B',
        F: 'L',
        B: 'R',
        U: 'U',
        D: 'D',
        r: 'f',
        f: 'l',
        M: "S'",
    };
    const regripped = alg
        .split(' ')
        .map((token) => {
            const move = mapped[token[0]],
                suffix = token.slice(1);
            if (!move) throw new Error('academyGrip ' + token);
            return move.endsWith("'") && suffix ? move[0] + (suffix === '2' ? '2' : '') : move + suffix;
        })
        .join(' ');
    return 'y ' + regripped + " y'";
}
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
    // The additional U is an explicitly labelled final alignment option.
    return {
        id,
        nameKey: 'aCase_' + (size === 2 && ['tperm', 'yperm'].includes(id) ? id + '222' : id),
        standardName: name,
        referenceSetup: new Alg(alg).invert().toString(),
        algorithms: [alg, sideGrip(alg), alg + ' U'],
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
    ({ id, nameKey: id, revision: 1, cases }) satisfies AlgSet;
function drill(
    id: string,
    setup: string,
    goal: StageGoal,
    main: string,
    alternate: string,
): AcademyCase {
    return {
        id,
        nameKey: 'aTitle_' + id,
        standardName: id,
        referenceSetup: setup,
        pattern: { kind: 'setup', setup },
        goal,
        algorithms: [main, sideGrip(main), alternate],
        fingertrickKey: main.includes('U') ? 'fingerUpper' : 'fingerHalf',
    };
}
const early3 = [
    drill('cross', 'F2', 'cross', 'F2', 'F2 U'),
    drill('crossPlan', 'F2 R2', 'cross', 'R2 F2', 'R2 F2 U'),
    drill('corners', "R U R'", 'first', "R U' R'", "R U' R' U"),
    drill('middle', "F' U' F U R U R' U'", 'f2l', "U R U' R' U' F' U F", "U R U' R' U' F' U F U"),
    drill('f2l', "R U2 R'", 'f2l', "R U2 R'", "R U2 R' U"),
    drill('f2lJoin', "R U R' U2", 'f2l', "U2 R U' R'", "U2 R U' R' U"),
    drill('f2lSplit', "R U' R'", 'f2l', "R U R'", "R U R' U"),
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
        drill('firstFace', 'F2', 'face', 'F2', 'F2 U'),
        drill('firstLayer', "R U R'", 'first', "R U' R'", "R U' R' U"),
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
