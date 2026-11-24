# Verificación del contenido de Clock

Simulador propio de las agujas construido a partir de la definición del KPuzzle `clock` de cubing.js 0.63.8 (`UL_PLUS_`, `U_PLUS_`, `ALL_PLUS_`, `y2` y las derivadas por simetría). Se comprobó que `UL1+`, `U1+` y `ALL1+` dan exactamente los mismos cambios que cubing.js.

## Qué se comprobó
1. Método de 3 pasos (cruz adelante, `y2`, cruz atrás, esquinas): resolvió 2.000 mezclas al azar.
2. Cada paso de la cruz cambia el centro sin tocar los bordes ya alineados; los movimientos de un lado solo afectan las esquinas del otro.
3. Las 4 combinaciones de esquina (p. ej. `DR a+ D a- R a- ALL a+`) cambian solo esa esquina y su pareja de atrás.
4. Los 4 casos del Entrenador: el setup mueve solo una esquina (3 horas) y el algoritmo la devuelve exactamente.
5. Demos: mezcla de ejemplo → paso 1 deja la cruz de adelante en 12 → paso 2 deja ambas cruces → paso 3 resuelve todo.
6. Todos los tokens están en la lista que acepta `normalizeClock` (sin giros de 0).

## Fuente
`generated:` método propio verificado. Notación: WCA 12g.
