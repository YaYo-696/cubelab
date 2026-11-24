import itertools
# front dials 0..8 row-major UL U UR / L C R / DL D DR ; back 9..17 (cubing order)
FRONT={'UL':{0,1,3,4},'UR':{1,2,4,5},'DL':{3,4,6,7},'DR':{4,5,7,8}}
FRONT['U']=FRONT['UL']|FRONT['UR']; FRONT['D']=FRONT['DL']|FRONT['DR']
FRONT['L']=FRONT['UL']|FRONT['DL']; FRONT['R']=FRONT['UR']|FRONT['DR']; FRONT['ALL']=set(range(9))
# cubing: UL_PLUS_ back corner 11 (-1); U: 9,11; ALL: 9,11,15,17 ; derive back corner for each front corner via the ALL pattern & UL
BACK_OF={0:11,2:9,6:17,8:15}   # front corner -> back dial index (from UL->11, U->{9,11}, ALL->{9,11,15,17}; z-symmetry gives UR->9, DL->17, DR->15)
FRONT_OF={v:k for k,v in BACK_OF.items()}
def front_move(pins,a,s):
    s=list(s)
    for d in FRONT[pins]:
        s[d]=(s[d]+a)%12
        if d in BACK_OF: s[BACK_OF[d]]=(s[BACK_OF[d]]-a)%12
    return s
def y2(s): return s[9:]+s[:9]
def apply(alg,s=None):
    s=list(s or [0]*18)
    for t in alg.split():
        if t=='y2': s=y2(s); continue
        pins=t.rstrip('0123456789+-')
        if pins==t: continue   # pin-only token
        amt=int(t[len(pins):-1])*(1 if t.endswith('+') else -1)
        s=front_move(pins,amt,s)
    return s
