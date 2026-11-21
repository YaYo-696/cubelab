import type { PuzzleModule } from '../core/contracts';
import { cubeEvent, type CubeId } from './events';
import { normalizeCube } from './notation';
import { cubeModel } from './cube';
import { loadAlgSet, loadCourse } from './content';
import { run } from '../workers/client';
export function makeCube(id: CubeId): PuzzleModule<string> {
    const model = cubeModel(id === '222' ? 2 : 3);
    return { id, nameKey: id, category: 'wca', events: id === '333' ? [cubeEvent(id), cubeEvent(id, true)] : [cubeEvent(id)],
        notation: { normalize: normalizeCube },
        visualization: { twistyPuzzleId: id === '222' ? '2x2x2' : '3x3x3', defaultView: '2D' },
        generateScramble: (event, signal) => run('scramble', id, event, signal),
        solvedState: () => model.solved, applyAlg: model.apply, isSolved: model.isSolved,
        algSets: ['basic'], courses: ['notation'], loadAlgSet, loadCourse,
        caseGenerators: { basic: (caseId, signal) => run('case', id, caseId, signal) }
    };
}
