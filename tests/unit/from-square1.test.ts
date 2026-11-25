// Fase 15-D · Square-1 desde sus piezas. Author: Claude.
import { describe, expect, it } from 'vitest';
import { readSquare1, square1TableSizes, SQUARE1_SOLVED } from '../../src/core/fromColors/readSquare1';
import { square1State } from '../../src/puzzles/sideEvents/square1';

const pos = (v: number) => ((v % 12) + 12) % 12;
const signed = (v: number) => (pos(v) > 6 ? pos(v) - 12 : pos(v));
const rot = (layer: string[], s: number) => layer.slice(12 - pos(s)).concat(layer.slice(0, 12 - pos(s)));
const split = (layer: string[]) => layer[0] !== layer[11] && layer[5] !== layer[6];
const pieces = (layer: string[]) => layer.filter((c, i) => c !== layer[(i + 11) % 12]);

describe('Square-1 desde sus piezas', () => {
    it('todas las etapas alcanzan todos sus estados', () => {
        expect(square1TableSizes()).toEqual({ shapeNodes: 38610, moves: 77, stageB: 2822400, effects: 103, stageC: 576 });
    }, 60_000);

    it('resuelve posiciones reales, comprobadas con el modelo de la app', () => {
        let seed = 11;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        let flipped = 0;
        for (let i = 0; i < 100; i++) {
            let a = [...SQUARE1_SOLVED];
            const parts: string[] = [];
            for (let k = 0; k < 12 + rnd(8); k++) {
                let t: number;
                let b: number;
                do {
                    t = rnd(12);
                    b = rnd(12);
                } while (!split(rot(a.slice(0, 12), t)) || !split(rot(a.slice(12), b)));
                a = [...rot(a.slice(0, 12), t), ...rot(a.slice(12), b)];
                a = [...a.slice(0, 6), ...a.slice(12, 18), ...a.slice(6, 12), ...a.slice(18, 24)];
                parts.push('(' + signed(t) + ', ' + signed(b) + ')', '/');
            }
            let t = 0;
            let b = 0;
            while (rot(a.slice(0, 12), t)[0] === rot(a.slice(0, 12), t)[11]) t++;
            while (rot(a.slice(12), b)[0] === rot(a.slice(12), b)[11]) b++;
            if (t || b) parts.push('(' + signed(t) + ', ' + signed(b) + ')');
            const scramble = parts.join(' ').replace(/\(0, 0\) /g, '');
            const state = square1State(scramble);
            if (state[24] === '1') flipped++;
            const result = readSquare1({
                top: pieces([...state.slice(0, 12)]),
                bottom: pieces([...state.slice(12, 24)]),
                middleSquare: state[24] === '0',
            });
            expect(result.ok).toBe(true);
            if (!result.ok) return;
            expect(result.state).toBe(state);
            expect(square1State(result.scramble)).toBe(state);
            expect(square1State(scramble + ' ' + result.solution)).toBe(SQUARE1_SOLVED + '0');
        }
        expect(flipped).toBeGreaterThan(20);
    }, 120_000);

    it('explica piezas repetidas, faltantes y capas que no cierran', () => {
        const result = readSquare1({ top: [...'ABCDEFGH'], bottom: [...'IJKLMNOA'], middleSquare: true });
        expect(result.ok ? [] : result.issues.map((issue) => issue.key)).toEqual(['sq1Duplicate', 'sq1Missing']);
        const size = readSquare1({ top: [...'ABCDEFGHI'], bottom: [...'JKLMNOP'], middleSquare: true });
        expect(size.ok ? [] : size.issues.map((issue) => issue.key)).toEqual(['sq1LayerSize', 'sq1LayerSize']);
        expect(readSquare1({ top: [...'ABCDEFGH'], bottom: [...'IJKLMNOP'], middleSquare: true })).toEqual({
            ok: true,
            solution: '',
            scramble: '',
            state: SQUARE1_SOLVED + '0',
        });
    });
});
