from skewb import *
from faces import layer, CENTER, corner_of
import itertools
for face in 'URF':
    L=layer(face); seqs=[]
    for seq in itertools.product(TURNS,repeat=4):
        if any(seq[i][0]==seq[i+1][0] for i in range(3)): continue
        s=apply(SOLVED,' '.join(seq))
        if s!=SOLVED and all(s[i]==SOLVED[i] for i in L): seqs.append(' '.join(seq))
    print(face, seqs)
