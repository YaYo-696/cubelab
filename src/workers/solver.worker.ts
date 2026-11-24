import { isTetra } from '../puzzles/events';
import type { SolveProgress } from '../core/solver/options';
import type { SolverJob } from './solverClient';

self.addEventListener('message', async ({ data }: MessageEvent<SolverJob>) => {
    if (data?.kind !== 'solve') return;
    try {
        const { puzzle, input, method, neutral } = data;
        if (puzzle === 'minx') {
            self.postMessage({ result: { status: 'invalidInput' } });
            return;
        }
        const progress = (value: SolveProgress) => self.postMessage({ progress: value });
        const result = puzzle === 'skewb'
            ? await (await import('../puzzles/skewb/engine')).solveSkewb(input, method, progress)
            : isTetra(puzzle)
            ? await (await import('../puzzles/tetra/engine')).solveTetra(puzzle, input, method, progress)
            : await (await import('../core/solver/solve')).solvePuzzle(puzzle, input, method, neutral, progress);
        self.postMessage({ result });
    } catch (error) {
        console.error('CubeLab solver verification or search error', error);
        self.postMessage({ error: error instanceof Error ? error.message : String(error) });
    }
});
