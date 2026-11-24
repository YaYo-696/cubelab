import json, re, os
from analyze import *
from l4e_src import L4E
SRC_L4E = "https://cubingapp.com/algorithms/Pyraminx-L4E"
SRC_BEG = "https://twisty-puzzle.pages.dev/pyraminx-algorithms/"
def normalize(alg):
    out=[]
    for t in alg.replace('(',' ').replace(')',' ').split():
        m=re.fullmatch(r"([ULRBulrb])(2?)('?)",t); n=int(m.group(2) or 1); n=-n if m.group(3) else n; n%=3
        if n: out.append(m.group(1)+('' if n==1 else "'"))
    return ' '.join(out)
def exact(alg, state):
    for pre in ['', 'U ', "U' "]:
        a=(pre+alg).strip()
        if apply(state, a)==SOLVED: return a
    raise AssertionError(('no resuelve', alg))
GROUPS = {
 'Down Edge Solved': ('des', 'Arista inferior resuelta', 'Down edge solved'),
 'Down Edge Flipped': ('def', 'Arista inferior volteada', 'Down edge flipped'),
 'Upper Edge Solved': ('ues', 'Arista superior resuelta', 'Upper edge solved'),
 'Upper Edge Flipped': ('uef', 'Arista superior volteada', 'Upper edge flipped'),
 'Nothing Placed': ('np', 'Nada colocado', 'Nothing placed'),
}
notes=[]
# --- fixes found during verification ---
L4E = {g:[(n,list(a)) for n,a in c] for g,c in L4E.items()}
ues = dict(L4E['Upper Edge Solved'])
assert ues['#2']==ues['#3']
for i,(n,a) in enumerate(L4E['Upper Edge Solved']):
    if n=='#3': L4E['Upper Edge Solved'][i]=('#3',[mirror(ues['#4'][0])])
notes.append("Upper Edge Solved #3: la fuente repite el algoritmo de #2 (mismo caso). Se reemplazó por el espejo de #4 (L R' L' R), que es el único caso del grupo sin su espejo en la lista.")
deff = L4E['Down Edge Flipped']
for i,(n,a) in enumerate(deff):
    if n=='#4':
        deff[i]=('#4a',[a[0]]); deff.insert(i+1,('#4b',[a[1]]))
        break
notes.append("Down Edge Flipped #4: la fuente pone dos algoritmos que resuelven casos distintos (uno es el espejo del otro). Se separaron como #4a y #4b.")
cases_l4e=[]; seen={}
for g,cases in L4E.items():
    gid,ges,gen=GROUPS[g]
    for n,algs in cases:
        algs=[normalize(a) for a in algs]
        main=algs[0]; setup=invert(main); S=apply(SOLVED,setup)
        # V intacta: aristas LB, RB y centros L R B
        assert all(S[i]==SOLVED[i] for p in ['edgeLB','edgeRB','ctrL','ctrR','ctrB','tipL','tipR','tipB'] for i in PIECES[p]), n
        ex=[exact(a,S) for a in algs]
        c=canon(S); assert c not in seen, (g,n,seen.get(c)); seen[c]=(g,n)
        cid=f"l4e-{gid}-{n.strip('#').lower().replace(' ','-').replace(chr(39),'p')}"
        cases_l4e.append({"id":cid,"name":{"es":f"{ges} · {n}","en":f"{gen} · {n}"},"group":gid,
            "setup":setup,"algs":ex,"source":SRC_L4E,"moves":len(ex[0].split())})
# mirror closure
for c in list(seen):
    pass
# --- L3E = casos con la arista inferior resuelta (primera capa completa) ---
extra={'Sune':["R' U R U R' U R","L' U L U L' U L"],'Antisune':["R' U' R U' R' U' R","L' U' L U' L' U' L"]}
NAMES={'Sune':('Sune (ciclo de 3 aristas)','Sune (3-edge cycle)'),'Antisune':('Antisune (ciclo inverso)','Antisune (reverse cycle)'),
       '2-flip':('Volteo de 2 aristas','2-edge flip'),"R' unsexy R":("Ciclo con volteo · R' (U' L' U L) R","Cycle with flip · R' (U' L' U L) R"),
       "L unsexy L'":("Ciclo con volteo · L (U R U' R') L'","Cycle with flip · L (U R U' R') L'")}
cases_l3e=[]
for n,algs in L4E['Down Edge Solved']:
    main=normalize(algs[0]); setup=invert(main); S=apply(SOLVED,setup)
    assert all(S[i]==SOLVED[i] for p in ['edgeLR','edgeLB','edgeRB','ctrL','ctrR','ctrB'] for i in PIECES[p])
    alts=[exact(normalize(a),S) for a in [main]+extra.get(n,[])]
    for a in extra.get(n,[]): assert canon(case_state(a))==canon(S)
    cid='l3e-'+{'Sune':'sune','Antisune':'antisune','2-flip':'2flip',"R' unsexy R":'flip-cycle-r',"L unsexy L'":'flip-cycle-l'}[n]
    cases_l3e.append({"id":cid,"name":{"es":NAMES[n][0],"en":NAMES[n][1]},"group":"l3e","setup":setup,"algs":alts,
        "source":SRC_L4E+(" ; "+SRC_BEG if n in extra else ""),"moves":len(alts[0].split())})
# final exact re-check of every case and alternative
for c in cases_l3e+cases_l4e:
    S=apply(SOLVED,c['setup'])
    for a in c['algs']: assert apply(S,a)==SOLVED, (c['id'],a)
    for a in c['algs']+[c['setup']]:
        assert all(re.fullmatch(r"[ULRB]'?",t) for t in a.split()), a
algsets={"version":1,"sets":[
 {"id":"l3e","name":{"es":"Última capa (L3E)","en":"Last layer (L3E)"},
  "stage":"Puntas, los 4 centros y la primera capa completa (aristas LR, LB y RB) resueltas; quedan las 3 aristas de arriba.",
  "cases":cases_l3e},
 {"id":"l4e","name":{"es":"Últimas 4 aristas (L4E)","en":"Last 4 edges (L4E)"},
  "stage":"Puntas resueltas y la V hecha: centros L, R y B con las aristas LB y RB. La capa U puede estar girada; quedan las aristas LR, UL, UR y UB.",
  "cases":cases_l4e}]}
os.makedirs('out/content-drop/pyram',exist_ok=True)
json.dump(algsets,open('out/content-drop/pyram/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({"notes":notes,"n_l3e":len(cases_l3e),"n_l4e":len(cases_l4e)},open('out/stats.json','w'),ensure_ascii=False,indent=2)
print(len(cases_l3e),len(cases_l4e)); print('\n'.join(notes))
# mirror closure check
mc=[c['id'] for c in cases_l4e if canon(case_state(mirror(c['algs'][0]))) not in seen]
print('sin espejo:',mc)
