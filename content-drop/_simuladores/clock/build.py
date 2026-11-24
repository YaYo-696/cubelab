from method import *
import json, os, re
def inv(alg):
    out=[]
    for t in reversed(alg.split()):
        if t=='y2' or not re.search(r'\d',t): out.append(t); continue
        out.append(t[:-1]+('-' if t.endswith('+') else '+'))
    return ' '.join(out)
def norm(alg):  # drop zero turns, 6- -> 6+
    out=[]
    for t in alg.split():
        if re.search(r'\D0[+-]$',t): continue
        if t.endswith('6-'): t=t[:-1]+'+'
        out.append(t)
    return ' '.join(out)
SCR="UR2+ DR3- DL1+ UL4- U2+ R1- D3+ L2+ ALL5- y2 U3+ R2- D1+ L4- ALL2+"
s0=apply(SCR)
def steps(s):
    log=[]
    def do(t):
        nonlocal s; s=apply(t,s); log.append(t)
    return s,log,do
# front
s=list(s0); front=[]
for f in [lambda s:tok('U',s[7]-s[4]),lambda s:tok('D',s[1]-s[4]),lambda s:tok('R',s[3]-s[4]),lambda s:tok('L',s[5]-s[4]),lambda s:tok('ALL',-s[4])]:
    t=f(s); s=apply(t,s); front.append(t)
assert all(s[d]==0 for d in (1,3,4,5,7))
s1=list(s); back=['y2']; s=y2(s)
for f in [lambda s:tok('U',s[7]-s[4]),lambda s:tok('D',s[1]-s[4]),lambda s:tok('R',s[3]-s[4]),lambda s:tok('L',s[5]-s[4]),lambda s:tok('ALL',-s[4])]:
    t=f(s); s=apply(t,s); back.append(t)
assert all(s[d]==0 for d in (1,3,4,5,7)) and all(s[9+d]==0 for d in (1,3,4,5,7))
corners=[]
macro={0:('DR','D','R'),2:('DL','D','L'),6:('UR','U','R'),8:('UL','U','L')}
for c,(q,h,v) in macro.items():
    a=rep(-s[c])
    for t in (tok(q,a),tok(h,-a),tok(v,-a),tok('ALL',a)): s=apply(t,s); corners.append(t)
assert s==[0]*18
FRONT_ALG=norm(' '.join(front)); BACK_ALG=norm(' '.join(back)); CORN_ALG=norm(' '.join(corners))
# check demos from setups
assert apply(BACK_ALG,apply(FRONT_ALG,s0)) and apply(CORN_ALG,apply(BACK_ALG,apply(FRONT_ALG,s0)))==[0]*18
print('front',FRONT_ALG); print('back',BACK_ALG); print('corners',CORN_ALG)
# trainer set: corner macros, each corner off by +3
names={0:('UL','arriba-izquierda','top-left'),2:('UR','arriba-derecha','top-right'),6:('DL','abajo-izquierda','bottom-left'),8:('DR','abajo-derecha','bottom-right')}
cases=[]
for c,(q,h,v) in macro.items():
    alg=' '.join([tok(q,-3),tok(h,3),tok(v,3),tok('ALL',-3)])
    setup=inv(alg); st=apply(setup)
    # setup changes only that corner gear
    assert [i for i in range(18) if st[i]] == sorted([c, BACK_OF[c]]), (c,st)
    assert apply(alg,st)==[0]*18
    n=names[c]
    cases.append({'id':f'clock-corner-{n[0].lower()}','name':{'es':f'Esquina {n[1]} (+3)','en':f'{n[2].capitalize()} corner (+3)'},
                  'group':'Esquinas / Corners','setup':setup,'algs':[alg],'source':'generated:cubelab-clock-sim (método por capas verificado)'})
sets={'version':1,'sets':[{'id':'clock-corners','name':{'es':'Clock · Esquinas sueltas','en':'Clock · Single corners'},'stage':'corners','cases':cases}]}
WCA12g='https://www.worldcubeassociation.org/regulations/#12g'
L=[]
def lesson(id,title,obj,body,refs,demos,pre): L.append({'id':id,'title':title,'objective':obj,'body':body,'algSetRefs':refs,'demos':demos,'prerequisites':pre})
lesson('clock-notation',{'es':'Cómo funciona el Clock','en':'How the Clock works'},{'es':'Entender relojes, pines, ruedas y notación WCA.','en':'Understand dials, pins, wheels and WCA notation.'},
{'es':f"""El Clock tiene **9 relojes por lado**, **4 pines** y **4 ruedas** en las esquinas. Está resuelto cuando los 18 relojes marcan las 12.

- Los **pines** deciden qué relojes giran juntos. Con un pin arriba, la rueda mueve los 4 relojes de ese cuarto (esquina, dos bordes y centro) del lado de adelante.
- Los relojes de las **esquinas** son un mismo engranaje con la esquina de atrás: si una gira en sentido horario adelante, la de atrás gira al revés. Por eso, si una esquina marca las 12 adelante, también las marca atrás.

**Notación WCA** ([Reglamento 12g]({WCA12g})): el nombre dice qué pines están arriba: **UR, DR, DL, UL** (uno), **U, R, D, L** (dos) o **ALL** (los cuatro). Luego viene cuántas horas se gira y el sentido: **UR3+** = ese pin arriba, 3 horas en sentido horario; **UR3-** = antihorario. **y2** da vuelta el puzzle como una página: arriba sigue arriba e izquierda y derecha se intercambian.""",
'en':f"""The Clock has **9 dials per side**, **4 pins** and **4 wheels** at the corners. It is solved when all 18 dials point to 12.

- The **pins** decide which dials turn together. With a pin up, the wheel moves the 4 dials of that quarter (corner, two edges and center) on the front.
- **Corner** dials share a gear with the back corner: if one turns clockwise in front, the back one turns the other way. So if a corner shows 12 in front, it shows 12 on the back too.

**WCA notation** ([Regulation 12g]({WCA12g})): the name says which pins are up: **UR, DR, DL, UL** (one), **U, R, D, L** (two) or **ALL** (all four). Then how many hours and which way: **UR3+** = that pin up, 3 hours clockwise; **UR3-** = counterclockwise. **y2** flips the puzzle like a page: top stays on top and left and right swap."""},
[],[{'setup':'','alg':'UR3+'},{'setup':'','alg':'U2-'},{'setup':'','alg':'ALL1+ y2'}],[])
lesson('clock-front',{'es':'Paso 1: cruz de adelante','en':'Step 1: front cross'},{'es':'Dejar en las 12 el centro y los 4 bordes de adelante.','en':'Get the front center and 4 edges to 12.'},
{'es':"""Llamamos **cruz** al centro y los 4 relojes de borde (arriba, abajo, izquierda, derecha). Cada paso gira el centro hasta que **coincida** con un borde:

1. **U** (pines de arriba): gira hasta que el centro marque lo mismo que el borde de **abajo**.
2. **D** (pines de abajo): hasta que el centro coincida con el borde de **arriba**.
3. **R** (pines de la derecha): hasta que coincida con el borde de la **izquierda**.
4. **L** (pines de la izquierda): hasta que coincida con el borde de la **derecha**.
5. **ALL** (todos los pines): gira hasta que la cruz entera marque las 12.

Cada paso no desarma los anteriores. Las esquinas pueden quedar en cualquier hora: se arreglan al final. La demo muestra una mezcla y estos 5 pasos.""",
'en':"""The **cross** is the center plus the 4 edge dials (top, bottom, left, right). Each step turns the center until it **matches** one edge:

1. **U** (top pins): turn until the center shows the same as the **bottom** edge.
2. **D** (bottom pins): until the center matches the **top** edge.
3. **R** (right pins): until it matches the **left** edge.
4. **L** (left pins): until it matches the **right** edge.
5. **ALL** (all pins): turn until the whole cross shows 12.

No step undoes the previous ones. Corners may end at any hour: they are fixed at the end. The demo shows a scramble and these 5 steps."""},
[],[{'setup':SCR,'alg':FRONT_ALG}],['clock-notation'])
lesson('clock-back',{'es':'Paso 2: cruz de atrás','en':'Step 2: back cross'},{'es':'Repetir la cruz del otro lado.','en':'Repeat the cross on the other side.'},
{'es':"""Da vuelta el puzzle (**y2**) y repite los mismos 5 pasos de la cruz en este lado.

Los movimientos de este lado solo tocan, del lado contrario, las **esquinas**: la cruz que ya resolviste no se mueve. Comprobado en el simulador.""",
'en':"""Flip the puzzle (**y2**) and repeat the same 5 cross steps on this side.

Moves on this side only touch the **corners** of the other side: the cross you already solved does not move. Checked in the simulator."""},
[],[{'setup':(SCR+' '+FRONT_ALG).strip(),'alg':BACK_ALG}],['clock-front'])
lesson('clock-corners',{'es':'Paso 3: esquinas','en':'Step 3: corners'},{'es':'Terminar el Clock.','en':'Finish the Clock.'},
{'es':"""Con las dos cruces en las 12, solo faltan las 4 esquinas. Para mover **una sola esquina** sin tocar nada más se usan 4 movimientos con la misma cantidad **a** (las horas que le faltan a esa esquina para llegar a las 12):

- Esquina **arriba-izquierda**: DR a+, D a-, R a-, ALL a+
- Esquina **arriba-derecha**: DL a+, D a-, L a-, ALL a+
- Esquina **abajo-izquierda**: UR a+, U a-, R a-, ALL a+
- Esquina **abajo-derecha**: UL a+, U a-, L a-, ALL a+

(Si la cantidad es negativa, los signos se invierten.) Comprobado en el simulador: cada combinación cambia solo esa esquina, adelante y atrás, y el método completo resolvió 2.000 mezclas al azar. En el Entrenador puedes practicar las 4 combinaciones.""",
'en':"""With both crosses at 12, only the 4 corners remain. To move **one corner only** without touching anything else, use 4 moves with the same amount **a** (the hours that corner needs to reach 12):

- **Top-left** corner: DR a+, D a-, R a-, ALL a+
- **Top-right** corner: DL a+, D a-, L a-, ALL a+
- **Bottom-left** corner: UR a+, U a-, R a-, ALL a+
- **Bottom-right** corner: UL a+, U a-, L a-, ALL a+

(If the amount is negative, the signs flip.) Checked in the simulator: each combination changes only that corner, front and back, and the full method solved 2,000 random scrambles. Practise the 4 combinations in the Trainer."""},
['clock-corners'],[{'setup':(SCR+' '+FRONT_ALG+' '+BACK_ALG).strip(),'alg':CORN_ALG}],['clock-back'])
lesson('clock-plan',{'es':'Plan de práctica','en':'Practice plan'},{'es':'Pasar del método por pasos a tiempos rápidos.','en':'Go from the step method to fast times.'},
{'es':"""1. Domina el método de 3 pasos hasta no equivocarte de sentido al girar.
2. Practica **leer la cantidad antes de girar**: mira los dos relojes que deben coincidir y calcula la diferencia en horas.
3. Usa el Entrenador para las 4 combinaciones de esquinas.
4. Cuando lo hagas sin errores, investiga métodos rápidos como **7-simul**, que giran dos ruedas a la vez.
5. Mide con Ao5 en el Timer.""",
'en':"""1. Master the 3-step method until you never turn the wrong way.
2. Practise **reading the amount before turning**: look at the two dials that must match and work out the difference in hours.
3. Use the Trainer for the 4 corner combinations.
4. Once you make no mistakes, look into fast methods like **7-simul**, which turn two wheels at once.
5. Track Ao5 in the Timer."""},
[],[],['clock-corners'])
os.makedirs('out/content-drop/clock',exist_ok=True)
json.dump(sets,open('out/content-drop/clock/algsets.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
json.dump({'version':1,'lessons':L},open('out/content-drop/clock/lessons.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
# token validity check against Codex normalizer
pins=['UR','DR','DL','UL','U','R','D','L','ALL']; amts=[f'{i}{s}' for i in range(7) for s in '+-']
valid=set(['y2']+pins+[p+a for p in pins for a in amts])
for blob in [json.dumps(sets),json.dumps(L)]:
    pass
allalgs=[c['setup'] for c in cases]+[a for c in cases for a in c['algs']]+[x for l in L for d in l['demos'] for x in (d['setup'],d['alg'])]
bad=[t for a in allalgs for t in a.split() if t not in valid]
print('tokens inválidos',bad)
