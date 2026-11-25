// Fase 15-H · cubos grandes reducidos (4x4 a 7x7). Author: Claude.
import { describe, expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { bigParity, colorsOfBig, readColorsBig, stickerAtBig, type BigSize } from '../../src/core/fromColors/readColorsBig';

const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
async function changed(size: BigSize, alg: string) {
    const before = await colorsOfBig(size, '');
    const after = await colorsOfBig(size, alg);
    const out: string[] = [];
    for (const face of faces)
        for (let row = 0; row < size; row++)
            for (let col = 0; col < size; col++) {
                const id = (await stickerAtBig(size, face, row, col))!;
                if (before[id] !== after[id]) out.push(face + row + col);
            }
    return out;
}

describe('cubos grandes reducidos desde colores', () => {
    it('los algoritmos de paridad de 4x4 y 6x6 son puros', async () => {
        expect(await changed(4, bigParity[4].oll)).toEqual(['U31', 'U32', 'F01', 'F02']);
        expect(await changed(4, bigParity[4].pll)).toEqual(['F01', 'F02', 'B01', 'B02']);
        expect(await changed(6, bigParity[6].oll)).toEqual(['U51', 'U52', 'U53', 'U54', 'F01', 'F02', 'F03', 'F04']);
        expect(await changed(6, bigParity[6].pll)).toEqual(['F01', 'F02', 'F03', 'F04', 'B01', 'B02', 'B03', 'B04']);
    });

    it.each([4, 5, 6, 7] as const)('%dx: detecta paridades y reconstruye la posición pintada', async (size) => {
        const kpuzzle = await puzzles[(size + 'x' + size + 'x' + size) as '4x4x4'].kpuzzle();
        let seed = 13 + size;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        const even = size % 2 === 0;
        const slice = '2-' + (size - 1) + 'Rw';
        for (let i = 0; i < 20; i++) {
            const mix = Array.from({ length: 20 }, () => [...'UDLRFB', slice][rnd(7)] + ['', "'", '2'][rnd(3)]).join(' ');
            const oll = even && rnd(2) === 1;
            const pll = even && rnd(2) === 1;
            const grip = Array.from({ length: rnd(3) }, () => ['x', 'y', 'z'][rnd(3)]).join(' ');
            const algs = even ? bigParity[size as 4 | 6] : undefined;
            const alg = [mix, oll ? algs!.oll : '', 'R U F', pll ? algs!.pll : '', grip].filter(Boolean).join(' ');
            const state = kpuzzle.defaultPattern().applyAlg(alg);
            const result = await readColorsBig(size, await colorsOfBig(size, state));
            expect(result.ok, alg).toBe(true);
            if (!result.ok) return;
            expect(result.parity.map((step) => step.key)).toEqual([
                ...(oll ? ['fromColorsBigOll'] : []),
                ...(pll ? ['fromColorsBigPll'] : []),
            ]);
            const after = state.applyAlg(result.parity.map((step) => step.alg).join(' ')).applyAlg(result.rotation);
            const expected = await colorsOfBig(size, result.scramble333);
            const shown = await colorsOfBig(size, after);
            expect(Object.keys(expected).every((id) => expected[id] === shown[id])).toBe(true);
        }
        const unreduced = await readColorsBig(size, await colorsOfBig(size, "2R U Rw' F 2U"));
        expect(unreduced.ok).toBe(false);
    }, 120_000);

    it('en un cubo impar, una arista volteada es un error de pintado', async () => {
        const base = await colorsOfBig(5, "R U F'");
        const painted = { ...base };
        for (const col of [1, 2, 3]) {
            const a = (await stickerAtBig(5, 'U', 4, col))!;
            const b = (await stickerAtBig(5, 'F', 0, col))!;
            [painted[a], painted[b]] = [painted[b], painted[a]];
        }
        const result = await readColorsBig(5, painted);
        expect(result.ok ? [] : result.issues.map((issue) => issue.key)).toEqual(['fromColorsFlip']);
    });
});
