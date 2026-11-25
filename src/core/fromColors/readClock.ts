// Resolver desde colores · Clock (Fase 15-C). Author: Claude.
// The user reads the 18 dials (9 per side) and gets a WCA-notation solution: 9 front moves, y2, 5 back moves.
// Dial values are hours 0–11 (12 o'clock = 0), row-major as seen from that side. The back is read after
// turning the clock around its vertical axis (y2): the top stays on top.
import { KPattern, type KPuzzle } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';

export type ClockDials = { front: number[]; back: number[] };
export type ClockIssueKey = 'clockValue' | 'clockCorner';
export type ClockIssue = { key: ClockIssueKey; dials: { side: 'front' | 'back'; index: number }[] };
export type ClockReading =
    | {
          ok: true;
          /** WCA notation, zero moves omitted. Start with the front facing you. */
          solution: string;
          /** Equivalent scramble from a solved clock (for the 3D player). */
          scramble: string;
      }
    | { ok: false; issues: ClockIssue[] };

const frontMoves = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];
const backMoves = ['U', 'R', 'D', 'L', 'ALL'];
/** Front corner dial → back dial index (0–8) that shares its gear. */
const backCorner: Record<number, number> = { 0: 2, 2: 0, 6: 8, 8: 6 };
const mod = (value: number) => ((value % 12) + 12) % 12;

type Solver = { kpuzzle: KPuzzle; columns: number[][] };
let solver: Promise<Solver> | undefined;
function setup() {
    return (solver ??= (async () => {
        const kpuzzle = await puzzles.clock.kpuzzle();
        const delta = (move: string) => kpuzzle.moveToTransformation(move).transformationData.DIALS;
        const flip = delta('y2').permutation;
        // A back move is done after y2: seen from the original frame, its effect moves through y2's permutation.
        const columns = [
            ...frontMoves.map((move) => [...delta(move + '1+').orientationDelta]),
            ...backMoves.map((move) => {
                const after = delta(move + '1+').orientationDelta;
                const before = new Array<number>(18).fill(0);
                flip.forEach((from, to) => (before[from] = after[to]));
                return before;
            }),
        ];
        return { kpuzzle, columns };
    })());
}

/** Solves columns · x ≡ −dials (mod 12) by elimination with unit pivots. */
function amounts(columns: number[][], dials: number[]) {
    const rows = dials.map((value, r) => [...columns.map((column) => column[r]), mod(-value)]);
    const n = columns.length;
    const pivots: number[] = [];
    let row = 0;
    for (let col = 0; col < n; col++) {
        const pick = rows.findIndex((r, i) => i >= row && [1, 5, 7, 11].includes(mod(r[col])));
        if (pick < 0) throw new Error('Clock: no unit pivot for column ' + col);
        [rows[row], rows[pick]] = [rows[pick], rows[row]];
        const inverse = [1, 5, 7, 11].find((u) => mod(u * rows[row][col]) === 1)!;
        rows[row] = rows[row].map((value) => mod(value * inverse));
        rows.forEach((r, i) => {
            if (i === row || !r[col]) return;
            const factor = r[col];
            rows[i] = r.map((value, j) => mod(value - factor * rows[row][j]));
        });
        pivots.push(row++);
    }
    // Remaining rows must be all zero: the dials are consistent.
    if (rows.slice(row).some((r) => r[n] !== 0)) return undefined;
    return pivots.map((r) => rows[r][n]);
}

const notation = (move: string, amount: number) =>
    move + (amount <= 6 ? amount + '+' : 12 - amount + '-');

export async function readClock(dials: ClockDials): Promise<ClockReading> {
    const issues: ClockIssue[] = [];
    const bad = (['front', 'back'] as const).flatMap((side) =>
        dials[side].length === 9
            ? dials[side].flatMap((value, index) =>
                  Number.isInteger(value) && value >= 0 && value <= 12 ? [] : [{ side, index }],
              )
            : [{ side, index: -1 }],
    );
    if (bad.length) return { ok: false, issues: [{ key: 'clockValue', dials: bad }] };
    const front = dials.front.map(mod);
    const back = dials.back.map(mod);
    for (const [corner, behind] of Object.entries(backCorner))
        if (mod(front[Number(corner)] + back[behind]) !== 0)
            issues.push({
                key: 'clockCorner',
                dials: [
                    { side: 'front', index: Number(corner) },
                    { side: 'back', index: behind },
                ],
            });
    if (issues.length) return { ok: false, issues };

    const { kpuzzle, columns } = await setup();
    const state = [...front, ...back];
    const x = amounts(columns, state);
    if (!x) throw new Error('Clock: consistent dials without a solution');
    const backPart = backMoves.map((move, i) => (x[9 + i] ? notation(move, x[9 + i]) : '')).filter(Boolean);
    const moves = [
        ...frontMoves.map((move, i) => (x[i] ? notation(move, x[i]) : '')).filter(Boolean),
        ...(backPart.length ? ['y2', ...backPart] : []),
    ];
    const solution = moves.join(' ');
    // A leading y2 keeps the frame (which side faces you) equal to the clock as it was read.
    const scramble = [...(backPart.length ? ['y2'] : []), ...[...moves].reverse()]
        .map((move) => {
            if (move === 'y2') return move;
            const [, pins, amount, sign] = /^([A-Z]+)(\d)([+-])$/.exec(move)!;
            return notation(pins, mod((sign === '+' ? -1 : 1) * Number(amount)));
        })
        .join(' ');
    const solved = kpuzzle.defaultPattern();
    const held = new KPattern(kpuzzle, {
        ...solved.patternData,
        DIALS: { pieces: solved.patternData.DIALS.pieces, orientation: state },
    });
    const dialsOf = (pattern: KPattern) => pattern.patternData.DIALS.orientation.join(',');
    if (dialsOf(held.applyAlg(solution)) !== dialsOf(solved) || !solved.applyAlg(scramble).isIdentical(held))
        throw new Error('Clock: solution failed verification');
    return { ok: true, solution, scramble };
}

/** Dials a scramble leaves on a solved clock, as the user would read them. */
export async function clockDialsOf(scramble: string): Promise<ClockDials> {
    const { kpuzzle } = await setup();
    const dials = kpuzzle.defaultPattern().applyAlg(scramble).patternData.DIALS.orientation;
    return { front: dials.slice(0, 9), back: dials.slice(9) };
}
