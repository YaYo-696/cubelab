from sq1 import *
import json, re
A=json.load(open('out/content-drop/sq1/algsets.json')); L=json.load(open('out/content-drop/sq1/lessons.json'))
tokre=re.compile(r"^\s*(/|\(\s*(-?[0-6])\s*,\s*(-?[0-6])\s*\))")
def syntax_ok(alg):
    s=alg.strip()
    while s:
        m=tokre.match(s)
        if not m: return False
        if m.group(1)!='/':
            a,b=int(m.group(2)),int(m.group(3))
            if a<-5 or b<-5 or (a==0 and b==0): return False
        s=s[m.end():].strip()
    return True
errs=[]; ids=set(); nv=0
for st in A['sets']:
    assert re.match(r'^sq1-[a-z0-9-]+$',st['id'])
    for c in st['cases']:
        assert c['id'] not in ids; ids.add(c['id'])
        assert c['source'].startswith('http') or c['source'].startswith('generated:')
        if not syntax_ok(c['setup']): errs.append('setup syntax '+c['id'])
        try: S=apply(SOLVED,c['setup'])
        except Exception as e: errs.append('setup illegal '+c['id']); continue
        for a in c['algs']:
            nv+=1
            if not syntax_ok(a): errs.append('alg syntax '+c['id'])
            try:
                if apply(S,a)!=SOLVED: errs.append('nosolve '+c['id'])
            except Exception: errs.append('alg illegal '+c['id'])
les={l['id'] for l in L['lessons']}
for l in L['lessons']:
    for p in l['prerequisites']: assert p in les
    for d in l['demos']:
        if d['setup'] and not syntax_ok(d['setup']): errs.append('demo setup '+l['id'])
        try:
            S=apply(SOLVED,d['setup']) if d['setup'] else SOLVED
            E=apply(S,d['alg'])
            if d['setup'] and E!=SOLVED: errs.append('demo nosolve '+l['id'])
        except Exception: errs.append('demo illegal '+l['id'])
print('errores',errs,'| casos',len(ids),'| variantes',nv)
