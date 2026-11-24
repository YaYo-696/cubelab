import { cube3x3x3 } from 'cubing/puzzles';
import { NotationError, standardHalfTurns } from '../../puzzles/notation';

export const fmcTimeLimit = 60 * 60 * 1000;
export const fmcMaximumExecutionMoves = 80;

export function parseFmc(input: string) {
    const moves: string[] = [];
    for (const match of input.matchAll(/\S+/g)) {
        const significant = Array.from(match[0].matchAll(/[a-zA-Z0-9'’′]/g));
        const word = significant
            .map((symbol) => symbol[0])
            .join('')
            .replace(/[’′]/g, "'");
        if (!word) continue;
        // WCA E2c4/E2c6: normalize capitalization, so r means R, never Rw.
        const token = word.replace(/[a-z]/gi, (letter) => {
            const lower = letter.toLowerCase();
            return 'xyzw'.includes(lower) ? lower : letter.toUpperCase();
        });
        if (!/^(?:(?:2?[RLUDFB]w|[RLUDFBxyz])(?:2'?|')?)$/.test(token)) {
            const prefix =
                /^(?:(?:2?[RLUDFB]w|[RLUDFBxyz])(?:2'?|')?)/.exec(token)?.[0].length ?? 0;
            throw new NotationError(match.index + (significant[prefix]?.index ?? 0));
        }
        moves.push(standardHalfTurns(token));
    }
    if (!moves.length) throw new NotationError(0);
    return {
        alg: moves.join(' '),
        execution: moves.length,
        moves: moves.filter((token) => !/^[xyz]/.test(token)).length,
    };
}
export async function evaluateFmc(scramble: string, input: string, elapsedMs: number) {
    if (elapsedMs >= fmcTimeLimit) return { reason: 'fmcTimeout', moves: 0 } as const;
    let solution: ReturnType<typeof parseFmc>;
    try {
        solution = parseFmc(input);
    } catch (error) {
        return {
            reason: 'fmcNotation',
            moves: 0,
            position: error instanceof NotationError ? error.offset + 1 : 1,
        } as const;
    }
    if (solution.execution > fmcMaximumExecutionMoves)
        return { reason: 'fmcTooLong', moves: solution.moves } as const;
    const model = await cube3x3x3.kpuzzle();
    const solved = model.defaultPattern();
    const result = solved.applyAlg(scramble).applyAlg(solution.alg);
    if (
        !result.experimentalIsSolved({
            ignorePuzzleOrientation: true,
            ignoreCenterOrientation: true,
        })
    )
        return { reason: 'fmcUnsolved', moves: solution.moves } as const;
    return { reason: null, moves: solution.moves, alg: solution.alg } as const;
}
