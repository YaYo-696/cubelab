from clk import *
import random
def rep(a):
    a%=12
    return a-12 if a>6 else a
def tok(pins,a):
    a=rep(a); return f"{pins}{abs(a)}{'+' if a>=0 else '-'}"
def solve(s):
    alg=[]
    def do(t):
        nonlocal s; s=apply(t,s); alg.append(t)
    def cross():
        do(tok('U', s[7]-s[4]))   # center -> D edge
        do(tok('D', s[1]-s[4]))   # center -> U edge
        do(tok('R', s[3]-s[4]))   # center -> L edge
        do(tok('L', s[5]-s[4]))   # center -> R edge
        assert s[1]==s[3]==s[4]==s[5]==s[7]
        do(tok('ALL', -s[4]))
    cross(); do('y2'); cross()
    macro={0:('DR','D','R'),2:('DL','D','L'),6:('UR','U','R'),8:('UL','U','L')}
    for c,(q,h,v) in macro.items():
        a=rep(-s[c])
        do(tok(q,a)); do(tok(h,-a)); do(tok(v,-a)); do(tok('ALL',a))
    return s,alg
random.seed(1)
moves=list(FRONT)
ok=0
for _ in range(2000):
    s=[0]*18
    for _ in range(30):
        if random.random()<0.2: s=y2(s)
        else: s=front_move(random.choice(moves),random.randint(-5,6),s)
    end,alg=solve(s)
    ok+= end==[0]*18
print('resueltos',ok,'/ 2000')
