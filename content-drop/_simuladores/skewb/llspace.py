from skewb import *
from faces import layer, CENTER, corner_of
import itertools, collections, pickle
UL=layer('U')
gens={}
def rec(state,seq,depth):
    if seq and state!=SOLVED and all(state[i]==SOLVED[i] for i in UL):
        a=' '.join(seq)
        if state not in gens or len(a.split())<len(gens[state].split()): gens[state]=a
    if depth==0: return
    for m in TURNS:
        if seq and m[0]==seq[-1][0]: continue
        rec(apply(state,m),seq+[m],depth-1)
rec(SOLVED,[],7)
galgs=sorted(set(gens.values()),key=len)
# BFS closure
seen={SOLVED:''}; q=collections.deque([SOLVED])
while q:
    s=q.popleft()
    for a in galgs:
        t=apply(s,a)
        if t not in seen: seen[t]=(seen[s]+' '+a).strip(); q.append(t)
print('LL states',len(seen))
DC=[i for i in range(30) if i not in CENTER and corner_of(i)[1]<0]
CEN=[i for i in CENTER if STK[i][0]!='U']
corner_cases=collections.Counter(tuple(s[i] for i in DC) for s in seen)
print('corner patterns',len(corner_cases))
cs=[s for s in seen if all(s[i]==SOLVED[i] for i in DC)]
print('center cases (corners solved)',len(cs))
pickle.dump(seen,open('ll.pkl','wb'))
