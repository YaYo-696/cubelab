import sys; sys.path.insert(0,'/home/claude/verify')
from nxn import *
import itertools, re
c=Cube(4); S0=c.solved
src=open('/home/claude/verify/names.py').read()
PLL=dict(re.findall(r"'([A-Z][a-z]?)':\"([^\"]+)\"",src))
PLL={k:v for k,v in PLL.items() if len(k)<=2 and k[0] in 'AEFGHJNRTUVYZ' and not re.search(r'[MES]',v)}
print('PLLs',len(PLL),sorted(PLL))
P="2R2 U2 2R2 Uw2 2R2 Uw2"
AUF=['',"U","U2","U'"]
def classify(s):
    # align with best AUF: min number of changed stickers
    best=None
    for d in AUF:
        t=c.apply(s,d) if d else s
        ch=[i for i in range(len(t)) if t[i]!=S0[i]]
        if best is None or len(ch)<len(best[1]): best=(d,ch,t)
    d,ch,t=best
    pos=[c.stk[i][1] for i in ch]
    corners=sorted({(p[0]>0,p[2]>0) for p in pos if abs(p[0])==1.5 and abs(p[2])==1.5 or (abs(p[0])==2 and abs(p[2])==1.5) or (abs(p[2])==2 and abs(p[0])==1.5)})
    return len(ch),t
res={}
def effect(s):
    # returns description: set of top-layer 'slots' changed after best AUF
    best=None
    for d in AUF:
        t=c.apply(s,d) if d else s
        ch=[i for i in range(len(t)) if t[i]!=S0[i]]
        if best is None or len(ch)<len(best): best=ch
    slots=set()
    for i in best:
        f,p=c.stk[i]
        x,z=p[0],p[2]
        cx= 'R' if x>1 else ('L' if x<-1 else '')
        cz= 'F' if z>1 else ('B' if z<-1 else '')
        if f in 'RL': cx=f
        if f in 'FB': cz=f
        slots.add(('U'+cz+cx) if (cx and cz) else ('U'+(cz or cx)))
    return tuple(sorted(slots)),len(best)
found={}
for a,b in itertools.product(AUF,AUF):
    for qn,q in list(PLL.items())+[('',None)]:
        alg=' '.join(x for x in [a,P,b,q] if x)
        s=c.apply(S0,invert(alg))
        if s==S0: continue
        e=effect(s)
        key=e[0]
        if key not in found or len(alg.split())<len(found[key][0].split()): found[key]=(alg,e[1],qn)
for k,v in sorted(found.items(),key=lambda kv:len(kv[0])):
    if len(k)<=2: print(k,v)
