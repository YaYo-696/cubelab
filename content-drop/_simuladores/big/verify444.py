import json, re, io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    from pllpar import c, S0, invert, effect
A=json.load(open('out/content-drop/444/algsets.json')); L=json.load(open('out/content-drop/444/lessons.json'))
tok=re.compile(r"^(?:(?:[23])?[RLUDFB]w?|[RLUDFB]|2[RLUDFB]|[xyz]|[rludfb])(2|')?$")
errs=[]; ids=set(); nv=0
for s in A['sets']:
    assert re.match(r'^444-[a-z0-9-]+$',s['id'])
    for cs in s['cases']:
        assert cs['id'] not in ids; ids.add(cs['id'])
        S=c.apply(S0,cs['setup'])
        if not all(S[i]==S0[i] or c.stk[i][1][1]>1 for i in range(len(S))): errs.append('not LL-only '+cs['id'])
        if any(t in('x',"x'",'x2','y',"y'",'y2','z',"z'",'z2') for t in cs['setup'].split()): errs.append('rotation in setup '+cs['id'])
        for a in cs['algs']:
            nv+=1
            if not all(tok.match(t) for t in a.split()): errs.append('tok '+a)
            if c.apply(S,a)!=S0: errs.append('nosolve '+cs['id'])
        print(cs['id'], effect(S)[0])
# PLL parity rule: after P, state is a valid even 3x3 LL (check by solving with P + some 3x3 PLL exists) - for each pll case
P="2R2 U2 2R2 Uw2 2R2 Uw2 U2"
for l in L['lessons']:
    for d in l['demos']:
        if d['setup']: 
            if c.apply(c.apply(S0,d['setup']),d['alg'])!=S0: errs.append('demo '+l['id'])
print('errores',errs,'casos',len(ids),'variantes',nv)
