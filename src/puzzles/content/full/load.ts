import { Alg } from 'cubing/alg';
import { inverseInInitialFrame } from '../../../core/academy/execution';
import type { AlgSet } from '../../../core/contracts';
import type { AcademyCase } from '../../../core/academy/cases';
import type { LastLayerPattern } from '../../../core/academy/lastLayer';
export type Row = {
    id: string;
    group: string;
    co: string;
    cp?: string;
    eo?: string;
    ep?: string;
    down?: string;
    algs: string[];
};
const sources = {
    fullOLL: () => import('./oll.json').then((m) => m.default),
    fullPLL: () => import('./pll.json').then((m) => m.default),
    fullCLL: () => import('./cll.json').then((m) => m.default),
    eg: () => import('./eg.json').then((m) => m.default),
};
export async function loadFullSet(kind: LastLayerPattern['kind']): Promise<AlgSet> {
    const rows: Row[] = await sources[kind]();
    const cases = rows.map(({ id, group, co, cp, eo, ep, down, algs }): AcademyCase => {
        const setups = algs.map((alg) => inverseInInitialFrame(new Alg(alg)).toString());
        return {
            id,
            nameKey: 'case.' + id,
            standardName: id,
            group,
            referenceSetup: setups[0] ?? '',
            alternativeSetups: setups.slice(1),
            algorithms: algs,
            goal: kind === 'fullOLL' ? 'orientation' : 'solved',
            pattern: { kind, co, cp, eo, ep, down },
            fingertrickKey:
                kind === 'fullPLL' && /\bM/.test(algs[0] ?? '') ? 'fingerSlice' : 'fingerUpper',
        };
    });
    return { id: kind, nameKey: kind, cases, revision: 2 };
}
