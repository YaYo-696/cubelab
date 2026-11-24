import { Alg } from 'cubing/alg';
import { parseAcademyDrop } from '../content/drop';
import {
    hasMinxRotation,
    minxModel,
    minxSolvedGrips,
    normalizeMinxContent,
    visibleMinx,
} from './model';

export function parseMinxDrop(algsets: unknown, lessons: unknown, fixture = false) {
    return parseAcademyDrop(
        {
            id: 'minx',
            model: minxModel,
            solved: (model) => visibleMinx(model.defaultPattern()),
            setId: (id) => /^minx-[a-z0-9-]+$/.test(id),
            normalize: normalizeMinxContent,
            allowGenerated: true,
            verify(solved, target, alg, fail) {
                const final = target.applyAlg(alg);
                const frames = hasMinxRotation(alg) ? minxSolvedGrips(solved) : [solved];
                const grip = frames.find((candidate) => final.isIdentical(candidate));
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

const files = import.meta.glob('../../../content-drop/minx/{algsets,lessons}.json', {
    import: 'default',
});
const setsFile = '../../../content-drop/minx/algsets.json';
const lessonsFile = '../../../content-drop/minx/lessons.json';

async function load() {
    if (files[setsFile] && files[lessonsFile])
        return parseMinxDrop(await files[setsFile](), await files[lessonsFile]());
    if (Object.keys(files).length)
        throw new Error('content-drop/minx: both algsets.json and lessons.json are required');
    const [sets, lessons] = await Promise.all([
        import('../../../tests/fixtures/minx/algsets.json'),
        import('../../../tests/fixtures/minx/lessons.json'),
    ]);
    return parseMinxDrop(sets.default, lessons.default, true);
}
let pending: ReturnType<typeof load> | undefined;
export const loadMinxContent = () => (pending ??= load());
