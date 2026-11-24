import sys; sys.path.insert(0,'.')
from cube import *
S=solved(); Y=(0,1,0)
SUNE="R U R' U R U2 R'"; ANTI="R U2 R' U' R U' R'"
UFL=(-1,1,1); UFR=(1,1,1)
CORN=[(1,1,1),(1,1,-1),(-1,1,-1),(-1,1,1)]
def yfaces(s,p): return [n for (q,n),c in s.items() if q==p and c==Y][0]
def n_or(s): return sum(1 for p in CORN if yfaces(s,p)==Y)
ocll={'sune':SUNE,'antisune':ANTI,'pi':"R U2 R2 U' R2 U' R2 U2 R",'h':"R U R' U R U' R' U R U2 R'",'t':"r U R' U' r' F R F'",'l':"F R' F' r U R U' r'",'u':"R2 D R' U2 R D' R' U2 R'"}
def step(s):
    n=n_or(s)
    if n==4: return None
    for u in ['','U','U2',"U'"]:
        t=apply(s,u) if u else s
        if n==1 and yfaces(t,UFL)==Y:
            return apply(t, SUNE if yfaces(t,UFR)==(0,0,1) else ANTI), ('sune' if yfaces(t,UFR)==(0,0,1) else 'anti')
        if n==0 and yfaces(t,UFL)==(-1,0,0): return apply(t,SUNE),'sune'
        if n==2 and yfaces(t,UFL)==(0,0,1): return apply(t,SUNE),'sune'
    raise Exception('no position n=%d'%n)
for nm,a in ocll.items():
    for u0 in ['','U','U2',"U'"]:
        s=apply(S,inv_str(a)); s=apply(s,u0) if u0 else s
        seq=[]
        for _ in range(5):
            r=step(s)
            if r is None: break
            s,m=r; seq.append(m)
        assert n_or(s)==4, (nm,u0,seq)
    print(nm.ljust(9),'ok', seq)
