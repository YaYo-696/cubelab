from skewb import *
import itertools, collections
def sgn(x): return 1 if x>0 else -1
CENTER=[i for i,(f,p) in enumerate(STK) if p==FACES[f]]
def corner_of(i):
    f,p=STK[i]; return None if i in CENTER else tuple(sgn(x) for x in p)
DLAYER=[i for i,(f,p) in enumerate(STK) if (f=='D') or (corner_of(i) and corner_of(i)[1]<0)]
TOPC=[i for i in range(30) if i not in CENTER and corner_of(i)[1]>0]
CENT_NOD=[i for i in CENTER if STK[i][0]!='D']
def dsolved(s): return all(s[i]==SOLVED[i] for i in DLAYER)
T=[m for m in TURNS]
inv={m:(m[:-1] if m.endswith("'") else m+"'") for m in T}
# enumerate sequences preserving D layer
macros={}
def rec(state,seq,depth):
    if seq and dsolved(state) and state!=SOLVED:
        if state not in macros or len(seq)<len(macros[state].split()): macros[state]=' '.join(seq)
    if depth==0: return
    for m in T:
        if seq and m[0]==seq[-1][0]: continue
        rec(apply(state,m),seq+[m],depth-1)
rec(SOLVED,[],7)
print('macro states',len(macros), collections.Counter(len(a.split()) for a in macros.values()))
