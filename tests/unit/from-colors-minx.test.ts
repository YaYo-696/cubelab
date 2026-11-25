// Fase 15-F · Megaminx desde colores. Author: Claude.
import { describe, expect, it } from 'vitest';
import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { colorLayoutMinx, colorsOfMinx, readColorsMinx, type Painted } from '../../src/core/fromColors/readColorsMinx';

const same = (a: Painted, b: Painted) => Object.keys(a).every((id) => a[id] === b[id]);
const faces = ['U', 'D', 'F', 'B', 'L', 'R', 'BL', 'BR', 'FL', 'FR', 'DL', 'DR'];

describe('Megaminx desde colores', () => {
    it('resuelve posiciones reales pintadas en cualquier orientación', async () => {
        const kpuzzle = await puzzles.megaminx.kpuzzle();
        let seed = 21;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        for (let i = 0; i < 10; i++) {
            const mix = Array.from({ length: 40 }, () => faces[rnd(12)] + ['', "'", '2', "2'"][rnd(4)]).join(' ');
            const grip = Array.from({ length: rnd(4) }, () => ['Uv', 'Rv', 'Fv'][rnd(3)]).join(' ');
            const state = kpuzzle.defaultPattern().applyAlg(mix).applyAlg(grip);
            const result = await readColorsMinx(await colorsOfMinx(state));
            expect(result.ok).toBe(true);
            if (!result.ok) return;
            const held = state.applyAlg(result.rotation);
            expect(same(await colorsOfMinx(result.scramble), await colorsOfMinx(held))).toBe(true);
            expect(same(await colorsOfMinx(held.applyAlg(result.solution)), await colorsOfMinx(''))).toBe(true);
        }
    }, 120_000);

    it('explica giros, volteos e intercambios imposibles', async () => {
        const layout = await colorLayoutMinx();
        expect(layout.stickers).toHaveLength(132);
        const base = await colorsOfMinx("R U F' BL");
        const slot = (orbit: string, location: number) =>
            layout.stickers
                .filter((s) => s.orbit === orbit && s.location === location)
                .sort((a, b) => a.orientation - b.orientation)
                .map((s) => s.id);
        const keys = async (painted: Painted) => {
            const result = await readColorsMinx(painted);
            return result.ok ? [] : result.issues.map((issue) => issue.key);
        };
        const twist = (orbit: string) => {
            const ids = slot(orbit, 0);
            return { ...base, ...Object.fromEntries(ids.map((id, i) => [id, base[ids[(i + 1) % ids.length]]])) };
        };
        const swap = (orbit: string) => {
            const [a, b] = [slot(orbit, 0), slot(orbit, 1)];
            return {
                ...base,
                ...Object.fromEntries(a.map((id, i) => [id, base[b[i]]])),
                ...Object.fromEntries(b.map((id, i) => [id, base[a[i]]])),
            };
        };
        expect(await keys(twist('CORNERS'))).toEqual(['fromColorsTwist']);
        expect(await keys(twist('EDGES'))).toEqual(['fromColorsFlip']);
        expect(await keys(swap('EDGES'))).toEqual(['fromColorsSwap']);
        expect(await keys(swap('CORNERS'))).toEqual(['fromColorsSwap']);
    }, 60_000);

    it('acepta y rechaza estados armados al azar según las reglas', async () => {
        const kpuzzle = await puzzles.megaminx.kpuzzle();
        let seed = 5;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        const parity = (v: number[]) => {
            let odd = 0;
            for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[i] > v[j]) odd ^= 1;
            return odd;
        };
        const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
        for (let i = 0; i < 30; i++) {
            const data: Record<string, { pieces: number[]; orientation: number[] }> = {};
            for (const orbit of kpuzzle.definition.orbits) {
                const pieces = [...Array(orbit.numPieces).keys()];
                if (orbit.orbitName !== 'CENTERS')
                    for (let j = pieces.length - 1; j > 0; j--) {
                        const k = rnd(j + 1);
                        [pieces[j], pieces[k]] = [pieces[k], pieces[j]];
                    }
                data[orbit.orbitName] = {
                    pieces,
                    orientation: pieces.map(() => (orbit.orbitName === 'CENTERS' ? 0 : rnd(orbit.numOrientations))),
                };
            }
            const expected =
                sum(data.CORNERS.orientation) % 3 === 0 &&
                sum(data.EDGES.orientation) % 2 === 0 &&
                !parity(data.CORNERS.pieces) &&
                !parity(data.EDGES.pieces);
            const result = await readColorsMinx(await colorsOfMinx(new KPattern(kpuzzle, data)));
            expect(result.ok).toBe(expected);
        }
    }, 120_000);
});
