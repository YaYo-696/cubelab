# Resolver desde colores · Verificación (Claude, 2026-11-24)

Núcleo: `src/core/fromColors/readColors.ts`. Puzzles: 3x3, 2x2, Pyraminx y Skewb.

## Cómo funciona
1. Los adhesivos son los de la red 2D de cubing.js 0.63.8 (`ORBITA-l<lugar>-o<orientación>`).
   Así el mapeo color → pieza es el mismo que usa cubing.js para dibujar.
   Regla comprobada: el adhesivo `(lugar, o)` muestra el color resuelto de `(pieza, o − orientación)`.
2. Se reconoce cada pieza por sus colores y su giro. Errores: faltan adhesivos, conteo de colores,
   pieza inexistente, pieza repetida.
3. Se busca la rotación del puzzle completo que deja en su lugar lo que los movimientos de la app nunca mueven:
   3x3 = centros; 2x2 = esquina DBL (WCA mezcla con U R F); Pyraminx = las 4 piezas axiales;
   Skewb = esquina UFR (R U L B nunca la mueven). Esa rotación es `rotation`.
4. Legalidad en esa posición:
   - 3x3: suma de giros de esquinas ≡ 0 (mod 3), de aristas ≡ 0 (mod 2), paridad de esquinas = paridad de aristas.
   - 2x2 (DBL fija): suma de giros ≡ 0 (mod 3).
   - Pyraminx: permutación de aristas par y suma de volteos par (axiales y puntas, libres).
   - Skewb: permutación de centros par y estado de esquinas dentro de los 8.748 alcanzables (BFS).
     Comprobado: el grupo completo tiene 3.149.280 estados = 360 (centros pares) × 8.748, así que ambas
     condiciones son independientes y suficientes (`_simuladores/colores/skewb-grupo.mjs`).
5. Se resuelve con cubing.js (`experimentalSolve3x3x3IgnoringCenters`, `experimentalSolve2x2x2`,
   `solvePyraminx`, `solveSkewb`) y se invierte: esa es la mezcla equivalente, en la notación que aceptan
   `normalizeCube`, `normalizeTetra` y `normalizeSkewb` (sin rotaciones). Se vuelve a comprobar que la mezcla
   reconstruye la posición pintada; si no, lanza error.

## Resultados
- `reconstruccion.ts`: 200 posiciones reales por puzzle, pintadas con rotaciones al azar → 800/800 aceptadas;
  la mezcla reconstruye exactamente los colores. Casos imposibles: cada uno da su mensaje.
  Tiempo máximo por lectura: 3x3 183 ms, 2x2 28 ms, Pyraminx 43 ms, Skewb 87 ms (Node).
- `legalidad.ts`: 300 estados armados al azar por puzzle (sin mezclar). Se aceptan o rechazan exactamente
  según las reglas del punto 4: 3x3 29/271, 2x2 98/202, Pyraminx 76/224, Skewb 1/299.
- `tests/unit/from-colors.test.ts`: 12 pruebas, pasan con un sustituto mínimo de Vitest en Node.
  Falta correrlas con el Vitest real y TypeScript del repo (diagnóstico).

## Clock (15-C): `src/core/fromColors/readClock.ts`
- Entrada: 9 esferas de adelante y 9 de atrás (horas 0–11; 12 se acepta como 0), por filas, vistas desde cada lado.
  El reverso se lee dando vuelta el reloj de izquierda a derecha (y2). Cada esquina de atrás comparte engranaje
  con la de adelante: deben sumar 12 (`clockCorner`). Las 12^14 combinaciones restantes son todas posibles.
- Solución: sistema lineal módulo 12 sobre los 14 movimientos de una mezcla WCA (9 adelante, y2, 5 atrás),
  resuelto por eliminación con pivotes invertibles (1, 5, 7, 11). Notación de `normalizeClock`.
  Sin movimientos atrás, la solución no lleva y2. La mezcla equivalente empieza con y2 cuando hace falta, para
  que el lado visible del reproductor sea el que se anotó como frente.
- `_simuladores/colores/clock.ts`: 2.000 estados aleatorios resueltos (máx. 14 movimientos, 0,3 ms c/u) y
  200 mezclas tipo WCA leídas y resueltas. `tests/unit/from-clock.test.ts`: 2 pruebas.

## 4x4 reducido (15-E): `src/core/fromColors/readColors444.ts`
- No hay solucionador 4x4 usable: el de cubing.js (threephase de Chen Shuang, GPL) solo expone mezclas, y el
  buscador general twips no resolvió ni los centros en 5 min. Por eso se resuelve la **etapa final**: el usuario
  reduce (centros armados, aristas emparejadas) y pinta los 96 adhesivos.
- Se comprueba la reducción (4 centros iguales por cara, las dos piezas del medio de cada borde iguales), se lee
  como 3x3 (fila/columna 0→0, 1–2→1, 3→2 en cada cara; ambas redes de cubing.js tienen la misma disposición) y se
  usa `readColors('333')`: volteo imposible = paridad OLL; intercambio imposible = paridad PLL.
- Algoritmos (puros, comprobados en cubing.js: solo cambian los adhesivos de esas aristas):
  OLL `2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2` (voltea UF);
  PLL `Uw2 Rw2 U2 2R2 U2 Rw2 Uw2` (intercambia UF y UB).
  Nota: la versión "Rw U2 x Rw U2…" con capas dobles NO es pura en este modelo (también mueve esquinas y aristas U).
- El efecto exacto de cada algoritmo se aplica sobre los colores con la transformación de cubing.js, y se vuelve a
  leer el 3x3: la mezcla resultante es exacta aunque el algoritmo cambiara.
- Lectura del 4x4 comprobada con R, 2R, Rw, U, F, x (colores físicamente correctos).
- `_simuladores/colores/cuatro.ts`: 200 posiciones reducidas (con OLL, PLL, ambas o ninguna, y rotaciones al azar):
  paridad detectada = aplicada en 200/200 y reconstrucción exacta de los 96 adhesivos. 50/50 posiciones sin reducir
  rechazadas. `tests/unit/from-colors-444.test.ts`: 3 pruebas.

## Square-1 (15-D): `src/core/fromColors/readSquare1.ts`
- El modelo de cubing.js permite «/» aunque corte una esquina, así que su buscador general no sirve. Se usa el
  modelo de la app (`square1.ts`: 24 cuñas + capa del medio) y un solucionador propio en tres etapas exactas:
  A) forma de cubo **con paridad par** (BFS 0–1 sobre forma exacta + paridad: 38.610 nodos; giros gratis, «/» cuesta 1);
  B) esquinas en su lugar y aristas en su capa (40.320 × 70 = 2.822.400 estados, todos alcanzables, ≤ 8 pasos);
  C) aristas dentro de su capa + capa del medio (576 estados) con 103 efectos que no mueven esquinas.
- Hecho comprobado: los movimientos que conservan la forma de cubo **nunca** cambian la paridad del orden de las
  piezas; por eso la paridad se arregla en la etapa A (igual que el solucionador clásico sq12phase).
  IDA* dentro de la forma de cubo con tablas 8! fue demasiado lento (poda máxima 7): descartado.
- Entrada: piezas de cada capa en orden de posiciones (0–11 arriba, 12–23 abajo) y si el medio está alineado.
  La primera pieza de cada capa debe empezar en el corte (el usuario gira la capa antes de anotar).
  **Pendiente de la interfaz:** confirmar con la vista plana de cubing.js el sentido y el punto de partida de
  cada capa en el puzzle físico (el núcleo usa el modelo de la app, que coincide con el reproductor).
- Resultados (laboratorio, Node): 300 posiciones reales (145 con el medio volteado) resueltas; mediana 19 «/»,
  máximo 26; < 6 ms por posición; tablas en 2,2 s la primera vez (se guardan en memoria).
  `tests/unit/from-square1.test.ts`: 3 pruebas; compara cada solución con `square1State` de la app, que rechaza
  cualquier «/» ilegal.

## Megaminx (15-F): `src/core/fromColors/readColorsMinx.ts`
- Mismo método que `readColors.ts` sobre los 132 adhesivos de la red de cubing.js (12 colores, 11 por color).
  Módulo aparte para que el Solucionador no ofrezca Megaminx donde espera sus propios solucionadores.
- Marco: los centros (las caras nunca los mueven); 60 rotaciones con Uv, Rv, Fv. Sostener: blanco arriba, verde al frente.
- Legalidad: giros de esquinas ≡ 0 (mod 3), volteos de aristas ≡ 0 (mod 2), permutación de esquinas par y de aristas
  par (cada giro de cara son dos ciclos de 5). 120 estados al azar: 32 aceptados y 88 rechazados, todos según las reglas.
- Solución: `solveMegaminx` de cubing.js (solo giros de cara, se comprueba que no traiga rotaciones) y se verifica.
  40 posiciones pintadas con rotaciones al azar: resueltas; mediana 158 movimientos, ~160 ms cada una.
  `tests/unit/from-colors-minx.test.ts`: 3 pruebas.

## Cubos grandes reducidos 4x4–7x7 (15-H): `src/core/fromColors/readColorsBig.ts`
- Generaliza el 4x4: lectura por cuadrícula N×N de la red de cubing.js (polígonos; los centros fijos de 5x5 y 7x7
  tienen 4 copias superpuestas, se pintan juntas). Reducción: centro (N−2)×(N−2) de un color y las N−2 piezas del
  medio de cada borde iguales. Se lee como 3x3 (fila/columna 0 → 0, 1…N−2 → 1, N−1 → 2).
- Pares (4x4, 6x6): paridad OLL/PLL como en el 4x4. Algoritmos 6x6 (puros, comprobados: solo cambian las aristas UF/UB):
  OLL `2-3Rw2 B2 U2 2-3Lw U2 2-3Rw' U2 2-3Rw U2 F2 2-3Rw F2 2-3Lw' B2 2-3Rw2`; PLL `3Uw2 3Rw2 U2 2-3Rw2 U2 3Rw2 3Uw2`.
- Impares (5x5, 7x7): un cubo impar reducido es un 3x3 real; un volteo o intercambio imposible es error de pintado.
- `_simuladores/colores/grandes.ts`: 60 posiciones reducidas por tamaño (con giros de bloque interno, paridades y
  rotaciones): 240/240 con la paridad detectada = aplicada y reconstrucción exacta; 80/80 sin reducir rechazadas;
  en 4x4 el resultado es idéntico al de `readColors444.ts`. `tests/unit/from-colors-big.test.ts`: 6 pruebas.
- Cuando la interfaz use este módulo para 4x4, `readColors444.ts` (y su prueba, textos y script) se pueden retirar.

## Cómo volver a correrlo (desde la raíz del repo)
```
node --experimental-strip-types content-drop/_simuladores/colores/reconstruccion.ts
node --experimental-strip-types content-drop/_simuladores/colores/legalidad.ts
node --experimental-strip-types content-drop/_simuladores/colores/clock.ts
node --experimental-strip-types content-drop/_simuladores/colores/cuatro.ts
node --experimental-strip-types content-drop/_simuladores/colores/grandes.ts
node content-drop/_simuladores/colores/skewb-grupo.mjs   (≈40 s, 4 GB: --max-old-space-size=4096)
```
