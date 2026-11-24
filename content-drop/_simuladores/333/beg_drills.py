import sys; sys.path.insert(0,'.')
from cube import *
S=solved()
X="R' D' R D"; SEXY="R U R' U'"; AA="R' F R' B2 R F' R' B2 R2"; UA="R U' R U R U R U' R' U' R2"; FRU="F R U R' U' F'"
def rep(a,k): return ' '.join([a]*k)
def eo_u(s): return [(p) for (p,n),c in s.items() if p[1]==1 and n==(0,1,0) and c==(0,1,0) and (p[0]==0 or p[2]==0) and p!=(0,1,0)]
names={(0,1,1):'UF',(1,1,0):'UR',(0,1,-1):'UB',(-1,1,0):'UL'}
# yellow cross: dot, L(back-left), line(horizontal)
for nm,setup in [('dot',inv_str("F R U R' U' F' f R U R' U' f'")),('L',inv_str("f R U R' U' f'")),('line',inv_str(FRU))]:
    s=apply(S,setup); print(nm,'oriented:',sorted(names[p] for p in eo_u(s)))
    t=apply(s,FRU); print('   after FRURUF:',sorted(names[p] for p in eo_u(t)), 'f2l', f2l_ok(t))
print('---')
L=apply(S,inv_str("f R U R' U' f'"))
for k,u in enumerate(['','U',"U2","U'"]):
    s=apply(L,u) if u else L; t=apply(s,FRU)
    print('L at',sorted(names[p] for p in eo_u(s)),'-> FRU:',sorted(names[p] for p in eo_u(t)))
