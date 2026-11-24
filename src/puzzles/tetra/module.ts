import { KPattern } from 'cubing/kpuzzle';
import type { PuzzleModule, Solver } from '../../core/contracts';
import { requestCase, requestScramble } from '../../workers/client';
import { requestSolution } from '../../workers/solverClient';
import { tetraEvent } from '../events';
import { normalizeTetra, solvedGrips, tetraModel, type TetraId } from './model';

export async function makeTetra(id: TetraId): Promise<PuzzleModule<string>> {
    const official = id === 'pyram';
    const model = await tetraModel(id);
    const grips = solvedGrips(model);
    const solve =
        (method: 'shortest' | 'beginner'): Solver =>
        (input, signal, options) =>
            requestSolution(id, method, input, signal, options);
    const pyr = () => import('./content').then((m) => m.loadPyramContent());
    const duo = () => import('./duoContent');
    const parse = (state: string) => new KPattern(model, JSON.parse(state));
    const sets = official ? ['l3e', 'l4e'] : ['duoBasics'];
    return {
        id,
        nameKey: id,
        category: official ? 'wca' : 'unofficial',
        events: [tetraEvent(id)],
        notation: { normalize: (input) => normalizeTetra(input, official) },
        visualization: {
            twistyPuzzleId: official ? 'pyraminx' : 'pyraminx-duo',
            defaultView: '2D',
        },
        generateScramble: (event, signal) => requestScramble(id, event, signal),
        solvedState: () => JSON.stringify(model.defaultPattern().patternData),
        applyAlg: (state, alg) => JSON.stringify(parse(state).applyAlg(alg).patternData),
        isSolved: (state) => {
            const pattern = parse(state);
            return grips.some((grip) => grip.isIdentical(pattern));
        },
        solvers: {
            shortestKnown: solve('shortest'),
            byMethod: official ? undefined : { beginner: solve('beginner') },
        },
        courses: ['academy-' + id],
        algSets: sets,
        loadCourse: async () => (official ? (await pyr()).course : (await duo()).duoCourse),
        loadAlgSet: async (setId) => {
            if (!official && setId === 'duoBasics') return (await duo()).duoSet;
            const set = official ? (await pyr()).sets.get(setId) : undefined;
            if (!set) throw new Error('Unknown set: ' + setId);
            return set;
        },
        loadContentInfo: official ? async () => await pyr() : undefined,
        trainingSets: official
            ? undefined
            : [
                  {
                      id: 'duoBasics',
                      nameKey: 'duoLesson',
                      targetMs: 5000,
                      skill: 'steps',
                      groups: [
                          {
                              id: 'twoSteps',
                              lessonId: 'duo-two-steps',
                              nameKey: 'duoLesson',
                          },
                      ],
                  },
              ],
        caseGenerators: Object.fromEntries(
            sets.map((set) => [
                set,
                (caseId: string, signal: AbortSignal) => requestCase(id, set, caseId, signal),
            ]),
        ),
    };
}
