import { KPattern } from 'cubing/kpuzzle';
import type { CaseGenerator, PuzzleModule } from '../../core/contracts';
import { requestCase, requestScramble } from '../../workers/client';
import { bigCubeEvent, type BigCubeId } from '../events';
import { bigCubeModel, twistyIds } from './model';
import { normalizeBigCube } from './notation';

export async function makeBigCube(id: BigCubeId): Promise<PuzzleModule<string>> {
    const { model, solved, isSolved } = await bigCubeModel(id);
    const parse = (state: string) => new KPattern(model, JSON.parse(state));
    const load = () => import('./content').then((m) => m.load444Content());
    const hasCourse = id === '444';
    return {
        id,
        nameKey: id,
        category: 'wca',
        events: [bigCubeEvent(id)],
        notation: { normalize: (input) => normalizeBigCube(id, input) },
        visualization: { twistyPuzzleId: twistyIds[id], defaultView: '2D' },
        generateScramble: (event, signal) => requestScramble(id, event, signal),
        solvedState: () => JSON.stringify(solved.patternData),
        applyAlg: (state, alg) => JSON.stringify(parse(state).applyAlg(alg).patternData),
        isSolved: (state) => isSolved(parse(state)),
        courses: hasCourse ? ['academy-444'] : [],
        algSets: [],
        loadCourse: async (courseId) => {
            if (!hasCourse || courseId !== 'academy-444')
                throw new Error('Unknown course: ' + courseId);
            return (await load()).course;
        },
        loadAlgSet: async (setId) => {
            const set = hasCourse && (await load()).sets.get(setId);
            if (!set) throw new Error('Unknown set: ' + setId);
            return set;
        },
        caseGenerators: {},
        loadContentInfo: hasCourse
            ? async () => {
                  const content = await load();
                  const algSets = [...content.sets.keys()];
                  const caseGenerators = Object.fromEntries(
                      algSets.map((setId) => {
                          const generate: CaseGenerator = (caseId, signal) =>
                              requestCase(id, setId, caseId, signal);
                          return [setId, generate];
                      }),
                  );
                  return { ...content, algSets, caseGenerators };
              }
            : undefined,
    };
}
