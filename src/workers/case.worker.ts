import { isBigCube, isTetra } from '../puzzles/events';
import { serveJob, type CaseJob } from './jobProtocol';

serveJob('case', async ({ puzzle, input, setId }: CaseJob, signal) => {
    if (puzzle === '444') return (await import('../puzzles/bigCube/case')).case444(setId, input, signal);
    if (isBigCube(puzzle)) throw new Error('No training catalog for ' + puzzle);
    if (puzzle === 'minx') return (await import('../puzzles/minx/case')).minxCase(setId, input, signal);
    if (puzzle === 'skewb') return (await import('../puzzles/skewb/case')).skewbCase(setId, input, signal);
    if (isTetra(puzzle)) return (await import('../puzzles/tetra/case')).tetraCase(puzzle, setId, input, signal);
    const { generateCase } = await import('./case');
    return generateCase(puzzle, input, signal, setId);
});
