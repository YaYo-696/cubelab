# Verificación del contenido de 5x5 (Claude, 2026-11-25)

Verificado con cubing.js 0.63.8 (el mismo modelo que usa la app) mediante
`content-drop/_simuladores/big/lessons.ts`. Notación de la app (DECISIONES.md, Fase 10): `Rw` = 2 capas,
`3Rw` = 3 capas, `2R`/`3R` = una sola capa interior, `2-3Rw` = capas 2 y 3 juntas, `r` = alias de `Rw`.

## Qué se comprobó
1. Cada caso resuelve exactamente su setup, el setup es el inverso del algoritmo y no tiene rotaciones.
2. Todos los movimientos de casos y demos están en la lista de `normalizeBigCube(id, …, content = true)`.
3. Prerrequisitos y referencias a sets existen; cada lección tiene título, objetivo y cuerpo en es y en.
4. `Dw R F' U R' F Dw'` (dos últimas aristas) no cambia ningún adhesivo de centro; intercambia un ala entre FL y FR
   y voltea la arista de FR.
5. Paridad de aristas `2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2`: solo cambian U41, U43, F01 y F03
   (las dos alas de UF se intercambian; la central U42/F02 no se mueve).
6. Un 5x5 reducido no tiene paridad OLL/PLL: comprobado en `content-drop/colores` (240 posiciones reducidas).

## Fuentes
- Paridad de aristas: `generated:` paridad OLL pura de 4x4 (https://kewbz.co.uk/blogs/solutions/4x4-parity-algorithms-oll-pll-algs-how-to-solve-a-4x4-rubiks-cube, r = capa interior) aplicada a la segunda capa.
