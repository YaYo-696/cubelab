from steps import *
from mitm import bfs_from
import json, os, pickle, collections
GEN='generated:cubelab-sq1-sim (búsqueda óptima por cortes con el modelo de la app)'
def A_shape(s): return abstract(s,lambda p:'c',lambda p:'e')
# ---- shape cases
T0=bfs_from([(A_shape(SOLVED),[])],9)
cls={}
for k,(st,mv) in T0.items():
    c=rot_canon(st)
    n=sum(1 for m in mv if m=='/')
    if c not in cls or n<cls[c][0]: cls[c]=(n,mv)
solved_c=rot_canon(A_shape(SOLVED))
cls.pop(solved_c,None)
def mk(id,es,en,group,setup_moves,src=GEN,extra=None):
    setup=fmt(clean(setup_moves)); alg=inverse(setup)
    S=apply(SOLVED,setup); assert apply(S,alg)==SOLVED
    algs=[alg]+(extra or [])
    return {'id':id,'name':{'es':es,'en':en},'group':group,'setup':setup,'algs':algs,'source':src}
shape_cases=[]
for i,(c,(n,mv)) in enumerate(sorted(cls.items(),key=lambda kv:(kv[1][0],kv[0])),1):
    shape_cases.append(mk(f'sq1-shape-{i}',f'Forma #{i} ({n} cortes)',f'Shape #{i} ({n} slices)',f'{n} cortes / {n} slices',mv))
print('shape',len(shape_cases),collections.Counter(c['group'] for c in shape_cases))
# ---- CO / EO / CP from pickles: m solves abstract case a ; setup = inverse(m)
def from_pkl(name,prefix,namef,groupf):
    res=pickle.load(open(name,'rb')); out=[]
    rows=[]
    for k,(a,m) in res.items():
        setup_moves=[x if x=='/' else x for x in m]
        setup=inverse(fmt(clean(m)))
        S=apply(SOLVED,setup)
        rows.append((sum(1 for x in m if x=='/'),k,a,setup,S))
    rows.sort(key=lambda r:(r[0],r[1]))
    for i,(n,k,a,setup,S) in enumerate(rows,1):
        es,en=namef(S,i,n); ges,gen=groupf(S,n)
        alg=inverse(setup); assert apply(S,alg)==SOLVED
        out.append({'id':f'{prefix}-{i}','name':{'es':es,'en':en},'group':f'{ges} / {gen}','setup':setup,'algs':[alg],'source':GEN})
    return out
def co_wrong(S): return sum(1 for i in (0,3,6,9) if S[i] not in CU)
def eo_wrong(S): return sum(1 for i in (2,5,8,11) if S[i] not in EU)
co_cases=from_pkl('co.pkl','sq1-co',lambda S,i,n:(f'CO #{i} · {co_wrong(S)} esquina(s) en la capa equivocada',f'CO #{i} · {co_wrong(S)} corner(s) in the wrong layer'),lambda S,n:(f'{n} cortes',f'{n} slices'))
eo_cases=from_pkl('eo.pkl','sq1-eo',lambda S,i,n:(f'EO #{i} · {eo_wrong(S)} arista(s) en la capa equivocada',f'EO #{i} · {eo_wrong(S)} edge(s) in the wrong layer'),lambda S,n:(f'{n} cortes',f'{n} slices'))
cp_cases=from_pkl('cp.pkl','sq1-cp',lambda S,i,n:(f'CP #{i} ({n} cortes)',f'CP #{i} ({n} slices)'),lambda S,n:(f'{n} cortes',f'{n} slices'))
print('co',len(co_cases),'eo',len(eo_cases),'cp',len(cp_cases))
pickle.dump((shape_cases,co_cases,eo_cases,cp_cases),open('cases.pkl','wb'))
