import { expect, it } from 'vitest';
import { makeCube } from '../../src/puzzles/module';
import { NotationError } from '../../src/puzzles/notation';
for (const id of ['222', '333'] as const) {
    const mod = makeCube(id);
    it(id + ' normaliza notación y produce un estado reproducible', () => {
        const seq = mod.notation.normalize(" U2'\nR2′ F2’ R′  x y' z2 ");
        expect(seq).toBe("U2 R2 F2 R' x y' z2");
        expect(mod.applyAlg(mod.solvedState(), seq)).not.toBe(mod.solvedState());
    });
    it.each([
        ['', 0],
        [' \t ', 0],
        [' R U3', 4],
        ['R\n Q', 3],
        ['U22', 2],
        ['Rx', 1],
        ["R2''", 3],
        ["U R2'x", 5],
    ])('%s identifica el carácter inválido', (input, index) => {
        try {
            mod.notation.normalize(String(input));
            throw Error('accepted');
        } catch (error) {
            expect(error).toBeInstanceOf(NotationError);
            expect((error as NotationError).offset).toBe(index);
        }
    });
}
