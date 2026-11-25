import { readColors } from '../core/fromColors/readColors';
import type { ColorJob } from './fromColorsClient';

export async function readColorJob(job: ColorJob) {
    switch (job.kind) {
        case 'readColors':
            return readColors(job.puzzle, job.painted);
        case 'readClock': {
            const { readClock } = await import('../core/fromColors/readClock');
            return readClock(job.dials);
        }
        case 'readColors444': {
            const { readColors444 } = await import('../core/fromColors/readColors444');
            return readColors444(job.painted);
        }
    }
}
