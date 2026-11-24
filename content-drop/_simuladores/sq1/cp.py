from co import *
TOPC=[0,3,6,9]; BOTC=[13,16,19,22]
def cp_cases():
    base=list(A_cp(SOLVED)); out={}
    tops=[base[i] for i in TOPC]; bots=[base[i] for i in BOTC]
    for pt in itertools.permutations(tops):
        for pb in itertools.permutations(bots):
            a=base[:]
            for i,c in zip(TOPC,pt): a[i]=c; a[i+1]=c.lower()
            for i,c in zip(BOTC,pb): a[i]=c; a[i+1]=c.lower()
            a=''.join(a); k=rot_canon(a)
            if k not in out: out[k]=a
    out.pop(rot_canon(''.join(base)),None); return out
if __name__=='__main__':
    cs=cp_cases(); print('CP cases',len(cs))
    t=time.time(); G=bfs_from([(A_cp(SOLVED),[])],3); print('goal table',len(G),round(time.time()-t,1))
    res={}; t=time.time()
    for n,(k,a) in enumerate(cs.items()):
        m=meet(G,a,3); res[k]=(a,m)
    print('time',round(time.time()-t,1))
    import collections
    print(collections.Counter(sum(1 for x in m if x=='/') if m else None for a,m in res.values()))
    pickle.dump(res,open('cp.pkl','wb'))
