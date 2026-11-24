from sq1 import *
import collections
def turn_pairs(a):
    tops=[k for k in range(12) if split_abs(turns(a[:12],k))]
    bots=[k for k in range(12) if split_abs(turns(a[12:24],k))]
    return [(t,b) for t in tops for b in bots]
def step(a,t,b):  # turn then slash
    x=turns(a[:12],t)+turns(a[12:24],b)+a[24]
    return slash(x)
def bfs_from(starts,depth,keyf=lambda a:a[:24]):
    """starts: list of (state, moves) ; explores turn+slash steps. returns dict key->(state,moves)"""
    seen={}
    frontier=[]
    for s,mv in starts:
        k=keyf(s)
        if k not in seen: seen[k]=(s,mv); frontier.append((s,mv))
    for d in range(depth):
        nxt=[]
        for s,mv in frontier:
            for t,b in turn_pairs(s):
                y=step(s,t,b); k=keyf(y)
                if k not in seen:
                    seen[k]=(y,mv+[(norm_amt(t),norm_amt(b)),'/']); nxt.append((y,mv+[(norm_amt(t),norm_amt(b)),'/']))
        frontier=nxt
    return seen
def meet(goal_table, case_state, depth, keyf=lambda a:a[:24]):
    """goal_table: key->(state,moves from SOLVED-ish start). find shortest path from case_state to any goal state.
    returns moves (from case) or None. Also tries final/initial layer turns."""
    best=None
    back=bfs_from([(case_state,[])],depth,keyf)
    # need: apply(case, w) == goal_state g  where g = start + f ; then alg = w + inverse(f)
    for k,(s,w) in back.items():
        # allow aligning turn: compare up to layer rotations: we search all rotations of s
        for t in range(12):
            for b in range(12):
                r=turns(s[:12],t)+turns(s[12:24],b)+s[24]
                kk=keyf(r)
                if kk in goal_table:
                    g,f=goal_table[kk]
                    cand=w+[(norm_amt(t),norm_amt(b))]+inv_moves(f)
                    L=sum(1 for m in cand if m=='/')
                    if best is None or L<best[0]: best=(L,cand)
    return None if best is None else clean(best[1])
def inv_moves(mv):
    out=[]
    for m in reversed(mv):
        out.append('/' if m=='/' else ((6 if norm_amt(m[0])==6 else -norm_amt(m[0])),(6 if norm_amt(m[1])==6 else -norm_amt(m[1]))))
    return out
def clean(mv):
    # merge consecutive turns, drop zero turns
    out=[]
    for m in mv:
        if m!='/' and out and out[-1]!='/':
            a,b=out.pop(); m=(norm_amt(a+m[0]),norm_amt(b+m[1]))
        if m!='/' and m==(0,0): continue
        out.append(m)
    return out
