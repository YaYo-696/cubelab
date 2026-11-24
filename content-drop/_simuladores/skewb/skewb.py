# Skewb simulator, WCA 12h notation. x=R, y=U, z=F.
import math
FACES={'U':(0,1,0),'D':(0,-1,0),'R':(1,0,0),'L':(-1,0,0),'F':(0,0,1),'B':(0,0,-1)}
# WCA corners: R=DBR, U=UBL, L=DFL, B=DBL
CORN={'R':(1,-1,-1),'U':(-1,1,-1),'L':(-1,-1,1),'B':(-1,-1,-1)}
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def rot(p,axis,ang):
    n=math.sqrt(dot(axis,axis)); k=[a/n for a in axis]; c,s=math.cos(ang),math.sin(ang)
    kxp=(k[1]*p[2]-k[2]*p[1],k[2]*p[0]-k[0]*p[2],k[0]*p[1]-k[1]*p[0]); kd=dot(k,p)
    return tuple(p[i]*c+kxp[i]*s+k[i]*kd*(1-c) for i in range(3))
def key(p): return tuple(round(x,4) for x in p)
STK=[]  # sticker positions
for f,n in FACES.items():
    STK.append((f,n))
    ax=[i for i in range(3) if n[i]==0]
    for s in (1,-1):
        for t in (1,-1):
            p=list(n); p[ax[0]]=0.6*s; p[ax[1]]=0.6*t; STK.append((f,tuple(p)))
IDX={key(p):i for i,(f,p) in enumerate(STK)}
SOLVED=tuple(f for f,p in STK)
def make_perm(v,ang):
    perm=list(range(len(STK)))
    for i,(f,p) in enumerate(STK):
        if dot(p,v)>0: perm[IDX[key(rot(p,v,ang))]]=i
    return perm  # new[j]=old[perm[j]]
MOVES={}
for m,v in CORN.items():
    MOVES[m]=make_perm(v,-2*math.pi/3)   # clockwise seen from outside
    MOVES[m+"'"]=make_perm(v,2*math.pi/3)
for r,v,base in (('x',(1,0,0),'x'),('y',(0,1,0),'y'),('z',(0,0,1),'z')):
    def whole(ang,v=v):
        perm=list(range(len(STK)))
        for i,(f,p) in enumerate(STK): perm[IDX[key(rot(p,v,ang))]]=i
        return perm
    MOVES[r]=whole(-math.pi/2); MOVES[r+"'"]=whole(math.pi/2); MOVES[r+'2']=whole(math.pi)
def apply(state,alg):
    for m in alg.split():
        pm=MOVES[m]; state=tuple(state[pm[j]] for j in range(len(STK)))
    return state
def invert(alg):
    out=[]
    for m in reversed(alg.split()):
        out.append(m if m.endswith('2') else (m[:-1] if m.endswith("'") else m+"'"))
    return ' '.join(out)
TURNS=[m for m in MOVES if m[0] in 'RULB']
