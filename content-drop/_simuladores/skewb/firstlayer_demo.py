from tools import *
UL=layer('U')
def ulayer_opt(S, maxd=7):
    frontier=[(S,'')]
    for d in range(maxd+1):
        for s,a in frontier:
            if all(s[i]==SOLVED[i] for i in UL): return a
        nxt=[]
        for s,a in frontier:
            last=a.split()[-1][0] if a else None
            for m in TURNS:
                if m[0]==last: continue
                nxt.append((apply(s,m),(a+' '+m).strip()))
        frontier=nxt
if __name__=='__main__':
    for sc in ["R U' B L'","L' B U R'","U B' R L U' R'"]:
        S=apply(SOLVED,sc); a=ulayer_opt(S,6)
        print(sc,'->',a, a is not None and all(apply(S,a)[i]==SOLVED[i] for i in UL))
