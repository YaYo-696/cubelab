// Verificación de los drops de 5x5, 6x6 y 7x7 (Claude). Desde la raíz del repo:
// node --experimental-strip-types content-drop/_simuladores/big/lessons.ts
import { readFileSync } from 'node:fs';
import { puzzles } from 'cubing/puzzles';
import { colorsOfBig, stickerAtBig, type BigSize } from '../../../src/core/fromColors/readColorsBig.ts';

const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
// Same token list as normalizeBigCube(id, input, content = true) in src/puzzles/bigCube/notation.ts.
function legal(size: number) {
    const moves: string[] = [...faces, ...faces.flatMap((f) => Array.from({ length: size - 2 }, (_, i) => (i ? String(i + 2) : '') + f + 'w'))];
    moves.push(...faces.map((f) => '2' + f + 'w'), 'x', 'y', 'z');
    if (size % 2) moves.push('M', 'E', 'S');
    for (const f of faces) {
        moves.push(f.toLowerCase());
        for (let first = 2; first < size; first++) {
            moves.push(first + f);
            for (let last = first + 1; last < size; last++) moves.push(first + '-' + last + f + 'w');
        }
    }
    return new Set(moves.flatMap((m) => ['', "'", '2', "2'"].map((s) => m + s)));
}
const inverse = (alg: string) => alg.split(' ').filter(Boolean).reverse().map((t) => (t.endsWith("'") ? t.slice(0, -1) : t.endsWith('2') ? t : t + "'")).join(' ');
let failures = 0;
const fail = (msg: string) => { failures++; console.log('  FALLA', msg); };
async function changed(n: BigSize, alg: string) {
    const a = await colorsOfBig(n, ''), b = await colorsOfBig(n, alg);
    const out: string[] = [];
    for (const f of ['U', 'D', 'F', 'B', 'R', 'L']) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const id = (await stickerAtBig(n, f, r, c))!; if (a[id] !== b[id]) out.push(f + r + c); }
    return out;
}
const isCenter = (n: number, s: string) => { const r = Number(s[1]), c = Number(s[2]); return r > 0 && r < n - 1 && c > 0 && c < n - 1; };
for (const n of [5, 6, 7] as const) {
    const id = `${n}${n}${n}`;
    console.log(`== ${id}`);
    const sets = JSON.parse(readFileSync(`content-drop/${id}/algsets.json`, 'utf-8'));
    const lessons = JSON.parse(readFileSync(`content-drop/${id}/lessons.json`, 'utf-8'));
    const tokens = legal(n);
    const kp = await puzzles[`${n}x${n}x${n}` as '5x5x5'].kpuzzle();
    const check = (alg: string, where: string) => { for (const t of alg.split(' ').filter(Boolean)) if (!tokens.has(t)) fail(`${where}: «${t}» no es notación de la app`); };
    const solvedColors = await colorsOfBig(n, '');
    for (const set of sets.sets) {
        if (!set.id.startsWith(id + '-')) fail('prefijo de set ' + set.id);
        for (const c of set.cases) {
            check(c.setup, c.id + '.setup');
            if (/(^| )[xyz]/.test(c.setup)) fail(c.id + ': setup con rotación');
            for (const alg of c.algs) {
                check(alg, c.id);
                const end = await colorsOfBig(n, kp.defaultPattern().applyAlg(c.setup).applyAlg(alg));
                if (Object.keys(end).some((k) => end[k] !== solvedColors[k])) fail(c.id + ': el algoritmo no resuelve el setup');
                if (inverse(alg) !== c.setup) fail(c.id + ': el setup no es el inverso');
            }
            console.log(`  caso ${c.id}: resuelve su setup; cambia ${(await changed(n, c.algs[0])).join(' ')}`);
        }
    }
    const ids = new Set(lessons.lessons.map((l: { id: string }) => l.id));
    const setIds = new Set(sets.sets.map((s: { id: string }) => s.id));
    for (const l of lessons.lessons) {
        for (const p of l.prerequisites) if (!ids.has(p)) fail(l.id + ': prerrequisito inexistente ' + p);
        for (const r of l.algSetRefs) if (!setIds.has(r)) fail(l.id + ': set inexistente ' + r);
        for (const k of ['es', 'en']) if (!l.title[k] || !l.body[k] || !l.objective[k]) fail(l.id + ': falta texto ' + k);
        for (const d of l.demos) {
            check(d.setup, l.id + '.demo'); check(d.alg, l.id + '.demo');
            if (d.setup) { const end = await colorsOfBig(n, kp.defaultPattern().applyAlg(d.setup).applyAlg(d.alg)); if (Object.keys(end).some((k) => end[k] !== solvedColors[k])) fail(l.id + ': la demo no resuelve su setup'); }
        }
    }
    for (const alg of ["Dw R F' U R' F Dw'", "3Dw R F' U R' F 3Dw'"]) {
        const ch = await changed(n, alg);
        const centers = ch.filter((s) => isCenter(n, s));
        if (centers.length) fail(`${alg} toca centros: ${centers.join(' ')}`);
        const wingsF = ch.filter((s) => s[0] === 'F' && (s[2] === '0' || s[2] === String(n - 1)) && s[1] !== '0' && s[1] !== String(n - 1));
        console.log(`  ${alg}: no toca centros; en F cambia ${wingsF.join(' ')}`);
    }
}
console.log(failures ? `FALLAS: ${failures}` : 'Todo verificado.');
process.exit(failures ? 1 : 0);
