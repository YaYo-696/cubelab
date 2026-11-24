import re
owners=[0,0,1,2,2,3,4,4,5,6,6,7,8,9,9,10,11,11,12,13,13,14,15,15]
SOLVED=''.join(chr(65+p) for p in owners)+'0'
def turns(layer,shift): shift%=12; return layer[12-shift:]+layer[:12-shift]
def slash(s): return s[0:6]+s[12:18]+s[6:12]+s[18:24]+('1' if s[24]=='0' else '0')
def first_half(layer,i):  # position i holds first half of a corner (exact letters)
    return layer[i]==layer[(i+1)%12]
def split_exact(layer): return layer[0]!=layer[11] and layer[5]!=layer[6]
def can_slash(s): return split_exact(s[:12]) and split_exact(s[12:24])
def parse(alg):
    out=[]
    for m in re.finditer(r"/|\(\s*(-?\d)\s*,\s*(-?\d)\s*\)",alg):
        if m.group(0)=='/': out.append('/')
        else: out.append((int(m.group(1)),int(m.group(2))))
    return out
def apply(s,alg):
    for mv in (parse(alg) if isinstance(alg,str) else alg):
        if mv=='/':
            if not can_slash(s): raise ValueError('cannot slash')
            s=slash(s)
        else:
            s=turns(s[:12],mv[0])+turns(s[12:24],mv[1])+s[24]
    return s
def fmt(moves):
    return ' '.join('/' if m=='/' else f'({m[0]}, {m[1]})' for m in moves)
def norm_amt(v):
    v%=12
    return v-12 if v>6 else v
def inverse(alg):
    inv=lambda v: 6 if norm_amt(v)==6 else -norm_amt(v)
    return fmt([m if m=='/' else (inv(m[0]),inv(m[1])) for m in reversed(parse(alg))])
# abstraction: encode exact state -> abstract string using a piece->class map
CORNERS=set('ACEGJLNP'); EDGES=set('BDFHIKMO')
def abstract(s,cmap,emap):
    out=[]
    for li in (0,12):
        L=s[li:li+12]
        for i in range(12):
            p=L[i]
            if p in CORNERS:
                c=cmap(p)
                out.append(c.upper() if first_half(L,i) else c.lower())
            else: out.append(emap(p))
    return ''.join(out)+s[24]
def split_abs(layer): return not layer[11].isupper() and not layer[5].isupper()
def can_slash_abs(a): return split_abs(a[:12]) and split_abs(a[12:24])
def apply_abs(a,moves):
    for mv in moves:
        if mv=='/':
            if not can_slash_abs(a): raise ValueError
            a=slash(a)
        else: a=turns(a[:12],mv[0])+turns(a[12:24],mv[1])+a[24]
    return a
