from steps import *
import time
def cases_for(A, slot_sets):
    base=A(SOLVED)
    out={}
    for assign in slot_sets:
        a=list(base)
        for i,c in assign: a[i]=c.upper(); a[i+1]=c
        a=''.join(a)
        k=rot_canon(a)
        if k not in out: out[k]=a
    return out
CS=[0,3,6,9,13,16,19,22]
def co_cases():
    sets=[]
    for U in itertools.combinations(CS,4):
        sets.append([(i,'u' if i in U else 'd') for i in CS])
    cs=cases_for(A_co,sets)
    solved=rot_canon(A_co(SOLVED))
    return {k:v for k,v in cs.items() if k!=solved}
if __name__=='__main__':
    cs=co_cases(); print('CO cases',len(cs))
    t=time.time(); G=bfs_from([(A_co(SOLVED),[])],3); print('goal table',len(G),round(time.time()-t,1),'s')
    res={}
    for k,a in cs.items():
        m=meet(G,a,3); res[k]=(a,m)
        print(sum(1 for x in m if x=='/') if m else None, fmt(m) if m else None)
    pickle.dump(res,open('co.pkl','wb'))
