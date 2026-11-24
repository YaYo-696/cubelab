import { KPattern } from 'cubing/kpuzzle';
import type { CaseGenerator, PuzzleModule, Solver } from '../../core/contracts';
import { requestCase, requestScramble } from '../../workers/client';
import { requestSolution } from '../../workers/solverClient';
import { skewbEvent } from '../events';
import { normalizeSkewb, skewbModel, skewbSolvedGrips, visibleSkewb } from './model';

export async function makeSkewb(): Promise<PuzzleModule<string>> {
    const model = await skewbModel();
    const solved = visibleSkewb(model.defaultPattern());
    const grips = skewbSolvedGrips(solved);
    const parse = (state: string) => new KPattern(model, JSON.parse(state));
    const solve =
        (method: 'shortest' | 'beginner'): Solver =>
        (input, signal, options) =>
            requestSolution('skewb', method, input, signal, options);
    const load = () => import('./content').then((m) => m.loadSkewbContent());
    return {
        id: 'skewb',
        nameKey: 'skewb',
        category: 'wca',
        events: [skewbEvent()],
        notation: { normalize: normalizeSkewb },
        visualization: { twistyPuzzleId: 'skewb', defaultView: '2D' },
        generateScramble: (event, signal) => requestScramble('skewb', event, signal),
        solvedState: () => JSON.stringify(solved.patternData),
        applyAlg: (state, alg) => JSON.stringify(parse(state).applyAlg(alg).patternData),
        isSolved: (state) => {
            const pattern = parse(state);
            return grips.some((grip) => grip.isIdentical(pattern));
        },
        solvers: { shortestKnown: solve('shortest'), byMethod: { beginner: solve('beginner') } },
        courses: ['academy-skewb'],
        algSets: [],
        loadCourse: async () => (await load()).course,
        loadAlgSet: async (id) => {
            const set = (await load()).sets.get(id);
            if (!set) throw new Error('Unknown set: ' + id);
            return set;
        },
        caseGenerators: {},
        loadContentInfo: async () => {
            const content = await load();
            const algSets = [...content.sets.keys()];
            const caseGenerators = Object.fromEntries(
                algSets.map((id) => {
                    const generate: CaseGenerator = (caseId, signal) =>
                        requestCase('skewb', id, caseId, signal);
                    return [id, generate];
                }),
            );
            return { ...content, algSets, caseGenerators };
        },
    };
}
