# Verificación del contenido de 7x7 (Claude, 2026-11-25)

Verificado con cubing.js 0.63.8 (el mismo modelo que usa la app) mediante
`content-drop/_simuladores/big/lessons.ts`. Notación de la app (DECISIONES.md, Fase 10): `Rw` = 2 capas,
`3Rw` = 3 capas, `2R`/`3R` = una sola capa interior, `2-3Rw` = capas 2 y 3 juntas, `r` = alias de `Rw`.

## Qué se comprobó
1. Cada caso resuelve exactamente su setup, el setup es el inverso del algoritmo y no tiene rotaciones.
2. Todos los movimientos de casos y demos están en la lista de `normalizeBigCube(id, …, content = true)`.
3. Prerrequisitos y referencias a sets existen; cada lección tiene título, objetivo y cuerpo en es y en.
4. `Dw R F' U R' F Dw'` (dos últimas aristas) no cambia ningún adhesivo de centro; intercambia un ala entre FL y FR
   y voltea la arista de FR.
5. Paridad de aristas por órbita (solo cambian las alas indicadas de UF):
   `2R…` → U61, U65, F01, F05 (exteriores); `3R…` → U62, U64, F02, F04 (interiores); `2-3Rw…` → las 4.
6. Un 7x7 reducido no tiene paridad OLL/PLL: comprobado en `content-drop/colores` (240 posiciones reducidas).

## Fuentes
- `generated:` paridad OLL pura de 4x4 (kewbz, r = capa interior) aplicada a la órbita de alas indicada.
