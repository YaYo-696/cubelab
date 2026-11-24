from sq1 import *
import collections, pickle
shp=lambda s: abstract(s,lambda p:'c',lambda p:'e')[:24]   # drop equator
def is_square(layer): return all(layer[(i)%12]=='C' and layer[(i+1)%12]=='c' and layer[(i+2)%12]=='e' for i in range(0,12,3)) or any(all(layer[(k+i)%12]=='C' and layer[(k+i+1)%12]=='c' and layer[(k+i+2)%12]=='e' for i in range(0,12,3)) for k in range(3))
def rots(layer): return [turns(layer,k) for k in range(12)]
def turn_opts(a):
    tops=[k for k in range(12) if split_abs(turns(a[:12],k))]
    bots=[k for k in range(12) if split_abs(turns(a[12:24],k))]
    return tops,bots
def neighbors(a):
    # a: 24-char shape string, assumed slashable. returns list of (move list, new state slashable after turn+slash)
    out=[]
    tops,bots=turn_opts(a)
    for t in tops:
        for b in bots:
            x=turns(a[:12],t)+turns(a[12:24],b)
            y=slash(x+'0')[:24]
            out.append(((norm_amt(t),norm_amt(b)),y))
    return out
# goal states: square both layers, slashable alignment
goal=set()
sq_top=[l for l in rots(shp(SOLVED)[:12]) if split_abs(l)]
sq_bot=[l for l in rots(shp(SOLVED)[12:]) if split_abs(l)]
for t in sq_top:
    for b in sq_bot: goal.add(t+b)
# BFS backward: from goal apply moves (turn+slash); since moves invertible, dist from goal = solution length
dist={g:[] for g in goal}; q=collections.deque(goal)
while q:
    a=q.popleft()
    for mv,y in neighbors(a):
        # y reached from a by (turn mv, slash). y is slashable? normalize: store y as is (may not be slashable -> any turn later)
        if y not in dist:
            dist[y]=dist[a]+[mv]; q.append(y)
print('shape states (slash-aligned)',len(dist))
pickle.dump(dist,open('shape_dist.pkl','wb'))
print(collections.Counter(len(v) for v in dist.values()))
