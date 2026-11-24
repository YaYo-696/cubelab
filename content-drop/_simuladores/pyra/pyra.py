"""Independent Pyraminx sticker simulator (geometric). WCA notation: U L R B (2 layers), u l r b (tips).
Clockwise = looking at the vertex from outside."""
import math, itertools, re
from collections import deque
r = 2*math.sqrt(2)
V = {'U': (0.0, 3.0, 0.0), 'B': (0.0, -1.0, -r),
     'L': (-r*math.sqrt(3)/2, -1.0, r/2), 'R': (r*math.sqrt(3)/2, -1.0, r/2)}
def add(a,b): return tuple(x+y for x,y in zip(a,b))
def mul(a,k): return tuple(x*k for x in a)
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def norm(a):
    n=math.sqrt(dot(a,a)); return mul(a,1/n)
def cross(a,b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def rot(p, axis, ang):
    k=norm(axis); c=math.cos(ang); s=math.sin(ang)
    return add(add(mul(p,c), mul(cross(k,p),s)), mul(k, dot(k,p)*(1-c)))
faces = {}  # face name = vertex NOT on it (opposite) -> but name by WCA: F(ULR) L(ULB) R(URB) D(LRB)
FACE_VERTS = {'F': 'ULR', 'Lf': 'ULB', 'Rf': 'URB', 'D': 'LRB'}
stickers = []  # (centroid, facename)
for fname, vs in FACE_VERTS.items():
    a,b,c = (V[x] for x in vs)
    def P(i,j,k): return add(add(mul(a,i/3), mul(b,j/3)), mul(c,k/3))
    tris=[]
    for i in range(3,-1,-1):
        for j in range(0,4-i):
            k=3-i-j
            # up triangle with top (i,j,k) -> (i-1,j+1,k),(i-1,j,k+1)
            if i>=1: tris.append((P(i,j,k),P(i-1,j+1,k),P(i-1,j,k+1)))
            # down triangle
            if i>=1 and j>=1: tris.append((P(i,j,k),P(i-1,j,k+1),P(i,j-1,k+1)))
    assert len(tris)==9, len(tris)
    for t in tris:
        cen = mul(add(add(t[0],t[1]),t[2]),1/3)
        stickers.append((cen,fname))
assert len(stickers)==36
def key(p): return tuple(round(x,4) for x in p)
index = {key(p):i for i,(p,_) in enumerate(stickers)}
def proj(p,v): return dot(p, norm(V[v]))
TIP_CUT, LAYER_CUT = 3-4/3, 3-8/3
def layer(v, tip):
    cut = TIP_CUT if tip else LAYER_CUT
    return [i for i,(p,_) in enumerate(stickers) if proj(p,v) > cut]
def make_perm(v, tip, qturns):
    ang = -2*math.pi/3*qturns
    perm = list(range(36))  # perm[new_pos] = old_pos
    for i in layer(v, tip):
        q = rot(stickers[i][0], V[v], ang)
        j = index[key(q)]
        perm[j] = i
    return tuple(perm)
MOVES={}
for v in 'ULRB':
    for q,suf in [(1,''),(2,"'")]:  # 2 x clockwise = counterclockwise
        MOVES[v+suf]=make_perm(v,False,q)
        MOVES[v.lower()+suf]=make_perm(v,True,q)
SOLVED = tuple(f for _,f in stickers)
def apply_perm(state, perm): return tuple(state[perm[i]] for i in range(36))
def parse(alg):
    out=[]
    for t in alg.replace('(',' ').replace(')',' ').split():
        m=re.fullmatch(r"([ULRBulrb])(2?)('?)",t)
        if not m: raise ValueError(t)
        base=m.group(1); n=int(m.group(2) or 1); n = -n if m.group(3) else n
        n%=3
        out += [base]*n   # n clockwise turns
    return out
def apply(state, alg):
    for b in parse(alg) if isinstance(alg,str) else alg:
        state = apply_perm(state, MOVES[b])
    return state
def invert(alg):
    toks=[]
    for t in reversed(alg.replace('(',' ').replace(')',' ').split()):
        m=re.fullmatch(r"([ULRBulrb])(2?)('?)",t); base=m.group(1); n=int(m.group(2) or 1)
        n = -n if m.group(3) else n
        n=(-n)%3
        if n: toks.append(base+('' if n==1 else "'"))
    return ' '.join(toks)
# piece classification
def piece_of(i):
    p=stickers[i][0]
    tips=[v for v in 'ULRB' if proj(p,v)>TIP_CUT]
    if tips: return 'tip'+tips[0]
    lay=[v for v in 'ULRB' if proj(p,v)>LAYER_CUT]
    if len(lay)==1: return 'ctr'+lay[0]
    if len(lay)==2: return 'edge'+''.join(sorted(lay, key='ULRB'.index))
    raise RuntimeError(lay)
PIECES={}
for i in range(36): PIECES.setdefault(piece_of(i),[]).append(i)
NONTIP=[i for i in range(36) if not piece_of(i).startswith('tip')]
def differing_pieces(s, ref=SOLVED):
    return sorted({piece_of(i) for i in range(36) if s[i]!=ref[i]})
