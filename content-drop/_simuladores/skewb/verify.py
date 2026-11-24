from tools import *
import json, itertools, re
A=json.load(open('out/content-drop/skewb/algsets.json')); L=json.load(open('out/content-drop/skewb/lessons.json'))
UL=layer('U'); errs=[]; tok=re.compile(r"^[RULB]'?$")
ids=set()
for s in A['sets']:
    assert re.match(r'^skewb-[a-z0-9-]+$',s['id'])
    for c in s['cases']:
        assert c['id'] not in ids; ids.add(c['id'])
        assert c['source'].startswith('generated:')
        S=apply(SOLVED,c['setup'])
        if c['setup']!=invert(c['algs'][0]): errs.append('setup not inverse '+c['id'])
        for a in c['algs']:
            if not all(tok.match(t) for t in a.split()): errs.append('tok '+a)
            if apply(S,a)!=SOLVED: errs.append('nosolve '+c['id']+' '+a)
        # case must have U layer solved
        if not all(S[i]==SOLVED[i] for i in UL): errs.append('U layer broken in case '+c['id'])
les={l['id'] for l in L['lessons']}
for l in L['lessons']:
    for p in l['prerequisites']: assert p in les
    for d in l['demos']:
        S=apply(SOLVED,d['setup']) if d['setup'] else SOLVED; E=apply(S,d['alg'])
        if l['id']=='skewb-first-layer':
            if not all(E[i]==SOLVED[i] for i in UL): errs.append('demo fl '+d['alg'])
        elif l['id'] in('skewb-corners','skewb-centers'):
            if E!=SOLVED: errs.append('demo '+l['id'])
# convention robustness
def tr(alg,P,flip):
    return ' '.join(P[m[0]]+("'" if m.endswith("'")!=flip else '') for m in alg.split())
ok_cfg=[]
for perm in itertools.permutations('RULB'):
    P=dict(zip('RULB',perm))
    for flip in (False,True):
        good=all(apply(apply(SOLVED,tr(c['setup'],P,flip)),tr(a,P,flip))==SOLVED for s in A['sets'] for c in s['cases'] for a in c['algs'])
        if good: ok_cfg.append((''.join(perm),flip))
print('errores',errs); print('casos',len(ids),'variantes',sum(len(c['algs']) for s in A['sets'] for c in s['cases']))
print('convenciones donde todo sigue valiendo',len(ok_cfg),'/48', ok_cfg[:8])
