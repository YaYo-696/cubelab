import { KPattern } from 'cubing/kpuzzle';

export type LastLayerPattern = {
    kind: 'fullOLL' | 'fullPLL' | 'fullCLL' | 'eg';
    co: string;
    cp?: string;
    eo?: string;
    ep?: string;
    down?: string;
};
type Sticker = readonly [orbit: 'CORNERS' | 'EDGES', index: number, facelet: number];
const c = (i: number, f: number): Sticker => ['CORNERS', i, f];
const e = (i: number, f: number): Sticker => ['EDGES', i, f];
// KPuzzle labels top corners UFR, URB, UBL, ULF and top edges UF, UR, UB, UL.
const top3 = [c(2, 0), e(2, 0), c(1, 0), e(3, 0), null, e(1, 0), c(3, 0), e(0, 0), c(0, 0)];
const top2 = [c(2, 0), c(1, 0), c(3, 0), c(0, 0)];
const sides = [
    [c(3, 1), e(0, 1), c(0, 2)],
    [c(0, 1), e(1, 1), c(1, 2)],
    [c(1, 1), e(2, 1), c(2, 2)],
    [c(2, 1), e(3, 1), c(3, 2)],
];
const lower = [
    [c(5, 2), c(4, 1)],
    [c(4, 2), c(7, 1)],
    [c(7, 2), c(6, 1)],
    [c(6, 2), c(5, 1)],
];
// Conceptual palette with yellow on U, white on D and green on F.
const colors = {
    CORNERS: ['yog', 'ybo', 'yrb', 'ygr', 'wgo', 'wrg', 'wbr', 'wob'],
    EDGES: ['yg', 'yo', 'yb', 'yr'],
};
function color(pattern: KPattern, sticker: Sticker | null) {
    if (!sticker) return 'y';
    const [orbit, slot, facelet] = sticker,
        { pieces, orientation } = pattern.patternData[orbit];
    const piece = colors[orbit][pieces[slot]];
    return piece ? piece[(facelet - orientation[slot] + piece.length) % piece.length] : '?';
}
export function lastLayerStickers(state: KPattern, includeLower = false) {
    const size = state.patternData.EDGES ? 3 : 2;
    const top = (size === 3 ? top3 : top2).map((s) => color(state, s)).join('');
    const strips = sides.map((row) =>
        row
            .filter((s) => size === 3 || s[0] === 'CORNERS')
            .map((s) => color(state, s))
            .join(''),
    );
    return {
        size,
        top,
        strips,
        lower: includeLower ? lower.map((row) => row.map((s) => color(state, s)).join('')) : [],
    };
}
const digits = (value: string) => Array.from(value, Number);
export function patternFromVectors(solved: KPattern, pattern: LastLayerPattern) {
    const data = structuredClone(solved.patternData);
    data.CORNERS.orientation.splice(0, 4, ...digits(pattern.co));
    if (pattern.cp) data.CORNERS.pieces.splice(0, 4, ...digits(pattern.cp));
    if (pattern.down) data.CORNERS.pieces.splice(4, 4, ...digits(pattern.down).map((n) => n + 4));
    if (pattern.eo) data.EDGES.orientation.splice(0, 4, ...digits(pattern.eo));
    if (pattern.ep) data.EDGES.pieces.splice(0, 4, ...digits(pattern.ep));
    return new KPattern(solved.kpuzzle, data);
}
export function lastLayerKey(state: KPattern, kind: LastLayerPattern['kind']) {
    const palette = 'grbo';
    let canonical: string | undefined;
    for (const auf of ['', 'U', 'U2', "U'"]) {
        const { top, strips, lower } = lastLayerStickers(state.applyAlg(auf), kind === 'eg');
        const text = [top, ...strips, ...lower].join('/');
        const keys =
            kind === 'fullOLL'
                ? [text.replace(/[a-z]/g, (c) => (c === 'y' ? '1' : '0'))]
                : [0, 1, 2, 3].map((i) =>
                      text.replace(/[grbo]/g, (c) => palette[(palette.indexOf(c) + i) % 4]),
                  );
        for (const key of keys) if (canonical === undefined || key < canonical) canonical = key;
    }
    return canonical!;
}
export function validLastLayer(state: KPattern, kind: LastLayerPattern['kind']) {
    const { CORNERS, EDGES } = state.patternData;
    if (CORNERS.pieces.slice(0, 4).some((piece) => piece >= 4)) return false;
    if (CORNERS.orientation.slice(4).some(Boolean)) return false;
    if (kind !== 'eg' && CORNERS.pieces.slice(4).some((piece, i) => piece !== i + 4)) return false;
    if (
        EDGES &&
        (EDGES.pieces.slice(0, 4).some((piece) => piece >= 4) ||
            EDGES.pieces.slice(4).some((piece, i) => piece !== i + 4) ||
            EDGES.orientation.slice(4).some(Boolean))
    )
        return false;
    return (
        kind !== 'fullPLL' || (!CORNERS.orientation.some(Boolean) && !EDGES.orientation.some(Boolean))
    );
}
export function isFullPattern(pattern: { kind: string }): pattern is LastLayerPattern {
    return ['fullOLL', 'fullPLL', 'fullCLL', 'eg'].includes(pattern.kind);
}
