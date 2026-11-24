import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { NotationError } from '../notation';

export const pins = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'] as const;
const pinNames = new Set<string>(pins);
const amounts = [
    '0+',
    '1+',
    '2+',
    '3+',
    '4+',
    '5+',
    '6+',
    '0-',
    '1-',
    '2-',
    '3-',
    '4-',
    '5-',
    '6-',
];
const tokens = ['y2', ...pins, ...pins.flatMap((pin) => amounts.map((amount) => pin + amount))];

export function normalizeClock(input: string) {
    const moves = Array.from(input.matchAll(/\S+/g), (match) => {
        const move = match[0];
        if (!tokens.includes(move)) {
            let prefix = 0;
            while (
                prefix < move.length &&
                tokens.some((token) => token.startsWith(move.slice(0, prefix + 1)))
            )
                prefix++;
            throw new NotationError(match.index + prefix);
        }
        return /[06]-$/.test(move) ? move.slice(0, -1) + '+' : move;
    });
    if (!moves.length) throw new NotationError(0);
    return moves.join(' ');
}

export function clockPlayerAlg(input: string) {
    // cubing.js models the dials, not independent pin positions.
    return input.replace(/\S+/g, (move) => (pinNames.has(move) ? move + '0+' : move));
}
export function clockDialKey(pattern: KPattern) {
    return pattern.patternData.DIALS.orientation.join(',');
}
export function clockCutoff(model: KPuzzle) {
    const solved = model.defaultPattern();
    const close = new Set([clockDialKey(solved)]);
    // Wheel moves can be performed on either side. Pins and y2 cost zero.
    for (const pin of pins)
        for (const amount of amounts) {
            const state = solved.applyMove(pin + amount);
            close.add(clockDialKey(state));
            close.add(clockDialKey(state.applyMove('y2')));
        }
    return (alg: string) => close.has(clockDialKey(solved.applyAlg(clockPlayerAlg(alg))));
}
