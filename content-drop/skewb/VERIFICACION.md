# Verificación del contenido de Skewb

Generado y verificado con un simulador geométrico propio (30 stickers, notación WCA 12h).

## Convención (WCA 12h, confirmada en el reglamento)
- Puzzle con U arriba y una esquina hacia el que lo sostiene; caras visibles U, F (adelante-izquierda) y R (adelante-derecha).
- R = DBR, U = UBL, L = DFL, B = DBL. Sin apóstrofo: 120° horario mirando la esquina desde afuera.
- Comprobado en el simulador: cada giro tiene orden 3 y R lleva el centro de R a B, el de B a D y el de D a R (horario visto desde DBR).

## Qué se comprobó
1. Las 70 variantes de los 67 casos resuelven exactamente su `setup` (estado idéntico, sin rotaciones).
2. Cada `setup` es la inversa exacta del algoritmo principal.
3. Todos los casos tienen la primera capa (centro U + 4 esquinas de arriba) resuelta.
4. Espacio completo tras la primera capa: 540 estados = 9 patrones de esquinas × 60 permutaciones de centros. Por eso hay 8 casos de esquinas y 59 de centros.
5. Algoritmos principales: los más cortos posibles (búsqueda bidireccional). Esquinas: 4 casos de 4 movimientos y 4 de 7. Centros: 8 a 10 movimientos.
6. Lección de centros: el plan con A (R U' L' U L B' L' B) y B (R U B' U' B L R' U') más rotaciones y se simuló literalmente sobre los 59 casos; todos terminan con 5 aplicaciones como máximo.
7. R' B R B' y L B' L' B dejan intacta la capa U, tienen orden 6, y ×3 solo cambian centros (R' B R B' ×3: D↔B y R↔L).
8. Demos de la primera capa: el algoritmo deja la capa U resuelta (solución óptima de la capa).

## Fuente
`source` = `generated:...` en todos los casos: no se copiaron algoritmos de terceros; salen de la búsqueda óptima.

## Si la verificación con KPuzzle falla
Las identidades valen con la asignación WCA de arriba. Si cubing.js asignara las esquinas o el sentido de otra forma, fallarían casi todas (solo 6 de 48 reetiquetados de R/U/L/B y sentido las conservan). En ese caso, no cambiar los datos: reportar el set, caso y variante.
