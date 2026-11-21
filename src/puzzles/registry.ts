import { cubeEvent } from './events';
export const registry = {
    '222': () => import('./222/module').then(m => m.default),
    '333': () => import('./333/module').then(m => m.default)
};
export const events = [
    { puzzleId: '222', rules: cubeEvent('222') },
    { puzzleId: '333', rules: cubeEvent('333') },
    { puzzleId: '333', rules: cubeEvent('333', true) }
] as const;
