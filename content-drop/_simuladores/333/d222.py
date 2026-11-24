exec(open('drills.py').read().split("OLL={")[0])
CD=[(1,-1,1),(1,-1,-1),(-1,-1,-1),(-1,-1,1)]
def ok2(s):
    return all(c==n for (p,n),c in s.items() if p in CD) and all(c==Y for (p,n),c in s.items() if p in CORN and n==Y)
out=[]
for id,setup in [('orient2Zero',inv_str("R U2 R2 U' R2 U' R2 U2 R")),('orient2Two',inv_str("R U R' U' R' F R F'"))]:
    st=apply(S,setup); alg=sune_plan(st); e=apply(st,alg)
    print(id,'OK' if ok2(e) else 'FAIL','|',setup,'=>',alg); out.append({'id':id,'setup':setup,'goal':'orientation','alg':alg})
st=apply(S,inv_str(' '.join([SEXY]*3))); e=apply(st,' '.join([SEXY]*3)); print('firstLayerRepeat', all(c==n for (p,n),c in e.items() if p in CD))
out.append({'id':'firstLayerRepeat','setup':inv_str(' '.join([SEXY]*3)),'goal':'first','alg':' '.join([SEXY]*3)})
json.dump(out,open('drills222.json','w'),indent=1)
