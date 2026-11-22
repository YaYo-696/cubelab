import type { KPattern } from 'cubing/kpuzzle';
import type { CubeId } from '../../puzzles/events';
import { frames, sequence } from './coordinates';
import { optimal222 } from './optimal222';

export const centersHome = (pattern: KPattern) =>
    pattern.patternData.CENTERS?.pieces.every((piece, i) => piece === i) ?? true;

export async function shortestPattern(
    cube: CubeId,
    state: KPattern,
    progress: (value: number) => void = () => {},
) {
    if (cube === '222') return optimal222(state, (fraction) => progress(Math.floor(fraction * 100)));
    const alignment = frames.find((frame) => centersHome(state.applyAlg(frame)))!;
    const { experimentalSolve3x3x3IgnoringCenters } = await import('cubing/search');
    return sequence(
        alignment,
        (await experimentalSolve3x3x3IgnoringCenters(state.applyAlg(alignment))).toString(),
    );
}
