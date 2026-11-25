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

## Cómo volver a correrlo (desde la raíz del repo)
```
node --experimental-strip-types content-drop/_simuladores/colores/reconstruccion.ts
node --experimental-strip-types content-drop/_simuladores/colores/legalidad.ts
node content-drop/_simuladores/colores/skewb-grupo.mjs   (≈40 s, 4 GB: --max-old-space-size=4096)
```
