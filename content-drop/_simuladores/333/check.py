import json, sys
from cube import *
D='/mnt/user-data/uploads/cubelab/src/puzzles/content/full/'
def case_state(alg):
    s=apply(solved(), invert(alg))
    s,r=normalize(s)
    return s
def equiv_key(s, mode):
    best=None
    for a in range(4):
        for b in range(4):
            for c in range(4):
                t=s
                seq=[]
                # conjugate by y^a and pre/post AUF
                t=apply(t,[('y',a)]) if a else t
                t=apply(t,[('U',b)]) if b else t
                # rotate whole cube back after: compare in frame -> apply y^-a then key, plus pre-AUF via U^c on solved side approximated by y-conj
                t=apply(t,[('y',(4-a)%4)]) if a else t
                k=key(t, ll_only_orientation=(mode=='oll'), corners_only=(mode=='cll'))
                if best is None or k<best: best=k
    return best
def full_key(alg, mode):
    # state reached by applying inverse(alg); consider all AUF variants U^c before setup too
    best=None
    for c in range(4):
        _,rr=normalize(apply(solved(),alg))
        if rr is None: return None
        s=apply(solved(), [('U',c)] if c else [])
        s=apply(s, invert(rr)) if rr else s
        s=apply(s, invert(alg))
        s,r=normalize(s)
        if s is None: return None
        k=equiv_key(s,mode)
        if best is None or k<best: best=k
    return best
def check(file, mode):
    rows=json.load(open(D+file))
    problems=[]; keys={}
    for row in rows:
        ks=set()
        for alg in row['algs']:
            s=apply(solved(), alg)
            s,r=normalize(s)
            if s is None: problems.append((row['id'],alg,'centros')); continue
            ok = corners_d_ok(s) if mode=='cll' else f2l_ok(s)
            if not ok: problems.append((row['id'],alg,'rompe F2L/primera capa')); continue
            if mode=='pll' and not all(c==(0,1,0) for (p,n),c in s.items() if p[1]==1 and n==(0,1,0)):
                problems.append((row['id'],alg,'no conserva orientación')); continue
            ks.add(full_key(alg,mode))
        if len(ks)>1: problems.append((row['id'],'*','alternativas de distinto caso'))
        if ks: keys.setdefault(next(iter(ks)),[]).append(row['id'])
    dup=[v for v in keys.values() if len(v)>1]
    print(file, 'casos',len(rows),'claves distintas',len(keys),'duplicados',dup)
    for p in problems: print('  PROBLEMA',p)
    return keys
if __name__=='__main__':
    for f,m in [('pll.json','pll'),('oll.json','oll'),('cll.json','cll')]:
        check(f,m)
