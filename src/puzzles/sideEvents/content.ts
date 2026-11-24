import type { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import type { SideEventId } from '../events';
import { parseAcademyDrop } from '../content/drop';
import { clockPlayerAlg, normalizeClock, clockDialKey } from './clock';
import { applySquare1, inverseSquare1, normalizeSquare1, square1PatternState } from './square1';

export function parseSideDrop(
    id: SideEventId,
    algsets: unknown,
    lessons: unknown,
    fixture = false,
) {
    const square = id === 'sq1';
    const apply = (pattern: KPattern, alg: string) =>
        square ? applySquare1(pattern, alg) : pattern.applyAlg(clockPlayerAlg(alg));
    const key = square ? square1PatternState : clockDialKey;
    return parseAcademyDrop(
        {
            id,
            model: () => (square ? puzzles.square1 : puzzles.clock).kpuzzle(),
            solved: (model) => model.defaultPattern(),
            setId: (set) => new RegExp('^' + id + '-[a-z0-9-]+$').test(set),
            normalize: (alg, variant) =>
                square ? normalizeSquare1(alg, { syntaxOnly: variant }) : normalizeClock(alg),
            allowGenerated: true,
            applySetup: apply,
            verify(solved, target, alg, fail) {
                let final: KPattern;
                try {
                    final = apply(target, alg);
                } catch {
                    return fail('(a) illegal move in declared setup');
                }
                if (key(final) !== key(solved))
                    return fail('(a) algorithm does not solve the declared setup');
                // Invert the Clock transformation so the self-inverse y2 stays valid in KPuzzle.
                const previous = square
                    ? apply(final, inverseSquare1(alg))
                    : final.applyTransformation(
                          target.kpuzzle.algToTransformation(clockPlayerAlg(alg)).invert(),
                      );
                if (key(previous) !== key(target))
                    fail('(b) inverse does not match the declared setup');
            },
        },
        algsets,
        lessons,
        fixture,
    );
}

const files = new Map(
    Object.entries(
        import.meta.glob('../../../content-drop/{sq1,clock}/{algsets,lessons}.json', {
            import: 'default',
        }),
    ),
);
const fixtures = {
    sq1: () =>
        Promise.all([
            import('../../../tests/fixtures/sq1/algsets.json'),
            import('../../../tests/fixtures/sq1/lessons.json'),
        ]),
    clock: () =>
        Promise.all([
            import('../../../tests/fixtures/clock/algsets.json'),
            import('../../../tests/fixtures/clock/lessons.json'),
        ]),
};
async function load(id: SideEventId) {
    const base = '../../../content-drop/' + id + '/';
    const sets = files.get(base + 'algsets.json');
    const lessons = files.get(base + 'lessons.json');
    if (sets && lessons) return parseSideDrop(id, await sets(), await lessons());
    if (sets || lessons)
        throw new Error('content-drop/' + id + ': both algsets.json and lessons.json are required');
    const [fixtureSets, fixtureLessons] = await fixtures[id]();
    return parseSideDrop(id, fixtureSets.default, fixtureLessons.default, true);
}
const pending = new Map<SideEventId, ReturnType<typeof load>>();
export function loadSideContent(id: SideEventId) {
    const content = pending.get(id) ?? load(id);
    pending.set(id, content);
    return content;
}
