# Verificación del contenido de 6x6 (Claude, 2026-11-25)

Verificado con cubing.js 0.63.8 (el mismo modelo que usa la app) mediante
`content-drop/_simuladores/big/lessons.ts`. Notación de la app (DECISIONES.md, Fase 10): `Rw` = 2 capas,
`3Rw` = 3 capas, `2R`/`3R` = una sola capa interior, `2-3Rw` = capas 2 y 3 juntas, `r` = alias de `Rw`.

## Qué se comprobó
1. Cada caso resuelve exactamente su setup, el setup es el inverso del algoritmo y no tiene rotaciones.
2. Todos los movimientos de casos y demos están en la lista de `normalizeBigCube(id, …, content = true)`.
3. Prerrequisitos y referencias a sets existen; cada lección tiene título, objetivo y cuerpo en es y en.
4. `Dw R F' U R' F Dw'` (dos últimas aristas) no cambia ningún adhesivo de centro; intercambia un ala entre FL y FR
   y voltea la arista de FR.
5. Paridad OLL `2-3Rw2 B2 U2 2-3Lw U2 2-3Rw' U2 2-3Rw U2 F2 2-3Rw F2 2-3Lw' B2 2-3Rw2`: solo cambian las 4 alas de UF.
6. Paridad PLL `3Uw2 3Rw2 U2 2-3Rw2 U2 3Rw2 3Uw2`: solo cambian F01–F04 y B01–B04 (intercambia UF y UB).
7. `3Dw R F' U R' F 3Dw'` intercambia dos alas juntas entre FL y FR sin voltear y sin tocar centros.

## Fuentes
- `generated:` paridades OLL y PLL puras de 4x4 llevadas a las capas 2 y 3 (base: kewbz y cubeskills, ver content-drop/444).
