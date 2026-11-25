import { puzzles } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { colorsOf, readColors, colorPuzzles } from '../../../src/core/fromColors/readColors.ts';
const names = { '333': '3x3x3', '222': '2x2x2', pyram: 'pyraminx', skewb: 'skewb' } as const;
const rots = { '333': ['x','y','z'], '222': ['x','y','z'], pyram: ['Uv','Lv','Rv','Bv'], skewb: ['x','y','z'] };
let seed = 99; const rnd = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * n); };
const shuffle = (n: number) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const parity = (v: number[]) => { let o = 0; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (v[i] > v[j]) o ^= 1; return o; };
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);
// ground truth for skewb corners: BFS in the app frame
const ks = await puzzles.skewb.kpuzzle();
const sk = ['R','U','L','B'].map(m => ks.moveToTransformation(m).transformationData.CORNERS);
const reach = new Set<string>(); { const q = [{ p: [0,1,2,3,4,5,6,7], o: [0,0,0,0,0,0,0,0] }]; reach.add('0123456700000000');
  for (let i = 0; i < q.length; i++) for (const t of sk) { const n = { p: t.permutation.map(f => q[i].p[f]), o: t.permutation.map((f, k) => (q[i].o[f] + t.orientationDelta[k]) % 3) }; const id = n.p.join('') + n.o.join(''); if (!reach.has(id)) { reach.add(id); q.push(n); } } }
console.log('skewb corner states', reach.size);
for (const p of colorPuzzles) {
  const kp = await puzzles[names[p]].kpuzzle();
  let legal = 0, illegal = 0;
  for (let i = 0; i < 300; i++) {
    const data: Record<string, { pieces: number[]; orientation: number[] }> = {};
    for (const orbit of kp.definition.orbits) {
      const fixedOrbit = (p === '333' && orbit.orbitName === 'CENTERS') || (p === 'pyram' && orbit.orbitName !== 'EDGES');
      const pieces = fixedOrbit ? [...Array(orbit.numPieces).keys()] : shuffle(orbit.numPieces);
      const orientation = pieces.map(() => (p === '333' || p === 'skewb') && orbit.orbitName === 'CENTERS' ? 0 : rnd(orbit.numOrientations));
      data[orbit.orbitName] = { pieces, orientation };
    }
    if (p === '222') { // keep DBL in place so the reference corner exists as frame; any other state is just rotated
      const at = data.CORNERS.pieces.indexOf(6); [data.CORNERS.pieces[at], data.CORNERS.pieces[6]] = [data.CORNERS.pieces[6], 6]; data.CORNERS.orientation[6] = 0; }
    if (p === 'skewb') { const at = data.CORNERS.pieces.indexOf(3); [data.CORNERS.pieces[at], data.CORNERS.pieces[3]] = [data.CORNERS.pieces[3], 3]; data.CORNERS.orientation[3] = 0; }
    const pattern = new KPattern(kp, data);
    const expected =
      p === '333' ? sum(data.CORNERS.orientation) % 3 === 0 && sum(data.EDGES.orientation) % 2 === 0 && parity(data.CORNERS.pieces) === parity(data.EDGES.pieces)
      : p === '222' ? sum(data.CORNERS.orientation) % 3 === 0
      : p === 'pyram' ? parity(data.EDGES.pieces) === 0 && sum(data.EDGES.orientation) % 2 === 0
      : parity(data.CENTERS.pieces) === 0 && reach.has(data.CORNERS.pieces.join('') + data.CORNERS.orientation.join(''));
    const grip = Array.from({ length: rnd(4) }, () => rots[p][rnd(rots[p].length)]).join(' ');
    const r = await readColors(p, await colorsOf(p, pattern.applyAlg(grip)));
    if (r.ok !== expected) throw new Error(p + ' expected ' + expected + ' got ' + JSON.stringify(r));
    if (r.ok) {
      legal++;
      const re = p === 'skewb' ? /^(?:[RULB]'?)$/ : p === 'pyram' ? /^(?:[ULRBulrb]'?)$/ : /^[RLUDFB](?:2|')?$/;
      for (const t of r.scramble.split(' ').filter(Boolean)) if (!re.test(t)) throw new Error('bad token ' + t);
    } else illegal++;
  }
  console.log(p, 'random states: accepted', legal, 'rejected', illegal, '(all match the rules)');
}
process.exit(0);
