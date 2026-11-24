from mitm import *
import itertools, collections, pickle
CU=set('ACEG'); EU=set('BDFH')
def A_co(s): return abstract(s,lambda p:'u' if p in CU else 'd',lambda p:'e')
def A_eo(s): return abstract(s,lambda p:'u' if p in CU else 'd',lambda p:'x' if p in EU else 'y')
def A_cp(s): return abstract(s,lambda p:p.lower(),lambda p:'x' if p in EU else 'y')
def A_full(s): return abstract(s,lambda p:p.lower(),lambda p:p.lower())
def corner_slots(a):  # indices of first halves in square-shaped abstract
    return [i for i in range(24) if a[i].isupper()]
def edge_slots(a):
    return [i for i in range(24) if not a[i].isupper() and (i%12==0 or not a[i-1].isupper() or True) and a[i].islower() and not (i>0 and a[i-1].isupper() and a[i-1].lower()==a[i] and (i%12)!=0)]
def rot_canon(a):
    return min(turns(a[:12],t)+turns(a[12:24],b) for t in range(12) for b in range(12))
