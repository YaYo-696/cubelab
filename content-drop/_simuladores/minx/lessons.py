from build import *
WCA12d='https://www.worldcubeassociation.org/regulations/#12d'
T="R' FR' R FR"; Aadj="R' BR' R BR R' F' R BR' R' BR F R"; Anon="BR' R2' U L U' R U L' U' R BR"
EOA="F R U R' U' F'"
def C(set_id,i): return [c for s in sets if s['id']==set_id for c in s['cases']][i]
L=[]
def lesson(id,title,obj,body,refs,demos,pre): L.append({'id':id,'title':title,'objective':obj,'body':body,'algSetRefs':refs,'demos':demos,'prerequisites':pre})
lesson('minx-notation',{'es':'Notación del Megaminx','en':'Megaminx notation'},
{'es':'Leer mezclas WCA y algoritmos de Megaminx.','en':'Read WCA scrambles and Megaminx algorithms.'},
{'es':f"""**Mezclas (solo para mezclar).** La WCA usa la notación Pochmann ([Reglamento 12d]({WCA12d})):
- **U / U'**: gira la cara de arriba 72° en sentido horario / antihorario.
- **R++ / R--** y **D++ / D--**: giran todo el puzzle 144°, salvo un bloque de 3 piezas arriba a la izquierda que queda fijo. R mueve en vertical y D en horizontal.

**Algoritmos (para resolver).** Cada cara tiene un nombre. Con U arriba y F al frente:
- Arriba: **U**. Alrededor de U: **F** (frente), **R** (frente-derecha), **BR** (atrás-derecha), **BL** (atrás-izquierda), **L** (frente-izquierda).
- Abajo: **D**, y alrededor: **FR** (bajo F y R), **DR** (bajo R y BR), **B** (bajo BR y BL), **DL** (bajo BL y L), **FL** (bajo L y F).

Una letra sola gira esa cara 72° en sentido horario mirándola desde afuera. **2** son 144° (dos quintos de vuelta). El apóstrofo invierte el sentido: R' es antihorario y R2' son 144° antihorario.""",
'en':f"""**Scrambles (scrambling only).** The WCA uses Pochmann notation ([Regulation 12d]({WCA12d})):
- **U / U'**: turns the top face 72° clockwise / counterclockwise.
- **R++ / R--** and **D++ / D--**: turn the whole puzzle 144°, except a block of 3 pieces at the top left that stays fixed. R moves vertically and D horizontally.

**Algorithms (solving).** Every face has a name. With U on top and F in front:
- Top: **U**. Around U: **F** (front), **R** (front-right), **BR** (back-right), **BL** (back-left), **L** (front-left).
- Bottom: **D**, and around it: **FR** (below F and R), **DR** (below R and BR), **B** (below BR and BL), **DL** (below BL and L), **FL** (below L and F).

A single letter turns that face 72° clockwise looking at it from outside. **2** is 144° (two fifths of a turn). A prime reverses the direction: R' is counterclockwise and R2' is 144° counterclockwise."""},
[],[{'setup':'','alg':'U'},{'setup':'','alg':'R'},{'setup':'','alg':'R2'},{'setup':'','alg':"F'"}],[])
lesson('minx-star',{'es':'Estrella y primera cara','en':'Star and first face'},
{'es':'Resolver la primera cara completa.','en':'Solve the whole first face.'},
{'es':"""Elige un color para empezar (muchos usan blanco) y déjalo abajo.

1. **Estrella:** junta las 5 aristas de ese color alrededor de su centro. Cada arista debe coincidir también con el centro de la cara vecina.
2. **Esquinas:** mete las 5 esquinas de ese color entre las aristas, igual que en la primera capa del 3x3: sube la esquina sobre su lugar y bájala con un giro de la cara lateral, el de arriba y el inverso.

Todo es intuitivo: no hace falta memorizar algoritmos. Si te pierdes, piensa en el 3x3: las ideas son las mismas.""",
'en':"""Pick a starting color (many people use white) and keep it at the bottom.

1. **Star:** bring the 5 edges of that color around its center. Each edge must also match the center of the neighbouring face.
2. **Corners:** insert the 5 corners of that color between the edges, just like the first layer of the 3x3: bring the corner above its slot and insert it with a side turn, a top turn and the inverse.

It is all intuitive: no algorithms to memorise. If you get lost, think of the 3x3: the ideas are the same."""},
[],[],['minx-notation'])
lesson('minx-f2l',{'es':'Capas del medio (F2L y S2L)','en':'Middle layers (F2L and S2L)'},
{'es':'Completar todo salvo la última cara.','en':'Complete everything except the last face.'},
{'es':"""Después de la primera cara, el Megaminx se resuelve **cara por cara hacia arriba**:

1. **Segunda capa:** las 5 aristas entre las caras laterales que tocan la primera cara. Se meten como las aristas de la segunda capa del 3x3.
2. **Caras laterales (S2L):** completa una por una las caras que rodean el centro de arriba, juntando cada esquina con su arista y metiéndolas como en el F2L del 3x3.
3. Al final solo queda la **última cara** (U) sin resolver.

Usa la cara de arriba (U) para mover piezas sin romper lo que ya resolviste. A partir de la lección siguiente, los algoritmos suponen la última cara arriba (U) y todo lo demás resuelto.""",
'en':"""After the first face, the Megaminx is solved **face by face going up**:

1. **Second layer:** the 5 edges between the side faces touching the first face. Insert them like 3x3 second-layer edges.
2. **Side faces (S2L):** complete, one at a time, the faces surrounding the top center, pairing each corner with its edge and inserting them like 3x3 F2L.
3. At the end only the **last face** (U) is unsolved.

Use the top face (U) to move pieces around without breaking what is solved. From the next lesson on, algorithms assume the last face on top (U) and everything else solved."""},
[],[],['minx-star'])
lesson('minx-eo',{'es':'Última cara 1: orientar aristas','en':'Last face 1: orient edges'},
{'es':'Formar la estrella de la última cara.','en':'Make the last-face star.'},
{'es':f"""Una arista está **orientada** si su color de U mira hacia arriba. Siempre hay 0, 2 o 4 aristas mal.

Con un solo algoritmo, **A = {EOA}**, y girando U entre medio:
- **2 aristas separadas:** gira U hasta que queden en F y BR, y aplica A. Listo.
- **2 aristas vecinas:** gira U hasta que queden en F y R, y aplica A. Quedan 2 separadas: sigue el caso anterior.
- **4 aristas mal:** gira U hasta que la buena quede en BL y aplica A. Quedan 2 separadas: sigue el caso anterior.

Comprobado en el simulador: nunca necesitas más de 2 aplicaciones. El Entrenador tiene los 3 casos con su algoritmo directo (cubeskills).""",
'en':f"""An edge is **oriented** when its U color faces up. There are always 0, 2 or 4 bad edges.

With a single algorithm, **A = {EOA}**, turning U in between:
- **2 non-adjacent edges:** turn U until they are at F and BR and apply A. Done.
- **2 adjacent edges:** turn U until they are at F and R and apply A. You get 2 non-adjacent edges: use the previous case.
- **4 bad edges:** turn U until the good one is at BL and apply A. You get 2 non-adjacent edges: use the previous case.

Checked in the simulator: you never need more than 2 applications. The Trainer has the 3 cases with their direct algorithm (cubeskills)."""},
['minx-eo'],[{'setup':invert(EOA),'alg':EOA}],['minx-f2l'])
lesson('minx-co',{'es':'Última cara 2: orientar esquinas','en':'Last face 2: orient corners'},
{'es':'Dejar toda la cara de arriba de un color.','en':'Make the whole top face one color.'},
{'es':f"""**Método principiante (sin memorizar casos).** Usa **T = {T}** y la esquina de adelante a la derecha (entre F y R) como lugar de trabajo:

1. Si esa esquina no tiene su color de U arriba, aplica **T dos veces**. Repite hasta que quede bien (como mucho 2 veces el par).
2. Gira **solo U** para traer otra esquina mal a ese lugar y repite.
3. Cuando todas estén bien, gira U para alinear.

Durante el proceso las capas de abajo se desarman: es normal. Al terminar las 5 esquinas vuelven solas. **No gires el puzzle completo** en medio. Comprobado en el simulador con los 81 patrones de giro posibles.

**Método rápido.** El Entrenador tiene los 16 casos con algoritmos cortos de 7 a 13 movimientos (cubeskills, Feliks Zemdegs y Andy Klise).""",
'en':f"""**Beginner method (no cases to memorise).** Use **T = {T}** and the front-right corner (between F and R) as the working spot:

1. If that corner does not have its U color on top, apply **T twice**. Repeat until it is right (at most twice the pair).
2. Turn **only U** to bring another bad corner to that spot and repeat.
3. When they are all right, turn U to align.

The bottom layers get scrambled during the process: that is normal. Once all 5 corners are done they come back on their own. **Do not rotate the whole puzzle** in between. Checked in the simulator with all 81 possible twist patterns.

**Fast method.** The Trainer has the 16 cases with short algorithms of 7 to 13 moves (cubeskills, Feliks Zemdegs and Andy Klise)."""},
['minx-co'],[{'setup':'','alg':T+' '+T},{'setup':C('minx-co',5)['setup'],'alg':C('minx-co',5)['algs'][0]}],['minx-eo'])
lesson('minx-ep',{'es':'Última cara 3: permutar aristas','en':'Last face 3: permute edges'},
{'es':'Poner las 5 aristas en su lugar.','en':'Put the 5 edges in place.'},
{'es':"""Con la cara de arriba orientada, mira las aristas: cada una debe coincidir con el centro de su cara lateral. Gira U hasta que coincidan las más posibles.

Solo hay 3 casos (salvo giros de U): dos ciclos de 3 aristas y uno de 2 pares. Practícalos en el Entrenador. Estos algoritmos pueden mover las esquinas: no importa, se arreglan en el paso siguiente.""",
'en':"""With the top face oriented, look at the edges: each must match the center of its side face. Turn U until as many as possible match.

There are only 3 cases (up to U turns): two 3-edge cycles and one 2-pair swap. Practise them in the Trainer. These algorithms may move the corners: that's fine, they are fixed in the next step."""},
['minx-ep'],[{'setup':C('minx-ep',1)['setup'],'alg':C('minx-ep',1)['algs'][0]}],['minx-co'])
lesson('minx-cp',{'es':'Última cara 4: permutar esquinas','en':'Last face 4: permute corners'},
{'es':'Terminar el Megaminx.','en':'Finish the Megaminx.'},
{'es':f"""Con las aristas en su lugar, cuenta cuántas esquinas están bien (sus colores coinciden con las aristas de al lado). Hay 0, 1, 2 o 5.

Dos algoritmos que solo mueven 3 esquinas:
- **A = {Aadj}**: no toca 2 esquinas **vecinas**.
- **B = {Anon}**: no toca 2 esquinas **separadas**.

1. **2 esquinas bien:** gira el puzzle completo (y) para que las 2 buenas queden donde A o B no tocan, y aplica ese algoritmo una vez. Si no quedó, aplícalo otra vez.
2. **0 o 1 bien:** aplica A o B desde algún ángulo hasta que queden 2 bien, y vuelve al punto 1.

Comprobado en el simulador: el punto 1 siempre resuelve con una o dos aplicaciones, y desde cualquier caso del punto 2 existe un ángulo que deja 2 esquinas bien. El Entrenador tiene los 15 casos con un algoritmo directo.""",
'en':f"""With the edges in place, count how many corners are right (their colors match the edges next to them). There are 0, 1, 2 or 5.

Two algorithms that move only 3 corners:
- **A = {Aadj}**: leaves 2 **adjacent** corners alone.
- **B = {Anon}**: leaves 2 **non-adjacent** corners alone.

1. **2 correct corners:** rotate the whole puzzle (y) so the 2 good ones sit where A or B does not touch, and apply that algorithm once. If it isn't solved, apply it again.
2. **0 or 1 correct:** apply A or B from some angle until 2 are correct, then go back to step 1.

Checked in the simulator: step 1 always solves with one or two applications, and from every step-2 case there is an angle that leaves 2 correct corners. The Trainer has the 15 cases with a direct algorithm."""},
['minx-cp'],[{'setup':invert(Aadj),'alg':Aadj},{'setup':invert(Anon),'alg':Anon}],['minx-ep'])
lesson('minx-plan',{'es':'Plan de práctica','en':'Practice plan'},
{'es':'Llegar a resolver el Megaminx con soltura.','en':'Get comfortable solving the Megaminx.'},
{'es':"""1. **Primero, terminarlo:** primera cara, capas del medio y última cara con el método principiante (1 algoritmo para aristas, el truco T para esquinas, 3 de aristas y A/B para esquinas).
2. **Después, velocidad en la última cara:** aprende en el Entrenador los 16 casos de CO; son los que más tiempo ahorran.
3. **Luego** los 15 de CP, empezando por los ciclos de 3.
4. Mide con Ao5 en el Timer. En Megaminx la mayor parte del tiempo está en las capas del medio: practica juntar esquina y arista sin pausas.""",
'en':"""1. **First, finish it:** first face, middle layers and last face with the beginner method (1 edge algorithm, the T trick for corners, 3 edge cases and A/B for corners).
2. **Then, last-face speed:** learn the 16 CO cases in the Trainer; they save the most time.
3. **Later** the 15 CP cases, starting with the 3-cycles.
4. Track Ao5 in the Timer. On Megaminx most of the time goes into the middle layers: practise pairing corner and edge without pauses."""},
[],[],['minx-cp'])
os.makedirs('out/content-drop/minx',exist_ok=True)
json.dump({'version':1,'sets':sets},open('out/content-drop/minx/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({'version':1,'lessons':L},open('out/content-drop/minx/lessons.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print('ok',len(L))
