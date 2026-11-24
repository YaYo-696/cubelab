from classify import *
best=pickle.load(open('best.pkl','rb')); cpf=pickle.load(open('cpfound.pkl','rb'))
allcp=dict(best['cp']); allcp.update(cpf)
algs=[normalize(a) for a in best['cp'].values() if len(parse(normalize(a)))<=13]  # short clean ones
U=lambda k: ' '.join(['U']*k)
improved={}
for key,cur in allcp.items():
    P=with_corners(perm=key); bestc=normalize(cur)
    for A in algs:
        for j in range(5):
            s1=apply(P,(U(j)+' '+A).strip())
            for k in range(5):
                s2=apply(s1,U(k)) if k else s1
                for B in algs:
                    s3=apply(s2,B)
                    for m in range(5):
                        if (apply(s3,U(m)) if m else s3)==SOLVED:
                            core=normalize(strip_auf(' '.join(x for x in [U(j),A,U(k),B] if x)))
                            if len(parse(core))<len(parse(bestc)): bestc=core; improved[key]=core
    if key in improved: print(key,len(parse(normalize(cur))),'->',len(parse(bestc)))
pickle.dump(improved,open('cpimproved.pkl','wb'))
