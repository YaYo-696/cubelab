export class NotationError extends Error {
    constructor(readonly offset: number) {
        super('notation');
    }
}
// Tokens use the same face turns and whole-cube rotations as cubeModel.
export function normalizeCube(input: string) {
    const result: string[] = [];
    for (const token of input.matchAll(/\S+/g)) {
        const move = token[0].replace(/[’′]/g, "'");
        const validPrefix = /^[RLUDFBxyz](?:2'?|')?/.exec(move)?.[0] ?? '';
        if (validPrefix !== move) throw new NotationError(token.index! + validPrefix.length);
        result.push(move.replace(/2'$/, '2'));
    }
    if (!result.length) throw new NotationError(0);
    return result.join(' ');
}
