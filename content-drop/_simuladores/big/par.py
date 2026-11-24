from nxn import *
c=Cube(4); S0=c.solved
def top_only(s):
    for i,(f,p) in enumerate(c.stk):
        if s[i]!=S0[i] and not (p[1]>1.0): return False   # top layer stickers have y=2 (U) or y=1.5 (side top row)
    return True
def diff(s): return [(c.stk[i][0],c.stk[i][1]) for i in range(len(s)) if s[i]!=S0[i]]
cands={
 'oll_a':"Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
 'oll_b':"r U2 r U2 r' U2 r U2 l' U2 r U2 r' U2 r'",
 'oll_c':"2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
 'oll_d':"Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2",
 'pll_a':"2R2 U2 2R2 Uw2 2R2 Uw2",
 'pll_b':"r2 U2 r2 Uw2 r2 Uw2",
 'pll_c':"Rw2 U2 Rw2 Uw2 Rw2 Uw2",
 'pll_d':"2R2 U2 2R2 2U2 2R2 2U2",
}
for k,a in cands.items():
    s=c.apply(S0,invert(a)); d=diff(s)
    # count by sticker region
    toponly=top_only(s)
    # need rotation check: solved up to whole-cube orientation?
    print(k,'stickers changed',len(d),'only top layer',toponly)
