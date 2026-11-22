import { Alg, Move } from 'cubing/alg';
import type { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import type { SearchResult, Stage } from '../contracts';
import { matchesCase, matchesStage, type AcademyCase, type StageGoal } from '../academy/cases';
import { finalRotation } from '../academy/execution';
import { loadAlgSet } from '../../puzzles/content';
import groups from '../../puzzles/content/full/groups';
import type { CubeId } from '../../puzzles/events';
import { NotationError, normalizeCube } from '../../puzzles/notation';
import {
    actions,
    atHome,
    coordinate,
    cross,
    distanceTable,
    edges,
    frames,
    idaPieces,
    lowerCorners,
    middle,
    movesFor,
    sequence,
    slotEdges,
    slotSearch,
    turns,
    type Piece,
} from './coordinates';
import { centersHome, shortestPattern } from './shortest';
import type { SolveMethod, SolveProgress } from './options';

export function moveCount(algorithm: string) {
    let count = 0;
    for (const move of new Alg(algorithm).experimentalExpand()) {
        if (!(move instanceof Move)) continue;
        const family = move.quantum.toString();
        if (!/^[xyz]$/.test(family)) count += /^[MES]$/.test(family) ? 2 : 1;
    }
    return count;
}
const candidates = (pattern: KPattern) => {
    const kp = pattern.kpuzzle;
    const basic = actions(kp, movesFor('UDRLFB'));
    const free = actions(kp, movesFor('URLFB'));
    // Single-side insertions preserve the cross at their boundaries. With U turns
    // and their inverses they can extract, pair, and insert in any free slot.
    const insertions = actions(kp, [
        ...movesFor('U'),
        ...[...'RLFB'].flatMap((face) =>
            [face, face + "'"].flatMap((turn) =>
                movesFor('U').map((u) => sequence(turn, u, new Alg(turn).invert().toString())),
            ),
        ),
    ]);
    return { basic, free, insertions };
};
const prepare = new Map<CubeId, ReturnType<typeof candidates>>();
function piecesTable(pieces: Piece[], moves: ReturnType<typeof actions>, goals?: number[][]) {
    return distanceTable(
        pieces,
        moves,
        goals ?? [pieces.map(({ orbit, id }) => id * (orbit === 'EDGES' ? 2 : 3))],
    );
}
type Table = ReturnType<typeof piecesTable>;
const tables = new Map<string, Table>();
function tableFor(key: string, build: () => Table) {
    let table = tables.get(key);
    if (!table) {
        table = build();
        tables.set(key, table);
    }
    return table;
}
function arrangements(values: number[]): number[][] {
    return values.length
        ? values.flatMap((v) => arrangements(values.filter((x) => x !== v)).map((tail) => [v, ...tail]))
        : [[]];
}

class UnrecognizedCase extends Error {}

type Selection = {
    alg: string;
    main?: string;
    before?: string;
    after?: string;
    caseId?: string;
    caseName?: string;
    lessonId: string;
};
async function lastLayer(
    pattern: KPattern,
    solved: KPattern,
    cube: CubeId,
    setId: string,
    goal: StageGoal,
    lessonId: string,
    ids?: string[],
    allowBottom = false,
): Promise<Selection> {
    const done = (state: KPattern) => matchesStage(state, solved, goal);
    const precise = (state: KPattern) =>
        goal === 'solved' ? matchesStage(state, solved, 'exact') : done(state);
    if (precise(pattern)) return { alg: '', lessonId };
    const bottom = allowBottom ? ['', 'D', 'D2', "D'"] : [''];
    for (const u of turns)
        for (const d of bottom) {
            const adjustment = sequence(u, d);
            if (precise(pattern.applyAlg(adjustment))) return { alg: adjustment, lessonId };
        }
    const set = await loadAlgSet(setId, cube);
    const grips = allowBottom ? ['', 'x2'] : [''];
    for (const grip of grips) {
        const relative = grip
            ? solved
                  .applyAlg(grip)
                  .applyTransformation(pattern.experimentalToTransformation()!)
                  .applyAlg(grip)
            : pattern;
        for (const entry of set.cases as AcademyCase[]) {
            if (ids && !ids.includes(entry.id)) continue;
            const main = entry.algorithms[0];
            if (!main) continue;
            const matching = bottom
                .map((d) => ({ d, prepared: relative.applyAlg(d) }))
                .filter(({ prepared }) => matchesCase(prepared, solved, entry.pattern));
            if (!matching.length) continue;
            const restore = sequence(finalRotation(new Alg(main)).invert().toString());
            for (const { d, prepared } of matching) {
                for (const u of turns) {
                    const before = sequence(grip, d, u);
                    const end = prepared.applyAlg(sequence(u, main, restore));
                    if (!done(end) && !allowBottom) continue;
                    for (const finalD of bottom)
                        for (const auf of goal === 'solved' ? turns : ['']) {
                            const adjustment = sequence(restore, finalD, auf);
                            if (!precise(end.applyAlg(sequence(finalD, auf)))) continue;
                            const after = sequence(adjustment, grip);
                            const catalog =
                                setId === 'fullOLL' || setId === 'fullPLL' || setId === 'fullCLL'
                                    ? groups[setId]
                                    : undefined;
                            return {
                                alg: sequence(before, main, after),
                                main,
                                before,
                                after,
                                caseId: entry.id,
                                caseName: entry.standardName,
                                lessonId: catalog?.find((g) => g.ids.includes(entry.id))?.id ?? lessonId,
                            };
                        }
                }
            }
        }
    }
    throw new UnrecognizedCase('No matching academy algorithm for ' + lessonId);
}

export async function solvePuzzle(
    cube: CubeId,
    input: string,
    method: SolveMethod,
    neutral: boolean,
    progress: (value: SolveProgress) => void = () => {},
): Promise<SearchResult> {
    let scramble: string;
    try {
        scramble = input.trim() ? normalizeCube(input) : '';
    } catch (error) {
        if (error instanceof NotationError) return { status: 'invalidInput' };
        throw error;
    }
    const kp = await puzzles[cube === '222' ? '2x2x2' : '3x3x3'].kpuzzle();
    const solved = kp.defaultPattern();
    const start = solved.applyAlg(scramble);
    const alignment = frames.find((frame) => centersHome(start.applyAlg(frame)))!;
    const viable = (state: KPattern) => matchesStage(state, solved, 'exact');
    let state = start;
    const stages: Stage[] = [];
    const checks: ((state: KPattern) => boolean)[] = [];
    function add(
        name: string,
        alg: string,
        test: (state: KPattern) => boolean,
        detail: Partial<Stage> = {},
    ) {
        state = state.applyAlg(alg);
        if (!test(state)) throw new Error('Stage verification failed: ' + name);
        stages.push({
            id: name + '-' + stages.length,
            nameKey: 'solveStage_' + name,
            alg,
            moves: moveCount(alg),
            explanationKey: 'solveExplain_' + name,
            explanationParams: {},
            ...detail,
        });
        checks.push(test);
        progress({ key: 'solveProgressStages', value: stages.length });
    }
    let initialFrame = '';
    let neutralFrame = '';
    if (method === 'shortest') {
        progress({ key: 'solveProgressSearch', value: 0 });
        const alg = await shortestPattern(cube, state, (value) =>
            progress({ key: 'solveProgressTable', value }),
        );
        add('shortest', alg, viable);
    } else {
        const moves = prepare.get(cube) ?? candidates(state);
        prepare.set(cube, moves);
        if (cube === '333') {
            progress({ key: 'solveProgressCross', value: 0 });
            const table = tableFor('cross', () => piecesTable(cross, moves.basic));
            const estimate = (pattern: KPattern) =>
                table.estimate(cross.map((p) => coordinate(pattern, p)));
            const possible = neutral
                ? Object.values(
                      Object.fromEntries(
                          frames.map((frame) => [
                              solved.applyAlg(frame).patternData.CENTERS.pieces[5],
                              frame,
                          ]),
                      ),
                  )
                : [''];
            const candidate = possible
                .map((frame) => {
                    const relative = solved
                        .applyAlg(new Alg(frame).invert())
                        .applyAlg(sequence(scramble, alignment, frame));
                    return { frame, relative, distance: estimate(relative) };
                })
                .sort((a, b) => a.distance - b.distance)[0];
            neutralFrame = candidate.frame;
            initialFrame = sequence(alignment, neutralFrame);
            const centerColors = ['Yellow', 'Red', 'Green', 'Orange', 'Blue', 'White'];
            const frameCenters = solved.applyAlg(candidate.frame).patternData.CENTERS.pieces;
            const slotFaces = [
                [2, 3],
                [2, 1],
                [4, 1],
                [4, 3],
            ];
            state = candidate.relative;
            const alg = idaPieces(state, cross, moves.basic, table.estimate, 8, Infinity);
            if (alg === undefined) throw new Error('Cross exceeds exact bound');
            add('cross', alg, (p) => atHome(p, cross), {
                lessonId: method === 'beginner' ? 'cross' : 'crossPlan',
                explanationParams: { color: 'solveColor' + centerColors[frameCenters[5]] },
            });
            const locked = [...cross];
            const solveSlots = (
                goals: Piece[][],
                insertions: ReturnType<typeof actions>,
                name: string,
                lessonId: string,
            ) => {
                const remaining = [...goals];
                while (remaining.length) {
                    const best = remaining.map((pieces) => {
                        const fallback = slotSearch(state, pieces, locked, insertions);
                        return {
                            pieces,
                            fallback,
                            cost: fallback === undefined ? Infinity : moveCount(fallback),
                        };
                    });
                    if (name === 'pair')
                        for (const candidate of best) {
                            if (!candidate.cost) continue;
                            const { pieces, cost } = candidate;
                            const joint = tableFor('pair' + pieces[0].id, () =>
                                piecesTable(pieces, moves.free),
                            );
                            const all = [...pieces, ...locked];
                            const estimate = (values: readonly number[]) =>
                                Math.max(
                                    joint.estimate(values.slice(0, 2)),
                                    ...all.map(({ orbit, id }, i) =>
                                        values[i] === id * (orbit === 'EDGES' ? 2 : 3) ? 0 : 1,
                                    ),
                                );
                            const alg = idaPieces(
                                state,
                                all,
                                moves.free,
                                estimate,
                                Math.min(8, cost - 1),
                                performance.now() + 12,
                            );
                            if (alg !== undefined) {
                                candidate.fallback = alg;
                                candidate.cost = moveCount(alg);
                            }
                        }
                    best.sort((a, b) => a.cost - b.cost);
                    const { pieces, fallback } = best[0];
                    if (fallback === undefined) throw new Error('No insertion for ' + name);
                    const protectedPieces = [...locked, ...pieces];
                    const faces = slotFaces[pieces[0].id - 4];
                    const explanationParams: Stage['explanationParams'] =
                        name === 'pair'
                            ? {
                                  color1: 'solveColor' + centerColors[frameCenters[faces[0]]],
                                  color2: 'solveColor' + centerColors[frameCenters[faces[1]]],
                              }
                            : {};
                    add(name, fallback, (p) => atHome(p, protectedPieces), {
                        lessonId,
                        explanationParams,
                    });
                    locked.push(...pieces);
                    remaining.splice(remaining.indexOf(pieces), 1);
                }
            };
            if (method === 'beginner') {
                solveSlots(
                    lowerCorners.map((piece) => [piece]),
                    moves.insertions,
                    'corner',
                    'corners',
                );
                const set = await loadAlgSet('drills333', cube);
                const insertion = new Alg(set.cases.find((c) => c.id === 'middle')!.algorithms[0]);
                const edgeMoves = actions(kp, [
                    ...movesFor('U'),
                    ...['', 'y', 'y2', "y'"].flatMap((y) =>
                        [insertion, insertion.invert()].map((alg) =>
                            sequence(y, alg.toString(), new Alg(y).invert().toString()),
                        ),
                    ),
                ]);
                solveSlots(
                    middle.map((piece) => [piece]),
                    edgeMoves,
                    'edge',
                    'middle',
                );
            } else {
                solveSlots(
                    lowerCorners.map((piece, i) => [piece, ...edges(slotEdges[i])]),
                    moves.insertions,
                    'pair',
                    'f2l',
                );
            }
        } else {
            const face = method === 'ortega' || method === 'egPractice';
            const goals = face ? arrangements([12, 15, 18, 21]) : undefined;
            const table = tableFor(method + '222', () => piecesTable(lowerCorners, moves.basic, goals));
            add(
                face ? 'face' : 'layer',
                sequence(...table.solve(state)),
                (p) => matchesStage(p, solved, face ? 'face' : 'first'),
                { lessonId: face ? 'firstFace' : 'firstLayer' },
            );
        }
        async function finish(
            set: string,
            goal: StageGoal,
            lesson: string,
            ids?: string[],
            allowBottom?: boolean,
        ) {
            const selection = await lastLayer(state, solved, cube, set, goal, lesson, ids, allowBottom);
            const { alg, lessonId, caseId, caseName, main, before, after } = selection;
            add(lesson, alg, (p) => matchesStage(p, solved, goal), {
                lessonId,
                caseId,
                mainAlgorithm: main,
                preAdjustment: before,
                postAdjustment: after,
                explanationKey: caseId ? 'solveExplainCase' : 'solveExplainStage',
                explanationParams: { caseName: caseName ?? '' },
            });
        }
        if (method === 'cllPractice') {
            await finish('fullCLL', 'solved', 'cllPractice');
        } else if (method === 'egPractice') {
            try {
                const selection = await lastLayer(
                    state,
                    solved,
                    cube,
                    'eg',
                    'solved',
                    'egConcept',
                    undefined,
                    true,
                );
                if (!selection.caseId) return { status: 'timeout' };
                add('egConcept', selection.alg, viable, {
                    lessonId: 'egConcept',
                    caseId: selection.caseId,
                });
            } catch (error) {
                if (error instanceof UnrecognizedCase) return { status: 'timeout' };
                throw error;
            }
        } else if (cube === '222') {
            await finish('oll222', 'orientation', method === 'ortega' ? 'oll2' : 'orient2');
            await finish(
                'pbl222',
                'solved',
                method === 'ortega' ? 'pbl2' : 'perm2',
                method === 'ortega' ? undefined : ['tperm', 'yperm'],
                true,
            );
        } else if (method === 'cfopFull') {
            await finish('fullOLL', 'orientation', 'oll3');
            await finish('fullPLL', 'solved', 'pll3');
        } else {
            await finish('oll333', 'edgeOrientation', 'yellowCross', ['dot', 'el', 'line']);
            await finish('oll333', 'orientation', 'orient', [
                'sune',
                'antisune',
                'pi',
                'h',
                't',
                'l',
                'u',
            ]);
            await finish('pll333', 'cornerPermutation', 'permCorners', ['tperm', 'yperm']);
            await finish('pll333', 'solved', 'permEdges', ['ua', 'ub', 'hperm', 'zperm']);
        }
    }
    if (initialFrame) {
        stages[0].alg = sequence(initialFrame, stages[0].alg);
        stages[0].moves = moveCount(stages[0].alg);
    }
    const alg = sequence(...stages.map((stage) => stage.alg));
    // Rebase the color labels, then replay exactly the stages returned to the player.
    const undoFrame = new Alg(neutralFrame).invert();
    let replay = solved.applyAlg(undoFrame).applyAlg(scramble);
    for (const [i, stage] of stages.entries()) {
        replay = replay.applyAlg(stage.alg);
        if (!checks[i](replay)) throw new Error('Solution replay failed at ' + stage.id);
    }
    if (!viable(start.applyAlg(alg).applyAlg(undoFrame)))
        throw new Error('Solution replay failed to solve the cube');
    return {
        status: 'solved',
        alg,
        metric: cube === '222' ? 'HTM' : 'OBTM',
        moves: stages.reduce((sum, stage) => sum + stage.moves, 0),
        quality: cube === '222' && method === 'shortest' ? 'provenOptimal' : 'heuristic',
        stages,
    };
}
