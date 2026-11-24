import { bigCubeSize, type BigCubeId } from '../events';
import { NotationError, standardHalfTurns } from '../notation';

const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
export const suffixes = ['', "'", '2'] as const;

export function outerBlocks(maxWidth: number) {
    return faces.flatMap((face) => [
        face,
        ...Array.from({ length: maxWidth - 1 }, (_, i) => (i ? String(i + 2) : '') + face + 'w'),
    ]);
}

function legalMoves(id: BigCubeId, content: boolean) {
    const size = bigCubeSize[id];
    const moves = [...outerBlocks(size - 1), ...faces.map((face) => '2' + face + 'w')];
    if (content) {
        moves.push('x', 'y', 'z');
        if (size % 2) moves.push('M', 'E', 'S');
        for (const face of faces) {
            moves.push(face.toLowerCase());
            for (let first = 2; first < size; first++) {
                moves.push(first + face);
                for (let last = first + 1; last < size; last++)
                    moves.push(first + '-' + last + face + 'w');
            }
        }
    }
    return moves.flatMap((move) => [...suffixes, "2'"].map((suffix) => move + suffix));
}

const tokens = new Map<string, readonly string[]>();
export function normalizeBigCube(id: BigCubeId, input: string, content = false) {
    const key = id + ':' + content;
    let legal = tokens.get(key);
    if (!legal) {
        legal = legalMoves(id, content);
        tokens.set(key, legal);
    }
    const words = Array.from(input.matchAll(/\S+/g), (match) => {
        const move = match[0].replace(/[’′]/g, "'");
        if (!legal.includes(move)) {
            let end = 0;
            while (
                end < move.length &&
                legal.some((candidate) => candidate.startsWith(move.slice(0, end + 1)))
            )
                end++;
            throw new NotationError(match.index + end);
        }
        return standardHalfTurns(move);
    });
    if (!words.length) throw new NotationError(0);
    return words.join(' ');
}
