import type { EventRules } from '../core/contracts';
export const minimumDistances = { '222': 4, '333': 2, pyram: 6, skewb: 7, sq1: 11 } as const;
export type CubeId = '222' | '333';
export function cubeEvent(puzzle: CubeId, blind = false): EventRules {
    const id = blind ? puzzle + 'bf' : puzzle;
    if (blind && puzzle !== '333')
        throw new RangeError(id);
    return { id, wcaEventId: id, nameKey: id, officialFormats: [blind ? 'bo5' : 'ao5'], inspectionSeconds: blind ? null : 15, scoring: 'time', minSolveDistance: minimumDistances[puzzle], randomOrientation: blind };
}
