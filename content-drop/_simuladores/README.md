# Simuladores de verificación (Claude)

Scripts de Python 3 sin dependencias que Claude usó para verificar **todo** el contenido de `content-drop/`.
No los usa la app. Sirven para que un chat nuevo de Claude pueda volver a verificar algoritmos sin
reconstruir nada. Algunos tienen rutas absolutas del chat anterior (`/home/claude/...`,
`/mnt/user-data/...`): ajústalas antes de correrlos.

| carpeta | modelo | notas |
|---|---|---|
| `333/cube.py` | 3x3 por adhesivos (54) | giros de cara, anchos (`r` = `Rw`), capas medias, rotaciones. `apply`, `invert`, `inv_str`, `normalize`, `f2l_ok` |
| `333/check.py` | | verificación de OLL/PLL/CLL/EG completos (`src/puzzles/content/full/*.json`) |
| `333/drills.py`, `d222.py` | | ejercicios nuevos del principiante 3x3/2x2 |
| `333/ll_beg.py`, `sune.py`, `beg2.py` | | pruebas exhaustivas de las reglas del principiante (Aa, Ua, Sune repetido) |
| `pyra/pyra.py` | Pyraminx geométrico | L3E/L4E. Probado contra 48 permutaciones de convención |
| `skewb/skewb.py` | Skewb, notación WCA 12h | esquinas R=DBR, U=UBL, L=DFL, B=DBL; sentido horario visto desde afuera |
| `minx/minx.py` | Megaminx, 132 adhesivos | nombres de cara de cubing.js (U; F,R,BR,BL,L; FR,DR,B,DL,FL; D) |
| `big/nxn.py` | NxN | `Rw`, `2R`, `3Rw`. En la app `r` = `Rw`; las fuentes que usan `r` = capa interna se traducen a `2R` |
| `clock/clk.py` | Clock | a partir de la definición kpuzzle de clock de cubing.js |
| `sq1/sq1.py` | Square-1 | copia exacta del modelo de `src/puzzles/sideEvents/square1.ts` |
| `colores/*.ts`, `skewb-grupo.mjs` | cubing.js real (Node) | Resolver desde colores: reconstrucción, legalidad y grupo del Skewb. Correr desde la raíz del repo; ver `content-drop/colores/VERIFICACION.md` |

Lección aprendida: al escribir en el PC de Carlos, volver a leer cada archivo escrito y comparar md5.
