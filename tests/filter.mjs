// Run with node --experimental-strip-types tests/filter.mjs (no npm packages needed).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generate } from '../src/workers/generate.ts';
import { cubeModel, orientations, turns } from '../src/puzzles/cube.ts';
for (const [puzzle, event] of [['222', '222'], ['333', '333'], ['333', '333bf']]) {
    test(event + ' · 1.000 secuencias controladas y rechazo de candidatos resueltos', async () => {
        const model = cubeModel(puzzle === '222' ? 2 : 3);
        const oneTurn = new Set();
        for (const rotation of orientations) {
            const root = model.apply(model.solved, rotation);
            oneTurn.add(root);
            for (const turn of turns)
                oneTurn.add(model.apply(root, turn));
        }
        // Independent search direction: meet the precomputed one-turn sphere
        // from the candidate. For 2×2, two more turns cover distances 0..3.
        function belowThreshold(state) {
            if (oneTurn.has(state))
                return true;
            if (puzzle === '333')
                return false;
            for (const a of turns) {
                const middle = model.apply(state, a);
                if (oneTurn.has(middle))
                    return true;
                for (const b of turns)
                    if (oneTurn.has(model.apply(middle, b)))
                        return true;
            }
            return false;
        }
        let seed = 40621;
        function nextTurn() {
            seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
            return turns[seed % turns.length];
        }
        for (let sample = 0; sample < 1000; sample++) {
            let attempts = 0;
            const alg = await generate(puzzle, event, new globalThis.AbortController().signal, async () => {
                if (attempts++ === 0)
                    return "U F F F2 U'";
                return Array.from({ length: 22 }, nextTurn).join(' ');
            });
            assert.ok(attempts >= 2);
            assert.equal(belowThreshold(model.apply(model.solved, alg)), false, alg);
        }
    });
}
