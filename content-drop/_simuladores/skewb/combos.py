from tools import *
import itertools, collections
G=["R U' L' U", "R' B R B'", "U R' U' L", "U' L U R'", "L B' L' B", "L' U R U'", "B R' B' R", "B' L B L'"]
def cyc(s):
    perm={STK[i][0]:s[i] for i in CEN}; seenf=set(); out=[]
    for f in perm:
        if f in seenf: continue
        c=[f]; seenf.add(f); g=perm[f]
        while g!=f: c.append(g); seenf.add(g); g=perm[g]
        if len(c)>1: out.append(tuple(c))
    return out
res=collections.defaultdict(list)
for k in (2,3):
  for w in itertools.product(G,repeat=k):
    a=' '.join(w); s=apply(SOLVED,a)
    if s!=SOLVED and all(s[i]==SOLVED[i] for i in NONC):
        res[k].append((a,cyc(s)))
for k in res:
    print(k,len(res[k]))
    for a,c in res[k][:40]: print('  ',a,c)
