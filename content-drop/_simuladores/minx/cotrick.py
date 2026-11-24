from classify import *
import itertools
T="R' FR' R FR"
def order(a):
    s=apply(SOLVED,a);k=1
    while s!=SOLVED: s=apply(s,a);k+=1
    return k
print('order of trick',order(T))
s=apply(SOLVED,T+' '+T); print('x2: co',co(s),'eo',eo(s),'f2l ok',f2l_ok(s))
s=apply(SOLVED,' '.join([T]*6)); print('x6 solved',s==SOLVED)
# strategy: corner at slot index 4 (between R and F) is the working slot
def solve_co(s):
    log=[]
    for _ in range(5):
        for _ in range(3):
            if co(s)[4]==0: break
            s=apply(s,T+' '+T); log.append('T2')
        s=apply(s,'U'); log.append('U')
    return s,log
ok=0; tot=0; maxT=0
for tw in itertools.product((0,1,2),repeat=5):
    if sum(tw)%3: continue
    P=with_corners(tw)
    s,log=solve_co(P); tot+=1
    good=f2l_ok(s) and not any(co(s)) and not any(eo(s))
    ok+=good; maxT=max(maxT,log.count('T2'))
print('CO strategy solved',ok,'/',tot,'max pairs',maxT)
