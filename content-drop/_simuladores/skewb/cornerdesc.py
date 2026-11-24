from tools import *
import pickle
ccs=pickle.load(open('corner_cases.pkl','rb'))
def cname(c):
    x,y,z=c; return ('U' if y>0 else 'D')+('F' if z>0 else 'B')+('R' if x>0 else 'L')
def twists(s):
    out=[]
    for c in [(1,-1,1),(-1,-1,1),(1,-1,-1),(-1,-1,-1)]:
        idx=[i for i in range(30) if i not in CENTER and corner_of(i)==c]
        # D color sticker
        dfaces=[STK[i][0] for i in idx if s[i]=='D']
        ok=all(s[i]==SOLVED[i] for i in idx)
        if not ok: out.append((cname(c),dfaces[0]))
    return out
for c in ccs:
    S=apply(SOLVED,c['setup']); c['tw']=twists(S); print(c['alg'],'|',c['tw'])
pickle.dump(ccs,open('corner_cases.pkl','wb'))
