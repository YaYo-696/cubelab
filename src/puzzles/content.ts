import type { AlgSet, Course } from '../core/contracts';
export async function loadAlgSet(id: string): Promise<AlgSet> {
    if (id !== 'basic')
        throw new RangeError(id);
    return (await import('./content/set')).default;
}
export async function loadCourse(id: string): Promise<Course> {
    if (id !== 'notation')
        throw new RangeError(id);
    return (await import('./content/course')).default;
}
