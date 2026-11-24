import { devFlags } from '../config/devFlags';
import { cubeEvent, tetraEvent, skewbEvent, minxEvent, bigCubeEvent, sideEvent, modality, type PuzzleId } from './events';
function registered<T>(category: 'wca' | 'unofficial', load: () => Promise<T>) {
    return Object.assign(load, { category });
}
export const registry = {
    '222': registered('wca', () => import('./222/module').then(m => m.default)),
    '333': registered('wca', () => import('./333/module').then(m => m.default)),
    pyram: registered('wca', () => import('./tetra/module').then(m => m.makeTetra('pyram'))),
    pyramduo: registered('unofficial', () => import('./tetra/module').then(m => m.makeTetra('pyramduo'))),
    skewb: registered('wca', () => import('./skewb/module').then(m => m.makeSkewb())),
    minx: registered('wca', () => import('./minx/module').then(m => m.makeMinx())),
    '444': registered('wca', () => import('./bigCube/module').then(m => m.makeBigCube('444'))),
    '555': registered('wca', () => import('./bigCube/module').then(m => m.makeBigCube('555'))),
    '666': registered('wca', () => import('./bigCube/module').then(m => m.makeBigCube('666'))),
    '777': registered('wca', () => import('./bigCube/module').then(m => m.makeBigCube('777'))),
    sq1: registered('wca', () => import('./sideEvents/module').then(m => m.makeSideEvent('sq1'))),
    clock: registered('wca', () => import('./sideEvents/module').then(m => m.makeSideEvent('clock'))),
};
export const events = [
    { puzzleId: '222', rules: cubeEvent('222') },
    { puzzleId: '333', rules: cubeEvent('333') },
    { puzzleId: '333', rules: cubeEvent('333', true) },
    { puzzleId: 'pyram', rules: tetraEvent('pyram') },
    { puzzleId: 'pyramduo', rules: tetraEvent('pyramduo') },
    { puzzleId: 'skewb', rules: skewbEvent() },
    { puzzleId: 'minx', rules: minxEvent() },
    { puzzleId: '444', rules: bigCubeEvent('444') },
    { puzzleId: '555', rules: bigCubeEvent('555') },
    { puzzleId: '666', rules: bigCubeEvent('666') },
    { puzzleId: '777', rules: bigCubeEvent('777') },
    { puzzleId: 'sq1', rules: sideEvent('sq1') },
    { puzzleId: 'clock', rules: sideEvent('clock') },
    { puzzleId: '333', rules: modality('333oh') },
    { puzzleId: '333', rules: modality('333fm') },
    { puzzleId: '444', rules: modality('444bf') },
    { puzzleId: '555', rules: modality('555bf') },
    { puzzleId: '333', rules: modality('333mbf') },
] as const;
export function puzzleFor(id: string): PuzzleId | undefined {
    return events.find(({ rules }) => rules.id === id)?.puzzleId ?? (isPuzzleId(id) ? id : undefined);
}
export function isPuzzleId(id: string): id is PuzzleId {
    return Object.hasOwn(registry, id);
}

export function visiblePuzzle(id: string): id is PuzzleId {
    return isPuzzleId(id) && (devFlags.SHOW_UNOFFICIAL || registry[id].category !== 'unofficial');
}

export function visibleEvents() {
    return events.filter(({ puzzleId }) => visiblePuzzle(puzzleId));
}

export function visibleEvent(id: string | null) {
    return visibleEvents().find(({ rules }) => rules.id === id) ?? events.find(({ rules }) => rules.id === '333')!;
}
