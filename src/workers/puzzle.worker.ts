import { isTetra } from '../puzzles/events';
import { generate } from './generate';
import { serveJob, type ScrambleJob } from './jobProtocol';

serveJob('scramble', async ({ puzzle, input }: ScrambleJob, signal) => {
    if (puzzle === 'skewb') return (await import('../puzzles/skewb/engine')).scrambleSkewb(signal);
    if (isTetra(puzzle)) return (await import('../puzzles/tetra/engine')).scrambleTetra(puzzle, signal);
    return generate(puzzle, input, signal);
});
