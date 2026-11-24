import { parsePyramDrop } from './drop';

const files = import.meta.glob('../../../content-drop/pyram/{algsets,lessons}.json', {
    import: 'default',
});
const catalog = '../../../content-drop/pyram/algsets.json';
const lessons = '../../../content-drop/pyram/lessons.json';

async function load() {
    if (files[catalog] && files[lessons])
        return parsePyramDrop(await files[catalog](), await files[lessons]());
    if (Object.keys(files).length)
        throw new Error('content-drop/pyram: both algsets.json and lessons.json are required');
    const [sets, course] = await Promise.all([
        import('../../../tests/fixtures/pyram/algsets.json'),
        import('../../../tests/fixtures/pyram/lessons.json'),
    ]);
    return parsePyramDrop(sets.default, course.default, true);
}
let pending: ReturnType<typeof load> | undefined;
export const loadPyramContent = () => (pending ??= load());
