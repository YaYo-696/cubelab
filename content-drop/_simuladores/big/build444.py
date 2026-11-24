import json, os, itertools, re, sys, io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    from pllpar import effect, c, S0, invert, PLL, AUF
P="2R2 U2 2R2 Uw2 2R2 Uw2 U2"
best={}
for a,b in itertools.product(AUF,AUF):
    for qn,q in PLL.items():
        alg=' '.join(x for x in [a,P,b,q] if x)
        s=c.apply(S0,invert(alg)); e=effect(s)
        if e[0] in [('UBR','UFR'),('UBL','UFR')]:
            if e[0] not in best or len(alg.split())<len(best[e[0]][0].split()): best[e[0]]=(alg,qn)
for k,v in best.items(): print(k,v)
CSK='https://www.cubeskills.com/uploads/pdf/tutorials/easy-parity-cases.pdf'
KEWBZ='https://kewbz.co.uk/blogs/solutions/4x4-parity-algorithms-oll-pll-algs-how-to-solve-a-4x4-rubiks-cube'
SCAU='https://ca.speedcube.com.au/blogs/speedcubing-solutions/4x4-pll-parity-algorithms'
GEN='generated:[PLL parity de cubeskills] + PLL de 3x3 (combinación verificada)'
def merge(alg):
    out=[]
    v={'U':1,"U'":3,'U2':2}
    for t in alg.split():
        if t in v and out and out[-1] in v:
            n=(v[out.pop()]+v[t])%4
            if n: out.append({1:'U',2:'U2',3:"U'"}[n])
        else: out.append(t)
    return ' '.join(out)
def strip_leading_auf(alg):
    t=merge(alg).split()
    while t and t[0] in ('U',"U'",'U2'): t=t[1:]
    return ' '.join(t)
def case(id,es,en,group,algs,src,setup_from=None):
    setup=invert(setup_from or algs[0]); S=c.apply(S0,setup)
    for a in algs: assert c.apply(S,a)==S0,(id,a)
    return {'id':id,'name':{'es':es,'en':en},'group':group,'setup':setup,'algs':algs,'source':src}
OLLA="Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'"; OLLD="Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2"
OLLP="2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2"
PADJ="R' U R U' 2R2 U2 2R2 Uw2 2R2 2U2 U R' U' R"
oll=[case('444-oll-1','Paridad OLL (rápida)','OLL parity (fast)','Paridad OLL / OLL parity',[OLLA,OLLD],CSK,setup_from=OLLD),
     case('444-oll-2','Paridad OLL (pura)','OLL parity (pure)','Paridad OLL / OLL parity',[OLLP],KEWBZ)]
cadj=strip_leading_auf(best[('UBR','UFR')][0]); cdia=strip_leading_auf(best[('UBL','UFR')][0])
pll=[case('444-pll-1','Aristas opuestas','Opposite edges','Aristas / Edges',[P],CSK),
     case('444-pll-2','Aristas vecinas','Adjacent edges','Aristas / Edges',[PADJ],SCAU),
     case('444-pll-3','Esquinas vecinas','Adjacent corners','Esquinas / Corners',[cadj],GEN),
     case('444-pll-4','Esquinas en diagonal','Diagonal corners','Esquinas / Corners',[cdia],GEN)]
sets={'version':1,'sets':[
 {'id':'444-oll-parity','name':{'es':'4x4 · Paridad OLL','en':'4x4 · OLL parity'},'stage':'oll-parity','cases':oll},
 {'id':'444-pll-parity','name':{'es':'4x4 · Paridad PLL','en':'4x4 · PLL parity'},'stage':'pll-parity','cases':pll}]}
EDGE="Dw R F' U R' F Dw'"
L=[]
def lesson(id,title,obj,body,refs,demos,pre): L.append({'id':id,'title':title,'objective':obj,'body':body,'algSetRefs':refs,'demos':demos,'prerequisites':pre})
lesson('444-notation',{'es':'Notación del 4x4','en':'4x4 notation'},{'es':'Leer giros exteriores, dobles e interiores.','en':'Read outer, wide and inner-slice turns.'},
{'es':"""Las caras son las del 3x3: **R L U D F B**, con ', 2 o nada.

- **Rw** gira las 2 capas de la derecha juntas (también se escribe **2Rw**). En esta app, la letra minúscula **r** significa lo mismo que **Rw**.
- **2R** gira solo la segunda capa desde la derecha (la capa interior).
- **3Rw** gira 3 capas juntas (en 4x4 equivale a girar todo menos L).
- **x, y, z** giran el cubo completo.

**Ojo con otros tutoriales:** muchos sitios escriben **r** para la capa interior (lo que aquí es **2R**). Todos los algoritmos de esta academia ya están traducidos a la notación de la app.""",
'en':"""Faces are the same as on the 3x3: **R L U D F B**, with ', 2 or nothing.

- **Rw** turns the 2 right layers together (also written **2Rw**). In this app, lowercase **r** means the same as **Rw**.
- **2R** turns only the second layer from the right (the inner slice).
- **3Rw** turns 3 layers together (on a 4x4 that is everything except L).
- **x, y, z** rotate the whole cube.

**Watch out with other tutorials:** many sites write **r** for the inner slice (what is **2R** here). Every algorithm in this academy is already translated to the app's notation."""},
[],[{'setup':'','alg':'Rw'},{'setup':'','alg':'2R'},{'setup':'','alg':'Uw'}],[])
lesson('444-centers',{'es':'Centros','en':'Centers'},{'es':'Formar los 6 centros de 2x2.','en':'Build the 6 2x2 centers.'},
{'es':"""Cada cara del 4x4 tiene un centro de 4 piezas que debes juntar. Es intuitivo:

1. Arma un centro completo (por ejemplo blanco) y luego el **opuesto** (amarillo) usando giros de capa interior como 2R o Rw y giros de cara.
2. Arma los 4 centros restantes respetando el orden de colores del 3x3 (con blanco arriba y verde al frente, el rojo va a la derecha). Si te equivocas aquí, el cubo no se puede terminar como un 3x3.

Truco: forma primero barras de 2 piezas y luego une dos barras.""",
'en':"""Each 4x4 face has a 4-piece center you must assemble. It is intuitive:

1. Build one full center (for example white) and then the **opposite** one (yellow) using inner-layer turns like 2R or Rw plus face turns.
2. Build the remaining 4 centers keeping the 3x3 color scheme (with white on top and green in front, red goes on the right). If you get this wrong, the cube cannot be finished like a 3x3.

Tip: build 2-piece bars first, then join two bars."""},[],[],['444-notation'])
lesson('444-edges',{'es':'Emparejar aristas','en':'Pair the edges'},{'es':'Juntar las 12 aristas dobles.','en':'Join the 12 double edges.'},
{'es':f"""Cada arista del 4x4 son dos piezas que deben quedar juntas.

1. Con los centros armados, busca dos mitades iguales, ponlas a la misma altura (una en FL y otra en FR) y únelas con Uw o Dw, guarda la arista nueva arriba con un giro de cara y deshaz el Uw/Dw. Así no rompes los centros.
2. Repite hasta tener 10 aristas emparejadas.
3. **Últimas 2 aristas:** con las mitades sueltas en FL y FR, usa **{EDGE}**. Comprobado en el simulador: cambia una mitad de FR por una mitad de FL y no toca ningún centro. Las demás piezas que mueve se ordenan después, en la etapa 3x3.""",
'en':f"""Each 4x4 edge is two pieces that must end up together.

1. With centers done, find two matching halves, place them at the same height (one in FL and one in FR) and join them with Uw or Dw, store the new edge on top with a face turn, and undo the Uw/Dw. This way you don't break the centers.
2. Repeat until 10 edges are paired.
3. **Last 2 edges:** with the loose halves in FL and FR, use **{EDGE}**. Checked in the simulator: it swaps a half of FR with a half of FL and touches no center. The other pieces it moves are sorted out later, in the 3x3 stage."""},
[],[{'setup':'','alg':EDGE}],['444-centers'])
lesson('444-3x3',{'es':'Resolver como 3x3','en':'Solve like a 3x3'},{'es':'Terminar con el método del 3x3.','en':'Finish with the 3x3 method.'},
{'es':"""Con centros y aristas emparejados, el 4x4 se resuelve como un 3x3 usando **solo giros exteriores** (R, U, F...). Usa lo que ya aprendiste en la Academia de 3x3: cruz, F2L, OLL y PLL.

Hay dos situaciones que en un 3x3 son imposibles: las **paridades**. Aparecen en la última capa y tienen sus propias lecciones a continuación.""",
'en':"""With centers and paired edges, the 4x4 is solved like a 3x3 using **outer turns only** (R, U, F...). Use what you already learned in the 3x3 Academy: cross, F2L, OLL and PLL.

There are two situations that are impossible on a 3x3: the **parities**. They show up in the last layer and have their own lessons next."""},[],[],['444-edges'])
lesson('444-oll-parity',{'es':'Paridad OLL','en':'OLL parity'},{'es':'Arreglar una arista volteada imposible en 3x3.','en':'Fix a single flipped edge (impossible on 3x3).'},
{'es':"""Si al orientar la última capa te queda un número **impar** de aristas volteadas (1 o 3), tienes paridad OLL.

- Pon una arista volteada adelante (UF) y aplica la **paridad OLL rápida** (cubeskills). Después sigue con OLL normal.
- La **versión pura** voltea solo esa arista y no toca nada más: sirve si el resto ya estaba resuelto.

Las dos están en el Entrenador.""",
'en':"""If, while orienting the last layer, you get an **odd** number of flipped edges (1 or 3), you have OLL parity.

- Put a flipped edge in front (UF) and apply the **fast OLL parity** (cubeskills). Then continue with normal OLL.
- The **pure version** flips only that edge and nothing else: useful when everything else was already solved.

Both are in the Trainer."""},['444-oll-parity'],[{'setup':invert(OLLP),'alg':OLLP}],['444-3x3'])
lesson('444-pll-parity',{'es':'Paridad PLL','en':'PLL parity'},{'es':'Arreglar permutaciones imposibles en 3x3.','en':'Fix permutations that are impossible on 3x3.'},
{'es':f"""Si en la última capa ves dos aristas o dos esquinas intercambiadas y nada más, tienes paridad PLL.

**Regla simple:** aplica **{P}**, que intercambia las aristas de adelante y atrás (UF y UB). Después, lo que quede es siempre una PLL normal de 3x3: resuélvela como siempre.

El Entrenador tiene los 4 casos puros con su algoritmo directo: aristas opuestas, aristas vecinas, esquinas vecinas y esquinas en diagonal. Los de esquinas son la paridad seguida de una PLL de 3x3 (combinación verificada en el simulador).""",
'en':f"""If the last layer shows two swapped edges or two swapped corners and nothing else, you have PLL parity.

**Simple rule:** apply **{P}**, which swaps the front and back edges (UF and UB). Whatever remains is always a normal 3x3 PLL: solve it as usual.

The Trainer has the 4 pure cases with a direct algorithm: opposite edges, adjacent edges, adjacent corners and diagonal corners. The corner ones are the parity followed by a 3x3 PLL (combination checked in the simulator)."""},
['444-pll-parity'],[{'setup':invert(P),'alg':P}],['444-oll-parity'])
lesson('444-plan',{'es':'Plan de práctica','en':'Practice plan'},{'es':'Bajar tiempos en 4x4.','en':'Lower your 4x4 times.'},
{'es':"""1. Primero termina el 4x4 completo con el método de reducción, aunque sea lento.
2. **Centros:** practica los dos primeros centros sin mirar el cubo entero; son el paso más largo.
3. **Aristas:** apunta a emparejar sin pausas largas entre una arista y la siguiente.
4. Aprende la paridad OLL rápida y la regla de la paridad PLL antes que cualquier otra cosa.
5. Mide con Ao5 en el Timer y compara la parte de 3x3 con tus tiempos de 3x3.""",
'en':"""1. First finish the whole 4x4 with the reduction method, even if slowly.
2. **Centers:** practise the first two centers without looking at the whole cube; it is the longest step.
3. **Edges:** aim to pair without long pauses between one edge and the next.
4. Learn the fast OLL parity and the PLL parity rule before anything else.
5. Track Ao5 in the Timer and compare the 3x3 part with your 3x3 times."""},[],[],['444-pll-parity'])
os.makedirs('out/content-drop/444',exist_ok=True)
json.dump(sets,open('out/content-drop/444/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({'version':1,'lessons':L},open('out/content-drop/444/lessons.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print('ok', cadj, '|', cdia)
