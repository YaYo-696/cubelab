from skewb import *
from faces import CENTER, corner_of
from solve import optimal
import pickle, collections
seen=pickle.load(open('ll.pkl','rb'))
CEN=[i for i in CENTER if STK[i][0]!='U']
NONC=[i for i in range(30) if i not in CEN]
cases=[s for s in seen if all(s[i]==SOLVED[i] for i in NONC) and s!=SOLVED]
print(len(cases))
out=[]
for S in cases:
    a=optimal(S); assert apply(S,a)==SOLVED
    # permutation: which face's center sits where
    perm={STK[i][0]:S[i] for i in CEN}  # position face -> color shown
    # cycle type
    seenf=set(); cyc=[]
    for f in perm:
        if f in seenf: continue
        c=[f]; seenf.add(f); g=perm[f]
        while g!=f: c.append(g); seenf.add(g); g=perm[g]
        if len(c)>1: cyc.append(c)
    out.append({'alg':a,'setup':invert(a),'perm':perm,'cycles':cyc})
out.sort(key=lambda c:(sorted(len(x) for x in c['cycles']),len(c['alg'].split()),c['alg']))
print(collections.Counter((tuple(sorted(len(x) for x in c['cycles'])),len(c['alg'].split())) for c in out))
pickle.dump(out,open('center_cases.pkl','wb'))
for c in out[:25]: print(c['cycles'],len(c['alg'].split()),c['alg'])
