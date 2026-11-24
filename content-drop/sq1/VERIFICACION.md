# Verificación del contenido de Square-1

Simulador propio que copia exactamente el modelo de la app (`src/puzzles/sideEvents/square1.ts`): mismo orden de cuñas, mismo giro `(x, y)`, misma regla de corte `/` y mismo bit de capa del medio. La app además compara ese modelo con el KPuzzle de cubing.js en cada verificación.

## Qué se comprobó
1. Las 220 variantes de los 220 casos: el setup es legal desde el estado resuelto, la sintaxis cumple el validador (números −5..6, sin `(0, 0)`) y el algoritmo resuelve exactamente el setup (incluida la capa del medio).
2. Forma de cubo: recorrido completo de las 3.678 posiciones de forma; 169 clases salvo giros de capa; la solución de cada una es la más corta en cortes (máximo 7).
3. CO (7 casos), EO (7) y CP (35): todas las clases posibles en forma de cubo, con búsqueda bidireccional (3 + 3 cortes) sobre abstracciones del estado; las de EO conservan las esquinas en su capa y las de CP conservan las aristas en su capa.
4. Paso 5: el plan con T, P, cambio de capa y capa del medio resolvió las 1.152 combinaciones de aristas (24 × 24 × capa del medio), con 8 aplicaciones de T o P como máximo.
5. P (paridad) intercambia solo 2 aristas de arriba y tuerce la capa del medio; `/ (6, 0) / (6, 0) / (6, 0)` solo endereza la capa del medio; `/ (6, 6) /` intercambia las capas.

## Fuentes
- Paridad P: https://speedcube.com.au/blogs/speedcubing-solutions/how-to-solve-a-square-1-in-6-steps-easy-to-follow-beginners-steps (con `(0, 3)` final para alinear la capa de abajo).
- Consejo de forma: https://ruwix.com/twisty-puzzles/square-1-back-to-square-one/
- Todo lo demás: `generated:` búsqueda óptima propia. Notación: WCA 12c.
