# 3x3 y 2x2 · Método principiante renovado (Claude, 2026-11-24)

Este paquete NO es un drop del importador. 3x3 y 2x2 siguen con su sistema propio
(`course.ts`, `academySets.ts`, `es.json`/`en.json`). Aquí van los datos listos para integrar.

## Archivos
- `textos.json` — `{es:{clave:texto}, en:{clave:texto}}`. 80 claves, las mismas en ambos idiomas.
  Sobrescriben las existentes en `src/i18n/es.json` y `src/i18n/en.json` y agregan las nuevas
  (`aTitle_<drill>`). Los cuerpos (`aBody_*`) están en **markdown**.
- `drills-nuevos.json` — ejercicios nuevos `{id, setup, goal, alg}` para `drills333` (15) y `drills222` (5).
- `VERIFICACION.md` — cómo se comprobó cada cosa.

## Cambios exactos

### 1. `src/puzzles/content/academySets.ts`
Agregar cada entrada de `drills-nuevos.json` con `drill(id, setup, goal, alg)`:
- `drills333` → al final de `early3`, en el orden del JSON.
- `drills222` → dentro de `set('drills222', [...])`, después de los existentes.

**No simplificar los algoritmos.** `F' F` y `R2 R` son intencionales: el ejercicio muestra
el mismo algoritmo repetido, que es lo que enseña la lección.

### 2. `src/puzzles/content/course.ts` (`plans`)
3x3, módulo `layers`:

| lección | set | cases | needs |
|---|---|---|---|
| cross | drills333 | cross | (igual) |
| corners | drills333 | corners, cornersRepeat | (igual) |
| middle | drills333 | middle, middleLeft | (igual) |
| yellowCross | **drills333** | ycLine, ycL, ycDot | **['middle']** (ya no usa giros anchos; se quita notationA) |
| orient | **drills333** | orientSune, orientAnti, orientZero, orientTwo | (igual) |
| permCorners | **drills333** | cornersAdj, cornersDiag | (igual) |
| permEdges | **drills333** | edgesUa, edgesUb, edgesH, edgesZ | (igual) |

2x2, módulo `layers`:

| lección | set | cases |
|---|---|---|
| firstLayer | drills222 | firstLayer, firstLayerRepeat |
| orient2 | **drills222** | orient2Sune, orient2Anti, orient2Zero, orient2Two |
| perm2 | (sin cambios) | (sin cambios) |

Marcar `markdown: true` en esas 10 lecciones (cross, corners, middle, yellowCross, orient,
permCorners, permEdges, firstLayer, orient2, perm2). El resto de lecciones no cambia.

### 3. `src/core/solver/solve.ts` — método `beginner` (3x3) y `orient2` (2x2)
El solucionador principiante hoy explica la última capa con casos 2-look (f R U R' U' f', Pi, T, Y, Ub, H, Z)
que la lección principiante ya no enseña. Debe usar **solo los algoritmos de la lección**, repitiendo:

| etapa | algoritmos permitidos | entre repeticiones | meta | máx. repeticiones (comprobado) |
|---|---|---|---|---|
| yellowCross | `F R U R' U' F'` | AUF (U, U2, U') | edgeOrientation | 3 |
| orient | Sune `R U R' U R U2 R'`, Anti-Sune `R U2 R' U' R U' R'` | AUF | orientation | 3 |
| permCorners | Aa `R' F R' B2 R F' R' B2 R2` | AUF | cornerPermutation | 2 (+AUF final) |
| permEdges | Ua `R U' R U R U R U' R' U' R2` | rotación y, y2, y' (NO AUF) | solved | 3 |
| orient2 (2x2) | Sune, Anti-Sune | AUF | orientation | 3 |

Implementación sugerida: búsqueda en anchura sobre `(ajuste, algoritmo)` hasta el máximo de la tabla.
Se elige la secuencia con menos algoritmos. `lessonId` sigue siendo el de la etapa. Si no encuentra
solución dentro del máximo, es un bug: lanzar `UnrecognizedCase` (no devolver timeout en silencio)
y cubrirlo con un test.
`cfop4`, `cfopFull` y Ortega **no cambian**.

### 4. `src/puzzles/content/trainer.ts`
Los grupos de `oll333` (`yellowCross`, `orient`) y `pll333` (`permCorners`, `permEdges`) apuntan
a lecciones que ya no enseñan esos casos. Cambiar su `lessonId` a `oll3` y `pll3` respectivamente.
Los `id` de los grupos no cambian, así no se pierde el progreso guardado.

### 5. Quiz (`src/core/academy/questions.ts`)
**Sin cambios de código.** Los textos nuevos `aQuiz_*` respetan las respuestas verdadero/falso que ya
están en `topics`.

## Qué revisar al terminar
- Test existente de `verifyCase` pasa con los 20 ejercicios nuevos.
- Solucionador principiante: 200 mezclas aleatorias 3x3 y 200 2x2 terminan resueltas y sin `UnrecognizedCase`.
- Ninguna clave nueva falta en es o en.
