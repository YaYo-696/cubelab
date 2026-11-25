// Verificación de cubos grandes reducidos, 4x4 a 7x7 (Claude). Desde la raíz del repo:
// node --experimental-strip-types content-drop/_simuladores/colores/grandes.ts
import { puzzles } from 'cubing/puzzles';
import { colorsOfBig, readColorsBig, stickerAtBig, bigParity, colorLayoutBig, type BigSize } from '../../../src/core/fromColors/readColorsBig.ts';
import { colorsOf444, readColors444 } from '../../../src/core/fromColors/readColors444.ts';
const faces = ['U','D','F','B','R','L'];
async function changed(n: BigSize, alg: string) {
  const a = await colorsOfBig(n, ''), b = await colorsOfBig(n, alg); const out: string[] = [];
  for (const f of faces) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const id = (await stickerAtBig(n, f, r, c))!; if (a[id] !== b[id]) out.push(f + r + c); }
  return out.join(' ');
}
for (const n of [4, 6] as const) console.log(n + 'x' + n, 'OLL changes:', await changed(n, bigParity[n].oll), '| PLL changes:', await changed(n, bigParity[n].pll));
let seed = 13; const rnd = (k: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * k); };
const same = (a: Record<string,string>, b: Record<string,string>) => Object.keys(a).every(k => a[k] === b[k]);
for (const n of [4, 5, 6, 7] as const) {
  const kp = await puzzles[`${n}x${n}x${n}` as '4x4x4'].kpuzzle();
  const layout = await colorLayoutBig(n);
  const slice = `2-${n - 1}Rw`;
  const stats: Record<string, number> = {};
  for (let i = 0; i < 60; i++) {
    const mix = Array.from({ length: 25 }, () => [...'UDLRFB', slice][rnd(7)] + ['', "'", '2'][rnd(3)]).join(' ');
    const oll = n % 2 === 0 && rnd(2) === 1, pll = n % 2 === 0 && rnd(2) === 1;
    const grip = Array.from({ length: rnd(4) }, () => ['x','y','z'][rnd(3)]).join(' ');
    const p = n % 2 === 0 ? bigParity[n as 4 | 6] : undefined;
    const alg = [mix, oll ? p!.oll : '', 'R U F', pll ? p!.pll : '', grip].filter(Boolean).join(' ');
    const state = kp.defaultPattern().applyAlg(alg);
    const r = await readColorsBig(n, await colorsOfBig(n, state));
    if (!r.ok) throw new Error(n + ' rejected ' + JSON.stringify(r.issues).slice(0, 200));
    const k = r.parity.map(x => x.key.slice(-3)).join('+') || 'none'; const e = [oll ? 'Oll' : '', pll ? 'Pll' : ''].filter(Boolean).join('+') || 'none';
    if (k !== e) throw new Error(n + ' parity ' + k + ' expected ' + e);
    stats[k] = (stats[k] ?? 0) + 1;
    const after = state.applyAlg(r.parity.map(x => x.alg).join(' ')).applyAlg(r.rotation);
    if (!same(await colorsOfBig(n, after), await colorsOfBig(n, r.scramble333))) throw new Error(n + ' mismatch ' + alg);
    if (n === 4) { const o = await readColors444(await colorsOf444(state)); if (!o.ok || o.scramble333 !== r.scramble333 || o.rotation !== r.rotation) throw new Error('444 cross-check'); }
  }
  let bad = 0;
  for (let i = 0; i < 20; i++) { const mix = Array.from({ length: 30 }, () => ['U','R','F','2R','2U','2F','3Rw'][rnd(7)] + ['', "'", '2'][rnd(3)]).join(' '); const r = await readColorsBig(n, await colorsOfBig(n, mix)); if (!r.ok && r.issues.some(x => x.key.startsWith('fromColorsBig'))) bad++; }
  console.log(`${n}x${n}`, 'stickers', layout.stickers.length, '| reduced 60/60 ok', JSON.stringify(stats), '| unreduced rejected', bad + '/20');
}
// odd cube with a flipped edge = painting mistake
const base = await colorsOfBig(5, "R U F'"); const c = { ...base };
const pairs = [[await stickerAtBig(5,'U',4,1), await stickerAtBig(5,'F',0,1)], [await stickerAtBig(5,'U',4,2), await stickerAtBig(5,'F',0,2)], [await stickerAtBig(5,'U',4,3), await stickerAtBig(5,'F',0,3)]];
for (const [a, b] of pairs) { [c[a!], c[b!]] = [c[b!], c[a!]]; }
const flip = await readColorsBig(5, c); console.log('5x5 flipped edge ->', flip.ok ? 'ok?!' : flip.issues.map(x => x.key).join());
process.exit(0);
