// Fase 15-C · Clock desde esferas. Author: Claude.
import { describe, expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { clockDialsOf, readClock } from '../../src/core/fromColors/readClock';

describe('resolver el Clock desde sus esferas', () => {
    it('resuelve estados aleatorios y mezclas tipo WCA en notación de la app', async () => {
        const kpuzzle = await puzzles.clock.kpuzzle();
        let seed = 31;
        const rnd = (n: number) => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return Math.floor((seed / 2 ** 32) * n);
        };
        for (let i = 0; i < 300; i++) {
            const front = Array.from({ length: 9 }, () => rnd(12));
            const back = Array.from({ length: 9 }, () => rnd(12));
            for (const [f, b] of [[0, 2], [2, 0], [6, 8], [8, 6]]) back[b] = (12 - front[f]) % 12;
            const result = await readClock({ front, back });
            expect(result.ok).toBe(true);
            if (!result.ok) return;
            for (const move of result.solution.split(' '))
                expect(move).toMatch(/^(?:y2|(?:UR|DR|DL|UL|U|R|D|L|ALL)[0-6][+-])$/);
            const held = kpuzzle.defaultPattern().applyAlg(result.scramble);
            expect(held.patternData.DIALS.orientation.join()).toBe([...front, ...back].join());
            expect(held.applyAlg(result.solution).patternData.DIALS.orientation.every((v) => v === 0)).toBe(true);
        }
        const mix = 'UR3+ DR1- DL6+ UL2- U4+ R5- D0+ L1+ ALL2- y2 U3- R6+ D1+ L4- ALL5+';
        const read = await readClock(await clockDialsOf(mix));
        expect(read.ok).toBe(true);
        if (read.ok)
            expect(
                kpuzzle
                    .defaultPattern()
                    .applyAlg(mix)
                    .applyAlg(read.solution)
                    .patternData.DIALS.orientation.every((v) => v === 0),
            ).toBe(true);
    }, 60_000);

    it('explica esquinas que no calzan y valores fuera de rango', async () => {
        const zero = () => [0, 0, 0, 0, 0, 0, 0, 0, 0];
        const back = zero();
        back[2] = 3;
        const corner = await readClock({ front: zero(), back });
        expect(corner.ok ? [] : corner.issues).toEqual([
            {
                key: 'clockCorner',
                dials: [
                    { side: 'front', index: 0 },
                    { side: 'back', index: 2 },
                ],
            },
        ]);
        const value = await readClock({ front: [0, 0, 0, 0, 13, 0, 0, 0, 0], back: zero() });
        expect(value.ok ? [] : value.issues.map((issue) => issue.key)).toEqual(['clockValue']);
        expect(await readClock({ front: zero(), back: zero() })).toEqual({ ok: true, solution: '', scramble: '' });
        const twelve = await readClock({ front: [12, 0, 0, 0, 12, 0, 0, 0, 0], back: zero() });
        expect(twelve.ok).toBe(true);
    });
});
