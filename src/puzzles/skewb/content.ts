import { Alg } from 'cubing/alg';
import { parseAcademyDrop } from '../content/drop';
import { normalizeSkewb, skewbModel, skewbSolvedGrips, visibleSkewb } from './model';

export function parseSkewbDrop(algsets: unknown, lessons: unknown, fixture = false) {
    return parseAcademyDrop(
        {
            id: 'skewb',
            model: skewbModel,
            solved: (model) => visibleSkewb(model.defaultPattern()),
            setId: (id) => /^skewb-[a-z0-9-]+$/.test(id),
            normalize: normalizeSkewb,
            allowGenerated: true,
            verify(solved, target, alg, fail) {
                const final = target.applyAlg(alg);
                const expected = /(?:^| )[xyz]/.test(alg) ? skewbSolvedGrips(solved) : [solved];
                const grip = expected.find((pattern) => final.isIdentical(pattern));
                if (!grip) return fail('(a) algorithm does not solve the declared setup');
                if (!grip.applyAlg(new Alg(alg).invert()).isIdentical(target))
                    fail('(b) inverse does not match the declared setup');
            },
        },
        algsets,
        lessons,
        fixture,
    );
}

const files = import.meta.glob('../../../content-drop/skewb/{algsets,lessons}.json', {
    import: 'default',
});
const setsFile = '../../../content-drop/skewb/algsets.json';
const lessonsFile = '../../../content-drop/skewb/lessons.json';

async function load() {
    if (files[setsFile] && files[lessonsFile])
        return parseSkewbDrop(await files[setsFile](), await files[lessonsFile]());
    if (Object.keys(files).length)
        throw new Error('content-drop/skewb: both algsets.json and lessons.json are required');
    const [sets, lessons] = await Promise.all([
        import('../../../tests/fixtures/skewb/algsets.json'),
        import('../../../tests/fixtures/skewb/lessons.json'),
    ]);
    return parseSkewbDrop(sets.default, lessons.default, true);
}
let pending: ReturnType<typeof load> | undefined;
export const loadSkewbContent = () => (pending ??= load());
