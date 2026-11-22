import { generate } from './generate';
import { serveJob, type ScrambleJob } from './jobProtocol';

serveJob('scramble', ({ puzzle, input }: ScrambleJob, signal) => generate(puzzle, input, signal));
