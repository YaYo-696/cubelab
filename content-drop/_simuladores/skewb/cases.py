from skewb import *
from faces import layer, CENTER, corner_of
import collections, pickle, json
from solve import optimal
UL=layer('U')
CEN=[i for i in CENTER if STK[i][0]!='U']
KEEP=[i for i in range(30) if i not in CEN]
DC=[i for i in range(30) if i not in CENTER and corner_of(i)[1]<0]
proj=lambda s: tuple(s[i] for i in KEEP)
# BFS on projection
seen={proj(SOLVED):''}; q=collections.deque([SOLVED]); reps={}
while q:
    s=q.popleft(); a=seen[proj(s)]
    if all(s[i]==SOLVED[i] for i in UL):
        P=tuple(s[i] for i in DC)
        if P not in reps: reps[P]=a
    for m in TURNS:
        if a and m[0]==a.split()[-1][0]: continue
        t=apply(s,m)
        if proj(t) not in seen: seen[proj(t)]=(a+' '+m).strip(); q.append(t)
print('proj states',len(seen),'patterns',len(reps))
corner_cases=[]
for P,setup in reps.items():
    if not setup: continue
    alg=invert(setup)
    # alternatives: all optimal-length? keep one; also check alg solves setup exactly
    assert apply(apply(SOLVED,setup),alg)==SOLVED
    corner_cases.append({'setup':setup,'alg':alg,'P':P})
corner_cases.sort(key=lambda c:(len(c['alg'].split()),c['alg']))
for c in corner_cases: print(len(c['alg'].split()),c['alg'],'| setup',c['setup'])
pickle.dump(corner_cases,open('corner_cases.pkl','wb'))
