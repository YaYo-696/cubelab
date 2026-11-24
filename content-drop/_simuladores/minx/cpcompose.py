from classify import *
best=pickle.load(open('best.pkl','rb'))
missing=sorted(ALL['cp']-set(best['cp']))
algs=list(best['cp'].values())
U=lambda k: ' '.join(['U']*k)
def target_state(key):
    return with_corners(perm=key)
found={}
for key in missing:
    P=target_state(key)
    assert cp_key2(P)==key, (cp_key2(P),key)
    bestc=None
    for A in algs:
        for j in range(5):
            s1=apply(P,(U(j)+' '+A).strip())
            for k in range(5):
                s2=apply(s1,U(k)) if k else s1
                for B in algs:
                    s3=apply(s2,B)
                    for m in range(5):
                        s4=apply(s3,U(m)) if m else s3
                        if s4==SOLVED:
                            cand=' '.join(x for x in [U(j),A,U(k),B] if x)
                            core=strip_auf(cand)
                            if bestc is None or len(parse(core))<len(parse(bestc)): bestc=core
    found[key]=bestc; print(key, len(parse(bestc)) if bestc else None, bestc)
pickle.dump(found,open('cpfound.pkl','wb'))
