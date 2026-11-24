import 'fake-indexeddb/auto';
import { it, expect } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { solvePuzzle } from '../../src/core/solver/solve';
import type { SolveMethod } from '../../src/core/solver/options';
import type { CubeId } from '../../src/puzzles/events';
import { frames } from '../../src/core/solver/coordinates';
import { loadAlgSet } from '../../src/puzzles/content';
import beginnerDrills from '../../content-drop/333-222/drills-nuevos.json';

const beginnerRules = {
    yellowCross: { ids: ['ycLine'], max: 3, adjustment: /^U(?:2|')?$/ },
    orient: { ids: ['orientSune', 'orientAnti'], max: 3, adjustment: /^U(?:2|')?$/ },
    permCorners: { ids: ['cornersAdj'], max: 2, adjustment: /^U(?:2|')?$/ },
    permEdges: { ids: ['edgesUa'], max: 3, adjustment: /^y(?:2|')?$/ },
    orient2: { ids: ['orient2Sune', 'orient2Anti'], max: 3, adjustment: /^U(?:2|')?$/ },
};
const beginnerCatalog = [...beginnerDrills.drills333, ...beginnerDrills.drills222];

function checkBeginnerStage(lesson: string, alg: string) {
    const rule = beginnerRules[lesson as keyof typeof beginnerRules];
    if (!rule) return;
    const allowed = rule.ids.map((id) => beginnerCatalog.find((row) => row.id === id)!.alg.split(' '));
    const moves = alg ? alg.split(' ') : [];
    let count = 0;
    for (let index = 0; index < moves.length; ) {
        const match = allowed.find((candidate) => candidate.every((move, i) => moves[index + i] === move));
        if (match) {
            count++;
            index += match.length;
        } else {
            expect(moves[index], lesson + ': ' + alg).toMatch(rule.adjustment);
            index++;
        }
    }
    expect(count, lesson + ': ' + alg).toBeLessThanOrEqual(rule.max);
}
const methods: [CubeId, SolveMethod][] = [
    ['222', 'shortest'],
    ['222', 'beginner'],
    ['222', 'ortega'],
    ['333', 'shortest'],
    ['333', 'beginner'],
    ['333', 'cfop4'],
    ['333', 'cfopFull'],
];
function sample() {
    let seed = 491331;
    const random = (n: number) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return Math.floor((seed / 2 ** 32) * n);
    };
    return Array.from({ length: 200 }, (_, index) => {
        let prev = '';
        const scramble = Array.from({ length: 25 }, () => {
            const faces = [...'RLUDFB'].filter((face) => face !== prev);
            prev = faces[random(faces.length)];
            return prev + ['', "'", '2'][random(3)];
        }).join(' ');
        return index % 5 ? scramble : scramble + ' x y';
    });
}
it.each(methods)(
    'verifica 200 mezclas de %s con %s',
    async (cube, method) => {
        const solved = (await puzzles[cube === '222' ? '2x2x2' : '3x3x3'].kpuzzle()).defaultPattern();
        const times: number[] = [];
        const lengths: number[] = [];
        const sets =
            method === 'cfopFull'
                ? await Promise.all(['fullOLL', 'fullPLL'].map((id) => loadAlgSet(id, cube)))
                : [];
        for (const [i, scramble] of sample().entries()) {
            const start = performance.now();
            let result;
            try {
                result = await solvePuzzle(cube, scramble, method, i % 2 === 0);
            } catch (error) {
                throw new Error(cube + ' ' + method + ' #' + i + ' ' + scramble, { cause: error });
            }
            times.push(performance.now() - start);
            expect(result.status).toBe('solved');
            if (result.status !== 'solved') throw new Error(result.status);
            expect(result.alg).not.toMatch(/(?:[a-zA-Z]3|2')(?=[\s)]|$)/);
            const end = solved.applyAlg(scramble).applyAlg(result.alg);
            expect(
                frames.some((frame) => end.applyAlg(frame).isIdentical(solved)),
                scramble,
            ).toBe(true);
            expect(result.moves).toBe(result.stages.reduce((sum, stage) => sum + stage.moves, 0));
            if (method === 'beginner')
                for (const stage of result.stages) checkBeginnerStage(stage.lessonId ?? '', stage.alg);
            if (cube === '333' && method !== 'shortest')
                expect(result.stages[0].moves).toBeLessThanOrEqual(8);
            if (cube === '222' && method === 'shortest') {
                expect(result.moves).toBeLessThanOrEqual(11);
                expect(result.quality).toBe('provenOptimal');
            }
            if (method === 'cfopFull')
                for (const [j, stage] of result.stages.slice(-2).entries()) {
                    if (!stage.caseId) continue;
                    const main = sets[j].cases.find((entry) => entry.id === stage.caseId)?.algorithms[0];
                    expect(stage.mainAlgorithm).toBe(main);
                    expect(stage.alg).toBe(
                        [stage.preAdjustment, main, stage.postAdjustment].filter(Boolean).join(' '),
                    );
                }
            lengths.push(result.moves);
        }
        console.log(
            JSON.stringify({
                cube,
                method,
                meanMs: times.reduce((a, b) => a + b) / times.length,
                maxMs: Math.max(...times),
                meanMoves: lengths.reduce((a, b) => a + b) / lengths.length,
                maxMoves: Math.max(...lengths),
            }),
        );
    },
    120_000,
);

it('produce posiciones verificadas para practicar CLL y EG desde mezclas reales', async () => {
    const solved = (await puzzles['2x2x2'].kpuzzle()).defaultPattern();
    const seen = new Set<string>();
    for (const scramble of sample().slice(0, 100)) {
        for (const method of ['cllPractice', 'egPractice'] as const) {
            const result = await solvePuzzle('222', scramble, method, false);
            if (result.status !== 'solved' || !result.stages.at(-1)?.caseId) continue;
            const lesson = result.stages.at(-1)!.lessonId;
            expect(lesson?.startsWith(method === 'cllPractice' ? 'fullCLL' : 'egConcept')).toBe(true);
            expect(solved.applyAlg(scramble).applyAlg(result.alg).isIdentical(solved)).toBe(true);
            seen.add(method);
        }
    }
    expect([...seen].sort()).toEqual(['cllPractice', 'egPractice']);
}, 120_000);
