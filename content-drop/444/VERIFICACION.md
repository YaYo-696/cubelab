# Verificación del contenido de 4x4

Verificado con un simulador NxN propio que compara por colores visibles (igual que el importador de la Fase 10). Notación de la app (DECISIONES.md, Fase 10): `Rw` = 2 capas, `2R` = solo la capa interior, `r` = alias de `Rw`.

## Ojo con la notación de las fuentes
Varias fuentes escriben `r`/`u` para la **capa interior**. Aquí se tradujeron a `2R`/`2U`. Ejemplo: la paridad PLL de cubeskills `r2 U2 r2 Uw2 r2 Uw2 U2` queda como `2R2 U2 2R2 Uw2 2R2 Uw2 U2`. Con `r` = `Rw` el algoritmo NO funciona (comprobado).

## Qué se comprobó
1. Cada variante resuelve exactamente su setup, y todos los setups cambian solo la capa de arriba. Ningún setup tiene rotaciones (la variante rápida de paridad OLL sí tiene `x`, por eso el setup viene de su versión equivalente sin rotación, que deja el mismo estado).
2. Efecto de cada caso: OLL rápida = arista UF volteada + cambios en UL, UR y esquinas UFL/UFR; OLL pura = solo UF volteada; PLL: UF↔UB, UF↔UR, esquinas UFR↔UBR, esquinas UFR↔UBL.
3. `Dw R F' U R' F Dw'` no toca ningún centro y, en las capas del medio, solo intercambia una mitad de FR con una de FL.
4. La paridad PLL de la lección (`2R2 U2 2R2 Uw2 2R2 Uw2 U2`) solo cambia la capa de arriba: intercambia UF y UB.

## Fuentes
- Paridad OLL rápida y paridad PLL: https://www.cubeskills.com/uploads/pdf/tutorials/easy-parity-cases.pdf
- Paridad OLL pura: https://kewbz.co.uk/blogs/solutions/4x4-parity-algorithms-oll-pll-algs-how-to-solve-a-4x4-rubiks-cube (r = capa interior)
- Aristas vecinas: https://ca.speedcube.com.au/blogs/speedcubing-solutions/4x4-pll-parity-algorithms (r, u = capa interior)
- Esquinas vecinas y en diagonal: `generated:` paridad PLL + T-perm / Nb-perm de 3x3 (combinación verificada).
