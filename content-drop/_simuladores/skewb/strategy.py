from tools import *
import pickle, collections
cc=pickle.load(open('center_cases.pkl','rb'))
T1="R U' L' U L B' L' B"; S3="R U B' U' B L R' U'"
ROT=['','y','y2',"y'"]
SOLVEDS={apply(SOLVED,r) if r else SOLVED for r in ROT}
def cidx(face): return [i for i,(f,p) in enumerate(STK) if f==face and p==FACES[f]][0]
def ucorner_sticker(face):  # a sticker on this face belonging to a U corner (solved)
    return [i for i,(f,p) in enumerate(STK) if f==face and p!=FACES[f] and p[1]>0][0]
def center_ok(s,face):
    if face=='D':  # D color = color of D corner stickers? D corners may be solved; use opposite of U: U center color
        dcol={'U':'D','D':'U','R':'L','L':'R','F':'B','B':'F'}[s[cidx('U')]]
        return s[cidx('D')]==dcol
    return s[cidx(face)]==s[ucorner_sticker(face)]
def where(s,color):
    return [STK[i][0] for i in CENTER if s[i]==color][0]
def solve_centers(s):
    log=[]
    # step 1: D center
    dcol={'U':'D','D':'U','R':'L','L':'R','F':'B','B':'F'}[s[cidx('U')]]
    if not center_ok(s,'D'):
        f=where(s,dcol)
        pre={'L':'','R':None,'F':'y','B':"y'"}[f]
        if f=='R': s=apply(s,T1+' '+T1); log+=['T1','T1']
        else:
            if pre: s=apply(s,pre); log.append(pre)
            s=apply(s,T1); log.append('T1')
    assert center_ok(s,'D')
    # step 2: sides
    for _ in range(4):
        ok=[f for f in 'FRBL' if center_ok(s,f)]
        if len(ok)==4: break
        if len(ok)==1:
            # rotate so the solved one is at B
            while not center_ok(s,'B'): s=apply(s,'y'); log.append('y')
            s=apply(s,S3); log.append('S3')
            if not all(center_ok(s,f) for f in 'FRBL'):
                s=apply(s,S3); log.append('S3')
        else:  # 0 solved: double swap -> apply S3 once
            s=apply(s,S3); log.append('S3')
    assert all(center_ok(s,f) for f in 'FRBLD')
    return s,log
cnt=collections.Counter()
for c in cc:
    S=apply(SOLVED,c['setup'])
    end,log=solve_centers(S)
    assert end in SOLVEDS, log
    cnt[sum(1 for x in log if x in('T1','S3'))]+=1
print('all 59 solved; algorithm applications:',sorted(cnt.items()))
# also check that S3 keeps D center & all corners (pure side 3-cycle) and T1 pure center cycle
for a in (T1,S3):
    s=apply(SOLVED,a); print(a, 'only centers changed:', all(s[i]==SOLVED[i] for i in NONC), describe(s))
