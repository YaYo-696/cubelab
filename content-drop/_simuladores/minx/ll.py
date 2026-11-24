from minx import *
ORDER=['F','L','BL','BR','R']   # U clockwise moves F->L->BL->BR->R
def sidx(face,pk): return [i for i,(f,k,p) in enumerate(STK) if f==face and k==frozenset(pk)][0]
EPOS=[frozenset(['U',x]) for x in ORDER]
CPOS=[frozenset(['U',ORDER[i],ORDER[(i+1)%5]]) for i in range(5)]
def edge_stickers(pos):
    x=[f for f in pos if f!='U'][0]; return sidx('U',pos), sidx(x,pos)
def corner_stickers(pos):
    i=CPOS.index(pos); a,b=ORDER[i],ORDER[(i+1)%5]
    return sidx('U',pos), sidx(a,pos), sidx(b,pos)
def eo(s): return tuple(0 if s[edge_stickers(p)[0]]=='U' else 1 for p in EPOS)
def co(s):
    out=[]
    for p in CPOS:
        u,a,b=corner_stickers(p)
        out.append(0 if s[u]=='U' else (1 if s[a]=='U' else 2))
    return tuple(out)
def ep(s):  # piece at each position identified by side color (assumes oriented)
    return tuple(ORDER.index(s[edge_stickers(p)[1]]) if s[edge_stickers(p)[1]] in ORDER else -1 for p in EPOS)
def cp(s):
    out=[]
    for p in CPOS:
        u,a,b=corner_stickers(p); cols={s[u],s[a],s[b]}-{'U'}
        out.append([i for i in range(5) if {ORDER[i],ORDER[(i+1)%5]}==cols][0])
    return tuple(out)
def rotations(t): return [t[k:]+t[:k] for k in range(5)]
def eo_key(s): return min(rotations(eo(s)))
def co_key(s): return min(rotations(co(s)))
def perm_key(t):
    best=None
    for a in range(5):
        r=t[a:]+t[:a]
        for b in range(5):
            v=tuple((x+b)%5 for x in r)
            if best is None or v<best: best=v
    return best
def ep_key(s): return perm_key(ep(s))
def cp_key(s): return perm_key(cp(s))
