import { cubeEvent, tetraEvent, skewbEvent, minxEvent, type PuzzleId } from './events';
export const registry = {
    '222': () => import('./222/module').then(m => m.default),
    '333': () => import('./333/module').then(m => m.default),
    pyram: () => import('./tetra/module').then(m => m.makeTetra('pyram')),
    pyramduo: () => import('./tetra/module').then(m => m.makeTetra('pyramduo')),
    skewb: () => import('./skewb/module').then(m => m.makeSkewb()),
    minx: () => import('./minx/module').then(m => m.makeMinx()),
};
export const events = [
    { puzzleId: '222', rules: cubeEvent('222') },
    { puzzleId: '333', rules: cubeEvent('333') },
    { puzzleId: '333', rules: cubeEvent('333', true) },
    { puzzleId: 'pyram', rules: tetraEvent('pyram') },
    { puzzleId: 'pyramduo', rules: tetraEvent('pyramduo') },
    { puzzleId: 'skewb', rules: skewbEvent() },
    { puzzleId: 'minx', rules: minxEvent() },
] as const;
export function isPuzzleId(id: string): id is PuzzleId {
    return Object.hasOwn(registry, id);
}
