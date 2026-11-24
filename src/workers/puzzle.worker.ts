import { isBigCube, isSideEvent, isTetra } from '../puzzles/events';
import { generate } from './generate';
import { serveJob, type ScrambleJob } from './jobProtocol';

serveJob('scramble', async ({ puzzle, input }: ScrambleJob, signal) => {
    if (isSideEvent(puzzle)) return (await import('../puzzles/sideEvents/scramble')).scrambleSideEvent(puzzle, signal);
    if (isBigCube(puzzle)) return (await import('../puzzles/bigCube/scramble')).scrambleBigCube(puzzle, signal, input);
    if (puzzle === 'minx') return (await import('../puzzles/minx/scramble')).scrambleMinx(signal);
    if (puzzle === 'skewb') return (await import('../puzzles/skewb/engine')).scrambleSkewb(signal);
    if (isTetra(puzzle)) return (await import('../puzzles/tetra/engine')).scrambleTetra(puzzle, signal);
    return generate(puzzle, input, signal);
});
