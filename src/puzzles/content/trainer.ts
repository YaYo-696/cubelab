import type { TrainingSet } from '../../core/trainer/catalog';
import type { CubeId } from '../events';
import groups from './full/groups';

const full = (
    id: 'fullOLL' | 'fullPLL' | 'fullCLL',
    skill: TrainingSet['skill'],
    targetMs: number,
): TrainingSet => ({
    id,
    nameKey: 'trainerSet_' + id,
    skill,
    targetMs,
    groups: groups[id].map((group) => ({ id: group.id, lessonId: group.id, ids: group.ids })),
});
export const trainingSets: Record<CubeId, readonly TrainingSet[]> = {
    '333': [
        {
            id: 'oll333',
            nameKey: 'trainerSet_oll333',
            skill: 'oll',
            targetMs: 6000,
            groups: [
                { id: 'yellowCross', lessonId: 'oll3', nameKey: 'aTitle_yellowCross', ids: ['dot', 'el', 'line'] },
                {
                    id: 'orient',
                    lessonId: 'oll3',
                    nameKey: 'aTitle_orient',
                    ids: ['sune', 'antisune', 'pi', 'h', 't', 'l', 'u'],
                },
            ],
        },
        {
            id: 'pll333',
            nameKey: 'trainerSet_pll333',
            skill: 'pll',
            targetMs: 6000,
            groups: [
                { id: 'permCorners', lessonId: 'pll3', nameKey: 'aTitle_permCorners', ids: ['tperm', 'yperm'] },
                { id: 'permEdges', lessonId: 'pll3', nameKey: 'aTitle_permEdges', ids: ['ua', 'ub', 'hperm', 'zperm'] },
            ],
        },
        full('fullOLL', 'oll', 4500),
        full('fullPLL', 'pll', 4500),
    ],
    '222': [
        {
            id: 'oll222',
            nameKey: 'trainerSet_oll222',
            skill: 'ortega',
            targetMs: 4000,
            groups: [{ id: 'oll2', lessonId: 'oll2' }],
        },
        {
            id: 'pbl222',
            nameKey: 'trainerSet_pbl222',
            skill: 'ortega',
            targetMs: 4500,
            groups: [{ id: 'pbl2', lessonId: 'pbl2' }],
            lowerFace: true,
        },
        full('fullCLL', 'cll', 4000),
    ],
};
