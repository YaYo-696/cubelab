from tools import *
import collections, pickle
cc=pickle.load(open('center_cases.pkl','rb'))
T1="R U' L' U L B' L' B"; T2="R' B R B' R' B R B' R' B R B'"
def run(tools):
    mac=[]
    for name,t in tools:
        for k,(pre,post) in enumerate([('',''),('y',"y'"),('y2','y2'),("y'",'y')]):
            mac.append(((pre+' '+t+' '+post).strip(),name,k))
    # BFS from solved over macro inverses -> distance of each center case
    dist={SOLVED:[]}; q=collections.deque([SOLVED])
    while q:
        s=q.popleft()
        for a,name,k in mac:
            t=apply(s,a)
            if t not in dist: dist[t]=dist[s]+[(name,k)]; q.append(t)
    targets=[apply(SOLVED,c['setup']) for c in cc]
    d=[len(dist[t]) if t in dist else None for t in targets]
    return collections.Counter(d)
print('T1,T2', run([('A',T1),('B',T2)]))
print('T1 only', run([('A',T1)]))
