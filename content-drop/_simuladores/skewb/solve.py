from skewb import *
from faces import layer, CENTER, corner_of
import collections, pickle
inv1=lambda m: m[:-1] if m.endswith("'") else m+"'"
UL=layer('U')
# forward table depth<=5
F={SOLVED:''}; frontier=[SOLVED]
for d in range(5):
    nxt=[]
    for s in frontier:
        last=F[s].split()[-1][0] if F[s] else None
        for m in TURNS:
            if m[0]==last: continue
            t=apply(s,m)
            if t not in F: F[t]=(F[s]+' '+m).strip(); nxt.append(t)
    frontier=nxt
print('forward',len(F))
def optimal(S, maxback=6):
    best=None; layer_={S:''}; frontier=[S]; d=0
    while True:
        for s in frontier:
            if s in F:
                alg=(layer_[s]+' '+invert(F[s]) if F[s] else layer_[s]).strip()
                if best is None or len(alg.split())<len(best.split()): best=alg
        if best is not None and d>=len(best.split())-0: break
        if d==maxback: break
        nxt=[]
        for s in frontier:
            last=layer_[s].split()[-1][0] if layer_[s] else None
            for m in TURNS:
                if m[0]==last: continue
                t=apply(s,m)
                if t not in layer_: layer_[t]=(layer_[s]+' '+m).strip(); nxt.append(t)
        frontier=nxt; d+=1
    return best
def all_optimal(S, L):
    """all algs of length L solving S exactly (meet in middle, split k=L//2 back)"""
    k=L-min(L,5); res=set()
    # backward all sequences of length k from S
    def rec(s,seq):
        if len(seq)==k:
            # need forward sequence f of length L-k with apply(SOLVED,f)==s
            if s in F and len(F[s].split())==L-k:
                pass
            return [(s,seq)]
        out=[]
        for m in TURNS:
            if seq and m[0]==seq[-1][0]: continue
            out+=rec(apply(s,m),seq+[m])
        return out
    return rec
