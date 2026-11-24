import sys,json; sys.path.insert(0,'/home/claude/verify')
from cube import *
S=solved(); Y=(0,1,0)
FRU="F R U R' U' F'"; SUNE="R U R' U R U2 R'"; ANTI="R U2 R' U' R U' R'"
AA="R' F R' B2 R F' R' B2 R2"; UA="R U' R U R U R U' R' U' R2"; SEXY="R U R' U'"
CORN=[(1,1,1),(1,1,-1),(-1,1,-1),(-1,1,1)]; UFL=(-1,1,1); UFR=(1,1,1)
def yf(s,p): return [n for (q,n),c in s.items() if q==p and c==Y][0]
def nor(s): return sum(1 for p in CORN if yf(s,p)==Y)
def sune_plan(s):
    out=[]
    for _ in range(4):
        n=nor(s)
        if n==4: return ' '.join(out)
        for u in ['','U','U2',"U'"]:
            t=apply(s,u) if u else s
            if (n==1 and yf(t,UFL)==Y) or (n==0 and yf(t,UFL)==(-1,0,0)) or (n==2 and yf(t,UFL)==(0,0,1)):
                if u: out.append(u)
                out.append(SUNE); s=apply(t,SUNE); break
def goal_ok(s,goal):
    for u in ['','U','U2',"U'"]:
        t=apply(s,u) if u else s
        if goal=='first' and all(c==n for (p,n),c in t.items() if p[1]==-1): return True
        if goal=='f2l' and f2l_ok(t): return True
        if goal=='edgeOrientation' and f2l_ok(t) and all(t[(p,Y)]==Y for p in [(0,1,1),(1,1,0),(0,1,-1),(-1,1,0)]): return True
        if goal=='orientation' and f2l_ok(t) and all(c==Y for (p,n),c in t.items() if p[1]==1 and n==Y): return True
        if goal=='cornerPermutation' and f2l_ok(t) and all(c==n for (p,n),c in t.items() if p in CORN): return True
        if goal=='solved' and t==S: return True
    return False
OLL={'pi':"R U2 R2 U' R2 U' R2 U2 R",'h':"R U R' U R U' R' U R U2 R'",'t':"r U R' U' r' F R F'"}
drills=[
 ('cornersRepeat', inv_str(' '.join([SEXY]*3)), 'first', ' '.join([SEXY]*3)),
 ('middleLeft', inv_str("U' L' U L U F U' F'"), 'f2l', "U' L' U L U F U' F'"),
 ('ycLine', inv_str(FRU), 'edgeOrientation', FRU),
 ('ycL', inv_str("f R U R' U' f'"), 'edgeOrientation', 'U2 '+FRU+' '+FRU),
 ('ycDot', inv_str("F R U R' U' F' f R U R' U' f'"), 'edgeOrientation', FRU+' U2 '+FRU+' '+FRU),
 ('orientZero', inv_str(OLL['pi']), 'orientation', None),
 ('orientTwo', inv_str(OLL['t']), 'orientation', None),
 ('cornersAdj', inv_str(AA), 'cornerPermutation', AA),
 ('cornersDiag', inv_str("F R U' R' U' R U R' F' R U R' U' R' F R F'"), 'cornerPermutation', AA+' U '+AA),
 ('edgesUa', inv_str(UA), 'solved', UA),
 ('edgesUb', inv_str("R2 U R U R' U' R' U' R' U R'"), 'solved', UA+' '+UA),
 ('edgesH', inv_str("M2 U M2 U2 M2 U M2"), 'solved', UA+" y "+UA+" y'"),
 ('edgesZ', inv_str("M2 U M2 U M' U2 M2 U2 M' U2"), 'solved', UA+" y' "+UA+" y"),
]
out=[]
for id,setup,goal,alg in drills:
    st=apply(S,setup)
    if alg is None: alg=sune_plan(st)
    end=apply(st,alg); n,_=normalize(end)
    ok=goal_ok(n,goal) and n is not None
    # setup must keep earlier stages (sanity)
    print(id.ljust(14),goal.ljust(17),'OK' if ok else 'FAIL','|',setup,'=>',alg)
    out.append({'id':id,'setup':setup,'goal':goal,'alg':alg})
json.dump(out,open('/home/claude/b333/drills.json','w'),indent=1)
