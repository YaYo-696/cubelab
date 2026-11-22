import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { frames, movesFor, sequence } from './coordinates';

const permutations = 5040;
const twists = 729;
const size = permutations * twists;
const moves = movesFor('URF');
const key = '222-urf-htm-kpuzzle-0.63.8-v1';

function permutationRank(values: number[]) {
    let rank = 0;
    for (let i = 0; i < 7; i++) {
        let smaller = 0;
        for (let j = i + 1; j < 7; j++) if (values[j] < values[i]) smaller++;
        rank = rank * (7 - i) + smaller;
    }
    return rank;
}
function permutationAt(rank: number) {
    const digits = new Array<number>(7);
    for (let i = 6; i >= 0; i--) {
        digits[i] = rank % (7 - i);
        rank = Math.floor(rank / (7 - i));
    }
    const available = [0, 1, 2, 3, 4, 5, 6];
    return digits.map((digit) => available.splice(digit, 1)[0]);
}
const twistRank = (values: number[]) => values.slice(0, 6).reduce((sum, v) => sum * 3 + v, 0);
function twistAt(rank: number) {
    const values = new Array<number>(7);
    let sum = 0;
    for (let i = 5; i >= 0; i--) {
        values[i] = rank % 3;
        sum += values[i];
        rank = Math.floor(rank / 3);
    }
    values[6] = (3 - (sum % 3)) % 3;
    return values;
}
function openCache() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('cubelab-solver-cache', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('tables');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('solver cache blocked'));
    });
}
async function cachedTable() {
    const db = await openCache();
    try {
        return await new Promise<unknown>((resolve, reject) => {
            const request = db.transaction('tables').objectStore('tables').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
}
async function saveTable(table: Uint8Array) {
    const db = await openCache();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('tables', 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(tx.error);
            tx.objectStore('tables').put(table, key);
        });
    } finally {
        db.close();
    }
}
function makeCoordinates(kp: KPuzzle) {
    const transforms = moves.map((move) => kp.moveToTransformation(move).transformationData.CORNERS);
    const anchor = transforms[0].permutation.findIndex((_, slot) =>
        transforms.every((t) => t.permutation[slot] === slot && t.orientationDelta[slot] === 0),
    );
    if (anchor < 0) throw new Error('2x2 fixed corner missing');
    const slots = Array.from({ length: 8 }, (_, slot) => slot).filter((slot) => slot !== anchor);
    const transitions = transforms.map((t) => ({
        from: slots.map((slot) => slots.indexOf(t.permutation[slot])),
        delta: slots.map((slot) => t.orientationDelta[slot]),
    }));
    const perm = Uint16Array.from({ length: permutations * moves.length }, (_, index) => {
        const values = permutationAt(Math.floor(index / moves.length));
        return permutationRank(transitions[index % moves.length].from.map((i) => values[i]));
    });
    const twist = Uint16Array.from({ length: twists * moves.length }, (_, index) => {
        const values = twistAt(Math.floor(index / moves.length));
        const { from, delta } = transitions[index % moves.length];
        return twistRank(from.map((i, slot) => (values[i] + delta[slot]) % 3));
    });
    function step(state: number, move: number) {
        return (
            perm[Math.floor(state / twists) * moves.length + move] * twists +
            twist[(state % twists) * moves.length + move]
        );
    }
    return { anchor, slots, step };
}
async function distance(step: (state: number, move: number) => number, progress: (n: number) => void) {
    const cached = await cachedTable().catch(() => undefined);
    if (cached instanceof Uint8Array && cached.length === size && cached[0] === 0) return cached;
    const table = new Uint8Array(size).fill(255);
    const queue = new Uint32Array(size);
    let read = 0,
        write = 1;
    table[0] = 0;
    while (read < write) {
        const state = queue[read++];
        if ((read & 0x3ffff) === 0) progress(read / size);
        for (let i = 0; i < moves.length; i++) {
            const next = step(state, i);
            if (table[next] !== 255) continue;
            table[next] = table[state] + 1;
            queue[write++] = next;
        }
    }
    if (write !== size) throw new Error('2x2 incomplete distance table');
    await saveTable(table).catch(() => {});
    return table;
}
let prepared: Promise<{ model: ReturnType<typeof makeCoordinates>; table: Uint8Array }> | undefined;
export async function optimal222(pattern: KPattern, progress: (fraction: number) => void) {
    if (!prepared) {
        const model = makeCoordinates(pattern.kpuzzle);
        prepared = distance(model.step, progress).then((table) => ({ model, table }));
        prepared.catch(() => {
            prepared = undefined;
        });
    }
    const {
        model: { anchor, slots, step },
        table,
    } = await prepared;
    const frame = frames.find((alg) => {
        const c = pattern.applyAlg(alg).patternData.CORNERS;
        return c.pieces[anchor] === anchor && c.orientation[anchor] === 0;
    });
    if (frame === undefined) throw new Error('2x2 frame missing');
    const c = pattern.applyAlg(frame).patternData.CORNERS;
    let state =
        permutationRank(slots.map((slot) => slots.indexOf(c.pieces[slot]))) * twists +
        twistRank(slots.map((slot) => c.orientation[slot]));
    const result = [frame];
    while (state !== 0) {
        const move = moves.findIndex((_, i) => table[step(state, i)] + 1 === table[state]);
        if (move < 0) throw new Error('2x2 invalid distance table');
        state = step(state, move);
        result.push(moves[move]);
    }
    return sequence(...result);
}
