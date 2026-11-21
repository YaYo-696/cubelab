import type { AlgSet, Course } from '../core/contracts';
import type { CubeId } from './events';
export async function loadAlgSet(id: string, puzzle: CubeId = '333'): Promise<AlgSet> {
    if (id === 'basic') return (await import('./content/set')).default;
    const { sets2, sets3 } = await import('./content/academySets');
    const found = (puzzle === '222' ? sets2 : sets3).find((set) => set.id === id);
    if (!found) throw new RangeError(id);
    return found;
}
export async function loadCourse(id: string, puzzle: CubeId = '333'): Promise<Course> {
    if (id !== 'notation' && id !== 'academy-' + puzzle) throw new RangeError(id);
    const { makeCourse } = await import('./content/course');
    return makeCourse(puzzle);
}
