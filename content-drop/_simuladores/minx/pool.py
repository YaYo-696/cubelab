from search import *
import pickle, collections
lines=[l for l in open('pool_src.txt').read().split('\n') if l.strip()]
toks_all=[parse_tok for parse_tok in []]
cands=set()
for l in lines:
    t=l.replace('(',' ').replace(')',' ').split()
    for i in range(len(t)):
        for j in range(i+3,min(len(t),i+30)+1):
            cands.add(' '.join(t[i:j]))
    # also joined adjacent lines handled by full-line spans
# also cross-line spans (wrapped algs): join consecutive lines
for a,b in zip(lines,lines[1:]):
    t=(a+' '+b).replace('(',' ').replace(')',' ').split()
    for i in range(len(t)):
        for j in range(i+3,min(len(t),i+30)+1): cands.add(' '.join(t[i:j]))
print('cands',len(cands))
good={}
for c in cands:
    try: S=apply(SOLVED,invert(c))
    except Exception as e: continue
    # strip whole-puzzle rotation effect: require F2L solved up to y? skip rotations-containing for now
    if 'y' in c.split() or "y'" in c.split(): continue
    if not f2l_ok(S): continue
    if all(S[i]==SOLVED[i] for i in range(132)): continue
    good[c]=S
print('F2L-preserving nontrivial',len(good))
pickle.dump(good,open('pool.pkl','wb'))
