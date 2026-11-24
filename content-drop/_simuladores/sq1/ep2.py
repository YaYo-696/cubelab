from sq1 import *
import itertools, collections
T="/ (3, 0) / (1, 0) / (0, -3) / (-1, 0) / (-3, 0) / (1, 0) / (0, 3) / (-1, 0)"
P="/ (-3, 0) / (0, 3) / (0, -3) / (0, 3) / (2, 0) / (0, 2) / (-2, 0) / (4, 0) / (0, -2) / (0, 2) / (-1, 4) / (0, -3) / (0, 3)"
S="/ (6, 6) /"
M="/ (6, 0) / (6, 0) / (6, 0)"
SUCC={'A':'B','C':'D','E':'F','G':'H','J':'K','L':'M','N':'O','P':'I'}
def top_ok(s):   # top in Cce pattern: corners at 0,3,6,9
    return [SUCC[s[c]]==s[c+2] for c in (0,3,6,9)]
def top_parity(s):
    # permutation of edges relative to corners: map each edge to index of its corner
    corners=[s[c] for c in (0,3,6,9)]; edges=[s[c+2] for c in (0,3,6,9)]
    want=[SUCC[x] for x in corners]
    perm=[want.index(e) for e in edges]
    return sum(1 for i in range(4) for j in range(i+1,4) if perm[i]>perm[j])%2
ROT={'':'','(3, 0)':'(-3, 0)','(6, 0)':'(6, 0)','(-3, 0)':'(3, 0)'}
def solve_top(s,log):
    if top_parity(s): s=apply(s,P); log.append('P')
    for _ in range(6):
        ok=top_ok(s)
        if all(ok): return s
        if sum(ok)==1:
            for pre,post in ROT.items():
                t=apply(s,pre) if pre else s
                if top_ok(t)[3]:
                    t=apply(t,T); log.append('T')
                    if not all(top_ok(t)): t=apply(t,T); log.append('T')
                    s=apply(t,post) if post else t; break
        else:
            s=apply(s,T); log.append('T')
    raise Exception('no termina')
def solved_upto_auf(s):
    for t in range(0,12,3):
        for b in range(0,12,3):
            if turns(s[:12],t)+turns(s[12:24],b)+s[24]==SOLVED: return True
    return False
res=collections.Counter(); bad=0; total=0
for pt in itertools.permutations('BDFH'):
    for pb in itertools.permutations('IKMO'):
        for eq in '01':
            s=list(SOLVED)
            for i,c in zip((2,5,8,11),pt): s[i]=c
            for i,c in zip((12,15,18,21),pb): s[i]=c
            s[24]=eq; s=''.join(s); log=[]
            s=solve_top(s,log)
            s=apply(s,S+' (-1, 1)')          # bring bottom layer up and align it like the top
            s=solve_top(s,log)
            s=apply(s,'(1, -1) '+S)
            if s[24]=='1': s=apply(s,M); log.append('M')
            total+=1; bad+= not solved_upto_auf(s)
            res[sum(1 for x in log if x in 'TP')]+=1
print('estados',total,'sin resolver',bad,'aplicaciones T/P',sorted(res.items()))
