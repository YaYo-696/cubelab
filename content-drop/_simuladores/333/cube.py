import re
import itertools, json
# Sticker model: dict (pos, normal) -> color ; pos, normal are int 3-tuples
AX = {'x':0,'y':1,'z':2}
def rot(v, axis, q):  # q quarter turns, positive = counterclockwise looking from +axis
    v=list(v)
    for _ in range(q%4):
        if axis==0: v=[v[0],-v[2],v[1]]
        elif axis==1: v=[v[2],v[1],-v[0]]
        else: v=[-v[1],v[0],v[2]]
    return tuple(v)
# move spec: axis, layers(set of coord), direction sign (q for one 'clockwise' turn)
FACE={'R':(0,{1},-1),'L':(0,{-1},1),'U':(1,{1},-1),'D':(1,{-1},1),'F':(2,{1},-1),'B':(2,{-1},1),
      'M':(0,{0},1),'E':(1,{0},1),'S':(2,{0},-1),
      'r':(0,{0,1},-1),'l':(0,{-1,0},1),'u':(1,{0,1},-1),'d':(1,{-1,0},1),'f':(2,{0,1},-1),'b':(2,{-1,0},1),
      'x':(0,{-1,0,1},-1),'y':(1,{-1,0,1},-1),'z':(2,{-1,0,1},-1)}
for w,base in [('Rw','r'),('Lw','l'),('Uw','u'),('Dw','d'),('Fw','f'),('Bw','b')]: FACE[w]=FACE[base]
def solved():
    s={}
    for p in itertools.product([-1,0,1],repeat=3):
        for a in range(3):
            if p[a]!=0:
                n=[0,0,0]; n[a]=p[a]; s[(p,tuple(n))]=tuple(n)
    return s
def parse(alg):
    out=[]
    for t in alg.split():
        t=t.replace('’',"'").strip('()')
        if not t: continue
        m=re.fullmatch(r"([A-Za-z]w?)(\d*)('?)",t)
        if not m or m.group(1) not in FACE: raise ValueError('bad token '+t)
        base=m.group(1); k=int(m.group(2) or 1)
        n=(-k if m.group(3) else k)%4
        out.append((base,n))
    return out
def apply(s, alg):
    for base,n in parse(alg) if isinstance(alg,str) else alg:
        a,layers,d=FACE[base]
        ns={}
        for (p,nrm),c in s.items():
            if p[a] in layers:
                ns[(rot(p,a,d*n),rot(nrm,a,d*n))]=c
            else: ns[(p,nrm)]=c
        s=ns
    return s
def invert(alg):
    out=[]
    for base,n in reversed(parse(alg)): out.append((base,(4-n)%4))
    return out
def inv_str(alg):
    return ' '.join(b+('' if n==1 else '2' if n==2 else "'") for b,n in invert(alg) if n)
ROTS=[]
for seq in itertools.product(['','x','x2',"x'",'z',"z'"],['','y','y2',"y'"]):
    ROTS.append(' '.join(t for t in seq if t))
def center_ok(s):
    return all(s[((n),(n))]==n for n in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)])
def normalize(s):
    for r in ROTS:
        t=apply(s,r) if r else s
        if center_ok(t): return t,r
    return None,None
def f2l_ok(s):  # all stickers of pieces with y<=0 match their normal
    return all(c==n for (p,n),c in s.items() if p[1]<=0)
def corners_d_ok(s):
    return all(c==n for (p,n),c in s.items() if p[1]==-1 and abs(p[0])==1 and abs(p[2])==1)
def key(s, ll_only_orientation=False, corners_only=False):
    items=[]
    for (p,n),c in sorted(s.items()):
        if p[1]!=1: continue
        if corners_only and not (abs(p[0])==1 and abs(p[2])==1): continue
        if ll_only_orientation: items.append(((p,n), c==(0,1,0)))
        else: items.append(((p,n),c))
    return tuple(items)
