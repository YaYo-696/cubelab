from classify import *
best=pickle.load(open('best.pkl','rb'))
import itertools
threes={k:a for k,a in best['cp'].items() if sorted(len(c) for c in [k]) and sum(1 for i in range(5) if k[i]!=i)==3}
for k,a in threes.items(): print(k, normalize(a))
ROT=['','Uv','Uv2',"Uv2'","Uv'"]
def correct(s):
    e=ep(s); c=cp(s); k=e[0]
    return sum(1 for i in range(5) if (c[i]-k)%5==i)
def solved_mod(s):
    return f2l_ok(s) and ident_rot(ep(s)) and correct(s)==5 and not any(eo(s)) and not any(co(s))
def greedy(P,A,maxsteps=8):
    s=P; n=0
    while not solved_mod(s) and n<maxsteps:
        opts=[]
        for r in ROT:
            for times in (1,2):
                t=apply(s,(r+' '+' '.join([A]*times)).strip()) if r else apply(s,' '.join([A]*times))
                opts.append((correct(t),times,r,t))
        opts.sort(key=lambda o:(-o[0],o[1]))
        _,times,r,s=opts[0]; n+=times
    return solved_mod(s), n
for k,A in threes.items():
    res=[]
    for p in itertools.permutations(range(5)):
        inv=sum(1 for i in range(5) for j in range(i+1,5) if p[i]>p[j])
        if inv%2: continue
        P=with_corners(perm=p)
        res.append(greedy(P,A))
    print(normalize(A),'all solved',all(r[0] for r in res),'max apps',max(r[1] for r in res))
