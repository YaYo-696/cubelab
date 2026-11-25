/* global console */
import { puzzles } from 'cubing/puzzles';
const kp = await puzzles.skewb.kpuzzle();
const gens = ['R','U','L','B'].flatMap(m=>[m,m+"'"]).map(m=>kp.moveToTransformation(m).transformationData);
function pidx(p){let r=0;const n=p.length;const used=[];for(let i=0;i<n;i++){let c=0;for(let j=0;j<p[i];j++) if(!used[j]) c++; r=r*(n-i)+c; used[p[i]]=1;}return r;}
function enc(cp,co,ce){let o=0;for(const x of co) o=o*3+x; return (pidx(ce)*40320+pidx(cp))*6561+o;}
function apply(s,t){ // state s = {cp,co,ce}; apply transformation t (cubing: new.pieces[i]=s.pieces[t.perm[i]], ori = s.ori[perm[i]]+delta[i])
  const C=t.CORNERS, E=t.CENTERS;
  return { cp: C.permutation.map(i=>s.cp[i]), co: C.permutation.map((i,k)=>(s.co[i]+C.orientationDelta[k])%3), ce: E.permutation.map(i=>s.ce[i]) };
}
let start={cp:[0,1,2,3,4,5,6,7],co:[0,0,0,0,0,0,0,0],ce:[0,1,2,3,4,5]};
const seen=new Set([enc(start.cp,start.co,start.ce)]); let frontier=[start]; const sample=[];
while(frontier.length){ const next=[]; for(const s of frontier) for(const g of gens){ const n=apply(s,g); const k=enc(n.cp,n.co,n.ce); if(!seen.has(k)){seen.add(k); next.push(n); if(Math.random()<0.0005) sample.push(n);} } frontier=next; }
console.log('states', seen.size);
// candidate invariants
const parity=p=>{let c=0;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++) if(p[i]>p[j]) c++; return c%2;};
console.log('cornersMovedBy', ['R','U','L','B'].map(m=>{const p=kp.moveToTransformation(m).transformationData.CORNERS.permutation; return m+':'+p.map((x,i)=>x!==i?i:'').filter(x=>x!=='').join('');}).join(' '));
const fails={}; const inv = {
  cePar: s=>parity(s.ce),
  cpPar: s=>parity(s.cp),
  oriSum: s=>s.co.reduce((a,b)=>a+b,0)%3,
};
for (const s of sample) for (const [k,f] of Object.entries(inv)) { fails[k]=fails[k]||new Set(); fails[k].add(f(s)); }
console.log(Object.fromEntries(Object.entries(fails).map(([k,v])=>[k,[...v]])));
console.log('sample cp', sample.slice(0,5).map(s=>s.cp.join('')+' '+s.co.join('')+' '+s.ce.join('')).join('\n'));
