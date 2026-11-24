from search import *
import pickle, collections, itertools
def is_auf(S):
    for b in range(5):
        if S==(apply(SOLVED,' '.join(['U']*b)) if b else SOLVED): return True
    return False
def rot_perm(t,k):  # rotate positions & relabel by k (conjugation)
    r=t[k:]+t[:k]; return tuple((x-k)%5 for x in r)
def ident_rot(t):  # t is a pure rotation of identity?
    return all((t[i]-t[0])%5==i for i in range(5))
def cp_rel(S):
    e=ep(S); c=cp(S)
    k=e[0]  # edges are rotation by k: piece at pos i is (i+k)%5
    # express corners relative to edges: relabel piece p -> (p-k)%5
    return tuple((x-k)%5 for x in c)
def cp_key2(S):
    t=cp_rel(S); return min(rot_perm(t,k) for k in range(5))
def step_of(S):
    if is_auf(S): return None,None
    if any(eo(S)): return 'eo',eo_key(S)
    if any(co(S)): return 'co',co_key(S)
    if not ident_rot(ep(S)): return 'ep',ep_key(S)
    return 'cp',cp_key2(S)
# all classes
def even(p):
    inv=sum(1 for i in range(5) for j in range(i+1,5) if p[i]>p[j]); return inv%2==0
ALL={'eo':{min(rotations(t)) for t in itertools.product((0,1),repeat=5) if sum(t)%2==0 and any(t)},
     'co':{min(rotations(t)) for t in itertools.product((0,1,2),repeat=5) if sum(t)%3==0 and any(t)},
     'ep':{perm_key(p) for p in itertools.permutations(range(5)) if even(p) and not ident_rot(p)},
     'cp':{min(rot_perm(p,k) for k in range(5)) for p in itertools.permutations(range(5)) if even(p) and p!=(0,1,2,3,4)}}
if __name__=='__main__':
    print({k:len(v) for k,v in ALL.items()})
    good=pickle.load(open('pool.pkl','rb'))
    best=collections.defaultdict(dict)
    for a,S in good.items():
        st,k=step_of(S)
        if st is None: continue
        # EP step algs must keep EO and CO; CP must keep everything but corners perm (already by classification)
        cur=best[st].get(k)
        if cur is None or len(parse(a))<len(parse(cur)): best[st][k]=a
    for st in ALL:
        print(st,'covered',len(best[st]),'/',len(ALL[st]))
    pickle.dump(dict(best),open('best.pkl','wb'))
