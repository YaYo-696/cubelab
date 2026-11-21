import { expect, it } from 'vitest';
import { registry } from '../../src/puzzles/registry';
import { generateCase } from '../../src/workers/case';
for (const id of ['222', '333'] as const) {
    it(id + ' · carga contenido y verifica el caso desde una referencia independiente', async () => {
        const m = await registry[id](), set = await m.loadAlgSet('basic');
        const lesson = (await m.loadCourse('notation')).modules[0].lessons[0];
        const c = set.cases.find(c => c.id === lesson.caseId)!;
        const result = await generateCase(id, c.id, new AbortController().signal);
        expect(result.verified).toBe(true);
        const state = m.applyAlg(m.solvedState(), result.scramble);
        expect(state).toBe(m.applyAlg(m.solvedState(), c.referenceSetup));
        for (const alg of c.algorithms)
            expect(m.isSolved(m.applyAlg(state, alg))).toBe(true);
        await expect(generateCase(id, '?', new AbortController().signal)).rejects.toThrow();
        await expect(generateCase(id, c.id, AbortSignal.abort())).rejects.toThrow();
        await expect(m.loadCourse('?')).rejects.toThrow();
    });
}
