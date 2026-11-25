// Verificación del 4x4 reducido (Claude). Desde la raíz del repo:
// node --experimental-strip-types content-drop/_simuladores/colores/cuatro.ts
import { puzzles } from 'cubing/puzzles';
import { colorsOf444, readColors444, stickerAt444, ollParity, pllParity } from '../../../src/core/fromColors/readColors444.ts';
const kp = await puzzles['4x4x4'].kpuzzle();
const solved = await colorsOf444('');
const at = (f: string, r: number, c: number) => stickerAt444(f, r, c);
const diff = (a: Record<string,string>, b: Record<string,string>) => Object.keys(a).filter(k => a[k] !== b[k]);
async function describe(alg: string) {
  const c = await colorsOf444(alg); const d = diff(solved, c);
  const named: string[] = [];
  for (const f of ['U','D','F','B','R','L']) for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) { const id = (await at(f, r, col))!; if (d.includes(id)) named.push(f + r + col + '=' + c[id]); }
  return named.join(' ');
}
console.log('OLL parity changes:', await describe(ollParity));
console.log('PLL parity changes:', await describe(pllParity));
// reduction kept by the parity algs?
const r1 = await readColors444(await colorsOf444(ollParity)); console.log('solved+OLL ->', JSON.stringify(r1.ok ? r1.parity.map(p=>p.key) : r1.issues.map(i=>i.key)));
const r2 = await readColors444(await colorsOf444(pllParity)); console.log('solved+PLL ->', JSON.stringify(r2.ok ? r2.parity.map(p=>p.key) : r2.issues.map(i=>i.key)));
let seed = 5; const rnd = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * n); };
const outer = ['U','D','L','R','F','B'];
const same = (a: Record<string,string>, b: Record<string,string>) => Object.keys(a).every(k => a[k] === b[k]);
const stats: Record<string, number> = {};
for (let i = 0; i < 200; i++) {
  const mix = Array.from({ length: 25 }, () => outer[rnd(6)] + ['', "'", '2'][rnd(3)]).join(' ');
  const oll = rnd(2) === 1, pll = rnd(2) === 1;
  const grip = Array.from({ length: rnd(4) }, () => ['x','y','z'][rnd(3)]).join(' ');
  const alg = [mix, oll ? ollParity : '', mix.split(' ').slice(0, 7).join(' '), pll ? pllParity : '', grip].filter(Boolean).join(' ');
  const state = kp.defaultPattern().applyAlg(alg);
  const r = await readColors444(await colorsOf444(state));
  if (!r.ok) throw new Error('rejected ' + JSON.stringify(r.issues).slice(0, 300));
  const k = r.parity.map(p => p.key.slice(-3)).join('+') || 'none';
  const expected = [oll ? 'Oll' : '', pll ? 'Pll' : ''].filter(Boolean).join('+') || 'none';
  stats[expected + '->' + k] = (stats[expected + '->' + k] ?? 0) + 1;
  // reconstruction on the 4x4: state + parity algs + rotation == scramble333 done on a solved 4x4
  const after = state.applyAlg(r.parity.map(p => p.alg).join(' ')).applyAlg(r.rotation);
  if (!same(await colorsOf444(after), await colorsOf444(r.scramble333))) throw new Error('mismatch ' + alg);
}
console.log('reduced states ok 200 |', JSON.stringify(stats));
// unreduced
let bad = 0; const keys: Record<string, number> = {};
for (let i = 0; i < 50; i++) {
  const mix = Array.from({ length: 30 }, () => ['U','D','L','R','F','B','2R','2U','2F','Rw','Uw'][rnd(11)] + ['', "'", '2'][rnd(3)]).join(' ');
  const r = await readColors444(await colorsOf444(mix));
  if (!r.ok) { bad++; for (const x of r.issues) keys[x.key] = (keys[x.key] ?? 0) + 1; }
}
console.log('unreduced rejected', bad, '/50', JSON.stringify(keys));
// twisted corner on a reduced cube
const base = await colorsOf444("R U F' D2 L");
const c = { ...base }; const ids = [await at('U',3,3), await at('F',0,3), await at('R',0,0)] as string[];
const cols = ids.map(id => base[id]); ids.forEach((id, i) => c[id] = cols[(i + 1) % 3]);
const tw = await readColors444(c); console.log('twisted corner ->', tw.ok ? 'ok?!' : tw.issues.map(x => x.key + ':' + x.stickers.length).join());
process.exit(0);
