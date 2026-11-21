// Sticker coordinates use x right, y up and z forward.
type Vec = [
    number,
    number,
    number
];
const faces = 'RLUDFB';
export const turns = [...faces].flatMap(face => ['', "'", '2'].map(s => face + s));
export const orientations = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(top => ['', 'y', 'y2', "y'"].map(spin => [top, spin].filter(Boolean).join(' ')));
function rotate([x, y, z]: Vec, axis: number): Vec {
    if (axis === 0)
        return [x, -z, y];
    if (axis === 1)
        return [z, y, -x];
    return [-y, x, z];
}
export function cubeModel(size: 2 | 3) {
    const stickers: {
        p: Vec;
        n: Vec;
        color: string;
    }[] = [];
    const limit = size - 1;
    for (let face = 0; face < 6; face++) {
        const axis = Math.floor(face / 2), side = face % 2 === 0 ? 1 : -1;
        for (let u = -limit; u <= limit; u += 2)
            for (let v = -limit; v <= limit; v += 2) {
                const p: Vec = [0, 0, 0], n: Vec = [0, 0, 0];
                p[axis] = side * limit;
                n[axis] = side;
                p[(axis + 1) % 3] = u;
                p[(axis + 2) % 3] = v;
                stickers.push({ p, n, color: faces[face] });
            }
    }
    const key = (p: Vec, n: Vec) => p.join(',') + '/' + n.join(',');
    const indices = new Map(stickers.map(({ p, n }, i) => [key(p, n), i]));
    const maps = new Map<string, number[]>();
    for (const move of [...faces, 'x', 'y', 'z']) {
        const face = faces.indexOf(move), whole = face < 0;
        const axis = whole ? 'xyz'.indexOf(move) : Math.floor(face / 2);
        const side = whole || face % 2 === 0 ? 1 : -1;
        for (const [suffix, count] of [['', 1], ['2', 2], ["'", 3]] as const) {
            const map = stickers.map(({ p, n }, index) => {
                if (!whole && p[axis] !== side * limit)
                    return index;
                for (let k = 0; k < (count * (side === 1 ? 3 : 1)) % 4; k++) {
                    p = rotate(p, axis);
                    n = rotate(n, axis);
                }
                return indices.get(key(p, n))!;
            });
            maps.set(move + suffix, map);
        }
    }
    const solved = stickers.map(s => s.color).join('');
    function apply(state: string, alg: string) {
        for (const token of alg.trim().split(/\s+/).filter(Boolean)) {
            const map = maps.get(token);
            if (!map)
                throw new RangeError('notation: ' + token);
            const next = Array<string>(state.length);
            for (let i = 0; i < map.length; i++)
                next[map[i]] = state[i];
            state = next.join('');
        }
        return state;
    }
    const roots = new Set(orientations.map(alg => apply(solved, alg)));
    const tables = new Map<number, Set<string>>();
    function tooClose(state: string, minimum: number) {
        if (!Number.isInteger(minimum) || minimum < 1)
            throw new RangeError('minSolveDistance');
        let table = tables.get(minimum);
        if (!table) {
            table = new Set(roots);
            let frontier = [...roots];
            for (let depth = 1; depth < minimum; depth++) {
                const next: string[] = [];
                for (const start of frontier)
                    for (const turn of turns) {
                        const end = apply(start, turn);
                        if (!table.has(end)) {
                            table.add(end);
                            next.push(end);
                        }
                    }
                frontier = next;
            }
            tables.set(minimum, table);
        }
        return table.has(state);
    }
    return { solved, apply, isSolved: (s: string) => roots.has(s), tooClose };
}
