import type { KPattern } from 'cubing/kpuzzle';
import { NotationError } from '../notation';

type Move = { offset: number } & (
    | { kind: 'slash' }
    | { kind: 'turn'; top: number; bottom: number }
);
// The two adjacent wedges of a corner have the same owner. Same order as
// TNoodle SquareOnePuzzle's solved pieces, and cubing.js's three basic moves.
const owners = [0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 11, 12, 13, 13, 14, 15, 15];
const wedges = owners.map((piece) => String.fromCharCode(65 + piece));
export const square1Solved = wedges.join('') + '0';
const positive = (value: number) => (value + 12) % 12;

function parse(input: string, skipZero = false, state?: string) {
    const moves: Move[] = [];
    let cursor = 0;
    function push(move: Move) {
        if (state !== undefined) state = apply(state, [move]);
        moves.push(move);
    }
    const space = () => {
        while (cursor < input.length && /\s/.test(input[cursor])) cursor++;
    };
    function expect(character: string) {
        space();
        if (input[cursor] !== character) throw new NotationError(cursor);
        cursor++;
    }
    function number() {
        space();
        const start = cursor;
        const negative = input[cursor] === '-';
        if (negative) cursor++;
        const digit = input[cursor] ?? '';
        if (!(negative ? /^[0-5]$/ : /^[0-6]$/).test(digit)) throw new NotationError(cursor);
        cursor++;
        return { start, value: Number(digit) * (negative ? -1 : 1) };
    }
    space();
    while (cursor < input.length) {
        const offset = cursor;
        if (input[cursor] === '/') {
            cursor++;
            push({ kind: 'slash', offset });
        } else {
            expect('(');
            const top = number();
            expect(',');
            const bottom = number();
            expect(')');
            if (top.value || bottom.value)
                push({ kind: 'turn', offset, top: top.value, bottom: bottom.value });
            else if (!skipZero) throw new NotationError(top.start);
        }
        space();
    }
    return moves;
}

const notation = (moves: Move[]) =>
    moves
        .map((move) => (move.kind === 'slash' ? '/' : '(' + move.top + ', ' + move.bottom + ')'))
        .join(' ');
const turns = (layer: string, shift: number) =>
    layer.slice(12 - shift) + layer.slice(0, 12 - shift);
const splitLayer = (layer: string) => layer[0] !== layer[11] && layer[5] !== layer[6];
export const canSlash = (state: string) =>
    splitLayer(state.slice(0, 12)) && splitLayer(state.slice(12, 24));
const slash = (state: string) =>
    state.slice(0, 6) +
    state.slice(12, 18) +
    state.slice(6, 12) +
    state.slice(18, 24) +
    (state[24] === '0' ? '1' : '0');

function apply(state: string, moves: Move[]) {
    for (const move of moves) {
        if (move.kind === 'slash') {
            if (!canSlash(state)) throw new NotationError(move.offset);
            state = slash(state);
        } else {
            state =
                turns(state.slice(0, 12), positive(move.top)) +
                turns(state.slice(12, 24), positive(move.bottom)) +
                state[24];
        }
    }
    return state;
}

export function normalizeSquare1(
    input: string,
    options: { generated?: boolean; syntaxOnly?: boolean } = {},
) {
    const moves = parse(input, options.generated, options.syntaxOnly ? undefined : square1Solved);
    if (!moves.length && !options.generated) throw new NotationError(0);
    return notation(moves);
}

export function square1State(input: string) {
    return apply(square1Solved, parse(input));
}
export function square1PatternState(pattern: KPattern) {
    const { WEDGES, EQUATOR } = pattern.patternData;
    return (
        WEDGES.pieces.map((piece) => wedges[piece]).join('') +
        String(EQUATOR.orientation[1] ? 1 : 0)
    );
}
export function applySquare1(pattern: KPattern, input: string) {
    const expected = apply(square1PatternState(pattern), parse(input));
    const result = pattern.applyAlg(input);
    if (square1PatternState(result) !== expected)
        throw new Error('Square-1 KPuzzle disagrees with slice model');
    return result;
}
export function inverseSquare1(input: string) {
    const inverse = (value: number) => (value === 6 ? 6 : -value);
    return notation(
        parse(input)
            .reverse()
            .map((move) =>
                move.kind === 'slash'
                    ? move
                    : { ...move, top: inverse(move.top), bottom: inverse(move.bottom) },
            ),
    );
}

const shifts = Array.from({ length: 12 }, (_, shift) => shift);
function* neighbors(state: string) {
    yield slash(state);
    const top = shifts.map((shift) => turns(state.slice(0, 12), shift)).filter(splitLayer);
    const bottom = shifts.map((shift) => turns(state.slice(12, 24), shift)).filter(splitLayer);
    for (const up of top) for (const down of bottom) yield up + down + state[24];
}
function searchSquare1(start: string, depth: number, intersects: (state: string) => boolean) {
    if (intersects(start)) return true;
    const queue = [start];
    const seen = new Set(queue);
    let next = 0;
    for (let level = 0; level < depth; level++) {
        const end = queue.length;
        while (next < end) {
            for (const candidate of neighbors(queue[next++])) {
                if (seen.has(candidate)) continue;
                if (intersects(candidate)) return true;
                seen.add(candidate);
                if (level + 1 < depth) queue.push(candidate);
            }
        }
    }
    return false;
}

let nearSolved: Set<string> | undefined;
export function square1TooClose(state: string) {
    if (!canSlash(state)) return true;
    if (!nearSolved) {
        const solvedBall = new Set<string>();
        searchSquare1(square1Solved, 5, (value) => {
            solvedBall.add(value);
            return false;
        });
        nearSolved = solvedBall;
    }
    // WCA 12c4: a tuple and a slash each cost one. A shortest path consists
    // of alternating tuples and slashes; adjacent tuples can always be merged.
    // Thus between slashable endpoints we can omit every non-slashable state.
    return searchSquare1(state, 5, (value) => nearSolved!.has(value));
}
