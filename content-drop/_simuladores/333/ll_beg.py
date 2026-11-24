import sys; sys.path.insert(0,'.')
from cube import *
S=solved()
AA="x R' U R' D2 R U' R' D2 R2 x'"
UA="R U' R U R U R U' R' U' R2"
CORN=[(1,1,1),(1,1,-1),(-1,1,-1),(-1,1,1)]
def ckey(s): return tuple(sorted(((p,n),c) for (p,n),c in s.items() if p in CORN))
def corners_solved(s): return all(c==n for (p,n),c in s.items() if p in CORN)
def headlights(s, face):  # face normal; two U corners on that face share side color
    cs=[c for (p,n),c in s.items() if p in CORN and n==face]
    return len(cs)==2 and cs[0]==cs[1]
# all corner LL states (orientation solved) reachable
seen={}; frontier=[S]
seen[ckey(S)]=S
while frontier:
    nf=[]
    for s in frontier:
        for m in [AA,"U","R U R' U' R' F R2 U' R' U' R U R' F'"]:
            t=apply(s,m); k=ckey(t)
            if k not in seen: seen[k]=t; nf.append(t)
    frontier=nf
print('corner states',len(seen))
def solveC(s, face):
    n=0
    for _ in range(6):
        for k in range(4):
            if corners_solved(apply(s,'U '*k)): return n
        for k in range(4):
            t=apply(s,'U '*k)
            if headlights(t,face): s=apply(t,AA); n+=1; break
        else: s=apply(s,AA); n+=1
    return None
for name,face in [('B',(0,0,-1)),('L',(-1,0,0)),('R',(1,0,0)),('F',(0,0,1))]:
    r=[solveC(s,face) for s in seen.values()]
    print(name, 'fails' if None in r else 'max Aa=%d'%max(r))
AA2="R' F R' B2 R F' R' B2 R2"
print('Aa no-rotation equal:', apply(S,AA2)==apply(S,AA))
EDG=[(0,1,1),(1,1,0),(0,1,-1),(-1,1,0)]
def ekey(s): return tuple(sorted(((p,n),c) for (p,n),c in s.items() if p in EDG))
seen={ekey(S):S}; fr=[S]
while fr:
    nf=[]
    for s in fr:
        for m in [UA,"M2 U M2 U2 M2 U M2","y "+UA+" y'"]:
            t=apply(s,m); k=ekey(t)
            if k not in seen: seen[k]=t; nf.append(t)
    fr=nf
print('edge states',len(seen))
def edge_ok(s,p): return all(c==n for (q,n),c in s.items() if q==p)
def solveE(s):
    n=0
    for _ in range(6):
        if s==S: return n
        done=False
        for k in range(4):
            if edge_ok(s,EDG[(2+k)%4]) :  # rotate so this edge is at back
                rot=[ '', "y'", 'y2', 'y'][k]
                # find rotation that brings edge to back by testing
                break
        for r in ['','y','y2',"y'"]:
            t=apply(s,r) if r else s
            if edge_ok(t,(0,1,-1)):
                t=apply(t,UA); s,_=normalize(t); n+=1; done=True; break
        if not done: s=apply(s,UA); n+=1
    return None
r=[solveE(s) for s in seen.values()]
print('edges', 'fails' if None in r else 'max Ua=%d'%max(r))
