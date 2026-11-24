# Verificación del contenido de Pyraminx (content-drop/pyram)

Generado el 23 de noviembre de 2026 por un asistente distinto del que programa la app, con un simulador propio e independiente de cubing.js.

## Cómo se verificó

1. **Simulador geométrico propio.** Tetraedro regular con 36 stickers; cada giro es una rotación de 120° de las piezas de esa capa, con sentido horario mirando el vértice desde afuera (convención WCA). Comprobaciones del modelo:
   - Cada giro repetido 3 veces vuelve al estado inicial.
   - Con U, el frente pasa a la izquierda (igual que el U del cubo).
   - Una búsqueda en anchura sin puntas encuentra exactamente **933.120 estados**, el tamaño conocido del Pyraminx sin puntas.
2. **Por cada caso:** `setup` es el inverso exacto del algoritmo principal. Se comprobó que **cada algoritmo, aplicado al estado de `setup`, deja el puzzle resuelto de forma exacta** (puntas incluidas). Cuando una alternativa necesita un ajuste previo de U, ya viene incluido en el texto del algoritmo.
3. **Etapa previa intacta:**
   - En L4E, el estado del caso conserva la V (aristas LB y RB, centros L, R y B y sus puntas).
   - En L3E conserva además la arista LR, es decir, la primera capa completa.
4. **Casos distintos:** los 36 casos de L4E son distintos entre sí, incluso permitiendo un giro previo de U.
5. **Espejos:** el espejo izquierda-derecha de cada caso de L4E también está en la lista.
6. **Notación:** todos los textos usan solo `U L R B` con o sin `'`. Se normalizaron formas como `L2'`, `R2'` o `R2` (por ejemplo, `L2'` → `L`), sin cambiar el efecto.

**Convención de sostén:** la V queda abajo y apunta hacia atrás (vértice B). Las 4 aristas de L4E son LR (abajo adelante), UL, UR y UB.

## Correcciones respecto de la fuente

- Upper Edge Solved #3: la fuente repite el algoritmo de #2 (mismo caso). Se reemplazó por el espejo de #4 (L R' L' R), que es el único caso del grupo sin su espejo en la lista.
- Down Edge Flipped #4: la fuente pone dos algoritmos que resuelven casos distintos (uno es el espejo del otro). Se separaron como #4a y #4b.

## Fuentes

- **L4E** (35 entradas, 5 grupos): https://cubingapp.com/algorithms/Pyraminx-L4E (consultado el 23-11-2026).
- **Alternativas de Sune y Antisune:** https://twisty-puzzle.pages.dev/pyraminx-algorithms/
- **Descartados:** dos algoritmos de volteo de otra fuente (zeroplay.io), porque con esta convención rompen la V.

## Para el importador (Codex)

- **Si la verificación con KPuzzle no coincide en todos los casos,** lo más probable es una diferencia de convención (nombre de los vértices u orientación del puzzle), no un algoritmo malo. En ese caso, reporta qué casos fallan y no corrijas los datos.
- **El grupo `des`** de L4E contiene los mismos 5 casos que el set `l3e`.

### Última capa (L3E) — 5 casos

| id | caso | algoritmo principal | mov. | alternativas |
|---|---|---|---:|---:|
| `l3e-sune` | Sune (ciclo de 3 aristas) | `R U R' U R U R'` | 7 | 2 |
| `l3e-antisune` | Antisune (ciclo inverso) | `R U' R' U' R U' R'` | 7 | 2 |
| `l3e-2flip` | Volteo de 2 aristas | `L R' L' R U' R U R'` | 8 | 0 |
| `l3e-flip-cycle-r` | Ciclo con volteo · R' (U' L' U L) R | `R' U' L' U L R` | 6 | 0 |
| `l3e-flip-cycle-l` | Ciclo con volteo · L (U R U' R') L' | `L U R U' R' L'` | 6 | 0 |

### Últimas 4 aristas (L4E) — 36 casos

| id | caso | algoritmo principal | mov. | alternativas |
|---|---|---|---:|---:|
| `l4e-des-sune` | Arista inferior resuelta · Sune | `R U R' U R U R'` | 7 | 0 |
| `l4e-des-antisune` | Arista inferior resuelta · Antisune | `R U' R' U' R U' R'` | 7 | 0 |
| `l4e-des-2-flip` | Arista inferior resuelta · 2-flip | `L R' L' R U' R U R'` | 8 | 0 |
| `l4e-des-rp-unsexy-r` | Arista inferior resuelta · R' unsexy R | `R' U' L' U L R` | 6 | 0 |
| `l4e-des-l-unsexy-lp` | Arista inferior resuelta · L unsexy L' | `L U R U' R' L'` | 6 | 0 |
| `l4e-def-1` | Arista inferior volteada · #1 | `R' L R L' U R' L R L' U R' L R L'` | 14 | 0 |
| `l4e-def-2` | Arista inferior volteada · #2 | `L R' L' R U L R' L' R` | 9 | 0 |
| `l4e-def-3` | Arista inferior volteada · #3 | `R' L R L' U' R' L R L'` | 9 | 0 |
| `l4e-def-4a` | Arista inferior volteada · #4a | `U' R' L R L' R U' R'` | 8 | 0 |
| `l4e-def-4b` | Arista inferior volteada · #4b | `U L R' L' R L' U L` | 8 | 0 |
| `l4e-def-5` | Arista inferior volteada · #5 | `U' R U' R' L' U' L` | 7 | 0 |
| `l4e-def-6` | Arista inferior volteada · #6 | `U L' U L R U R'` | 7 | 0 |
| `l4e-ues-1` | Arista superior resuelta · #1 | `U L' U' L` | 4 | 0 |
| `l4e-ues-2` | Arista superior resuelta · #2 | `U' R U R'` | 4 | 0 |
| `l4e-ues-3` | Arista superior resuelta · #3 | `L R' L' R` | 4 | 0 |
| `l4e-ues-4` | Arista superior resuelta · #4 | `R' L R L'` | 4 | 0 |
| `l4e-ues-5` | Arista superior resuelta · #5 | `R' L R L U L` | 6 | 0 |
| `l4e-ues-6` | Arista superior resuelta · #6 | `L R' L' R' U' R'` | 6 | 0 |
| `l4e-ues-7` | Arista superior resuelta · #7 | `R U' R'` | 3 | 0 |
| `l4e-ues-8` | Arista superior resuelta · #8 | `L' U L` | 3 | 0 |
| `l4e-uef-1` | Arista superior volteada · #1 | `R U R' U R' L R L'` | 8 | 0 |
| `l4e-uef-2` | Arista superior volteada · #2 | `L' U' L U' L R' L' R` | 8 | 0 |
| `l4e-uef-3` | Arista superior volteada · #3 | `U L' U L U' R U R'` | 8 | 0 |
| `l4e-uef-4` | Arista superior volteada · #4 | `U' R U' R' U L' U' L` | 8 | 0 |
| `l4e-uef-5` | Arista superior volteada · #5 | `R U R' U L' U L` | 7 | 0 |
| `l4e-uef-6` | Arista superior volteada · #6 | `L' U' L U' R U' R'` | 7 | 0 |
| `l4e-uef-7` | Arista superior volteada · #7 | `U R' L R L' U L' U L` | 9 | 0 |
| `l4e-uef-8` | Arista superior volteada · #8 | `U' L R' L' R U' R U' R'` | 9 | 0 |
| `l4e-np-1` | Nada colocado · #1 | `U R U' R L R L'` | 7 | 0 |
| `l4e-np-2` | Nada colocado · #2 | `U' L' U L' R' L' R` | 7 | 0 |
| `l4e-np-3` | Nada colocado · #3 | `U' L' U' L U R U R'` | 8 | 0 |
| `l4e-np-4` | Nada colocado · #4 | `U R U R' U' L' U' L` | 8 | 0 |
| `l4e-np-5` | Nada colocado · #5 | `U R U' R' U' R U R'` | 8 | 0 |
| `l4e-np-6` | Nada colocado · #6 | `U' L' U L U L' U' L` | 8 | 0 |
| `l4e-np-7` | Nada colocado · #7 | `U' L' U L R U' R'` | 7 | 0 |
| `l4e-np-8` | Nada colocado · #8 | `U R U' R' L' U L` | 7 | 0 |
