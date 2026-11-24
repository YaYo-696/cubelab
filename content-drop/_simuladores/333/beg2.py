exec(open('beg_drills.py').read().split("# yellow")[0])
def uok(s): return all(c==s[((0,1,0),(0,1,0))] for (p,n),c in s.items() if p[1]==1 and n==(0,1,0))
def all_ok(s): return all(c==n for (p,n),c in s.items())
def solved_auf(s): return any(all_ok(apply(s,u)) if u else all_ok(s) for u in ['','U','U2',"U'"])
CORN=[(1,1,1),(1,1,-1),(-1,1,-1),(-1,1,1)]
def corners_ok_auf(s):
    for u in ['','U','U2',"U'"]:
        t=apply(s,u) if u else s
        if all(c==n for (p,n),c in t.items() if p in CORN): return u or '-'
# 1 twist drill: two corners twisted opposite
setup=rep(X,2)+" U "+rep(X,4)+" U'"
alg="U "+rep(X,2)+" U' "+rep(X,4)
s=apply(S,setup); print('twist setup clean F2L:',f2l_ok(s),'U yellow:',uok(s)); print('twist alg solves:',all_ok(apply(s,alg)))
print('twist setup ==inverse:',apply(apply(S,setup),alg)==S)
# corner perm: Aa from headlights back
s=apply(S,inv_str(AA)); print('Aa case corners ok after AA:',corners_ok_auf(apply(s,AA)))
# diagonal corners: find k s.t. setup Aa U^k Aa gives no headlights
for u in ['U','U2',"U'"]:
    st=apply(S,AA+' '+u+' '+AA)
    print('Aa',u,'Aa ->','corners solved?',corners_ok_auf(st))
print('---')
YP="F R U' R' U' R U R' F' R U R' U' R' F R F'"
D=apply(S,inv_str(YP))
def head_back(s):
    cs=[c for (p,n),c in s.items() if p in CORN and n==(0,0,-1)]; return cs[0]==cs[1]
def anyhead(s,face):
    return [u for u in ['','U','U2',"U'"] if (lambda t: len(set(c for (p,n),c in t.items() if p in CORN and n==face))==1)(apply(s,u) if u else s)]
print('diag any headlights:', [anyhead(D,f) for f in [(0,0,-1)]])
t=apply(D,AA); us=anyhead(t,(0,0,-1)); print('after AA headlights back via', us)
for u in us:
    alg=AA+' '+u+' '+AA; print('diag alg',alg,'->',corners_ok_auf(apply(D,alg)), 'f2l',f2l_ok(apply(D,alg)))
# edges
import itertools
EDG=[(0,1,1),(1,1,0),(0,1,-1),(-1,1,0)]
blocks={'Ua':UA,'Ua(U)':"U "+UA+" U'",'Ua(U2)':"U2 "+UA+" U2",'Ua(U\')':"U' "+UA+" U"}
cases={'ub':inv_str("R2 U R U R' U' R' U' R' U R'"),'h':inv_str("M2 U M2 U2 M2 U M2"),'z':inv_str("M2 U M2 U M' U2 M2 U2 M' U2"),'ua':inv_str(UA)}
for nm,st in cases.items():
    s0=apply(S,st); found=None
    for L in range(1,4):
        for combo in itertools.product(blocks.items(),repeat=L):
            alg=' '.join(v for k,v in combo)
            if apply(s0,alg)==S: found=(L,[k for k,v in combo],alg); break
        if found: break
    print(nm, found[:2])
print('===')
def where(s,piece_colors):
    # find position whose sticker colors set equals given
    pos={}
    for (p,n),c in s.items(): pos.setdefault(p,set()).add(c)
    return [p for p,cs in pos.items() if cs==piece_colors]
DFR={(1,0,0),(0,-1,0),(0,0,1)}
for k in range(1,6):
    st=apply(S,inv_str(rep(SEXY,k)))
    p=where(st,DFR)[0]; white_up = st[(p,(0,1,0))]==(0,-1,0) if p[1]==1 else None
    print('k',k,'corner at',p,'D-color up' if white_up else '', 'cross ok', all(st[(q,n)]==n for (q,n),c in st.items() if q[1]==-1 and (q[0]==0 or q[2]==0)))
for nm,alg in [('h',UA+" y "+UA+" y'"),('z',UA+" y' "+UA+" y")]:
    s0=apply(S,cases[nm]); print(nm,'solves exactly:',apply(s0,alg)==S)
    t=apply(s0,UA); print('  after 1st Ua solved edges:',[names[p] for p in EDG if all(t[(p,n)]==n for (q,n),c in t.items() if q==p)])
t=apply(S,"F U F' U' L' U' L U"); print('middleLeft f2l broken only FL:', not f2l_ok(t), apply(t,"U' L' U L U F U' F'")==S)
