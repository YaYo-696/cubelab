from pyra import *
from l4e_src import L4E
def variants(S): return [S, apply(S,'U'), apply(S,"U'")]
def canon(S): return min(variants(S))
def aligned(S):
    for v in variants(S):
        if all(v[i]==SOLVED[i] for i in PIECES['ctrU']): return v
def edge_status(S, e):
    idx=PIECES[e]
    if all(S[i]==SOLVED[i] for i in idx): return 'ok'
    cols=sorted(S[i] for i in idx); want=sorted(SOLVED[i] for i in idx)
    if cols==want: return 'flip'
    return 'x'
def case_state(alg): return apply(SOLVED, invert(alg))
def mirror(alg):
    sw={'L':'R','R':'L','l':'r','r':'l'}
    out=[]
    for t in alg.replace('(',' ').replace(')',' ').split():
        m=re.fullmatch(r"([ULRBulrb])(2?)('?)",t)
        b=sw.get(m.group(1),m.group(1)); n=m.group(2); p='' if m.group(3) else "'"
        out.append(b+n+p)
    return ' '.join(out)
