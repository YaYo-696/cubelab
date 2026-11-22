import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { generateCase } from '../../src/workers/case';
import { trainingSets } from '../../src/puzzles/content/trainer';
import { loadAlgSet } from '../../src/puzzles/content';
import { matchesCase, matchesStage, type AcademyCase } from '../../src/core/academy/cases';
import { atHome, lowerCorners, turns } from '../../src/core/solver/coordinates';
import { translate } from '../../src/i18n/translate';

for (const puzzle of ['222', '333'] as const) {
    it(
        puzzle + ' genera cada caso con los cuatro AUF y verifica todas las piezas',
        async () => {
            const signal = new AbortController().signal;
            const solved = (
                await puzzles[puzzle === '222' ? '2x2x2' : '3x3x3'].kpuzzle()
            ).defaultPattern();
            for (const config of trainingSets[puzzle]) {
                const cases = (await loadAlgSet(config.id, puzzle)).cases as AcademyCase[];
                for (const lang of ['es', 'en'] as const) {
                    expect(translate(lang, config.nameKey)).not.toBe(config.nameKey);
                    for (const group of config.groups) {
                        const label = 'aTitle_' + group.lessonId;
                        expect(translate(lang, label)).not.toBe(label);
                    }
                }
                for (const entry of cases)
                    for (const auf of turns) {
                        const result = await generateCase(puzzle, entry.id, signal, config.id, auf);
                        const context = config.id + ' / ' + entry.id + ' / ' + auf;
                        const state = solved.applyAlg(result.scramble);
                        const reference = solved.applyAlg(entry.referenceSetup);
                        expect(result.verified, context).toBe(true);
                        expect(state.isIdentical(reference.applyAlg(auf)), context).toBe(true);
                        expect(
                            state.applyAlg(result.preAdjustment ?? '').isIdentical(reference),
                            context,
                        ).toBe(true);
                        expect(matchesCase(state, solved, entry.pattern), context).toBe(true);
                        expect(
                            puzzle === '333'
                                ? matchesStage(state, solved, 'f2l')
                                : config.lowerFace
                                  ? matchesStage(state, solved, 'face')
                                  : atHome(state, lowerCorners),
                            context,
                        ).toBe(true);
                        expect(result.scramble).not.toMatch(/2'(?=\s|$)/);
                    }
            }
        },
        90000,
    );
}
