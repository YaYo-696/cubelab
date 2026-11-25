import { readColors } from '../core/fromColors/readColors';
import { clockPlayerAlg } from '../puzzles/sideEvents/clock';
import { square1State } from '../puzzles/sideEvents/square1';
import type { ColorJob } from './fromColorsClient';

export async function readColorJob(job: ColorJob) {
    switch (job.kind) {
        case 'readColors':
            return readColors(job.puzzle, job.painted);
        case 'readClock': {
            const { readClock } = await import('../core/fromColors/readClock');
            return readClock(job.dials);
        }
        case 'clockScramble': {
            const { clockDialsOf, readClock } = await import('../core/fromColors/readClock');
            return readClock(await clockDialsOf(clockPlayerAlg(job.scramble)));
        }
        case 'readSquare1': {
            const { readSquare1 } = await import('../core/fromColors/readSquare1');
            return readSquare1(job.pieces);
        }
        case 'square1Scramble': {
            const { square1Solution } = await import('../core/fromColors/readSquare1');
            const state = square1State(job.scramble);
            return { ok: true, solution: square1Solution(state), scramble: job.scramble, state } as const;
        }
        case 'readColors444': {
            const { readColors444 } = await import('../core/fromColors/readColors444');
            return readColors444(job.painted);
        }
    }
}
