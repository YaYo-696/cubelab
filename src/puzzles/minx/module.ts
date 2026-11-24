import { KPattern } from 'cubing/kpuzzle';
import type { CaseGenerator, PuzzleModule } from '../../core/contracts';
import { requestCase, requestScramble } from '../../workers/client';
import { minxEvent } from '../events';
import { minxModel, minxSolvedGrips, normalizeMinxScramble, visibleMinx } from './model';

export async function makeMinx(): Promise<PuzzleModule<string>> {
    const model = await minxModel();
    const solved = visibleMinx(model.defaultPattern());
    const grips = minxSolvedGrips(solved);
    const parse = (state: string) => new KPattern(model, JSON.parse(state));
    const load = () => import('./content').then((m) => m.loadMinxContent());
    return {
        id: 'minx',
        nameKey: 'minx',
        category: 'wca',
        events: [minxEvent()],
        notation: { normalize: normalizeMinxScramble },
        visualization: { twistyPuzzleId: 'megaminx', defaultView: '2D' },
        generateScramble: (event, signal) => requestScramble('minx', event, signal),
        solvedState: () => JSON.stringify(solved.patternData),
        applyAlg: (state, alg) => JSON.stringify(parse(state).applyAlg(alg).patternData),
        isSolved: (state) => {
            const pattern = parse(state);
            return grips.some((grip) => grip.isIdentical(pattern));
        },
        courses: ['academy-minx'],
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
                        requestCase('minx', id, caseId, signal);
                    return [id, generate];
                }),
            );
            return { ...content, algSets, caseGenerators };
        },
    };
}
