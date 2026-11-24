# Verificación · 3x3/2x2 principiante

Simulador propio de 3x3 por adhesivos (54 adhesivos, giros de cara, anchos, capas medias y rotaciones),
el mismo con el que se verificaron los 354 algoritmos de OLL/PLL/CLL/EG.

## Algoritmos actuales (sin cambios)
Los 19 de `academySequences.json`, las alternativas de 2x2 y 3x3 y los 7 ejercicios existentes
dan el resultado que dice su meta.

## Ejercicios nuevos (20)
Cada uno: estado = solved + setup; se aplica `alg`; se comprueba la meta (con AUF cuando la meta lo permite).
- 3x3: cornersRepeat (first), middleLeft (f2l), ycLine/ycL/ycDot (edgeOrientation),
  orientSune/orientAnti/orientZero/orientTwo (orientation), cornersAdj/cornersDiag (cornerPermutation),
  edgesUa/edgesUb/edgesH/edgesZ (solved). 15/15 OK.
- 2x2 (solo esquinas): firstLayerRepeat (first), orient2Sune/orient2Anti/orient2Zero/orient2Two (orientation). 5/5 OK.

## Reglas de las lecciones (exhaustivas)
- **Primera capa:** esquina sobre su hueco con R U R' U' ×k. Blanco a la derecha k=1, arriba k=3,
  al frente k=5. (R U R' U')×6 = identidad. R U R' U' solo toca la esquina DFR de la capa D.
- **Segunda capa:** arista en UF con color frontal = F. Color de arriba = R → `U R U' R' U' F' U F`;
  = L → `U' L' U L U F U' F'`. Ambos conservan la primera capa.
- **Cruz amarilla:** punto → F R U R' U' F' → L en UF+UR. L atrás-izquierda (UB+UL) → línea UL+UR.
  Línea horizontal → cruz. L en UF+UL o UB+UR queda igual; L en UF+UR da línea vertical (por eso la lección usa atrás-izquierda).
- **Orientar con Sune:** regla de posición (1 esquina → adelante-izquierda; 0 → amarillo de UFL a la
  izquierda; 2 → amarillo de UFL al frente). Probada en los 7 casos × 4 AUF: Sune 1, Anti-Sune 2,
  Pi 2, H 2, T 3, L 3, U 3 Sunes. Con el atajo Anti-Sune (1 esquina en UBR y UFL amarillo al frente):
  Anti-Sune 1, T/L/U 2.
- **Permutar esquinas con Aa:** faros atrás + Aa. Probado en las 24 permutaciones de esquinas: máximo 2 Aa.
  Con faros a la izquierda, a la derecha o al frente la regla falla (por eso la lección dice "atrás").
  `R' F R' B2 R F' R' B2 R2` es idéntico a `x R' U R' D2 R U' R' D2 R2 x'`.
- **Permutar aristas con Ua:** arista resuelta atrás (rotando el cubo) + Ua. Probado en las 12
  permutaciones de aristas: máximo 3 Ua.
- **2x2 adyacente:** en el caso T los faros quedan a la izquierda. Diagonal: Y desde cualquier lado + AUF.
- Descartado: `U R U' L' U R' U' L` (Niklas) gira esquinas, así que no sirve después de orientar.
