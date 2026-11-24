import { expect, it, vi } from 'vitest';
import { generate } from '../../src/workers/generate';
import { cubeModel, orientations } from '../../src/puzzles/cube';
import { cubeEvent } from '../../src/puzzles/events';
import { makeOracle } from '../distance-oracle';
for (const [puzzle, event] of [['222', '222'], ['333', '333'], ['333', '333bf']] as const) {
    it(event + ' · 1.000 mezclas reales fuera de la bola prohibida', async () => {
        const { below } = await makeOracle(puzzle);
        expect(below(puzzle === '222' ? 'R U F' : 'R')).toBe(true);
        expect(below(puzzle === '222' ? 'R U F R' : 'R U')).toBe(false);
        const signal = new AbortController().signal;
        for (let i = 0; i < 1000; i++) {
            const alg = await generate(puzzle, event, signal);
            expect(below(alg), event + ' #' + i + ' ' + alg).toBe(false);
        }
    }, 120_000);
}
it('rechaza candidatos por estado y reintenta incluso si la secuencia es larga', async () => {
    const candidates = ['R U F2 F2 U\' R\'', 'R U F', 'R U F R'];
    expect(await generate('222', '222', new AbortController().signal, async () => candidates.shift()!)).toBe('R U F R');
    expect(candidates).toHaveLength(0);
});
it('la orientación cubre las 24 posiciones y conserva la distancia', () => {
    const m = cubeModel(2);
    expect(new Set(orientations.map(a => m.apply(m.solved, a))).size).toBe(24);
    for (const spin of orientations) {
        expect(m.tooClose(m.apply(m.solved, 'R U F ' + spin), 4)).toBe(true);
        expect(m.tooClose(m.apply(m.solved, 'R U F R ' + spin), 4)).toBe(false);
    }
    expect(cubeEvent('333', true).randomOrientation).toBe(true);
});

it('aplica las 24 orientaciones ciegas y descarta bytes sesgados', async () => {
    const bytes = [255, ...Array.from({ length: 24 }, (_, index) => index)];
    vi.stubGlobal('crypto', { getRandomValues(buffer: Uint8Array) {
        if (!bytes.length) throw new Error('Unexpected entropy request');
        buffer[0] = bytes.shift()!;
        return buffer;
    }});
    try {
        const model = cubeModel(3);
        const positions = new Set<string>();
        for (let index = 0; index < 24; index++) {
            const alg = await generate('333', '333bf', new AbortController().signal, async () => 'R U');
            positions.add(model.apply(model.solved, alg));
        }
        expect(positions.size).toBe(24);
        expect(bytes).toHaveLength(0);
    } finally {
        vi.unstubAllGlobals();
    }
});
