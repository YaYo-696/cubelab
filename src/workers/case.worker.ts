import { isTetra } from '../puzzles/events';
import { serveJob, type CaseJob } from './jobProtocol';

serveJob('case', async ({ puzzle, input, setId }: CaseJob, signal) => {
    if (isTetra(puzzle)) return (await import('../puzzles/tetra/case')).tetraCase(puzzle, setId, input, signal);
    const { generateCase } = await import('./case');
    return generateCase(puzzle, input, signal, setId);
});
