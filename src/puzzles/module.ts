import { trainingSets } from './content/trainer';
import { requestSolution } from '../workers/solverClient';
import type { SolveMethod } from '../core/solver/options';
import type { PuzzleModule, Solver } from '../core/contracts';
import { cubeEvent, type CubeId } from './events';
import { normalizeCube } from './notation';
import { cubeModel } from './cube';
import { loadAlgSet, loadCourse } from './content';
import { requestCase, requestScramble } from '../workers/client';
export function makeCube(id: CubeId): PuzzleModule<string> {
    const model = cubeModel(id === '222' ? 2 : 3);
    const solve =
        (method: SolveMethod): Solver =>
        (input, signal, options) =>
            requestSolution(id, method, input, signal, options);
    return {
        id,
        nameKey: id,
        category: 'wca',
        events: id === '333' ? [cubeEvent(id), cubeEvent(id, true)] : [cubeEvent(id)],
        notation: { normalize: normalizeCube },
        visualization: { twistyPuzzleId: id === '222' ? '2x2x2' : '3x3x3', defaultView: '2D' },
        generateScramble: (event, signal) => requestScramble(id, event, signal),
        solvedState: () => model.solved,
        applyAlg: model.apply,
        isSolved: model.isSolved,
        solvers: {
            shortestKnown: solve('shortest'),
            practice:
                id === '222'
                    ? { cllPractice: solve('cllPractice'), egPractice: solve('egPractice') }
                    : undefined,
            byMethod:
                id === '222'
                    ? { beginner: solve('beginner'), ortega: solve('ortega') }
                    : {
                          beginner: solve('beginner'),
                          cfop4: solve('cfop4'),
                          cfopFull: solve('cfopFull'),
                      },
        },
        algSets: [
            'basic',
            'drills' + id,
            'oll' + id,
            id === '222' ? 'pbl222' : 'pll333',
            ...(id === '222' ? ['fullCLL', 'eg'] : ['fullOLL', 'fullPLL']),
        ],
        courses: ['academy-' + id],
        loadAlgSet: (set) => loadAlgSet(set, id),
        loadCourse: (course) => loadCourse(course, id),
        trainingSets: trainingSets[id],
        caseGenerators: Object.fromEntries(
            ['basic', ...trainingSets[id].map((set) => set.id)].map((setId) => [
                setId,
                (caseId: string, signal: AbortSignal) => requestCase(id, setId, caseId, signal),
            ]),
        ),
    };
}
