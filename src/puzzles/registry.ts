import { cubeEvent, tetraEvent, type PuzzleId } from './events';
export const registry = {
    '222': () => import('./222/module').then(m => m.default),
    '333': () => import('./333/module').then(m => m.default),
    pyram: () => import('./tetra/module').then(m => m.makeTetra('pyram')),
    pyramduo: () => import('./tetra/module').then(m => m.makeTetra('pyramduo')),
};
export const events = [
    { puzzleId: '222', rules: cubeEvent('222') },
    { puzzleId: '333', rules: cubeEvent('333') },
    { puzzleId: '333', rules: cubeEvent('333', true) },
    { puzzleId: 'pyram', rules: tetraEvent('pyram') },
    { puzzleId: 'pyramduo', rules: tetraEvent('pyramduo') },
] as const;
export function isPuzzleId(id: string): id is PuzzleId {
    return Object.hasOwn(registry, id);
}
