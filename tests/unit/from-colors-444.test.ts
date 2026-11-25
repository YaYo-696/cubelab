// Fase 15-E · 4x4 reducido y paridades. Author: Claude.
import { describe, expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import {
    colorsOf444,
    ollParity,
    pllParity,
    readColors444,
    stickerAt444,
} from '../../src/core/fromColors/readColors444';

const faces = ['U', 'D', 'F', 'B', 'R', 'L'];
async function changed(alg: string) {
    const solved = await colorsOf444('');
    const after = await colorsOf444(alg);
    const out: string[] = [];
    for (const face of faces)
        for (let row = 0; row < 4; row++)
            for (let col = 0; col < 4; col++) {
                const id = (await stickerAt444(face, row, col))!;
                if (after[id] !== solved[id]) out.push(face + row + col);
            }
    return out;
}

describe('4x4 reducido desde colores', () => {
    it('los algoritmos de paridad son puros', async () => {
        expect(await changed(ollParity)).toEqual(['U31', 'U32', 'F01', 'F02']);
        expect(await changed(pllParity)).toEqual(['F01', 'F02', 'B01', 'B02']);
    });

    it('detecta cada paridad y reconstruye la posición pintada', async () => {
        const kpuzzle = await puzzles['4x4x4'].kpuzzle();
        let seed = 99;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        const outer = ['U', 'D', 'L', 'R', 'F', 'B'];
        for (let i = 0; i < 60; i++) {
            const mix = Array.from({ length: 20 }, () => outer[rnd(6)] + ['', "'", '2'][rnd(3)]).join(' ');
            const oll = rnd(2) === 1;
            const pll = rnd(2) === 1;
            const grip = Array.from({ length: rnd(3) }, () => ['x', 'y', 'z'][rnd(3)]).join(' ');
            const alg = [mix, oll ? ollParity : '', 'R U F', pll ? pllParity : '', grip].filter(Boolean).join(' ');
            const state = kpuzzle.defaultPattern().applyAlg(alg);
            const result = await readColors444(await colorsOf444(state));
            expect(result.ok, alg).toBe(true);
            if (!result.ok) return;
            expect(result.parity.map((step) => step.key)).toEqual([
                ...(oll ? ['fromColors444Oll'] : []),
                ...(pll ? ['fromColors444Pll'] : []),
            ]);
            const after = state.applyAlg(result.parity.map((step) => step.alg).join(' ')).applyAlg(result.rotation);
            const expected = await colorsOf444(result.scramble333);
            const shown = await colorsOf444(after);
            expect(Object.keys(expected).every((id) => expected[id] === shown[id])).toBe(true);
        }
    }, 120_000);

    it('pide reducir primero si los centros o las aristas no están armados', async () => {
        const result = await readColors444(await colorsOf444("2R U Rw' F 2U"));
        expect(result.ok ? [] : result.issues.map((issue) => issue.key)).toEqual([
            'fromColors444Centers',
            'fromColors444Pairs',
        ]);
    });
});
