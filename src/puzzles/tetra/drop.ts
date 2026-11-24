import { parseAcademyDrop } from '../content/drop';
import { inverse, normalizeTetra, pyrModel } from './model';

export function parsePyramDrop(algsets: unknown, lessons: unknown, fixture = false) {
    return parseAcademyDrop(
        {
            id: 'pyram',
            model: pyrModel,
            solved: (model) => model.defaultPattern(),
            setId: (id) => id === 'l3e' || id === 'l4e',
            normalize: (alg) => normalizeTetra(alg, true),
            verify(solved, target, alg, fail) {
                if (!target.applyAlg(alg).isIdentical(solved))
                    fail('(a) algorithm does not solve the declared setup');
                if (!solved.applyAlg(inverse(alg)).isIdentical(target))
                    fail('(b) inverse does not match the declared setup');
            },
        },
        algsets,
        lessons,
        fixture,
    );
}
