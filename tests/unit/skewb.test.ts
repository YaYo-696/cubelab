import { expect, it } from 'vitest';
import { Alg } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import { parseSkewbDrop, loadSkewbContent } from '../../src/puzzles/skewb/content';
import { skewbCase } from '../../src/puzzles/skewb/case';
import {
    cornersStageSolved,
    filterSkewb,
    firstLayerSolved,
    scrambleSkewb,
    skewbDistance,
    solveSkewb,
} from '../../src/puzzles/skewb/engine';
import {
    normalizeSkewb,
    skewbModel,
    skewbSolvedGrips,
    visibleSkewb,
} from '../../src/puzzles/skewb/model';
import sets from '../fixtures/skewb/algsets.json';
import lessons from '../fixtures/skewb/lessons.json';

const signal = new AbortController().signal;

it('normalizes WCA turns, reports offsets and allows grip rotations only in algorithms', () => {
    expect(normalizeSkewb('  R  U′ L B')).toBe("R U' L B");
    expect(normalizeSkewb("R x y2 z' U'", true)).toBe("R x y2 z' U'");
    for (const [text, offset, variant] of [
        ['R x2', 2, false],
        ['R2', 1, false],
        ["B''", 2, false],
        ['L U r', 4, false],
        ["R x2'", 4, true],
        ['', 0, true],
    ] as const) {
        expect(() => normalizeSkewb(text, variant)).toThrow(expect.objectContaining({ offset }));
    }
});

it('uses optimal corner-turn distance and rejects a position exactly six moves away', async () => {
    const seed = await scrambleSkewb(signal);
    const result = await solveSkewb(seed, 'shortest');
    if (result.status !== 'solved') throw new Error(result.status);
    const sequence = new Alg(result.alg).invert().toString().split(' ');
    // Every prefix of a shortest path is itself shortest.
    const six = sequence.slice(0, 6).join(' ');
    const seven = sequence.slice(0, 7).join(' ');
    expect(await skewbDistance("R R'")).toBe(0);
    expect(await skewbDistance('R R')).toBe(1);
    expect(await skewbDistance(six)).toBe(6);
    expect(await skewbDistance(seven)).toBe(7);
    const candidates = [six, seven];
    expect(await filterSkewb(async () => candidates.shift()!, signal)).toBe(seven);
    expect(candidates).toHaveLength(0);
});

it('verifies both Skewb methods with KPuzzle on 200 random-state WCA mixtures', async () => {
    const model = await skewbModel();
    const solved = visibleSkewb(model.defaultPattern());
    expect(skewbSolvedGrips(solved)).toHaveLength(24);
    const geometry = (await puzzles.skewb.pg!()).get3d();
    for (const sequence of ["R' B R B'", "L B' L' B"])
        expect(firstLayerSolved(solved.applyAlg(sequence)), sequence).toBe(true);
    const upperFace = geometry.faces.findIndex(({ name }) => name === 'U');
    const upperStickers = geometry.stickers.filter(({ face }) => face === upperFace);
    const upperCenter = upperStickers.find(({ orbit }) => orbit === 'CENTERS')!.ord;
    const upperCorners = upperStickers
        .filter(({ orbit }) => orbit === 'CORNERS')
        .map(({ ord }) => ord);
    for (let i = 0; i < 200; i++) {
        const scramble = await scrambleSkewb(signal);
        expect(normalizeSkewb(scramble)).toBe(scramble);
        const optimal = await solveSkewb(scramble, 'shortest');
        const beginner = await solveSkewb(scramble, 'beginner');
        if (optimal.status !== 'solved' || beginner.status !== 'solved')
            throw new Error('Missing solution');
        expect(optimal.quality).toBe('provenOptimal');
        expect(beginner.quality).toBe('heuristic');
        expect(optimal.moves).toBe(await skewbDistance(scramble));
        expect(optimal.moves).toBeGreaterThanOrEqual(7);
        expect(optimal.moves).toBeLessThanOrEqual(11);
        const pattern = solved.applyAlg(scramble);
        expect(pattern.applyAlg(optimal.alg).isIdentical(solved)).toBe(true);
        expect(pattern.applyAlg(beginner.alg).isIdentical(solved)).toBe(true);
        expect(beginner.stages.map((stage) => stage.id)).toEqual([
            'skewbLayer',
            'skewbCorners',
            'skewbCenters',
        ]);
        const layer = pattern.applyAlg(beginner.stages[0].alg);
        expect(firstLayerSolved(layer)).toBe(true);
        expect(layer.patternData.CENTERS.pieces[upperCenter]).toBe(upperCenter);
        for (const slot of upperCorners) {
            expect(layer.patternData.CORNERS.pieces[slot]).toBe(slot);
            expect(layer.patternData.CORNERS.orientation[slot]).toBe(0);
        }
        expect(cornersStageSolved(layer.applyAlg(beginner.stages[1].alg))).toBe(true);
        expect(beginner.moves).toBe(
            beginner.stages.reduce((total, stage) => total + stage.moves, 0),
        );
        expect(beginner.moves).toBeGreaterThanOrEqual(optimal.moves);
    }
}, 45000);

it('validates both variants from the fixture and generates the declared active training cases', async () => {
    const fixture = await parseSkewbDrop(sets, lessons, true);
    expect(fixture.course.modules[0].lessons[0].setId).toBe('skewb-fixture');
    expect(fixture.sets.get('skewb-fixture')?.cases[0].algorithms).toEqual(["R'", "R' x y2 z'"]);
    const active = await loadSkewbContent();
    const solved = visibleSkewb((await skewbModel()).defaultPattern());
    for (const [id, set] of active.sets)
        for (const entry of set.cases) {
            const { scramble, verified } = await skewbCase(id, entry.id, signal);
            expect(verified).toBe(true);
            if (scramble) expect(normalizeSkewb(scramble)).toBe(scramble);
            expect(
                solved.applyAlg(scramble).isIdentical(solved.applyAlg(entry.referenceSetup)),
            ).toBe(true);
        }
});

it('rejects a broken drop and reports the set, case and variant', async () => {
    const invalid = structuredClone(sets);
    invalid.sets[0].cases[0].algs[1] = "L' x";
    await expect(parseSkewbDrop(invalid, lessons)).rejects.toThrow(
        /skewb-fixture\/skewb-fixture-case alg #2.*does not solve/,
    );
    invalid.sets[0].cases[0].algs[1] = 'R2';
    await expect(parseSkewbDrop(invalid, lessons)).rejects.toThrow(
        /skewb-fixture\/skewb-fixture-case alg #2.*invalid puzzle notation/,
    );
    const invalidSet = structuredClone(sets);
    invalidSet.sets[0].id = 'skewb_foo';
    await expect(parseSkewbDrop(invalidSet, lessons)).rejects.toThrow(
        /skewb_foo.*unknown or duplicate set/,
    );
    const invalidSource = structuredClone(sets);
    invalidSource.sets[0].cases[0].source = 'file:///algorithm';
    await expect(parseSkewbDrop(invalidSource, lessons)).rejects.toThrow(
        /expected an HTTP\(S\) URL or generated:/,
    );
});
