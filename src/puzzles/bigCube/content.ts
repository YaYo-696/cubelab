import { Alg } from 'cubing/alg';
import { parseAcademyDrop } from '../content/drop';
import { bigCubeModel } from './model';
import { normalizeBigCube } from './notation';

export async function parse444Drop(algsets: unknown, lessons: unknown, fixture = false) {
    const { model, colorKey, grips } = await bigCubeModel('444');
    return parseAcademyDrop(
        {
            id: '444',
            model: async () => model,
            solved: (puzzle) => puzzle.defaultPattern(),
            setId: (id) => /^444-[a-z0-9-]+$/.test(id),
            normalize: (alg) => normalizeBigCube('444', alg, true),
            allowGenerated: true,
            verify(solved, target, alg, fail) {
                const final = colorKey(target.applyAlg(alg));
                const frames = /(?:^| )[xyz]/.test(alg) ? grips : [solved];
                const grip = frames.find((candidate) => colorKey(candidate) === final);
                if (!grip) return fail('(a) algorithm does not solve the declared setup');
                if (colorKey(grip.applyAlg(new Alg(alg).invert())) !== colorKey(target))
                    fail('(b) inverse does not match the declared setup');
            },
        },
        algsets,
        lessons,
        fixture,
    );
}

const files = import.meta.glob('../../../content-drop/444/{algsets,lessons}.json', {
    import: 'default',
});
const setsFile = '../../../content-drop/444/algsets.json';
const lessonsFile = '../../../content-drop/444/lessons.json';
async function load() {
    if (files[setsFile] && files[lessonsFile])
        return parse444Drop(await files[setsFile](), await files[lessonsFile]());
    if (Object.keys(files).length)
        throw new Error('content-drop/444: both algsets.json and lessons.json are required');
    const [sets, lessons] = await Promise.all([
        import('../../../tests/fixtures/444/algsets.json'),
        import('../../../tests/fixtures/444/lessons.json'),
    ]);
    return parse444Drop(sets.default, lessons.default, true);
}
let pending: ReturnType<typeof load> | undefined;
export const load444Content = () => (pending ??= load());
