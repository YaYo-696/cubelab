from co import *
ES=[2,5,8,11,12,15,18,21]
def eo_cases():
    base=A_eo(SOLVED); out={}
    for U in itertools.combinations(ES,4):
        a=list(base)
        for i in ES: a[i]='x' if i in U else 'y'
        a=''.join(a); k=rot_canon(a)
        if k not in out: out[k]=a
    s=rot_canon(base); out.pop(s,None); return out
if __name__=='__main__':
    cs=eo_cases(); print('EO cases',len(cs))
    t=time.time(); G=bfs_from([(A_eo(SOLVED),[])],3); print('goal table',len(G),round(time.time()-t,1))
    res={}
    for k,a in cs.items():
        m=meet(G,a,3); res[k]=(a,m)
        print(sum(1 for x in m if x=='/') if m else None, fmt(m) if m else None)
    pickle.dump(res,open('eo.pkl','wb'))
