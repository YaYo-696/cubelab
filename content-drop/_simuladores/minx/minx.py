import math, itertools
s5=math.sqrt(5)
def h(deg): r=math.radians(deg); return (math.sin(r),0.0,math.cos(r))
N={'U':(0,1,0),'D':(0,-1,0)}
for name,phi in [('F',0),('R',72),('BR',144),('BL',216),('L',288)]:
    x,_,z=h(phi); N[name]=(2/s5*x,1/s5,2/s5*z)
for name,phi in [('FR',36),('DR',108),('B',180),('DL',252),('FL',324)]:
    x,_,z=h(phi); N[name]=(2/s5*x,-1/s5,2/s5*z)
FACES=list(N)
def dot(a,b): return sum(x*y for x,y in zip(a,b))
ADJ={f:[g for g in FACES if g!=f and abs(dot(N[f],N[g])-1/s5)<1e-6] for f in FACES}
assert all(len(v)==5 for v in ADJ.values())
def add(*vs): return tuple(sum(c) for c in zip(*vs))
def mul(v,k): return tuple(x*k for x in v)
STK=[]  # (face, piecekey frozenset, position)
for f in FACES:
    STK.append((f,frozenset([f]),N[f]))
    for g in ADJ[f]: STK.append((f,frozenset([f,g]),add(N[f],mul(N[g],0.3))))
    for g,k in itertools.combinations(ADJ[f],2):
        if k in ADJ[g]: STK.append((f,frozenset([f,g,k]),add(N[f],mul(N[g],0.3),mul(N[k],0.3))))
assert len(STK)==132, len(STK)
def rot(p,axis,ang):
    k=axis; c,s=math.cos(ang),math.sin(ang)
    kxp=(k[1]*p[2]-k[2]*p[1],k[2]*p[0]-k[0]*p[2],k[0]*p[1]-k[1]*p[0]); kd=dot(k,p)
    return tuple(p[i]*c+kxp[i]*s+k[i]*kd*(1-c) for i in range(3))
key=lambda p: tuple(round(x,4) for x in p)
IDX={key(p):i for i,(f,pk,p) in enumerate(STK)}
SOLVED=tuple(f for f,pk,p in STK)
def make(face,steps,whole=False):
    ang=-2*math.pi/5*steps; perm=list(range(132))
    for i,(f,pk,p) in enumerate(STK):
        if whole or face in pk: perm[IDX[key(rot(p,N[face],ang))]]=i
    return perm
MOVES={}
for f in FACES:
    for amt,st in (('',1),("'",-1),('2',2),("2'",-2)):
        MOVES[f+amt]=make(f,st)
    for amt,st in (('',1),("'",-1),('2',2),("2'",-2)):
        MOVES[f+'v'+amt]=make(f,st,True)
MOVES['y']=MOVES['Uv']; MOVES["y'"]=MOVES["Uv'"]; MOVES['y2']=MOVES['Uv2']; MOVES["y2'"]=MOVES["Uv2'"]
import re
def parse(alg):
    alg=alg.replace('(',' ').replace(')',' ').replace('’',"'")
    out=[]
    for t in alg.split():
        m=re.fullmatch(r"([A-Z]+v?|y)(\d?)('?)",t)
        assert m, t
        base,n,pr=m.groups(); n=int(n or 1)
        if base!='y' and base not in FACES and base[:-1] not in FACES: raise ValueError(t)
        n=n%5
        if pr: n=(-n)%5
        if n==0: continue
        if n==3: out.append(base+"2'")
        elif n==4: out.append(base+"'")
        elif n==1: out.append(base)
        else: out.append(base+'2')
    return out
def apply(state,alg):
    for m in parse(alg):
        pm=MOVES[m]; state=tuple(state[pm[j]] for j in range(132))
    return state
def invert(alg):
    out=[]
    for m in reversed(parse(alg)):
        if m.endswith("2'"): out.append(m[:-1])
        elif m.endswith('2'): out.append(m+"'")
        elif m.endswith("'"): out.append(m[:-1])
        else: out.append(m+"'")
    return ' '.join(out)
ULAYER=[i for i,(f,pk,p) in enumerate(STK) if 'U' in pk]
F2L=[i for i in range(132) if i not in ULAYER]
def f2l_ok(s): return all(s[i]==SOLVED[i] for i in F2L)
def normalize(alg):
    out=[]
    for m in parse(alg):
        base=m.rstrip("2'"); n={'':1,"'":4,'2':2,"2'":3}[m[len(base):]]
        if out and out[-1][0]==base: out[-1]=(base,(out[-1][1]+n)%5)
        else: out.append((base,n))
        if out[-1][1]==0: out.pop()
    names={1:'',4:"'",2:'2',3:"2'"}
    return ' '.join(b+names[n] for b,n in out)
