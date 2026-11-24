import { describe, expect, it } from 'vitest';
import {
    filterPyraminx,
    scrambleTetra,
    solveTetra,
    tetraDistance,
} from '../../src/puzzles/tetra/engine';
import {
    inverse,
    moves,
    normalizeTetra,
    solvedGrips,
    tetraModel,
} from '../../src/puzzles/tetra/model';
import { parsePyramDrop } from '../../src/puzzles/tetra/drop';
import { tetraCase } from '../../src/puzzles/tetra/case';
import { loadPyramContent } from '../../src/puzzles/tetra/content';
import { duoCourse, duoSet } from '../../src/puzzles/tetra/duoContent';
import sets from '../fixtures/pyram/algsets.json';
import lessons from '../fixtures/pyram/lessons.json';

const signal = new AbortController().signal;
describe('tetrahedral puzzles', () => {
    it.each(['pyram', 'pyramduo'] as const)(
        'verifies 200 random-state %s solves',
        async (id) => {
            const model = await tetraModel(id);
            const solved = model.defaultPattern();
            expect(solvedGrips(model)).toHaveLength(12);
            for (let index = 0; index < 200; index++) {
                const scramble = await scrambleTetra(id, signal);
                expect(normalizeTetra(scramble, id === 'pyram')).toBe(scramble);
                const distance = await tetraDistance(id, scramble);
                const pattern = solved.applyAlg(scramble);
                expect(distance).toBeGreaterThanOrEqual(id === 'pyram' ? 6 : 1);
                if (id === 'pyramduo') expect(distance).toBeLessThanOrEqual(4);
                for (const method of id === 'pyram'
                    ? (['shortest'] as const)
                    : (['shortest', 'beginner'] as const)) {
                    const result = await solveTetra(id, scramble, method);
                    if (result.status !== 'solved') throw new Error(result.status);
                    expect(pattern.applyAlg(result.alg).isIdentical(solved)).toBe(true);
                    expect(result.moves).toBe(
                        result.stages.reduce((sum, stage) => sum + stage.moves, 0),
                    );
                    if (method === 'shortest') {
                        expect(result.quality).toBe('provenOptimal');
                        expect(result.moves).toBe(distance);
                    } else {
                        expect(
                            pattern
                                .applyAlg(result.stages[0].alg)
                                .patternData.CORNERS.orientation.every((n) => n === 0),
                        ).toBe(true);
                    }
                }
            }
        },
        30000,
    );

    it('has the independent Duo distance distribution', async () => {
        const model = await tetraModel('pyramduo');
        const states = [{ pattern: model.defaultPattern(), sequence: '', depth: 0 }];
        const seen = new Set([JSON.stringify(states[0].pattern.patternData)]);
        const counts = [1, 0, 0, 0, 0];
        for (const { pattern, sequence, depth } of states)
            for (const move of moves) {
                const neighbor = pattern.applyMove(move);
                const key = JSON.stringify(neighbor.patternData);
                if (seen.has(key)) continue;
                seen.add(key);
                const next = [sequence, move].filter(Boolean).join(' ');
                states.push({ pattern: neighbor, sequence: next, depth: depth + 1 });
                counts[depth + 1]++;
                expect(await tetraDistance('pyramduo', next)).toBe(depth + 1);
            }
        expect(counts).toEqual([1, 8, 48, 188, 79]);
        const solved = model.defaultPattern();
        for (const demo of duoCourse.modules[0].lessons[0].demos)
            expect(solved.applyAlg(demo.setup).applyAlg(demo.alg).isIdentical(solved)).toBe(true);
        for (const entry of duoSet.cases)
            for (const alg of entry.algorithms) {
                expect(
                    solved.applyAlg(entry.referenceSetup).applyAlg(alg).isIdentical(solved),
                ).toBe(true);
                expect(
                    solved
                        .applyAlg(inverse(alg))
                        .isIdentical(solved.applyAlg(entry.referenceSetup)),
                ).toBe(true);
            }
    });

    it('counts tips in the Pyraminx distance and marks notation errors', async () => {
        expect(await tetraDistance('pyram', "u b l r'")).toBe(4);
        expect(await tetraDistance('pyram', "U L u b l r'")).toBe(6);
        expect(await tetraDistance('pyram', 'U L u b l')).toBe(5);
        const candidates = ['U L u b l', "U L u b l r'"];
        expect(await filterPyraminx(async () => candidates.shift()!, signal)).toBe("U L u b l r'");
        expect(candidates).toHaveLength(0);
        expect(normalizeTetra('U   r′', true)).toBe("U r'");
        expect(() => normalizeTetra('U r2', true)).toThrow();
        try {
            normalizeTetra('U r2', true);
        } catch (error) {
            expect(error).toMatchObject({ offset: 3 });
        }
        expect(() => normalizeTetra('U r', false)).toThrow();
    });

    it('imports the fixture and the active content, then generates each declared case', async () => {
        const fixture = await parsePyramDrop(sets, lessons, true);
        expect(fixture.course.modules[0].lessons[0].algSetRefs).toEqual(['l3e']);
        const active = await loadPyramContent();
        const solved = (await tetraModel('pyram')).defaultPattern();
        for (const [id, set] of active.sets)
            for (const entry of set.cases) {
                const result = await tetraCase('pyram', id, entry.id, signal);
                expect(result.verified).toBe(true);
                expect(
                    solved
                        .applyAlg(result.scramble)
                        .isIdentical(solved.applyAlg(entry.referenceSetup)),
                ).toBe(true);
            }
    });

    it('rejects the entire drop and identifies the failing variant', async () => {
        const bad = structuredClone(sets);
        bad.sets[0].cases[0].algs.push("L'");
        await expect(parsePyramDrop(bad, lessons)).rejects.toThrow(
            /l3e\/l3e-fixture alg #2.*does not solve/,
        );
        const missing = structuredClone(lessons);
        const brokenLesson = { ...missing.lessons[0], prerequisites: ['missing'] };
        await expect(parsePyramDrop(sets, { ...missing, lessons: [brokenLesson] })).rejects.toThrow(
            /missing.*unknown prerequisite/,
        );
    });
});
