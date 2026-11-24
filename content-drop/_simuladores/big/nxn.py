import re, itertools
class Cube:
    AX={'R':(0,1),'L':(0,-1),'U':(1,1),'D':(1,-1),'F':(2,1),'B':(2,-1)}
    def __init__(self,n):
        self.n=n; h=n/2
        coords=[ -h+0.5+i for i in range(n)]
        self.stk=[]
        for f,(ax,sg) in self.AX.items():
            for a in coords:
                for b in coords:
                    p=[0,0,0]; p[ax]=sg*h
                    o=[i for i in range(3) if i!=ax]; p[o[0]]=a; p[o[1]]=b
                    self.stk.append((f,tuple(p)))
        self.idx={self._k(p):i for i,(f,p) in enumerate(self.stk)}
        self.solved=tuple(f for f,p in self.stk)
        self.cache={}
    def _k(self,p): return tuple(round(x*2) for x in p)
    @staticmethod
    def rot90(p,ax,sgn):  # rotate +90 about +ax (right-hand) if sgn=1
        x,y,z=p
        if ax==0: r=(x,-z,y)
        elif ax==1: r=(z,y,-x)
        else: r=(-y,x,z)
        if sgn==-1:
            for _ in range(2): r=Cube.rot90(r,ax,1)
        return r
    def layer_perm(self,face,lo,hi,qt):
        """turn layers lo..hi (1=outer) of face, qt quarter turns clockwise seen from face"""
        key=(face,lo,hi,qt%4)
        if key in self.cache: return self.cache[key]
        ax,sg=self.AX[face]; h=self.n/2
        perm=list(range(len(self.stk)))
        for i,(f,p) in enumerate(self.stk):
            # depth of sticker from this face: layer index 1..n
            c=p[ax]*sg  # in [-h,h]
            # piece layer: stickers on the face itself have c=h -> layer1; side stickers coordinate h-0.5-k...
            if abs(c-h)<1e-9: layer=1
            elif abs(c+h)<1e-9: layer=self.n
            else: layer=int(round(h-0.5-c))+1
            if lo<=layer<=hi:
                q=p
                for _ in range(qt%4): q=self.rot90(q,ax,-sg)   # clockwise seen from face = -90 about outward axis
                perm[self.idx[self._k(q)]]=i
        self.cache[key]=perm; return perm
    def parse(self,alg):
        n=self.n; out=[]
        alg=alg.replace('(',' ').replace(')',' ').replace('’',"'")
        for t in alg.split():
            m=re.fullmatch(r"(?:(\d+)-(\d+)([RLUDFB])w|(\d*)([RLUDFB])(w?)|([rludfb])|([xyz])|([MES]))(2|3)?(')?",t)
            if not m: raise ValueError(t)
            a,b,fa,num,face,w,low,rot,sl,amt,pr=m.groups()
            q=int(amt or 1)*(-1 if pr else 1)
            if fa: out.append((fa,int(a),int(b),q))
            elif face:
                k=int(num) if num else (2 if w else 1)
                if w: out.append((face,1,k,q))
                else: out.append((face,k,k,q))
            elif low: out.append((low.upper(),1,2,q))
            elif rot: out.append(({'x':'R','y':'U','z':'F'}[rot],1,n,q))
            elif sl:
                assert n%2==1; mid=n//2+1
                out.append(({'M':'L','E':'D','S':'F'}[sl],mid,mid,q))
        return out
    def apply(self,state,alg):
        for face,lo,hi,q in self.parse(alg):
            pm=self.layer_perm(face,lo,hi,q)
            state=tuple(state[pm[j]] for j in range(len(pm)))
        return state
def invert_tok(t):
    if t.endswith("2'"): return t[:-1]
    if t.endswith("2"): return t
    return t[:-1] if t.endswith("'") else t+"'"
def invert(alg): return ' '.join(invert_tok(t) for t in reversed(alg.replace('(',' ').replace(')',' ').split()))
