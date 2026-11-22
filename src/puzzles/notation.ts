export class NotationError extends Error {
    constructor(readonly offset: number) {
        super('notation');
    }
}
// Inverting a half-turn can produce a redundant prime in cubing.js.
export function standardHalfTurns(alg: string) {
    return alg.replace(/2'(?=[\s)\]]|$)/g, '2');
}

// Tokens use the same face turns and whole-cube rotations as cubeModel.
export function normalizeCube(input: string) {
    const result: string[] = [];
    for (const token of input.matchAll(/\S+/g)) {
        const move = token[0].replace(/[’′]/g, "'");
        const validPrefix = /^[RLUDFBxyz](?:2'?|')?/.exec(move)?.[0] ?? '';
        if (validPrefix !== move) throw new NotationError(token.index! + validPrefix.length);
        result.push(standardHalfTurns(move));
    }
    if (!result.length) throw new NotationError(0);
    return result.join(' ');
}
