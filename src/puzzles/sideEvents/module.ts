import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import type { PuzzleModule, CaseGenerator } from '../../core/contracts';
import { requestCase, requestScramble } from '../../workers/client';
import { sideEvent, type SideEventId } from '../events';
import { clockDialKey, clockPlayerAlg, normalizeClock } from './clock';
import { applySquare1, normalizeSquare1, square1PatternState } from './square1';

export async function makeSideEvent(id: SideEventId): Promise<PuzzleModule<string>> {
    const square = id === 'sq1';
    const twistyPuzzleId = square ? 'square1' : 'clock';
    const model = await puzzles[twistyPuzzleId].kpuzzle();
    const solved = model.defaultPattern();
    const key = square ? square1PatternState : clockDialKey;
    const solvedKey = key(solved);
    const courseId = 'academy-' + id;
    const parse = (state: string) => new KPattern(model, JSON.parse(state));
    const load = () => import('./content').then((m) => m.loadSideContent(id));
    return {
        id,
        nameKey: id,
        category: 'wca',
        events: [sideEvent(id)],
        notation: { normalize: square ? normalizeSquare1 : normalizeClock },
        visualization: { twistyPuzzleId, defaultView: '2D' },
        generateScramble: (event, signal) => requestScramble(id, event, signal),
        solvedState: () => JSON.stringify(solved.patternData),
        applyAlg: (state, alg) => {
            const pattern = parse(state);
            const next = square
                ? applySquare1(pattern, alg)
                : pattern.applyAlg(clockPlayerAlg(alg));
            return JSON.stringify(next.patternData);
        },
        isSolved: (state) => key(parse(state)) === solvedKey,
        courses: [courseId],
        algSets: [],
        loadCourse: async (course) => {
            if (course !== courseId) throw new Error('Unknown course: ' + course);
            return (await load()).course;
        },
        loadAlgSet: async (setId) => {
            const set = (await load()).sets.get(setId);
            if (!set) throw new Error('Unknown set: ' + setId);
            return set;
        },
        caseGenerators: {},
        loadContentInfo: async () => {
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
        },
    };
}
