import json
from cube import *
from check import full_key, D
PLL={
'Aa':"x R' U R' D2 R U' R' D2 R2 x'",
'Ab':"x R2 D2 R U R' D2 R U' R x'",
'E':"x' L' U L D' L' U' L D L' U' L D' L' U L D x",
'F':"R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
'Ga':"R2 U R' U R' U' R U' R2 U' D R' U R D'",
'Gb':"R' U' R U D' R2 U R' U R U' R U' R2 D",
'Gc':"R2 U' R U' R U R' U R2 U D' R U' R' D",
'Gd':"R U R' U' D R2 U' R U' R' U R' U R2 D'",
'H':"M2 U M2 U2 M2 U M2",
'Ja':"R' U L' U2 R U' R' U2 R L",
'Jb':"R U R' F' R U R' U' R' F R2 U' R'",
'Na':"R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
'Nb':"R' U R U' R' F' U' F R U R' F R' F' R U' R",
'Ra':"R U' R' U' R U R D R' U' R D' R' U2 R'",
'Rb':"R2 F R U R U' R' F' R U2 R' U2 R",
'T':"R U R' U' R' F R2 U' R' U' R U R' F'",
'Ua':"R U' R U R U R U' R' U' R2",
'Ub':"R2 U R U R' U' R' U' R' U R'",
'V':"R' U R' U' y R' F' R2 U' R' U R' F R F",
'Y':"F R U' R' U' R U R' F' R U R' U' R' F R F'",
'Z':"M' U M2 U M2 U M' U2 M2",
}
rows={r['id']:r for r in json.load(open(D+'pll.json'))}
bad=0
for name,ref in PLL.items():
    # sanity: my ref must be a valid PLL
    s,_=normalize(apply(solved(),ref))
    from cube import f2l_ok
    if s is None or not f2l_ok(s): print('ref inválida',name); continue
    k=full_key(ref,'pll')
    k2=full_key(rows[name]['algs'][0],'pll')
    if k!=k2: print('PLL distinto:',name,rows[name]['algs'][0]); bad+=1
print('PLL nombres revisados', len(PLL), 'discrepancias', bad)
OLL={
21:"R U2 R' U' R U R' U' R U' R'",
22:"R U2 R2 U' R2 U' R2 U2 R",
23:"R2 D' R U2 R' D R U2 R",
24:"r U R' U' r' F R F'",
25:"F' r U R' U' r' F R",
26:"R U2 R' U' R U' R'",
27:"R U R' U R U2 R'",
33:"R U R' U' R' F R F'",
37:"F R' F' R U R U' R'",
44:"f R U R' U' f'",
45:"F R U R' U' F'",
51:"f R U R' U' R U R' U' f'",
57:"R U R' U' M' U R U' r'",
28:"r U R' U' r' R U R U' R'",
1:"R U2 R2 F R F' U2 R' F R F'",
2:"r U r' U2 r U2 R' U2 R U' r'",
3:"r' R2 U R' U r U2 r' U M'",
4:"r' R U' r U2 r' U' R U' R' M",
20:"r U R' U' M2 U R U' R' U' M'",
}
rows={r['id']:r for r in json.load(open(D+'oll.json'))}
bad=0
for n,ref in OLL.items():
    s,_=normalize(apply(solved(),ref))
    if s is None or not f2l_ok(s): print('ref inválida OLL',n); continue
    if full_key(ref,'oll')!=full_key(rows['OLL %d'%n]['algs'][0],'oll'):
        print('OLL distinto:',n, rows['OLL %d'%n]['algs']); bad+=1
print('OLL nombres revisados',len(OLL),'discrepancias',bad)
