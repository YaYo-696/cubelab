from cpbeg import *
Aadj="R' BR' R BR R' F' R BR' R' BR F R"; Anon="BR' R2' U L U' R U L' U' R BR"
cases=[]
for p in itertools.permutations(range(5)):
    if sum(1 for i in range(5) for j in range(i+1,5) if p[i]>p[j])%2: continue
    cases.append(with_corners(perm=p))
def app(s,r,A,t): return apply(s,(r+' '+' '.join([A]*t)).strip())
# rule part 1: 2 correct -> exists rotation & (A or A^2) of Aadj/Anon that solves
p1=all(any(solved_mod(app(s,r,A,t)) for r in ROT for A in (Aadj,Anon) for t in (1,2)) for s in cases if correct(s)==2)
# rule part 2: <=1 correct -> any rotation with Aadj once gives >=2 correct?
low=[s for s in cases if correct(s)<=1]
anyang=all(correct(app(s,'',Aadj,1))>=2 for s in low)
exists=all(any(correct(app(s,r,Aadj,1))>=2 for r in ROT) for s in low)
exists_any=all(any(correct(app(s,r,A,1))>=2 for r in ROT for A in (Aadj,Anon)) for s in low)
print('3-cycles solved in one step:',p1,'| low cases',len(low),'Aadj sin girar:',anyang,'Aadj con algún giro:',exists,'A o B con algún giro:',exists_any)
