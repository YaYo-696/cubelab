from skewb import *
import collections
def sgn(x): return 1 if x>0 else -1
CENTER=[i for i,(f,p) in enumerate(STK) if p==FACES[f]]
def corner_of(i):
    f,p=STK[i]; return None if i in CENTER else tuple(sgn(x) for x in p)
def layer(face):
    n=FACES[face]; ax=[i for i in range(3) if n[i]][0]
    return [i for i,(f,p) in enumerate(STK) if f==face or (corner_of(i) and corner_of(i)[ax]==n[ax])]
T=TURNS
res={}
def _main():
      for face in FACES:
        L=layer(face); found=collections.defaultdict(set)
        def rec(state,seq,depth):
            if seq and state!=SOLVED and all(state[i]==SOLVED[i] for i in L):
                found[len(seq)].add(state)
            if depth==0: return
            for m in T:
                if seq and m[0]==seq[-1][0]: continue
                rec(apply(state,m),seq+[m],depth-1)
        rec(SOLVED,[],7)
        print(face, {k:len(v) for k,v in sorted(found.items())})

if __name__=='__main__': _main()
