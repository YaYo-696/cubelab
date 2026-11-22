# Algoritmos de la fase 3B.1

Cada celda enumera el principal primero y luego las alternativas, en el orden de la app. Los casos sin cambios también aparecen. [Fuentes](FUENTES.md)

## OLL 3×3

[Catálogo de SpeedCubeDB](https://www.speedcubedb.com/a/3x3/OLL)

| Caso | Algoritmo anterior | Algoritmo nuevo |
| --- | --- | --- |
| OLL 1 | `R U2 R2 F R F' U2 R' F R F'`<br>`B U' B2 D' b U' b' D B2 U B'`<br>`f R U R' U' R f' U' r' U' R U M'` | `R U2 R2 F R F' U2 R' F R F'`<br>`y R U' R2 D' r U' r' D R2 U R'`<br>`f R U R' U' R f' U' r' U' R U M'` |
| OLL 2 | `F U' F2 D' f U f' D F2 U F'`<br>`F R U R' U' S R U R' U' f'`<br>`b U b' U2 B U2 B' U2 b U' b'` | `y' R U' R2 D' r U r' D R2 U R'`<br>`F R U R' U' S R U R' U' f'`<br>`y r U r' U2 R U2 R' U2 r U' r'` |
| OLL 3 | `l F U F' U' l' U' L F U F' U' L'`<br>`B' R2 B2 U2 B' R B U2 B2 R2 B`<br>`r' R2 U R' U r U2 r' U M'` | `y' f R U R' U' f' U' F R U R' U' F'`<br>`y R' F2 R2 U2 R' F R U2 R2 F2 R`<br>`r' R2 U R' U r U2 r' U M'` |
| OLL 4 | `F' L2 F2 U2 F' L' F U2 F2 L2 F`<br>`l F U F' U' l' U L F U F' U' L'`<br>`R' F R F' U' S R' U' R U R S'` | `y' R' F2 R2 U2 R' F' R U2 R2 F2 R`<br>`y' f R U R' U' f' U F R U R' U' F'`<br>`R' F R F' U' S R' U' R U R S'` |
| OLL 5 | `r' U2 R U R' U r`<br>`L' B2 l U l' B L`<br>`L' B2 R B R' B L` | `r' U2 R U R' U r`<br>`y2 R' F2 r U r' F R`<br>`y2 R' F2 L F L' F R` |
| OLL 6 | `r U2 R' U' R U' r'`<br>`F U' R2 D R' U' R D' R2 U F'`<br>`L F2 l' U' l F' L'` | `r U2 R' U' R U' r'`<br>`F U' R2 D R' U' R D' R2 U F'`<br>`L F2 l' U' l F' L'` |
| OLL 7 | `r U R' U R U2 r'`<br>`S' R U R' U R U2 R' U S`<br>`L' U2 L U2 L F' L' F` | `r U R' U R U2 r'`<br>`S' R U R' U R U2 R' U S`<br>`L' U2 L U2 L F' L' F` |
| OLL 8 | `l' U' L U' L' U2 l`<br>`R U2 R' U2 R' F R F'`<br>`R' F' r U' r' F2 R` | `y2 r' U' R U' R' U2 r`<br>`R U2 R' U2 R' F R F'`<br>`R' F' r U' r' F2 R` |
| OLL 9 | `B U B' U' B' R B2 U B' U' R'`<br>`R U2 R' U' S' R U' R' S`<br>`B' U' B U' B L' B' L B' U2 B` | `y R U R' U' R' F R2 U R' U' F'`<br>`R U2 R' U' S' R U' R' S`<br>`y' L' U' L U' L F' L' F L' U2 L` |
| OLL 10 | `R U R' U R' F R F' R U2 R'`<br>`R U R' B' R B U' B' R' B`<br>`S' B' U2 B U B' U B U S` | `R U R' U R' F R F' R U2 R'`<br>`y F U F' R' F R U' R' F' R`<br>`y M' R' U2 R U R' U R U M` |
| OLL 11 | `r' R2 U R' U R U2 R' U M'`<br>`l U L' U L' B L B' L U2 l'`<br>`M R U R' U R U2 R' U M'` | `r' R2 U R' U R U2 R' U M'`<br>`y2 r U R' U R' F R F' R U2 r'`<br>`M R U R' U R U2 R' U M'` |
| OLL 12 | `S F' U' F U' F' U2 F U' S'`<br>`F R U R' U' F' U F R U R' U' F'`<br>`M F' U' F U' F' U2 F U2 M'` | `y' M' R' U' R U' R' U2 R U' M`<br>`F R U R' U' F' U F R U R' U' F'`<br>`y' S R' U' R U' R' U2 R U2 S'` |
| OLL 13 | `F U R U2 R' U' R U R' F'`<br>`F U R U' R2 F' R U R U' R'`<br>`r U' r' U' r U r' F' U F` | `F U R U2 R' U' R U R' F'`<br>`F U R U' R2 F' R U R U' R'`<br>`r U' r' U' r U r' F' U F` |
| OLL 14 | `R' F R U R' F' R F U' F'`<br>`r U R' U' r' F R2 U R' U' F'`<br>`l' U l U l' U' l F U' F'` | `R' F R U R' F' R F U' F'`<br>`r U R' U' r' F R2 U R' U' F'`<br>`l' U l U l' U' l F U' F'` |
| OLL 15 | `r' U' r R' U' R U r' U r`<br>`r' U' M' U' R U r' U r`<br>`L' B' L R' U' R U L' B L` | `r' U' r R' U' R U r' U r`<br>`r' U' M' U' R U r' U r`<br>`y2 R' F' R L' U' L U R' F R` |
| OLL 16 | `r U r' R U R' U' r U' r'`<br>`r U M U R' U' r U' r'`<br>`L' B L U L' U' B' L U' L' U2 L` | `r U r' R U R' U' r U' r'`<br>`r U M U R' U' r U' r'`<br>`y2 R' F R U R' U' F' R U' R' U2 R` |
| OLL 17 | `R U R' U R' F R F' U2 R' F R F'`<br>`B L' B' L U S L U' L' S'`<br>`B L' B' L2 l' U L U' L' U' M` | `R U R' U R' F R F' U2 R' F R F'`<br>`y2 F R' F' R U S' R U' R' S`<br>`y2 F R' F' R2 r' U R U' R' U' M'` |
| OLL 18 | `B U2 B2 R B R' U2 S' U B U' b'`<br>`r U R' U R U2 r2 U' R U' R' U2 r`<br>`R M B U' B' M' B U2 B' U' R'` | `y R U2 R2 F R F' U2 M' U R U' r'`<br>`r U R' U R U2 r2 U' R U' R' U2 r`<br>`y F S' R U' R' S R U2 R' U' F'` |
| OLL 19 | `M B U B' M' U' B' R B R'`<br>`M U R U R' U' M' R' F R F'`<br>`R' U2 F R U R' U' F2 U2 F R` | `y S' R U R' S U' R' F R F'`<br>`M U R U R' U' M' R' F R F'`<br>`R' U2 F R U R' U' F2 U2 F R` |
| OLL 20 | `r U R' U' M2 U R U' R' U' M'`<br>`M' U2 M U2 M' U M U2 M' U2 M`<br>`S' R U R' S U' M' U R U' r'` | `r U R' U' M2 U R U' R' U' M'`<br>`M' U2 M U2 M' U M U2 M' U2 M`<br>`S' R U R' S U' M' U R U' r'` |
| OLL 21 | `R U R' U R U' R' U R U2 R'`<br>`B U2 B' U' B U B' U' B U' B'`<br>`R B U B' U' B U B' U' B U B' U' R'` | `R U R' U R U' R' U R U2 R'`<br>`y R U2 R' U' R U R' U' R U' R'`<br>`y F R U R' U' R U R' U' R U R' U' F'` |
| OLL 22 | `R U2 R2 U' R2 U' R2 U2 R`<br>`R' U2 R2 U R2 U R2 U2 R'`<br>`f R U R' U' S' R U R' U' F'` | `R U2 R2 U' R2 U' R2 U2 R`<br>`R' U2 R2 U R2 U R2 U2 R'`<br>`f R U R' U' S' R U R' U' F'` |
| OLL 23 | `R2 D R' U2 R D' R' U2 R'`<br>`L2 D' L U2 L' D L U2 L`<br>`R U R' U R U2 R2 U' R U' R' U2 R` | `R2 D R' U2 R D' R' U2 R'`<br>`y2 R2 D' R U2 R' D R U2 R`<br>`R U R' U R U2 R2 U' R U' R' U2 R` |
| OLL 24 | `r U R' U' r' F R F'`<br>`L' B' l U L U' l' B`<br>`B U B D B' U' B D' B2` | `r U R' U' r' F R F'`<br>`y2 R' F' r U R U' r' F`<br>`y R U R D R' U' R D' R2` |
| OLL 25 | `R U2 R D R' U2 R D' R2`<br>`R' b U B' U' b' R B`<br>`F R' F' r U R U' r'` | `R U2 R D R' U2 R D' R2`<br>`y F' r U R' U' r' F R`<br>`F R' F' r U R U' r'` |
| OLL 26 | `B U2 B' U' B U' B'`<br>`R' U' R U' R' U2 R`<br>`R' U L U' R U L'` | `y R U2 R' U' R U' R'`<br>`R' U' R U' R' U2 R`<br>`y2 L' U R U' L U R'` |
| OLL 27 | `R U R' U R U2 R'`<br>`F' U2 F U F' U F` | `R U R' U R U2 R'`<br>`y' R' U2 R U R' U R` |
| OLL 28 | `r U R' U' M U R U' R'`<br>`r U R' U' r' R U R U' R'`<br>`R' F R S R' F' R S'` | `r U R' U' M U R U' R'`<br>`r U R' U' r' R U R U' R'`<br>`R' F R S R' F' R S'` |
| OLL 29 | `r2 D' r U r' D r2 U' r' U' r`<br>`B U B' U' B U' B' R' U' R B U B'`<br>`M B U B' U' B' R B R' U M'` | `r2 D' r U r' D r2 U' r' U' r`<br>`y R U R' U' R U' R' F' U' F R U R'`<br>`y S' R U R' U' R' F R F' U S` |
| OLL 30 | `B U L U2 L' U' L U2 L' U' B'`<br>`f' D' f U' f' D f2 U' f' U f U f'`<br>`B L' B L2 U' L' U' L U L' B2` | `y2 F U R U2 R' U' R U2 R' U' F'`<br>`y' r' D' r U' r' D r2 U' r' U r U r'`<br>`y2 F R' F R2 U' R' U' R U R' F2` |
| OLL 31 | `R' U' F U R U' R' F' R`<br>`M' B U B' U' r' U' R`<br>`S R' U' R U R B' R' b` | `R' U' F U R U' R' F' R`<br>`y S R U R' U' f' U' F`<br>`y2 S' L' U' L U L F' L' f` |
| OLL 32 | `S R U R' U' R' F R f'`<br>`R U B' U' R' U R B R'`<br>`F' L F L' U' f U' f' U f U f'` | `S R U R' U' R' F R f'`<br>`y2 L U F' U' L' U L F L'`<br>`y' R' F R F' U' r U' r' U r U r'` |
| OLL 33 | `R U R' U' R' F R F'`<br>`R' U' R U R B' R' B`<br>`l' B' l U l U' l' B` | `R U R' U' R' F R F'`<br>`y2 L' U' L U L F' L' F`<br>`y2 r' F' r U r U' r' F` |
| OLL 34 | `r B r' U' b' U' B U S'`<br>`L U L2 U' L' B L U L U' B'`<br>`F R U R' U' R' F' r U R U' r'` | `y f R f' U' r' U' R U M'`<br>`y2 R U R2 U' R' F R U R U' F'`<br>`F R U R' U' R' F' r U R U' r'` |
| OLL 35 | `R U2 R2 F R F' R U2 R'`<br>`f R U R' U' f' R U R' U R U2 R'`<br>`F' U2 F2 R' F' R F' U2 F` | `R U2 R2 F R F' R U2 R'`<br>`f R U R' U' f' R U R' U R U2 R'`<br>`y L' U2 L2 F' L' F L' U2 L` |
| OLL 36 | `B U B2 R' U' R U B2 U2 B'`<br>`R' U' R U' R' U R U R B' R' B`<br>`L U L' B' L U L' U' L' B L U' L' B L B'` | `y R U R2 F' U' F U R2 U2 R'`<br>`y2 L' U' L U' L' U L U L F' L' F`<br>`y2 R U R' F' R U R' U' R' F R U' R' F R F'` |
| OLL 37 | `F R' F' R U R U' R'`<br>`F R U' R' U' R U R' F'`<br>`R' b U b' U' b' R b` | `F R' F' R U R U' R'`<br>`F R U' R' U' R U R' F'`<br>`y F' r U r' U' r' F r` |
| OLL 38 | `R U R' U R U' R' U' R' F R F'`<br>`R B U' B' M' U' B U B' r'`<br>`r U R' U' r' F R U R U' R' F'` | `R U R' U R U' R' U' R' F R F'`<br>`y F R U' R' S U' R U R' f'`<br>`r U R' U' r' F R U R U' R' F'` |
| OLL 39 | `l' f U f' U' f' L f M`<br>`F U F' L' U' L U F U2 F'`<br>`F R' F' U' F U R U' F'` | `y' f' r U r' U' r' F r S`<br>`y' R U R' F' U' F U R U2 R'`<br>`y L F' L' U' L U F U' L'` |
| OLL 40 | `B' R B U B' U' R' U B`<br>`l F' L' F U F U' F' M'`<br>`R r D r' U r D' r' U' R'` | `y R' F R U R' U' F' U R`<br>`y' f R' F' R U R U' R' S'`<br>`R r D r' U r D' r' U' R'` |
| OLL 41 | `L U L' U L U2 L' B L U L' U' B'`<br>`B U L2 D L' U' L D' L2 B'`<br>`M U' F' L' U' L U F M'` | `y2 R U R' U R U2 R' F R U R' U' F'`<br>`y2 F U R2 D R' U' R D' R2 F'`<br>`y' S U' R' F' U' F U R S'` |
| OLL 42 | `R' U' R U' R' U2 R F R U R' U' F'`<br>`R M B U B' U' R' U M'`<br>`B' R B R' B' R B R' B U B' U' B U B'` | `R' U' R U' R' U2 R F R U R' U' F'`<br>`y F S' R U R' U' F' U S`<br>`y R' F R F' R' F R F' R U R' U' R U R'` |
| OLL 43 | `B' U' R' U R B`<br>`f' L' U' L U f` | `y R' U' F' U F R`<br>`f' L' U' L U f` |
| OLL 44 | `f R U R' U' f'`<br>`B U L U' L' B'` | `f R U R' U' f'`<br>`y2 F U R U' R' F'` |
| OLL 45 | `F R U R' U' F'`<br>`B' R' U' R U B`<br>`b U L U' L' b'` | `F R U R' U' F'`<br>`y R' F' U' F U R`<br>`y2 f U R U' R' f'` |
| OLL 46 | `R' U' R' F R F' U R`<br>`R' F' U' F R U' R' U2 R`<br>`R B U B' U' R' U' B U B' U B U2 B'` | `R' U' R' F R F' U R`<br>`R' F' U' F R U' R' U2 R`<br>`y F R U R' U' F' U' R U R' U R U2 R'` |
| OLL 47 | `L F' L' F U2 F U' F' U F U2 F'`<br>`F' L' U' L U L' U' L U F`<br>`R' U' R' F R F' R' F R F' U R` | `y' F R' F' R U2 R U' R' U R U2 R'`<br>`F' L' U' L U L' U' L U F`<br>`R' U' R' F R F' R' F R F' U R` |
| OLL 48 | `F R U R' U' R U R' U' F'`<br>`b U L U' L' U L U' L' b'`<br>`F l F l' U' l F l' U' F'` | `F R U R' U' R U R' U' F'`<br>`y2 f U R U' R' U R U' R' f'`<br>`F l F l' U' l F l' U' F'` |
| OLL 49 | `l U' l2 U l2 U l2 U' l`<br>`R B' R2 F R2 B R2 F' R`<br>`L' B L' B' L2 U2 F' L F L'` | `y2 r U' r2 U r2 U r2 U' r`<br>`R B' R2 F R2 B R2 F' R`<br>`y2 R' F R' F' R2 U2 B' R B R'` |
| OLL 50 | `r' U r2 U' r2 U' r2 U r'`<br>`L' B L2 F' L2 B' L2 F L'`<br>`F U2 F' U' F U' F' L F U F' U' L'` | `r' U r2 U' r2 U' r2 U r'`<br>`y2 R' F R2 B' R2 F' R2 B R'`<br>`y' R U2 R' U' R U' R' F R U R' U' F'` |
| OLL 51 | `B U L U' L' U L U' L' B'`<br>`f R U R' U' R U R' U' f'`<br>`F' U' F' L F L' F U' F' U2 F` | `y2 F U R U' R' U R U' R' F'`<br>`f R U R' U' R U R' U' f'`<br>`y' R' U' R' F R F' R U' R' U2 R` |
| OLL 52 | `L' B' U' B U' L U L' U L`<br>`R U R' U R U' B U' B' R'` | `y2 R' F' U' F U' R U R' U R`<br>`R U R' U R U' B U' B' R'` |
| OLL 53 | `r' U' R U' R' U R U' R' U2 r`<br>`b' U2 B U B' U' B U B' U b` | `r' U' R U' R' U R U' R' U2 r`<br>`y r' U2 R U R' U' R U R' U r` |
| OLL 54 | `r U R' U R U' R' U R U2 r'`<br>`f U2 F' U' F U F' U' F U' f'`<br>`f U f' F U F' U' F U F' U' f U' f'` | `r U R' U R U' R' U R U2 r'`<br>`y' r U2 R' U' R U R' U' R U' r'`<br>`y' r U r' R U R' U' R U R' U' r U' r'` |
| OLL 55 | `B' R U B U' B2 R' B2 U B' U' B`<br>`B' R B U B U' B2 R' B2 U' B' U B U B'`<br>`R U2 R2 U' R U' R' U2 F R F'` | `y R' F U R U' R2 F' R2 U R' U' R`<br>`y R' F R U R U' R2 F' R2 U' R' U R U R'`<br>`R U2 R2 U' R U' R' U2 F R F'` |
| OLL 56 | `r U r' U R U' R' U R U' R' r U' r'`<br>`r U r' U R U' R' M' U R U2 r'`<br>`F R U R' U' R F' r U R' U' r'` | `r U r' U R U' R' U R U' R' r U' r'`<br>`r U r' U R U' R' M' U R U2 r'`<br>`F R U R' U' R F' r U R' U' r'` |
| OLL 57 | `R U R' U' M' U R U' r'`<br>`B U' B' M B U B' M'`<br>`B U B' M B U' B' M'` | `R U R' U' M' U R U' r'`<br>`y R U' R' S' R U R' S`<br>`y R U R' S' R U' R' S` |

## PLL 3×3

[Catálogo de SpeedCubeDB](https://www.speedcubedb.com/a/3x3/PLL)

| Caso | Algoritmo anterior | Algoritmo nuevo |
| --- | --- | --- |
| Aa | `R' F R' B2 R F' R' B2 R2`<br>`B2 R2 B' L' B R2 B' L B'` | `x R' U R' D2 R U' R' D2 R2`<br>`y' x L2 D2 L' U' L D2 L' U L'` |
| Ab | `R2 B2 R F R' B2 R F' R`<br>`B L' B R2 B' L B R2 B2`<br>`R' B' R U' R D R' U R D' R2 B R` | `x R2 D2 R U R' D2 R U' R x'`<br>`y' x L U' L D2 L' U L D2 L2`<br>`R' B' R U' R D R' U R D' R2 B R` |
| E | `B L' B' R B L B' R' B L B' R B L' B' R'`<br>`B' U' B' D' B U' B' D B U B' D' B U B' D B2`<br>`R2 U F' R' U R U' R' U R U' R' U R U' F U' R2` | `x' (L' U L D') (L' U' L D) (L' U' L D') (L' U L D)`<br>`y R' U' R' D' R U' R' D R U R' D' R U R' D R2`<br>`R2 U F' R' U R U' R' U R U' R' U R U' F U' R2` |
| F | `B' U' R' B U B' U' B' R B2 U' B' U' B U B' U B`<br>`B' R B r' B' R B2 U B' U' B' R' B2 U B' M'`<br>`R' U R U' R2 F' U' F U R F R' F' R2` | `y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R`<br>`y R' F R f' R' F R2 U R' U' R' F' R2 U R' S`<br>`R' U R U' R2 F' U' F U R F R' F' R2` |
| Ga | `R2 U R' U R' U' R U' R2 D U' R' U R D'`<br>`R2 u R' U R' U' R u' R2 F' U F`<br>`B U B' R' B U B' U' B' R B U' B' R B2 U' B' U' B U B' R'` | `R2 U R' U R' U' R U' R2 D U' R' U R D'`<br>`R2 u R' U R' U' R u' R2 F' U F`<br>`y R U R' F' R U R' U' R' F R U' R' F R2 U' R' U' R U R' F'` |
| Gb | `D R' U' R U D' R2 U R' U R U' R U' R2`<br>`R' U' R U D' R2 U R' U R U' R U' R2 D`<br>`R' U' R B2 u B' U B U' B u' B2` | `D R' U' R U D' R2 U R' U R U' R U' R2`<br>`R' U' R U D' R2 U R' U R U' R U' R2 D`<br>`y F' U' F R2 u R' U R U' R u' R2` |
| Gc | `R2 U' R U' R U R' U R2 D' U R U' R' D`<br>`L2 B2 L U2 L U2 L' B L U L' U' L' B L2`<br>`D R2 U' R U' R U R' U R2 D' U R U' R'` | `R2 U' R U' R U R' U R2 D' U R U' R' D`<br>`y2 R2 F2 R U2 R U2 R' F R U R' U' R' F R2`<br>`D R2 U' R U' R U R' U R2 D' U R U' R'` |
| Gd | `R U R' U' D R2 U' R U' R' U R' U R2 D'`<br>`D' R U R' U' D R2 U' R U' R' U R' U R2`<br>`R U R' F2 u' F U' F' U F' u F2` | `R U R' U' D R2 U' R U' R' U R' U R2 D'`<br>`D' R U R' U' D R2 U' R U' R' U R' U R2`<br>`R U R' y' R2 u' R U' R' U R' u R2` |
| H | `M2 U M2 U2 M2 U M2`<br>`M2 U' M2 U2 M2 U' M2`<br>`R2 S2 R2 U' R2 S2 R2` | `M2 U M2 U2 M2 U M2`<br>`M2 U' M2 U2 M2 U' M2`<br>`R2 S2 R2 U' R2 S2 R2` |
| Ja | `L2 D L D' L B2 l' B l B2`<br>`L' U' L F L' U' L U L F' L2 U L`<br>`B' U F' U2 B U' B' U2 B F` | `y2 x R2 F R F' R U2 r' U r U2 x'`<br>`L' U' L F L' U' L U L F' L2 U L`<br>`y R' U L' U2 R U' R' U2 R L` |
| Jb | `R U R' F' R U R' U' R' F R2 U' R'`<br>`R U2 R' U' R U2 L' U R' U' L`<br>`r' F R F' r U2 R' U R U2 R'` | `R U R' F' R U R' U' R' F R2 U' R'`<br>`R U2 R' U' R U2 L' U R' U' L`<br>`r' F R F' r U2 R' U R U2 R'` |
| Na | `R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'`<br>`F' R U R' U' R' F R2 F U' R' U' R U F' R'`<br>`R F U' R' U R U F' R2 F' R U R U' R' F` | `R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'`<br>`F' R U R' U' R' F R2 F U' R' U' R U F' R'`<br>`R F U' R' U R U F' R2 F' R U R U' R' F` |
| Nb | `R' U R U' R' F' U' F R U R' F R' F' R U' R`<br>`r' D' F r U' r' F' D r2 U r' U' r' F r F'`<br>`R' U L' U2 R U' L R' U L' U2 R U' L` | `R' U R U' R' F' U' F R U R' F R' F' R U' R`<br>`r' D' F r U' r' F' D r2 U r' U' r' F r F'`<br>`R' U L' U2 R U' L R' U L' U2 R U' L` |
| Ra | `B U' B' U' B U B D B' U' B D' B' U2 B'`<br>`B U B' R' B U2 B' U2 B' R B U B U2 B'`<br>`L U2 L' U2 L F' L' U' L U L F L2` | `y R U' R' U' R U R D R' U' R D' R' U2 R'`<br>`y R U R' F' R U2 R' U2 R' F R U R U2 R'`<br>`L U2 L' U2 L F' L' U' L U L F L2` |
| Rb | `R' U2 R U2 R' F R U R' U' R' F' R2`<br>`B2 R B U B U' B' R' B U2 B' U2 B`<br>`R' U2 R' D' R U' R' D R U R U' R' U' R` | `R' U2 R U2 R' F R U R' U' R' F' R2`<br>`y R2 F R U R U' R' F' R U2 R' U2 R`<br>`R' U2 R' D' R U' R' D R U R U' R' U' R` |
| T | `R U R' U' R' F R2 U' R' U' R U R' F'`<br>`R U R' U' R' F R2 U' R' U F' L' U L`<br>`R2 u R2 u' R2 F2 u' F2 u F2` | `R U R' U' R' F R2 U' R' U' R U R' F'`<br>`R U R' U' R' F R2 U' R' U F' L' U L`<br>`R2 u R2 u' R2 F2 u' F2 u F2` |
| Ua | `M2 U M' U2 M U M2`<br>`R U R' U R' U' R2 U' R' U R' U R`<br>`B2 U' M U2 M' U' B2` | `y2 M2 U M U2 M' U M2`<br>`R U R' U R' U' R2 U' R' U R' U R`<br>`y R2 U' S' U2 S U' R2` |
| Ub | `M2 U' M' U2 M U' M2`<br>`R' U R' U' R' U' R' U R U R2`<br>`R2 U R U R' U' R' U' R' U R'` | `y2 M2 U' M U2 M' U' M2`<br>`R' U R' U' R' U' R' U R U R2`<br>`R2' U R U R' U' R3 U' R' U R'` |
| V | `R' U R' U' R D' R' D R' U D' R2 U' R2 D R2`<br>`R' U R U' R' f' U' R U2 R' U' R U' R' f R`<br>`R' U R' U' B' R' B2 U' B' U B' R B R` | `R' U R' U' R D' R' D R' U D' R2 U' R2 D R2`<br>`R' U R U' R' f' U' R U2 R' U' R U' R' f R`<br>`R' U R' U' y R' F' R2 U' R' U R' F R F` |
| Y | `F R U' R' U' R U R' F' R U R' U' R' F R F'`<br>`F R' F R2 U' R' U' R U R' F' R U R' U' F'`<br>`R2 U' R2 U' R2 U F U F' R2 F U' F'` | `F R U' R' U' R U R' F' R U R' U' R' F R F'`<br>`F R' F R2 U' R' U' R U R' F' R U R' U' F'`<br>`R2 U' R2 U' R2 U F U F' R2 F U' F'` |
| Z | `M' U' M2 U' M2 U' M' U2 M2`<br>`M2 U M2 U M' U2 M2 U2 M'`<br>`S2 U' S2 U' S' U2 S2 U2 S'` | `M' U' M2 U' M2 U' M' U2 M2`<br>`M2 U M2 U M' U2 M2 U2 M'`<br>`y M2 U' M2 U' M' U2 M2 U2 M'` |

## CLL 2×2

[Catálogo de SpeedCubeDB](https://www.speedcubedb.com/a/2x2/CLL)

| Caso | Algoritmo anterior | Algoritmo nuevo |
| --- | --- | --- |
| CLL AS 1 | `B U2 B' U' B U' B'`<br>`R' U' R U' R' U2 R`<br>`U2 L' U' L U' L' U2 L` | `y R U2 R' U' R U' R'`<br>`R' U' R U' R' U2 R`<br>`U2 L' U' L U' L' U2 L` |
| CLL AS 2 | `R U2 R' F R' F' R U' R U' R'`<br>`L' U L U' L2 B L B' L U L' U' L`<br>`L' U' L U' L F' L' F L' U2 L` | `R U2 R' F R' F' R U' R U' R'`<br>`y2 R' U R U' R2 F R F' R U R' U' R`<br>`L' U' L U' L F' L' F L' U2 L` |
| CLL AS 3 | `B' R B R' U2 R' U2 R`<br>`B' L U L' U2 L' B2 L`<br>`B' R B R' B U2 B' U' B' R B R'` | `y2 F' L F L' U2 L' U2 L`<br>`y2 F' R U R' U2 R' F2 R`<br>`y R' F R F' R U2 R' U' R' F R F'` |
| CLL AS 4 | `L' B L B' L U L'`<br>`U2 L' U R U' L U R'`<br>`R' U R B' L U L'` | `y2 R' F R F' R U R'`<br>`U2 L' U R U' L U R'`<br>`y2 L' U L F' R U R'` |
| CLL AS 5 | `L U2 L' U2 L' B L B'`<br>`R B2 R' U2 R' U R B'`<br>`L U2 L' U' B' U' B L U' L'` | `y2 R U2 R' U2 R' F R F'`<br>`x' R U2 R' F2 R' F R U'`<br>`y' z F R2 F' R' U' R' U z' y' R U' R'` |
| CLL AS 6 | `F U2 F' U' F U' F' L F' L' F U F U' F' U'`<br>`R2 F' U' R2 F' R2 U F R2`<br>`R2 F R U2 R U' R' U2 F' R` | `y' R U2 R' U' R U' R' F R' F' R U R U' R' U'`<br>`R2 F' U' R2 F' R2 U F R2`<br>`R2 F R U2 R U' R' U2 F' R` |
| CLL H 1 | `F R2 U' R2 U' R2 U R2 F'`<br>`F R U' R' U R U2 R' U' R U R' U' F'`<br>`F' U2 F R' U R' U' R U' R` | `F R2 U' R2 U' R2 U R2 F'`<br>`F R U' R' U R U2 R' U' R U R' U' F'`<br>`y' R' U2 R y R' U R' U' R U' R` |
| CLL H 2 | `R U R' U R U R' F R' F' R`<br>`L' B' L U' L' B' L B' L U L'`<br>`R U R' U R U L' U R' U' L` | `R U R' U R U R' F R' F' R`<br>`y2 R' F' R U' R' F' R F' R U R'`<br>`R U R' U R U L' U R' U' L` |
| CLL H 3 | `R B U B' U' B U B' U' B U B' U' R'`<br>`L2 B L2 B2 U2 B L2`<br>`R U' R' F R' F' R2 U' R' F R' F' R` | `y F R U R' U' R U R' U' R U R' U' F'`<br>`y x' U2 R U2 R2 F2 R U2 x`<br>`R U' R' F R' F' R2 U' R' F R' F' R` |
| CLL H 4 | `B2 U2 B' U2 B2`<br>`B2 U2 B U2 B2`<br>`R U R' U R U' R' U R U2 R'` | `y R2 U2 R' U2 R2`<br>`y R2 U2 R U2 R2`<br>`R U R' U R U' R' U R U2 R'` |
| CLL L 1 | `B U2 B' R' B U2 B' U B' R2 B`<br>`B' U' B U2 B' R B' R' B U' B`<br>`R' F' R U R' U' R' F R2 U' R' U2 R` | `y R U2 R' F' R U2 R' U R' F2 R`<br>`y R' U' R U2 R' F R' F' R U' R`<br>`R' F' R U R' U' R' F R2 U' R' U2 R` |
| CLL L 2 | `L U2 L2 B2 L U L' B2 L B'`<br>`R U' R' U R U' R' F R' F' R2 U R'`<br>`R' U2 R' U' F R2 F' U R2` | `y2 R U2 R2 F2 R U R' F2 R F'`<br>`R U' R' U R U' R' F R' F' R2 U R'`<br>`R' U2 R' U' F R2 F' U R2` |
| CLL L 3 | `L' U L' U2 L U' L' U L U' L2`<br>`L2 U' L U2 L' U2 L U' L2`<br>`F U F' U F U' F' U F U' F' U F U2 F'` | `y2 R' U R' U2 R U' R' U R U' R2`<br>`y2 R2 U' R U2 R' U2 R U' R2`<br>`y' R U R' U R U' R' U R U' R' U R U2 R'` |
| CLL L 4 | `B U2 B2 R B R' B U2 B'`<br>`R U2 R' F R' F' R2 U2 R'`<br>`L U L' R' U2 L U L' U2 R` | `y R U2 R2 F R F' R U2 R'`<br>`R U2 R' F R' F' R2 U2 R'`<br>`y2 R U R' L' U2 R U R' U2 L` |
| CLL L 5 | `R B' R' B U B U' B'`<br>`R B' R' U' B' U B`<br>`R' U B U' B' R2 B U' B'` | `y F R' F' R U R U' R'`<br>`y F R' F' U' R' U R`<br>`y F' U R U' R' F2 R U' R'` |
| CLL L 6 | `B' L U L' U' L' B L`<br>`R B U' B' U' B U B' R'`<br>`R U R U' R' F R' F'` | `y2 F' R U R' U' R' F R`<br>`y F R U' R' U' R U R' F'`<br>`R U R U' R' F R' F'` |
| CLL Pi 1 | `R B' R' B U2 B U' B' U B U2 B'`<br>`R' F2 R F' U2 R U' R' U' F`<br>`U F U R U' R' U R U' R2 F' R U R U' R'` | `y F R' F' R U2 R U' R' U R U2 R'`<br>`R' F2 R F' U2 R U' R' U' F`<br>`U F U R U' R' U R U' R2 F' R U R U' R'` |
| CLL Pi 2 | `R U2 R' U' R U R' U2 R' F R F'`<br>`R' B U B' U2 B' R B U' B' R2 B`<br>`R U R' U' R' F R2 U R' U' R U R' U' F'` | `R U2 R' U' R U R' U2 R' F R F'`<br>`y F' R U R' U2 R' F R U' R' F2 R`<br>`R U R' U' R' F R2 U R' U' R U R' U' F'` |
| CLL Pi 3 | `R B2 U' B2 U B2 U B2 R'`<br>`F U' F U' F' U F' L F2 L'`<br>`B L' B' L U2 B L' B' L2 U2 L'` | `y F R2 U' R2 U R2 U R2 F'`<br>`y' R U' R U' R' U R' F R2 F'`<br>`y2 F R' F' R U2 F R' F' R2 U2 R'` |
| CLL Pi 4 | `L' B L B' L U' L' U' L U' L'`<br>`R U' R' F R' F R U R' F R`<br>`R U' R' F L' U L U L' U L` | `y2 R' F R F' R U' R' U' R U' R'`<br>`R U' R' F R' F R U R' F R`<br>`R U' R' F L' U L U L' U L` |
| CLL Pi 5 | `F' U' F' L F L' F U' F' U2 F`<br>`R2 U R' U' F R F' R U' R2`<br>`U' R' U' R' F R F' R U' R' U2 R` | `y' R' U' R' F R F' R U' R' U2 R`<br>`R2 U R' U' F R F' R U' R2`<br>`U' R' U' R' F R F' R U' R' U2 R` |
| CLL Pi 6 | `F R U R' U' R U R' U' F'`<br>`R U' R2 U R2 U R2 U' R`<br>`R' U R2 U' R2 U' R2 U R'` | `F R U R' U' R U R' U' F'`<br>`R U' R2 U R2 U R2 U' R`<br>`R' U R2 U' R2 U' R2 U R'` |
| CLL Sune 1 | `L' U2 L U2 L F' L' F`<br>`R' F2 R U2 R U' R' F`<br>`R' F2 R U2 L F' L' F` | `L' U2 L U2 L F' L' F`<br>`R' F2 R U2 R U' R' F`<br>`R' F2 R U2 L F' L' F` |
| CLL Sune 2 | `R U R' U' R' F R F' R U R' U R U2 R'`<br>`R U2 R' F R U2 R' U R U' R' F`<br>`L U' L U' L' U L' U' F U' F'` | `R U R' U' R' F R F' R U R' U R U2 R'`<br>`R U2 R' F R U2 R' U R U' R' F`<br>`y2 R U' R U' R' U R' U' y R U' R'` |
| CLL Sune 3 | `R U' R' F R' F' R`<br>`R U' R' F L' U' L`<br>`L F' L' F L' U' L` | `R U' R' F R' F' R`<br>`R U' R' F L' U' L`<br>`L F' L' F L' U' L` |
| CLL Sune 4 | `F R' F' R U2 R U2 R'`<br>`F L' U' L U2 L F2 L'`<br>`B U' B' R B' R2 B U B U' B' R` | `F R' F' R U2 R U2 R'`<br>`y2 x' U R' F' R F2 R U2 R'`<br>`y R U' R' F R' F2 R U R U' R' F` |
| CLL Sune 5 | `L U L' U L' B L B' L U2 L'`<br>`U2 R U R' U R' F R F' R U2 R'`<br>`R U R' U' R' F R F' R U' R' F R' F' R` | `y2 R U R' U R' F R F' R U2 R'`<br>`U2 R U R' U R' F R F' R U2 R'`<br>`R U R' U' R' F R F' R U' R' F R' F' R` |
| CLL Sune 6 | `R U R' U R U2 R'`<br>`R U R2 U' R2 U R`<br>`F' U2 F U F' U F` | `R U R' U R U2 R'`<br>`R U R2 U' R2 U R`<br>`y' R' U2 R U R' U R` |
| CLL T 1 | `F U F' U' F' L F L'`<br>`L' U' L U B L B'`<br>`U' L F R' F' L' F R F'` | `y' R U R' U' R' F R F'`<br>`y2 R' U' R U F R F'`<br>`U' x L U R' U' L' U R U' x'` |
| CLL T 2 | `F' U' F U F R' F' R`<br>`B' R' B U B U' B' R`<br>`R U R' U' F' U' F` | `y L' U' L U L F' L' F`<br>`y R' F' R U R U' R' F`<br>`R U R' U' y L' U' L` |
| CLL T 3 | `F U' R U2 R' U' F2 R U R'`<br>`B U2 B2 R B R' B U' B' U B U2 B'`<br>`L U B L' B' L U2 L U2 L2` | `F U' R U2 R' U' F2 R U R'`<br>`y R U2 R2 F R F' R U' R' U R U2 R'`<br>`y2 R U F R' F' R U2 R U2 R2` |
| CLL T 4 | `R' U R U2 R2 F' R U' R' F2 R2`<br>`B' U B' R U' B U R2 B2`<br>`L' U L' U2 L U2 L' U L2 U' L'` | `R' U R U2 R2 F' R U' R' F2 R2`<br>`y R' U R' F U' R U F2 R2`<br>`y2 R' U R' U2 R U2 R' U R2 U' R'` |
| CLL T 5 | `B L U L' U' L U' L' U' L U L' B'`<br>`F U F' U' F U' F' L' U' L F U F'`<br>`B U B' U2 B U B' U B' R B R'` | `y2 F R U R' U' R U' R' U' R U R' F'`<br>`y' R U R' U' R U' R' F' U' F R U R'`<br>`y R U R' U2 R U R' U R' F R F'` |
| CLL T 6 | `R' U R U2 R2 F R F' R`<br>`U' F U' F' U' R U2 F' U' F' U F U' R'`<br>`L U' L' U2 R2 B' R' U R'` | `R' U R U2 R2 F R F' R`<br>`U2 y z R U R' U' R' F R2 U' R' U' R U R' F'`<br>`y2 R U' R' U2 L2 F' L' U L'` |
| CLL U 1 | `L F U F' U' L'`<br>`R U B U' B' R'`<br>`R' F' U' F U R` | `y' F R U R' U' F'`<br>`y F U R U' R' F'`<br>`R' F' U' F U R` |
| CLL U 2 | `R' U' R2 U R' U2 R U2 R' U R'`<br>`F2 L2 F U F' L F2 U2 F' U' F`<br>`R' F U' R U' R' U2 F2 R` | `R' U' R2 U R' U2 R U2 R' U R'`<br>`y' R2 F2 R U R' F R2 U2 R' U' R`<br>`R' F U' R U' R' U2 F2 R` |
| CLL U 3 | `B L U L' U2 B' L U' L' B`<br>`R' F R U' R' U' R U R' F' R U R' U' R' F R F' R`<br>`F U2 F U' F' L F' L2 U' L` | `y2 F R U R' U2 F' R U' R' F`<br>`R' F R U' R' U' R U R' F' R U R' U' R' F R F' R`<br>`y' R U2 R U' R' F R' F2 U' F` |
| CLL U 4 | `L F' L' F U' F U' F' U2 F U' F'`<br>`F R U' R' U R U R' U R U' R' F'`<br>`R' B U B' U' B' R B2 U B' U B U2 B'` | `y' F R' F' R U' R U' R' U2 R U' R'`<br>`F R U' R' U R U R' U R U' R' F'`<br>`y F' R U R' U' R' F R2 U R' U R U2 R'` |
| CLL U 5 | `R U' R2 F R F' R U R' U' R U R'`<br>`L U2 L' U L' B2 L B' L' B2 L`<br>`R2 D' R U2 R' D R U2 R` | `R U' R2 F R F' R U R' U' R U R'`<br>`y2 R U2 R' U R' F2 R F' R' F2 R`<br>`R2 D' R U2 R' D R U2 R` |
| CLL U 6 | `R' U R' F R F' R U2 R' U R`<br>`L' U L2 F' L' F L' U' L U L' U' L`<br>`R' F R2 U' R' F R' F' R U R' F' R` | `R' U R' F R F' R U2 R' U R`<br>`L' U L2 F' L' F L' U' L U L' U' L`<br>`R' F R2 U' R' F R' F' R U R' F' R` |
| CLL O Adj | `R U R' U' R' F R2 U' R' U' R U R' F'` | `R U R' U' R' F R2 U' R' U' R U R' F'` |
| CLL O Diag | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | `F R U' R' U' R U R' F' R U R' U' R' F R F'` |

## EG-1 y EG-2 · 2×2

| Caso | Algoritmo anterior | Algoritmo nuevo |
| --- | --- | --- |
| EG1 AS 2 | `R U' F2 R U2 R U' F` | `R U' F2 R U2 R U' F` |
| EG1 AS 3 | `F' R U R' U' R U R2 F' R` | `F' R U R' U' R U R2 F' R` |
| EG2 AS 1 | `F' R2 D R2 D' F R' F2 R' F` | `x U' R2 F R2 F' U R' U2 R' U x'` |
| EG2 AS 2 | `R' U' R U' R' U2 R' F2 R2` | `R' U' R U' R' U2 R' F2 R2` |
