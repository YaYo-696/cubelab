import { Alg } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import { loadAlgSet } from '../puzzles/content';
import { trainingSets } from '../puzzles/content/trainer';
import { atHome, lowerCorners, turns } from '../core/solver/coordinates';
import { matchesCase, matchesStage, type AcademyCase } from '../core/academy/cases';
import { standardHalfTurns } from '../puzzles/notation';
import type { VerifiedCase } from '../core/contracts';
import type { CubeId } from '../puzzles/events';

export async function generateCase(
    puzzle: CubeId,
    id: string,
    signal: AbortSignal,
    setId = 'basic',
    auf = turns[Math.floor(Math.random() * turns.length)],
): Promise<VerifiedCase> {
    signal.throwIfAborted();
    const configuration = trainingSets[puzzle].find((set) => set.id === setId);
    if (!configuration && setId !== 'basic') throw new RangeError(setId);
    const entry = (await loadAlgSet(setId, puzzle)).cases.find((row) => row.id === id);
    if (!entry) throw new RangeError(id);
    const solved = (await puzzles[puzzle === '222' ? '2x2x2' : '3x3x3'].kpuzzle()).defaultPattern();
    const target = solved.applyAlg(entry.referenceSetup).applyAlg(configuration ? auf : '');
    let scramble = entry.referenceSetup;
    if (configuration) {
        const { shortestPattern } = await import('../core/solver/shortest');
        signal.throwIfAborted();
        const solution = await shortestPattern(puzzle, target);
        scramble = standardHalfTurns(new Alg(solution).invert().expand().toString());
    }
    signal.throwIfAborted();
    const result = solved.applyAlg(scramble);
    if (!result.isIdentical(target)) throw new Error('caseVerification');
    if (configuration) {
        const { pattern } = entry as AcademyCase;
        const layerReady =
            puzzle === '333'
                ? matchesStage(result, solved, 'f2l')
                : configuration.lowerFace
                  ? matchesStage(result, solved, 'face')
                  : atHome(result, lowerCorners);
        if (!matchesCase(result, solved, pattern) || !layerReady) throw new Error('caseVerification');
    }
    return {
        scramble,
        verified: true,
        ...(configuration && auf
            ? { preAdjustment: standardHalfTurns(new Alg(auf).invert().toString()) }
            : {}),
    };
}
