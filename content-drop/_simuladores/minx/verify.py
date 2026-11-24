from classify import *
import json, re
A=json.load(open('out/content-drop/minx/algsets.json')); L=json.load(open('out/content-drop/minx/lessons.json'))
tok=re.compile(r"^(U|F|R|BR|BL|L|D|FR|DR|B|DL|FL)(2)?(')?$")
errs=[]; ids=set(); nv=0
for s in A['sets']:
    assert re.match(r'^minx-[a-z0-9-]+$',s['id'])
    for c in s['cases']:
        assert c['id'] not in ids; ids.add(c['id'])
        assert c['source'].startswith('http') or c['source'].startswith('generated:')
        S=apply(SOLVED,c['setup'])
        if not f2l_ok(S): errs.append('f2l '+c['id'])
        if c['setup']!=invert(c['algs'][0]): errs.append('inv '+c['id'])
        st,k=step_of(S)
        if st!=s['stage']: errs.append(f"stage {c['id']} {st}")
        for a in c['algs']:
            nv+=1
            if not all(tok.match(t) for t in a.split()): errs.append('tok '+a)
            if apply(S,a)!=SOLVED: errs.append('nosolve '+c['id'])
    keys={step_of(apply(SOLVED,c['setup']))[1] for c in s['cases']}
    if keys!=ALL[s['stage']]: errs.append('coverage '+s['id'])
les={l['id'] for l in L['lessons']}
for l in L['lessons']:
    for p in l['prerequisites']: assert p in les
    for r in l['algSetRefs']: assert r in {s['id'] for s in A['sets']}
    for d in l['demos']:
        if not all(tok.match(t) for t in (d['setup']+' '+d['alg']).split()): errs.append('demo tok '+l['id'])
        if l['id'] in ('minx-eo','minx-ep','minx-cp') or (l['id']=='minx-co' and d['setup']):
            if apply(apply(SOLVED,d['setup']) if d['setup'] else SOLVED,d['alg'])!=SOLVED: errs.append('demo '+l['id'])
print('errores',errs); print('casos',len(ids),'variantes',nv,{s['id']:len(s['cases']) for s in A['sets']})
