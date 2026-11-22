import { serveJob, type CaseJob } from './jobProtocol';

serveJob('case', async ({ puzzle, input, setId }: CaseJob, signal) => {
    const { generateCase } = await import('./case');
    return generateCase(puzzle, input, signal, setId);
});
