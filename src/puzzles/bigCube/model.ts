import type { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { type BigCubeId } from '../events';

export const twistyIds = {
    '444': '4x4x4',
    '555': '5x5x5',
    '666': '6x6x6',
    '777': '7x7x7',
} as const;

async function loadBigCube(id: BigCubeId) {
    const loader = puzzles[twistyIds[id]];
    const model = await loader.kpuzzle();
    const geometry = await loader.pg!();
    const { stickers } = geometry.get3d();
    const solved = model.defaultPattern();
    const orbits = Object.fromEntries(
        model.definition.orbits.map(({ orbitName, numPieces, numOrientations }) => [
            orbitName,
            { size: numOrientations, colors: new Uint8Array(numPieces * numOrientations) },
        ]),
    );
    for (const { face, orbit, ord, ori } of stickers) {
        const data = orbits[orbit];
        data.colors[ord * data.size + ori] = face;
    }
    function colorKey(pattern: KPattern) {
        let key = '';
        for (const { orbit, ord, ori } of stickers) {
            const { size, colors } = orbits[orbit];
            const { orientation, pieces } = pattern.patternData[orbit];
            // PuzzleGeometry places the source sticker at ori - piece orientation.
            const source = (ori + size - orientation[ord]) % size;
            key += String(colors[pieces[ord] * size + source]);
        }
        return key;
    }
    const grips = [solved];
    const keys = new Set([colorKey(solved)]);
    for (const grip of grips)
        for (const rotation of ['x', 'y']) {
            const next = grip.applyMove(rotation);
            const key = colorKey(next);
            if (keys.has(key)) continue;
            keys.add(key);
            grips.push(next);
        }
    if (grips.length !== 24) throw new Error('Unexpected orientation count for ' + id);
    return {
        model,
        solved,
        grips,
        colorKey,
        isSolved: (pattern: KPattern) => keys.has(colorKey(pattern)),
    };
}

const models = new Map<BigCubeId, ReturnType<typeof loadBigCube>>();
export function bigCubeModel(id: BigCubeId) {
    let ready = models.get(id);
    if (!ready) {
        ready = loadBigCube(id);
        models.set(id, ready);
    }
    return ready;
}
