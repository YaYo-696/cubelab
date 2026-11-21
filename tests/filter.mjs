import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generate } from '../src/workers/generate.ts';
import { faceTurns, makeOracle } from './distance-oracle.ts';

for (const [puzzle, event] of [['222', '222'], ['333', '333'], ['333', '333bf']]) {
    test(event + ' · distancia exacta, rotaciones y 1.000 muestras', async t => {
        const oracle = await makeOracle(puzzle);
        const signal = new globalThis.AbortController().signal;
        const cases = puzzle === '222' ? ['', 'R', 'R U', 'R U F', 'R U F R'] : ['', 'R', 'R U'];
        const minimum = cases.length - 1;
        for (const [distance, setup] of cases.entries()) {
            await t.test('distancia ' + distance + ' en las 24 orientaciones', async () => {
                for (const rotation of oracle.rotations) {
                    const candidate = (setup + ' ' + rotation).trim();
                    // Verify the expected distance before injecting the candidate.
                    assert.equal(oracle.distanceAtBoundary(candidate), distance, candidate);
                    const inputs = distance < minimum ? [candidate, cases[minimum]] : [candidate];
                    let calls = 0;
                    const result = await generate(puzzle, event, signal, async () => {
                        assert.ok(calls < inputs.length, 'Se rechazó el estado en el umbral: ' + candidate);
                        return inputs[calls++];
                    });
                    assert.equal(calls, inputs.length, 'Se aceptó un estado demasiado próximo: ' + candidate);
                    assert.equal(oracle.distanceAtBoundary(result), minimum);
                }
            });
        }
        let seed = 40621;
        function nextTurn() {
            seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
            return faceTurns[seed % faceTurns.length];
        }
        for (let i = 0; i < 1000; i++) {
            const result = await generate(puzzle, event, signal, async () => Array.from({ length: 22 }, nextTurn).join(' '));
            assert.equal(oracle.below(result), false, result);
        }
    });
}
