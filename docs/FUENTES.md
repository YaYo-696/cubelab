# Fuentes de la academia de CubeLab

## Notación y reproducción

- [WCA, artículo 12](https://www.worldcubeassociation.org/regulations/#article-12-notation) para giros de cara, giros anchos y rotaciones. [Move Notation de J Perm](https://jperm.net/3x3/moves) para los alias de giros anchos y capas internas del glosario.
- [cubing.js 0.63.8](https://github.com/cubing/cubing.js/tree/v0.63.8) para KPuzzle, Alg y TwistyPlayer. La academia pone el blanco abajo con una rotación inicial del marco visual. Las secuencias de práctica empiezan desde el mismo marco en el cubo físico.

## Métodos y secuencias

- [J Perm, método principiante 3×3](https://jperm.net/3x3) y [Advanced F2L](https://jperm.net/3x3/cfop/f2l) para la progresión por capas y el trabajo alrededor de los huecos. CubeLab redactó sus propias explicaciones, preparaciones y preguntas.
- [SpeedcubeQuest, 2-Look OLL y PLL](https://speedcube.quest/guides/2-look-oll-pll) para las formas de aristas y esquinas, T, Ua, Ub y H. CubeLab usa Y para cubrir el reconocimiento diagonal y emplea la secuencia de Z recopilada en [CubeMasters, Algorithm Library](https://cubemasters.online/algorithms).
- [HCubist, lámina de Ortega](https://hcubist.com/downloads/HCubist-2x2-Ortega-Sheet.pdf) para los siete casos OLL y los cinco tipos PBL. En 2×2 se sustituyen los giros anchos de las secuencias T y L de 3×3 por sus formas de giros de cara. El PBL de una capa usa T y Y. [Ortega de Kevin Gittemeier](https://www.kevingittemeier.com/2x2-cube-ortega-tutorial/) documenta la variante de una barra que usa CubeLab. La hoja de HCubist documenta los casos de dos diagonales y dos adyacencias.
- Las alternativas 2×2 de Sune, H, Pi, U y PBL adyacente con la otra capa resuelta provienen de la [lámina Ortega de HCubist](https://hcubist.com/downloads/HCubist-2x2-Ortega-Sheet.pdf), páginas 2 y 3. Las alternativas 3×3 de Anti-Sune y Z provienen de [SpeedcubeQuest](https://speedcube.quest/guides/2-look-oll-pll). Cada alternativa conserva su propia preparación cuando cambia el ángulo. Los fingertricks son sugerencias de CubeLab.

## Verificación

Las figuras de reconocimiento motivan patrones de orientación y permutación declarados como vectores de piezas en KPuzzle. Para OLL se comprueba orientación, separación por capas y conservación de las piezas protegidas. Para PLL y PBL se comprueba también la clase de permutación. La prueba construye un estado de caso con esos vectores y comprueba que el algoritmo cumple el objetivo de la etapa. Por separado se cotejan el estado inducido por el inverso y el setup reproducible del ejercicio. Las clases y los ajustes de U solo identifican como equivalentes las variaciones que corresponden al caso. En los ejercicios iniciales se compara con una preparación escrita explícitamente.

## Fase 3B · Catálogos completos

- [OLL 3×3](https://www.speedcubedb.com/a/3x3/OLL) y [PLL 3×3](https://www.speedcubedb.com/a/3x3/PLL) de SpeedCubeDB para numeración, diagramas, familias y secuencias de speedsolving. Las variantes parten del orden publicado en cada caso. PLL separa Aa, Ab y E como permutaciones de solo esquinas.
- [CLL 2×2](https://www.speedcubedb.com/a/2x2/CLL) aporta 40 casos de esquinas torcidas. Los dos casos ya orientados son adyacente y diagonal con D ordenada. Se enseñan con T y Y, respectivamente. [Lámina de Ortega, HCubist](https://hcubist.com/downloads/HCubist-2x2-Ortega-Sheet.pdf) · [Referencia T y Y](https://cubemasters.online/algorithms)
- [EG-1](https://www.speedcubedb.com/a/2x2/EG1) y [EG-2](https://www.speedcubedb.com/a/2x2/EG2) aportan dos ejemplos cada uno. Los cuatro usan la familia Anti-Sune arriba para comparar el efecto de las dos permutaciones inferiores. Se incluyó por caso la primera variante del catálogo que pasó la comprobación del patrón y el objetivo.
- Los diagramas de SpeedCubeDB proporcionan la cuadrícula superior y las franjas laterales. Los vectores se obtuvieron comparando sus adhesivos con estados legales de KPuzzle enumerados independientemente de los algoritmos. Para OLL se conserva solo la orientación. Para PLL y CLL se conserva el orden de las piezas. En los ejemplos EG también se conserva la permutación inferior.
- Las secuencias se expandieron a giros y las rotaciones de agarre se expresaron en el marco inicial. Se descartaron variantes equivalentes por añadir ajustes U a la misma secuencia. Cada variante conserva un setup reproducible y pasa las dos verificaciones. Las miniaturas de CubeLab se generan desde el estado de KPuzzle.
- [Advanced F2L y anticipación, J Perm](https://jperm.net/3x3/cfop/f2l), [Speedsolving Wiki, Roux](https://www.speedsolving.com/wiki/index.php/Roux_method) y [ZZ Method Tutorial](https://cube.rider.biz/zz.php) para las lecciones conceptuales. Los planes de práctica describen objetivos, ejercicios y enlaces propios de CubeLab.
