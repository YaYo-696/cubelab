from ll import *
import itertools, time
def gens_of(faces): return [f+a for f in faces for a in ('',"'",'2',"2'")]
def build_forward(faces,depth):
    G=gens_of(faces); F={}
    roots=[]
    for b in range(5):
        r=apply(SOLVED,' '.join(['U']*b)) if b else SOLVED
        F.setdefault(r,(b,'')); roots.append((r,''))
    frontier=roots
    for d in range(depth):
        nxt=[]
        for s,seq in frontier:
            last=seq.split()[-1].rstrip("2'") if seq else None
            for m in G:
                if m.rstrip("2'")==last: continue
                t=tuple(s[j] for j in MOVES[m]) if False else apply(s,m)
                if t not in F: F[t]=(F[s][0],(seq+' '+m).strip()); nxt.append((t,(seq+' '+m).strip()))
        frontier=nxt
    return F
def mitm(P,F,faces,depth):
    G=gens_of(faces); best=None
    starts=[]
    for a in range(5):
        pre=' '.join(['U']*a)
        starts.append((apply(P,pre) if a else P,''))
    frontier=starts; seen={s for s,_ in starts}
    for d in range(depth+1):
        for s,w in frontier:
            if s in F:
                b,f=F[s]
                core=(w+' '+(invert(f) if f else '')).strip()
                if best is None or len(parse(core))<len(parse(best)): best=core
        if best is not None: return best
        if d==depth: break
        nxt=[]
        for s,w in frontier:
            last=w.split()[-1].rstrip("2'") if w else None
            for m in G:
                if m.rstrip("2'")==last: continue
                t=apply(s,m)
                if t not in seen: seen.add(t); nxt.append((t,(w+' '+m).strip()))
        frontier=nxt
    return best
def strip_auf(alg):
    ms=parse(alg)
    while ms and ms[0].startswith('U') and not ms[0].startswith('Uv'): ms=ms[1:]
    while ms and ms[-1].startswith('U') and not ms[-1].startswith('Uv'): ms=ms[:-1]
    return ' '.join(ms)
# pure state builders
def with_edges(flips=(),perm=None):
    s=list(SOLVED)
    if perm:
        base=list(SOLVED)
        for pos_i,piece_i in enumerate(perm):
            us,ss=edge_stickers(EPOS[pos_i]); s[ss]=ORDER[piece_i]
    for i in flips:
        us,ss=edge_stickers(EPOS[i]); s[us],s[ss]=s[ss],s[us]
    return tuple(s)
def with_corners(tw=(0,0,0,0,0),perm=None):
    s=list(SOLVED)
    if perm:
        for pos_i,piece_i in enumerate(perm):
            u,a,b=corner_stickers(CPOS[pos_i]); s[u]='U'; s[a]=ORDER[piece_i]; s[b]=ORDER[(piece_i+1)%5]
    for i,t in enumerate(tw):
        u,a,b=corner_stickers(CPOS[i]); cols=[s[u],s[a],s[b]]
        for _ in range(t): cols=[cols[2],cols[0],cols[1]]
        s[u],s[a],s[b]=cols
    return tuple(s)
