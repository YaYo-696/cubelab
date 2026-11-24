from sq1 import *
import json, os, pickle, re
shape_cases,co_cases,eo_cases,cp_cases=pickle.load(open('cases.pkl','rb'))
def fixplural(c):
    for k in ('es','en'):
        c['name'][k]=c['name'][k].replace('(1 cortes)','(1 corte)').replace('(1 slices)','(1 slice)')
    c['group']=c['group'].replace('1 cortes / 1 slices','1 corte / 1 slice')
    return c
for L_ in (shape_cases,co_cases,eo_cases,cp_cases):
    for c in L_: fixplural(c)
T="/ (3, 0) / (1, 0) / (0, -3) / (-1, 0) / (-3, 0) / (1, 0) / (0, 3) / (-1, 0)"
P="/ (-3, 0) / (0, 3) / (0, -3) / (0, 3) / (2, 0) / (0, 2) / (-2, 0) / (4, 0) / (0, -2) / (0, 2) / (-1, 4) / (0, -3) / (0, 3)"
SW="/ (6, 6) / (-1, 1)"; SWB="(1, -1) / (6, 6) /"
M="/ (6, 0) / (6, 0) / (6, 0)"
SCAU='https://speedcube.com.au/blogs/speedcubing-solutions/how-to-solve-a-square-1-in-6-steps-easy-to-follow-beginners-steps'
GEN='generated:cubelab-sq1-sim (búsqueda óptima por cortes con el modelo de la app)'
ep_cases=[{'id':'sq1-ep-t','name':{'es':'Ciclo de 3 aristas (T)','en':'3-edge cycle (T)'},'group':'Aristas / Edges','setup':inverse(T),'algs':[T],'source':GEN},
          {'id':'sq1-ep-p','name':{'es':'Paridad (2 aristas)','en':'Parity (2 edges)'},'group':'Paridad / Parity','setup':inverse(P),'algs':[P],'source':SCAU}]
for c in ep_cases: assert apply(apply(SOLVED,c['setup']),c['algs'][0])==SOLVED
sets={'version':1,'sets':[
 {'id':'sq1-shape','name':{'es':'Square-1 · Volver a cubo','en':'Square-1 · Cube shape'},'stage':'shape','cases':shape_cases},
 {'id':'sq1-co','name':{'es':'Square-1 · Esquinas a su capa (CO)','en':'Square-1 · Corners to their layer (CO)'},'stage':'co','cases':co_cases},
 {'id':'sq1-eo','name':{'es':'Square-1 · Aristas a su capa (EO)','en':'Square-1 · Edges to their layer (EO)'},'stage':'eo','cases':eo_cases},
 {'id':'sq1-cp','name':{'es':'Square-1 · Permutar esquinas (CP)','en':'Square-1 · Corner permutation (CP)'},'stage':'cp','cases':cp_cases},
 {'id':'sq1-ep','name':{'es':'Square-1 · Aristas y paridad','en':'Square-1 · Edges and parity'},'stage':'ep','cases':ep_cases}]}
WCA='https://www.worldcubeassociation.org/regulations/#12c'
RUWIX='https://ruwix.com/twisty-puzzles/square-1-back-to-square-one/'
L=[]
def lesson(id,title,obj,body,refs,demos,pre): L.append({'id':id,'title':title,'objective':obj,'body':body,'algSetRefs':refs,'demos':demos,'prerequisites':pre})
lesson('sq1-notation',{'es':'Notación del Square-1','en':'Square-1 notation'},{'es':'Leer (x, y) y /.','en':'Read (x, y) and /.'},
{'es':f"""El Square-1 tiene una capa de arriba, una de abajo y una capa del medio que se parte en dos. Notación WCA ([Reglamento 12c]({WCA})):

- **(x, y)**: gira la capa de arriba **x** pasos y la de abajo **y** pasos. Un paso es 1/12 de vuelta (30°): una arista ocupa 1 paso y una esquina 2. Los números negativos giran al revés. **(3, 0)** gira solo arriba un cuarto de vuelta.
- **/** (corte): gira media vuelta la mitad derecha del puzzle. Solo se puede hacer si ninguna esquina queda atravesada por la línea del corte.

En esta academia todos los algoritmos ya están comprobados con el mismo modelo que usa el Timer. Las demos muestran hacia dónde gira cada número.""",
'en':f"""The Square-1 has a top layer, a bottom layer and a middle layer that splits in two. WCA notation ([Regulation 12c]({WCA})):

- **(x, y)**: turn the top layer **x** steps and the bottom layer **y** steps. One step is 1/12 of a turn (30°): an edge takes 1 step and a corner 2. Negative numbers turn the other way. **(3, 0)** turns only the top a quarter turn.
- **/** (slice): turn the right half of the puzzle 180°. It is only possible when no corner sits across the slice line.

Every algorithm in this academy is checked with the same model the Timer uses. The demos show which way each number turns."""},
[],[{'setup':'','alg':'(3, 0)'},{'setup':'','alg':'(0, 3)'},{'setup':'','alg':'/'}],[])
lesson('sq1-shape',{'es':'Paso 1: volver a cubo','en':'Step 1: cube shape'},{'es':'Llevar el puzzle a forma de cubo.','en':'Bring the puzzle back to a cube shape.'},
{'es':f"""Mezclado, el Square-1 pierde la forma de cubo. El primer paso es recuperarla sin importar los colores.

- Hay **169 formas** distintas (sin contar giros de capa) y todas vuelven a cubo en **7 cortes o menos**. Comprobado en el simulador recorriendo las 3.678 posiciones de forma.
- Consejo para empezar ([Ruwix]({RUWIX})): junta las piezas chicas (aristas) unas con otras, o deja como mucho una arista sola entre dos esquinas; así las formas se vuelven fáciles de reconocer.
- El Entrenador tiene las 169 formas con su solución más corta, agrupadas por cantidad de cortes. Empieza por las de 1 a 3 cortes: son las que más aparecen al final de este paso.""",
'en':f"""Scrambled, the Square-1 loses its cube shape. The first step is getting it back, ignoring colors.

- There are **169 different shapes** (not counting layer turns) and every one returns to a cube in **7 slices or fewer**. Checked in the simulator over all 3,678 shape positions.
- Starting tip ([Ruwix]({RUWIX})): gather the small pieces (edges) together, or leave at most one lone edge between two corners; the shapes then become easy to recognise.
- The Trainer has all 169 shapes with their shortest solution, grouped by number of slices. Start with the 1–3 slice ones: they show up most at the end of this step."""},
['sq1-shape'],[{'setup':shape_cases[0]['setup'],'alg':shape_cases[0]['algs'][0]}],['sq1-notation'])
lesson('sq1-co',{'es':'Paso 2: esquinas a su capa','en':'Step 2: corners to their layer'},{'es':'Dejar las 4 esquinas de arriba arriba y las de abajo abajo.','en':'Put the 4 top corners on top and the bottom ones at the bottom.'},
{'es':"""Con forma de cubo, mira solo las **esquinas**: las 4 del color de arriba deben quedar arriba y las 4 del color de abajo, abajo (sin importar el orden).

Hay **7 casos** y todos se resuelven en 3 cortes o menos, sin perder la forma de cubo al final. Están en el Entrenador.""",
'en':"""In cube shape, look only at the **corners**: the 4 top-colored ones must be on top and the 4 bottom-colored ones at the bottom (order doesn't matter).

There are **7 cases** and all are solved in 3 slices or fewer, ending in cube shape. They are in the Trainer."""},
['sq1-co'],[{'setup':co_cases[0]['setup'],'alg':co_cases[0]['algs'][0]}],['sq1-shape'])
lesson('sq1-eo',{'es':'Paso 3: aristas a su capa','en':'Step 3: edges to their layer'},{'es':'Dejar las aristas en su capa.','en':'Put the edges in their layer.'},
{'es':"""Igual que el paso anterior, ahora con las **aristas**: las 4 del color de arriba, arriba. Estos algoritmos no sacan ninguna esquina de su capa.

Hay **7 casos**, de 2 a 5 cortes. Practícalos en el Entrenador.""",
'en':"""Same as the previous step, now with the **edges**: the 4 top-colored ones on top. These algorithms keep every corner in its layer.

There are **7 cases**, from 2 to 5 slices. Practise them in the Trainer."""},
['sq1-eo'],[{'setup':eo_cases[0]['setup'],'alg':eo_cases[0]['algs'][0]}],['sq1-co'])
lesson('sq1-cp',{'es':'Paso 4: ordenar las esquinas','en':'Step 4: permute the corners'},{'es':'Poner las esquinas en su lugar en ambas capas.','en':'Put the corners in place on both layers.'},
{'es':"""Ahora las esquinas de cada capa deben quedar en el orden correcto (las aristas todavía no importan, pero se mantienen en su capa).

Hay **35 combinaciones** (arriba y abajo a la vez) y cada una tiene en el Entrenador su solución más corta, de 3 a 6 cortes. Empieza por las de 3 y 4 cortes.""",
'en':"""Now the corners of each layer must be in the right order (edges don't matter yet, but they stay in their layer).

There are **35 combinations** (top and bottom together) and each has its shortest solution in the Trainer, from 3 to 6 slices. Start with the 3- and 4-slice ones."""},
['sq1-cp'],[{'setup':cp_cases[0]['setup'],'alg':cp_cases[0]['algs'][0]}],['sq1-eo'])
lesson('sq1-ep',{'es':'Paso 5: aristas, paridad y capa del medio','en':'Step 5: edges, parity and middle layer'},{'es':'Terminar el Square-1.','en':'Finish the Square-1.'},
{'es':f"""Con las esquinas listas, ordena las aristas **una capa a la vez** con estos algoritmos:

- **T = {T}**: mueve 3 aristas de arriba y deja una quieta (la demo muestra cuál).
- **P = {P}**: la **paridad**. Intercambia 2 aristas de arriba. Fuente: [speedcube.com.au]({SCAU}).
- **Cambiar de capa**: `{SW}` lleva la capa de abajo arriba; `{SWB}` la devuelve.
- **Capa del medio**: `{M}` la endereza sin tocar nada más.

**Capa de arriba:**
1. Si hay 2 aristas intercambiadas o las 4 en ciclo, aplica **P** primero.
2. Si hay **1 arista bien**, gira la capa de arriba de a (3, 0) hasta que quede en el lugar que T no toca, aplica T y, si no quedó, T otra vez. Después deshaz el giro.
3. Si no hay ninguna bien, aplica T una vez y vuelve al punto 2.

**Capa de abajo:** súbela con `{SW}`, repite los mismos pasos y bájala con `{SWB}`. Al final, si la capa del medio quedó torcida, aplica la de la capa del medio, y alinea las capas con (3, 0) o (0, 3).

Comprobado en el simulador con las 1.152 combinaciones de aristas y capa del medio: todas se resuelven, con 8 aplicaciones de T o P como máximo.""",
'en':f"""With the corners done, sort the edges **one layer at a time** with these algorithms:

- **T = {T}**: moves 3 top edges and leaves one in place (the demo shows which).
- **P = {P}**: the **parity**. Swaps 2 top edges. Source: [speedcube.com.au]({SCAU}).
- **Switch layers**: `{SW}` brings the bottom layer up; `{SWB}` sends it back.
- **Middle layer**: `{M}` straightens it without touching anything else.

**Top layer:**
1. If 2 edges are swapped or all 4 are in a cycle, apply **P** first.
2. If **1 edge is correct**, turn the top layer by (3, 0) steps until it sits where T doesn't touch, apply T and, if it isn't solved, T again. Then undo the turn.
3. If none is correct, apply T once and go back to step 2.

**Bottom layer:** bring it up with `{SW}`, repeat the same steps and send it down with `{SWB}`. Finally, if the middle layer is crooked, apply the middle-layer algorithm and align the layers with (3, 0) or (0, 3).

Checked in the simulator on all 1,152 edge and middle-layer combinations: all are solved, with at most 8 applications of T or P."""},
['sq1-ep'],[{'setup':inverse(T),'alg':T},{'setup':inverse(P),'alg':P},{'setup':'','alg':M}],['sq1-cp'])
lesson('sq1-plan',{'es':'Plan de práctica','en':'Practice plan'},{'es':'Pasar del método completo a tiempos estables.','en':'Go from the full method to consistent times.'},
{'es':"""1. Termina el Square-1 completo con los 5 pasos, aunque sea lento.
2. **Forma de cubo:** es el paso que más se repite; aprende en el Entrenador las formas de 1 a 3 cortes y después las de 4.
3. **Esquinas y aristas a su capa:** son 14 casos cortos; apréndelos todos.
4. **Esquinas:** los 35 casos, empezando por los de 3 y 4 cortes.
5. Mide con Ao5 en el Timer.""",
'en':"""1. Finish the whole Square-1 with the 5 steps, even if slowly.
2. **Cube shape:** it is the most repeated step; learn the 1–3 slice shapes in the Trainer, then the 4-slice ones.
3. **Corners and edges to their layer:** 14 short cases; learn them all.
4. **Corners:** the 35 cases, starting with the 3- and 4-slice ones.
5. Track Ao5 in the Timer."""},
[],[],['sq1-ep'])
os.makedirs('out/content-drop/sq1',exist_ok=True)
json.dump(sets,open('out/content-drop/sq1/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({'version':1,'lessons':L},open('out/content-drop/sq1/lessons.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print('ok',{s['id']:len(s['cases']) for s in sets['sets']})
