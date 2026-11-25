// Verificación del Clock desde esferas (Claude). Correr desde la raíz del repo:
// node --experimental-strip-types content-drop/_simuladores/colores/clock.ts
import { puzzles } from 'cubing/puzzles';
import { clockDialsOf, readClock } from '../../../src/core/fromColors/readClock.ts';
const kp = await puzzles.clock.kpuzzle();
const app = /^(?:y2|(?:UR|DR|DL|UL|U|R|D|L|ALL)[0-6][+-])$/;
let seed = 12; const rnd = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * n); };
let ok = 0, maxMoves = 0;
const t0 = performance.now();
for (let i = 0; i < 2000; i++) {
  const front = Array.from({ length: 9 }, () => rnd(12));
  const back = Array.from({ length: 9 }, () => rnd(12));
  for (const [f, b] of [[0, 2], [2, 0], [6, 8], [8, 6]]) back[b] = (12 - front[f]) % 12;
  if (i % 3 === 0) front[4] = front[4] || 12; // 12 o'clock written as 12 is accepted
  const r = await readClock({ front, back });
  if (!r.ok) throw new Error('rejected ' + JSON.stringify({ front, back, r }));
  for (const t of r.solution.split(' ')) if (!app.test(t)) throw new Error('token ' + t);
  const held = kp.defaultPattern().applyAlg(r.scramble).patternData.DIALS.orientation;
  if (held.join() !== [...front, ...back].map(v => v % 12).join()) throw new Error('scramble mismatch');
  if (kp.defaultPattern().applyAlg(r.scramble).applyAlg(r.solution).patternData.DIALS.orientation.some(v => v)) throw new Error('not solved');
  maxMoves = Math.max(maxMoves, r.solution.split(' ').length - 1);
  ok++;
}
console.log('random states solved', ok, 'max moves', maxMoves, 'ms', (performance.now() - t0).toFixed(0));
// WCA-like scrambles read back
for (let i = 0; i < 200; i++) {
  const mix = ['UR','DR','DL','UL','U','R','D','L','ALL'].map(p => p + rnd(7) + (rnd(2) ? '+' : '-')).join(' ') + ' y2 ' + ['U','R','D','L','ALL'].map(p => p + rnd(7) + (rnd(2) ? '+' : '-')).join(' ');
  const r = await readClock(await clockDialsOf(mix));
  if (!r.ok) throw new Error('scramble rejected');
  if (kp.defaultPattern().applyAlg(mix).applyAlg(r.solution).patternData.DIALS.orientation.some(v => v)) throw new Error('scramble not solved ' + mix);
}
console.log('WCA scrambles read and solved: 200');
const front = [0,0,0,0,0,0,0,0,0], back = [0,0,0,0,0,0,0,0,0];
back[2] = 3;
const bad = await readClock({ front, back });
console.log('corner mismatch ->', bad.ok ? 'ok?!' : JSON.stringify(bad.issues));
const val = await readClock({ front: [0,0,0,0,13,0,0,0,0], back });
console.log('bad value ->', val.ok ? 'ok?!' : val.issues.map(i => i.key).join());
const solved = await readClock({ front, back: [0,0,0,0,0,0,0,0,0] });
console.log('solved ->', JSON.stringify(solved));
process.exit(0);
