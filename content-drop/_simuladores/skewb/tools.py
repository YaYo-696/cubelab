from skewb import *
from faces import CENTER, corner_of, layer
import itertools
UL=layer('U'); CEN=[i for i in CENTER if STK[i][0]!='U']; NONC=[i for i in range(30) if i not in CEN]
def order(a):
    s=apply(SOLVED,a);k=1
    while s!=SOLVED: s=apply(s,a);k+=1
    return k
def describe(s):
    ch=[STK[i] for i in range(30) if s[i]!=SOLVED[i]]
    cen=[f for f,p in ch if p==FACES[f]]; cor=sorted(set(corner_of(IDX[tuple(round(x,4) for x in p)]) for f,p in ch if p!=FACES[f]))
    return cen,cor
for a in ["R' B R B'","L B' L' B","B R' B' R","B' L B L'"]:
    s=apply(SOLVED,a); print(a,'order',order(a),describe(s))
