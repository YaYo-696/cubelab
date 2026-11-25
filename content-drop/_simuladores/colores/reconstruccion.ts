import { puzzles } from 'cubing/puzzles';
import { colorLayout, colorsOf, readColors, colorPuzzles, type ColorPuzzle } from '../../../src/core/fromColors/readColors.ts';
const names = { '333': '3x3x3', '222': '2x2x2', pyram: 'pyraminx', skewb: 'skewb' } as const;
const moves = { '333': ['U','D','L','R','F','B'], '222': ['U','R','F'], pyram: ['U','L','R','B','u','l','r','b'], skewb: ['R','U','L','B'] };
const rots = { '333': ['x','y','z'], '222': ['x','y','z'], pyram: ['Uv','Lv','Rv','Bv'], skewb: ['x','y','z'] };
let seed = 7; const rnd = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * n); };
const scrambleFor = (p: ColorPuzzle, n: number) => Array.from({ length: n }, () => moves[p][rnd(moves[p].length)] + ["", "'", p==='pyram'||p==='skewb'? "'" : '2'][rnd(3)]).join(' ');
const same = (a: Record<string,string>, b: Record<string,string>) => Object.keys(a).every(k => a[k] === b[k]);
for (const p of colorPuzzles) {
  const kp = await puzzles[names[p]].kpuzzle();
  const layout = await colorLayout(p);
  let ok = 0, rotated = 0; const t0 = performance.now(); let maxMs = 0;
  for (let i = 0; i < 200; i++) {
    const grip = Array.from({ length: rnd(4) }, () => rots[p][rnd(3)]).join(' ');
    const state = kp.defaultPattern().applyAlg(scrambleFor(p, 25)).applyAlg(grip);
    const painted = await colorsOf(p, state);
    const s = performance.now();
    const r = await readColors(p, painted);
    maxMs = Math.max(maxMs, performance.now() - s);
    if (!r.ok) throw new Error(p + ' legal state rejected: ' + JSON.stringify(r.issues) + ' grip ' + grip);
    if (/[xyz]|v/.test(r.scramble)) throw new Error('rotation in scramble ' + r.scramble);
    const rebuilt = await colorsOf(p, r.scramble);
    const expected = await colorsOf(p, state.applyAlg(r.rotation));
    if (!same(rebuilt, expected)) throw new Error(p + ' mismatch for grip ' + grip);
    if (r.rotation) rotated++;
    ok++;
  }
  console.log(p, 'stickers', layout.stickers.length, 'palette', layout.palette.join(','), '| legal ok', ok, 'rotated', rotated, '| ms max', maxMs.toFixed(0), 'total', (performance.now()-t0).toFixed(0));
  // ---- illegal states ----
  const base = await colorsOf(p, scrambleFor(p, 25));
  const expectIssue = async (name: string, painted: Record<string,string>, key: string) => {
    const r = await readColors(p, painted);
    if (r.ok || !r.issues.some(x => x.key === key)) throw new Error(p + ' ' + name + ' expected ' + key + ' got ' + JSON.stringify(r));
    return r.issues.map(x=>x.key).join('+');
  };
  const slotsOf = (orbit: string) => { const m = new Map<number, string[]>(); for (const s of layout.stickers.filter(s => s.orbit === orbit)) m.set(s.location, [...(m.get(s.location) ?? []), s.id]); for (const v of m.values()) v.sort(); return [...m.values()]; };
  const twist = (orbit: string, slot = 0) => { const ids = slotsOf(orbit)[slot]; const c = { ...base }; const cols = ids.map(id => base[id]); ids.forEach((id, i) => c[id] = cols[(i + 1) % ids.length]); return c; };
  const swapSlots = (orbit: string, a: number, b: number) => { const s = slotsOf(orbit); const c = { ...base }; s[a].forEach((id, i) => { c[id] = base[s[b][i]]; c[s[b][i]] = base[id]; }); return c; };
  const out: string[] = [];
  { const c = { ...base }; delete c[layout.stickers[3].id]; out.push('missing:' + await expectIssue('missing', c, 'fromColorsMissing')); }
  { const c = { ...base }; const id = layout.stickers.find(s => base[s.id] !== layout.palette[0])!.id; c[id] = layout.palette[0]; out.push('count:' + await expectIssue('count', c, 'fromColorsCount')); }
  if (p === '333' || p === '222') out.push('twist:' + await expectIssue('twist', twist('CORNERS'), 'fromColorsTwist'));
  if (p === '333' || p === 'pyram') out.push('flip:' + await expectIssue('flip', twist('EDGES'), 'fromColorsFlip'));
  if (p === '333' || p === 'pyram') out.push('swap:' + await expectIssue('swap', swapSlots('EDGES', 0, 1), 'fromColorsSwap'));
  if (p === 'skewb') { out.push('centers:' + await expectIssue('centers', swapSlots('CENTERS', 0, 1), 'fromColorsSwap'));
    out.push('cornerTwist:' + await expectIssue('ctwist', twist('CORNERS', 0), 'fromColorsTwist')); }
  { // two stickers swapped between different pieces -> impossible pieces
    const c = { ...base }; const e = slotsOf(p === 'pyram' ? 'EDGES' : 'CORNERS'); const a = e[0][0], b = e[1][0];
    if (c[a] !== c[b]) { [c[a], c[b]] = [c[b], c[a]]; const r = await readColors(p, c); out.push('stickerSwap:' + (r.ok ? 'ok' : r.issues.map(x => x.key).join('+'))); } }
  console.log('   illegal ->', out.join(' | '));
}
process.exit(0);
