import type { EventRules } from '../core/contracts';
export const minimumDistances = { '222': 4, '333': 2, pyram: 6, skewb: 7, minx: 2, sq1: 11 } as const;
export type CubeId = '222' | '333';
export type TetraId = 'pyram' | 'pyramduo';
export type PuzzleId = CubeId | TetraId | 'skewb' | 'minx';
export function isCubePuzzle(puzzle: string): puzzle is CubeId {
    return puzzle === '222' || puzzle === '333';
}
export function minxEvent(): EventRules {
    return { id: 'minx', wcaEventId: 'minx', nameKey: 'minx', officialFormats: ['ao5'],
        inspectionSeconds: 15, scoring: 'time', minSolveDistance: minimumDistances.minx, randomOrientation: false };
}
export function skewbEvent(): EventRules {
    return { id: 'skewb', wcaEventId: 'skewb', nameKey: 'skewb', officialFormats: ['ao5'],
        inspectionSeconds: 15, scoring: 'time', minSolveDistance: minimumDistances.skewb, randomOrientation: false };
}
export function isTetra(puzzle: string): puzzle is TetraId {
    return puzzle === 'pyram' || puzzle === 'pyramduo';
}
export function tetraEvent(puzzle: TetraId): EventRules {
    const official = puzzle === 'pyram';
    return { id: puzzle, wcaEventId: official ? puzzle : undefined, nameKey: puzzle,
        officialFormats: official ? ['ao5'] : [], inspectionSeconds: 15, scoring: 'time',
        minSolveDistance: official ? minimumDistances.pyram : 1, randomOrientation: false };
}
export function cubeEvent(puzzle: CubeId, blind = false): EventRules {
    const id = blind ? puzzle + 'bf' : puzzle;
    if (blind && puzzle !== '333')
        throw new RangeError(id);
    return { id, wcaEventId: id, nameKey: id, officialFormats: [blind ? 'bo5' : 'ao5'], inspectionSeconds: blind ? null : 15, scoring: 'time', minSolveDistance: minimumDistances[puzzle], randomOrientation: blind };
}
