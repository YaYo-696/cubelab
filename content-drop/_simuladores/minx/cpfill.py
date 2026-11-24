from classify import *
best=pickle.load(open('best.pkl','rb'))
missing=sorted(ALL['cp']-set(best['cp']))
print('missing',missing)
def cyc_type(p):
    seen=set(); t=[]
    for i in range(5):
        if i in seen: continue
        j=i; n=0
        while j not in seen: seen.add(j); j=p[j]; n+=1
        if n>1: t.append(n)
    return sorted(t)
for k in sorted(ALL['cp']): print(k, cyc_type(k), 'OK' if k in best['cp'] else 'MISSING', best['cp'].get(k,''))
