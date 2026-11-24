from classify import *
import json, os
best=pickle.load(open('best.pkl','rb')); cpf=pickle.load(open('cpfound.pkl','rb'))
CS='https://www.cubeskills.com/uploads/pdf/tutorials/intermediate-megaminx-techniques.pdf'
GENCP='generated:combinación verificada de dos algoritmos de CP de cubeskills (Feliks Zemdegs y Andy Klise)'
def cyc(p):
    seen=set(); t=[]
    for i in range(5):
        if i in seen: continue
        j=i;n=0
        while j not in seen: seen.add(j); j=p[j]; n+=1
        if n>1: t.append(n)
    return sorted(t)
def mk(id,es,en,group,alg,src):
    alg=normalize(alg); setup=invert(alg)
    S=apply(SOLVED,setup); assert apply(S,alg)==SOLVED and f2l_ok(S)
    return {'id':id,'name':{'es':es,'en':en},'group':group,'setup':setup,'algs':[alg],'source':src}
sets=[]
# EO
eon={(0,0,0,1,1):('2 aristas vecinas','2 adjacent edges'),(0,0,1,0,1):('2 aristas separadas','2 non-adjacent edges'),(0,1,1,1,1):('4 aristas','4 edges')}
cases=[mk(f'minx-eo-{i}',f'EO · {eon[k][0]}',f'EO · {eon[k][1]}','Orientar aristas / Orient edges',a,CS) for i,(k,a) in enumerate(sorted(best['eo'].items()),1)]
sets.append({'id':'minx-eo','name':{'es':'Megaminx · Orientar aristas (EO)','en':'Megaminx · Edge orientation (EO)'},'stage':'eo','cases':cases})
# CO
cases=[]
for i,(k,a) in enumerate(sorted(best['co'].items(),key=lambda kv:(sum(1 for x in kv[0] if x),kv[0])),1):
    n=sum(1 for x in k if x)
    cases.append(mk(f'minx-co-{i}',f'CO #{i} · {n} esquinas giradas',f'CO #{i} · {n} twisted corners',f'{n} esquinas / {n} corners',a,CS))
sets.append({'id':'minx-co','name':{'es':'Megaminx · Orientar esquinas (CO)','en':'Megaminx · Corner orientation (CO)'},'stage':'co','cases':cases})
# EP
def ep_type(S):
    best_t=None
    for b in range(5):
        e=ep(apply(S,' '.join(['U']*b)) if b else S)
        t=cyc(e); key=(sum(t),t)
        if best_t is None or key<best_t: best_t=key
    return best_t[1]
cases=[]
for i,(k,a) in enumerate(sorted(best['ep'].items()),1):
    S=apply(SOLVED,invert(normalize(a))); t=ep_type(S)
    es,en=({(3,):('ciclo de 3','3-cycle'),(2,2):('2 pares','2 pairs')}.get(tuple(t),('ciclo de 5','5-cycle')))
    cases.append(mk(f'minx-ep-{i}',f'EP · {es} ({i})',f'EP · {en} ({i})',f'{es} / {en}',a,CS))
sets.append({'id':'minx-ep','name':{'es':'Megaminx · Permutar aristas (EP)','en':'Megaminx · Edge permutation (EP)'},'stage':'ep','cases':cases})
# CP
allcp=dict(best['cp']); allcp.update(cpf); imp=pickle.load(open('cpimproved.pkl','rb')); allcp.update(imp)
cases=[]
def cpname(k):
    t=cyc(k)
    if t==[3]:
        fixed=[i for i in range(5) if k[i]==i]; adj=(fixed[1]-fixed[0])%5 in (1,4)
        return ('ciclo de 3, fijas vecinas','3-cycle, adjacent fixed') if adj else ('ciclo de 3, fijas separadas','3-cycle, non-adjacent fixed')
    if t==[2,2]: return ('doble intercambio','double swap')
    return ('ciclo de 5','5-cycle')
order={'ciclo de 3, fijas vecinas':0,'ciclo de 3, fijas separadas':1,'doble intercambio':2,'ciclo de 5':3}
rows=sorted(allcp.items(),key=lambda kv:(order[cpname(kv[0])[0]],len(parse(normalize(kv[1]))),kv[0]))
for i,(k,a) in enumerate(rows,1):
    es,en=cpname(k)
    cases.append(mk(f'minx-cp-{i}',f'CP #{i} · {es}',f'CP #{i} · {en}',f'{es} / {en}',a,GENCP if (k in cpf or k in imp) else CS))
sets.append({'id':'minx-cp','name':{'es':'Megaminx · Permutar esquinas (CP)','en':'Megaminx · Corner permutation (CP)'},'stage':'cp','cases':cases})
json.dump({'version':1,'sets':sets},open('/dev/null','w'))
pickle.dump(sets,open('sets.pkl','wb'))
print({s['id']:len(s['cases']) for s in sets})
for s in sets:
    for c in s['cases']: print(c['id'],c['name']['es'],'|',c['algs'][0])
