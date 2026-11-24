from sq1 import *
import itertools, collections
T="/ (3, 0) / (1, 0) / (0, -3) / (-1, 0) / (-3, 0) / (1, 0) / (0, 3) / (-1, 0)"
P="/ (-3, 0) / (0, 3) / (0, -3) / (0, 3) / (2, 0) / (0, 2) / (-2, 0) / (4, 0) / (0, -2) / (0, 2) / (-1, 4) / (0, -3) / (0, 3)"
S="/ (6, 6) /"
M="/ (6, 0) / (6, 0) / (6, 0)"
TOPE=[2,5,8,11]; BOTE=[12,15,18,21]
def check(alg,name):
    s=apply(SOLVED,alg); d=[(i,SOLVED[i],s[i]) for i in range(25) if s[i]!=SOLVED[i]]; print(name,d)
for a,n in ((T,'T'),(P,'P'),(S,'S'),(M,'M')): check(a,n)
def parity(perm):
    return sum(1 for i in range(len(perm)) for j in range(i+1,len(perm)) if perm[i]>perm[j])%2
def top_perm(s): return [ 'BDFH'.index(s[i]) for i in TOPE]
def solve_top(s,log):
    if parity(top_perm(s)):
        s=apply(s,P); log.append('P')
    for _ in range(4):
        p=top_perm(s); ok=[i for i in range(4) if p[i]==i]
        if len(ok)==4: return s
        if len(ok)==1:
            # rotate so the solved edge is at position index 3 (pos 11), apply T (cycles 2,5,8)
            k=ok[0]; r=(3-k)%4   # number of (3,0) turns that move edge index k to index 3
            pre=f"({-3*r if r<=2 else 3}, 0)" if r else ''
            # simpler: try both directions literally
            for pre in ['', '(3, 0)', '(6, 0)', '(-3, 0)']:
                post={'':'','(3, 0)':'(-3, 0)','(6, 0)':'(6, 0)','(-3, 0)':'(3, 0)'}[pre]
                t=apply(s,pre) if pre else s
                if top_perm(t)[3]==3 or [ 'BDFH'.index(t[i]) for i in TOPE][3]=='BDFH'.index(t[11]):
                    pass
                tp=[ 'BDFH'.index(t[i]) for i in TOPE]
                # solved edge relative to corners after turn: correct if edge letter matches position letter
                if t[11]==SOLVED[11]:
                    t=apply(t,T); log.append('T')
                    if [t[i] for i in TOPE]!=[SOLVED[i] for i in TOPE]: t=apply(t,T); log.append('T')
                    s=apply(t,post) if post else t; break
            else:
                raise Exception('no angle')
        else:
            s=apply(s,T); log.append('T')
    return s
results=collections.Counter(); bad=0
tops=list(itertools.permutations('BDFH')); bots=list(itertools.permutations('IKMO'))
for pt in tops:
    for pb in bots:
        for eq in '01':
            s=list(SOLVED)
            for i,c in zip(TOPE,pt): s[i]=c
            for i,c in zip(BOTE,pb): s[i]=c
            s[24]=eq; s=''.join(s); log=[]
            s=solve_top(s,log); s=apply(s,S); log.append('S'); s=solve_top(s,log); s=apply(s,S); log.append('S')
            if s[24]=='1': s=apply(s,M); log.append('M')
            if s!=SOLVED: bad+=1
            results[sum(1 for x in log if x in 'TP')]+=1
print('estados',24*24*2,'sin resolver',bad,'algoritmos aplicados',sorted(results.items()))
