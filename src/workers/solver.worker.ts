import { solvePuzzle } from '../core/solver/solve';
import type { SolverJob } from './solverClient';

self.onmessage = async ({ data }: MessageEvent<SolverJob>) => {
    try {
        const { puzzle, input, method, neutral } = data;
        const result = await solvePuzzle(puzzle, input, method, neutral, (progress) =>
            self.postMessage({ progress }),
        );
        self.postMessage({ result });
    } catch (error) {
        console.error('CubeLab solver verification or search error', error);
        self.postMessage({ error: error instanceof Error ? error.message : String(error) });
    }
};
