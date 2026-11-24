from tools import *
from firstlayer_demo import ulayer_opt
import pickle, json, os
ccs=pickle.load(open('corner_cases.pkl','rb')); cen=pickle.load(open('center_cases.pkl','rb'))
T1="R U' L' U L B' L' B"; S3="R U B' U' B L R' U'"; SL="R' B R B'"; T2=' '.join([SL]*3)
GEN="generated:cubelab-skewb-sim (búsqueda óptima, notación WCA 12h)"
ES={'U':'U','D':'D','F':'F','B':'B','R':'R','L':'L'}
def mv(n): return len(n.split())
# ---- corners set
corner_cases=[]
for k,c in enumerate(ccs,1):
    tw=', '.join(f"{a}→{b}" for a,b in c['tw'])
    n=len(c['tw'])
    corner_cases.append({'id':f'skewb-c{k}','name':{'es':f'Esquinas: {tw}','en':f'Corners: {tw}'},
        'group':f'{n} esquinas giradas / {n} twisted corners','setup':c['setup'],'algs':[c['alg']],'source':GEN})
# ---- centers set
def cycles_and_name(S):
    perm={STK[i][0]:S[i] for i in CEN}  # position -> center color there
    moved=[f"{col}→{pos}" for pos,col in perm.items() if col!=pos]
    seenf=set(); cyc=[]
    for f in perm:
        if f in seenf: continue
        c=[f]; seenf.add(f); g=perm[f]
        while g!=f: c.append(g); seenf.add(g); g=perm[g]
        if len(c)>1: cyc.append(c)
    t=sorted(len(c) for c in cyc)
    if t==[3]: grp=('Ciclo de 3 con D','3-cycle with D') if any('D' in c for c in cyc) else ('Ciclo de 3 en los costados','3-cycle on the sides')
    elif t==[2,2]: grp=('Doble intercambio','Double swap')
    else: grp=('Ciclo de 5','5-cycle')
    return ', '.join(sorted(moved)), grp
order={'Ciclo de 3 con D':0,'Ciclo de 3 en los costados':1,'Doble intercambio':2,'Ciclo de 5':3}
beg={'T1':T1,'T1 T1':T1+' '+T1,'S3':S3,'S3 S3':S3+' '+S3,'sledge×3':T2}
rows=[]
for c in cen:
    S=apply(SOLVED,c['setup']); nm,grp=cycles_and_name(S)
    algs=[c['alg']]
    for b in beg.values():
        if apply(S,b)==SOLVED and b not in algs: algs.append(b)
    rows.append((order[grp[0]],mv(c['alg']),nm,grp,c['setup'],algs))
rows.sort()
center_cases=[]
for k,(o,l,nm,grp,setup,algs) in enumerate(rows,1):
    center_cases.append({'id':f'skewb-x{k}','name':{'es':f'Centros: {nm}','en':f'Centers: {nm}'},
        'group':f'{grp[0]} / {grp[1]}','setup':setup,'algs':algs,'source':GEN})
sets={'version':1,'sets':[
 {'id':'skewb-corners','name':{'es':'Skewb · Esquinas de abajo','en':'Skewb · Bottom corners'},'stage':'corners','cases':corner_cases},
 {'id':'skewb-centers','name':{'es':'Skewb · Centros','en':'Skewb · Centers'},'stage':'centers','cases':center_cases}]}
WCA='https://www.worldcubeassociation.org/regulations/#12h'
L=[]
def lesson(id,title,obj,body,refs,demos,pre): L.append({'id':id,'title':title,'objective':obj,'body':body,'algSetRefs':refs,'demos':demos,'prerequisites':pre})
lesson('skewb-notation',{'es':'Notación del Skewb','en':'Skewb notation'},
 {'es':'Leer y ejecutar R, U, L y B en notación WCA.','en':'Read and perform R, U, L and B in WCA notation.'},
 {'es':f"""Sostén el Skewb con una cara arriba (U) y una esquina apuntando hacia ti, de modo que veas tres caras completas: arriba (U), la de adelante a la izquierda (F) y la de adelante a la derecha (R). Esta es la notación oficial de la WCA ([Reglamento 12h]({WCA})). Para mezclar en competencia se usa blanco arriba y verde adelante a la izquierda (Reglamento 4d5).

Cada letra gira **la mitad del puzzle** que contiene una esquina, 120°:

- **R**: la esquina visible de abajo a la derecha más lejana (DBR).
- **U**: la esquina visible de arriba más lejana (UBL).
- **L**: la esquina visible de abajo a la izquierda más lejana (DFL).
- **B**: la esquina de atrás que no se ve (DBL).

Sin apóstrofo, el giro es en sentido horario mirando esa esquina desde afuera. Con apóstrofo (R', U', L', B') es antihorario. No existen giros dobles: R R R vuelve al inicio.""",
  'en':f"""Hold the Skewb with one face on top (U) and a corner pointing at you, so three faces are fully visible: up (U), front-left (F) and front-right (R). This is official WCA notation ([Regulation 12h]({WCA})). Competition scrambling uses white on top and green front-left (Regulation 4d5).

Each letter turns **the half of the puzzle** containing one corner by 120°:

- **R**: the farthest visible bottom-right corner (DBR).
- **U**: the farthest visible upper corner (UBL).
- **L**: the farthest visible bottom-left corner (DFL).
- **B**: the non-visible back corner (DBL).

Without a prime the turn is clockwise looking at that corner from outside. With a prime (R', U', L', B') it is counterclockwise. There are no double turns: R R R returns to the start."""},
 [],[{'setup':'','alg':'R'},{'setup':'','alg':'U'},{'setup':'','alg':'L'},{'setup':'','alg':'B'}],[])
lesson('skewb-sledge',{'es':'La herramienta de 4 movimientos','en':'The 4-move tool'},
 {'es':'Conocer R\' B R B\' y L B\' L\' B, la base del método.','en':'Learn R\' B R B\' and L B\' L\' B, the base of the method.'},
 {'es':"""Todo el método se apoya en dos secuencias cortas:

- **R' B R B'**
- **L B' L' B**

Las dos dejan intacta la cara de arriba completa (su centro y sus 4 esquinas) y solo mueven piezas fuera de ella. Por eso, una vez que resuelves la primera capa arriba, puedes usarlas sin romperla.

Dos datos útiles, comprobados en el simulador:

- Si repites cualquiera de las dos **6 veces**, el puzzle vuelve a como estaba.
- Si la repites **3 veces**, las esquinas quedan como estaban y solo se intercambian centros: R' B R B' ×3 cambia D con B y R con L.""",
  'en':"""The whole method relies on two short sequences:

- **R' B R B'**
- **L B' L' B**

Both leave the entire top face (its center and its 4 corners) untouched and only move pieces outside it. So once the first layer is solved on top, you can use them without breaking it.

Two useful facts, checked in the simulator:

- Repeating either one **6 times** returns the puzzle to where it was.
- Repeating it **3 times** leaves the corners as they were and only swaps centers: R' B R B' ×3 swaps D with B and R with L."""},
 [],[{'setup':'','alg':SL},{'setup':'','alg':T2}],['skewb-notation'])
d1=ulayer_opt(apply(SOLVED,"L' B U R'")); d2=ulayer_opt(apply(SOLVED,"U B' R L U' R'"))
lesson('skewb-first-layer',{'es':'Primera capa','en':'First layer'},
 {'es':'Resolver una cara con sus 4 esquinas y dejarla arriba.','en':'Solve one face with its 4 corners and keep it on top.'},
 {'es':"""La primera capa es un centro más las 4 esquinas que lo rodean, con los colores de los costados coincidiendo entre esquinas vecinas. Se resuelve de forma intuitiva:

1. Elige un color y pon su centro arriba.
2. Busca una esquina con ese color y llévala a su lugar con uno o dos giros. Muchas veces basta un giro para meter una esquina sin mover las que ya pusiste.
3. Repite con las demás. Fíjate en los costados: dos esquinas vecinas deben compartir el color del lado.

**Importante:** en esta academia los algoritmos siguientes suponen la primera capa **arriba (U)**, porque así R' B R B' y L B' L' B no la rompen.

Las demos muestran dos mezclas cortas y la solución más corta solo de la primera capa.""",
  'en':"""The first layer is one center plus the 4 corners around it, with side colors matching between neighbouring corners. It is solved intuitively:

1. Pick a color and put its center on top.
2. Find a corner with that color and bring it into place with one or two turns. Often a single turn inserts a corner without moving the ones you already placed.
3. Repeat for the rest. Watch the sides: two neighbouring corners must share the side color.

**Important:** in this academy the following algorithms assume the first layer **on top (U)**, because that way R' B R B' and L B' L' B do not break it.

The demos show two short scrambles and the shortest solution for the first layer only."""},
 [],[{'setup':"L' B U R'",'alg':d1},{'setup':"U B' R L U' R'",'alg':d2}],['skewb-sledge'])
c4=[c for c in corner_cases if mv(c['algs'][0])==4][0]; c7=[c for c in corner_cases if mv(c['algs'][0])==7][0]
lesson('skewb-corners',{'es':'Esquinas de abajo','en':'Bottom corners'},
 {'es':'Orientar las 4 esquinas de abajo con la primera capa arriba.','en':'Orient the 4 bottom corners with the first layer on top.'},
 {'es':"""Con la primera capa arriba, las 4 esquinas de abajo ya están en su lugar: solo pueden estar **giradas**. Hay 8 casos posibles (más el resuelto).

Para reconocerlos, mira dónde quedó el color de la cara de abajo (D) en cada esquina. En los nombres, **DFR→F** significa: en la esquina DFR, el color de D mira hacia F.

- **4 esquinas giradas:** se resuelven con una sola herramienta de 4 movimientos (R' B R B', L B' L' B o sus parientes).
- **2 esquinas giradas:** necesitan 7 movimientos.

Los centros pueden quedar desordenados; eso se arregla en la lección siguiente. Practica los 8 casos en el Entrenador.""",
  'en':"""With the first layer on top, the 4 bottom corners are already in place: they can only be **twisted**. There are 8 possible cases (plus solved).

To recognise them, look at where the bottom-face (D) color ended up on each corner. In the names, **DFR→F** means: on the DFR corner, the D color faces F.

- **4 twisted corners:** solved with a single 4-move tool (R' B R B', L B' L' B or their relatives).
- **2 twisted corners:** need 7 moves.

Centers may end up scrambled; that is fixed in the next lesson. Practise the 8 cases in the Trainer."""},
 ['skewb-corners'],[{'setup':c4['setup'],'alg':c4['algs'][0]},{'setup':c7['setup'],'alg':c7['algs'][0]}],['skewb-first-layer'])
lesson('skewb-centers',{'es':'Centros','en':'Centers'},
 {'es':'Terminar el Skewb con dos algoritmos.','en':'Finish the Skewb with two algorithms.'},
 {'es':f"""Con la primera capa arriba y las esquinas resueltas, solo faltan los 5 centros (D, F, R, B, L). Hay 59 casos, pero un principiante puede resolverlos **todos** con dos algoritmos:

- **A = {T1}**: lleva el centro de L a D, el de D a R y el de R a L. No toca nada más.
- **B = {S3}**: lleva el centro de F a L, el de L a R y el de R a F. No toca D ni B.

**Paso 1 — centro de abajo (D).** Busca dónde está el centro del color de D:
- En L: aplica A una vez.
- En R: aplica A dos veces.
- En F: gira todo el puzzle (y) para que quede en L y aplica A.
- En B: gira todo el puzzle (y') para que quede en L y aplica A.

**Paso 2 — costados.** Cuenta cuántos centros de los costados coinciden con sus esquinas:
- Si hay uno bueno, gira todo el puzzle (y) hasta dejarlo atrás (B) y aplica B. Si no quedó, aplícalo otra vez.
- Si no hay ninguno, aplica B una vez y vuelve a contar.

Comprobado en el simulador con los 59 casos: este plan siempre termina, con 5 aplicaciones como máximo. En el Entrenador está cada caso con su solución óptima por si quieres aprender atajos. En los nombres, **L→D** significa que el centro de L está en el lugar de D.""",
  'en':f"""With the first layer on top and the corners solved, only the 5 centers (D, F, R, B, L) remain. There are 59 cases, but a beginner can solve **all** of them with two algorithms:

- **A = {T1}**: moves the L center to D, the D center to R and the R center to L. Nothing else moves.
- **B = {S3}**: moves the F center to L, the L center to R and the R center to F. It does not touch D or B.

**Step 1 — bottom center (D).** Find where the D-colored center is:
- On L: apply A once.
- On R: apply A twice.
- On F: turn the whole puzzle (y) so it is on L, then apply A.
- On B: turn the whole puzzle (y') so it is on L, then apply A.

**Step 2 — sides.** Count how many side centers match their corners:
- If one is correct, turn the whole puzzle (y) until it is at the back (B) and apply B. If it isn't solved, apply it again.
- If none is correct, apply B once and count again.

Checked in the simulator on all 59 cases: this plan always finishes, with at most 5 applications. The Trainer has every case with its optimal solution if you want to learn shortcuts. In the names, **L→D** means the L center is in D's place."""},
 ['skewb-centers'],[{'setup':invert(T1),'alg':T1},{'setup':invert(S3),'alg':S3}],['skewb-corners'])
lesson('skewb-plan',{'es':'Plan de práctica','en':'Practice plan'},
 {'es':'Pasar del método completo a tiempos estables.','en':'Go from the full method to consistent times.'},
 {'es':"""1. **Semana 1:** primera capa intuitiva hasta hacerla en menos de 10 movimientos casi siempre. Usa mezclas del Timer y resuelve solo la capa.
2. **Semana 2:** los 8 casos de esquinas en el Entrenador, hasta reconocerlos sin pensar.
3. **Semana 3:** centros con A y B. Después, aprende en el Entrenador los casos de centros más frecuentes con su solución óptima (8 a 10 movimientos).
4. Mide tus tiempos con Ao5 en el Timer y usa el Solucionador para revisar solves lentos: compara tu primera capa con la más corta.""",
  'en':"""1. **Week 1:** intuitive first layer until you usually do it in under 10 moves. Use Timer scrambles and solve only the layer.
2. **Week 2:** the 8 corner cases in the Trainer, until you recognise them without thinking.
3. **Week 3:** centers with A and B. Then learn the most frequent center cases in the Trainer with their optimal solution (8 to 10 moves).
4. Track your times with Ao5 in the Timer and use the Solver to review slow solves: compare your first layer with the shortest one."""},
 [],[],['skewb-centers'])
os.makedirs('out/content-drop/skewb',exist_ok=True)
json.dump(sets,open('out/content-drop/skewb/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({'version':1,'lessons':L},open('out/content-drop/skewb/lessons.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(len(corner_cases),len(center_cases),sum(len(c['algs']) for c in center_cases), d1, d2)
