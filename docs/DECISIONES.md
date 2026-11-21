# Decisiones de CubeLab

## Mecánica y modalidad
El módulo describe cómo se mueven las piezas. EventRules define la modalidad, la inspección, la distancia mínima y la orientación. Solve guarda eventId con índice compuesto por fecha para consultar marcas personales entre sesiones.

## Versión y licencia
Fijamos exactamente `cubing@0.63.8`, una versión publicada. Elegimos MPL-2.0 entre las licencias alternativas del código original. Permite distribución gratuita o comercial. Al distribuir la app, conservaremos avisos de licencia y copyright, indicaremos cómo obtener el fuente exacto de la biblioteca y ofreceremos bajo MPL las modificaciones a sus archivos cubiertos. Se revisarán y conservarán los avisos de las dependencias y recursos de terceros incluidos. [Versión seleccionada](https://github.com/cubing/cubing.js/releases/tag/v0.63.8) · [Licencias](https://github.com/cubing/cubing.js#license) · [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/)

## Generación de mezclas
El worker parte de estados aleatorios de cubing.js. Un solucionador acotado para el tamaño del cubo enumera desde las 24 orientaciones resueltas todos los estados alcanzables en menos movimientos que el mínimo en métrica de giros de cara. La reversibilidad de los movimientos permite consultar esa tabla para rechazar exactamente los estados demasiado cercanos. Para 3×3 las orientaciones de los centros sobre su eje son irrelevantes. La muestra ciega añade una rotación uniforme independiente. La interfaz distingue los criterios de generación del uso de TNoodle en competiciones oficiales. [WCA 4b3](https://www.worldcubeassociation.org/regulations/#4b3)

## Navegador de aceptación en Windows
Playwright utiliza el canal `msedge` para abrir la instalación estable de Edge del equipo. El build de producción se sirve con Vite Preview. La prueba espera el control del service worker, corta la red y vuelve a abrir la aplicación. Otros sistemas usan Chromium de Playwright por defecto. Se puede elegir ese navegador en cualquier equipo con `CUBELAB_E2E_BROWSER=chromium` e instalarlo allí con `npx playwright install chromium` (en CI Linux, `--with-deps`).

## Revisión antes de fase 1 · 20 de noviembre de 2026

Conservamos `cubing@0.63.8` en el manifiesto y el lockfile. Contrastamos las declaraciones TypeScript de los paquetes npm 0.63.8 y 0.66.1. Ambos ofrecen `randomScrambleForEvent(string): Promise<Alg>`, `KPuzzle.defaultPattern(): KPattern` y `KPattern.applyAlg(Alg | string): KPattern`. Ambos exportan la clase `TwistyPlayer`. El generador usa la primera API, el oráculo de pruebas usa las dos siguientes y el reproductor está previsto para la academia. La vista previa actual es de CubeLab. [Paquete 0.63.8](https://www.npmjs.com/package/cubing/v/0.63.8) · [Paquete 0.66.1](https://www.npmjs.com/package/cubing/v/0.66.1)

En 0.64 cambió el orden del estado resuelto emitido por puzzle-geometry. En 0.65 se retiraron reexportaciones antiguas de tipos y se añadió una opción de depuración de workers de Node. En 0.66 se retiró el campo obsoleto `type` de Alg y Move. El parche 0.66.1 retira los mapas de fuentes y reorganiza código interno. CubeLab usa las importaciones públicas y las operaciones anteriores. Para la fase 1, las notas no identifican una corrección de mezclas 2×2/3×3 que justifique cambiar la base ya probada. Revisaremos la actualización al integrar TwistyPlayer, cuando podamos probar reproducción y carga offline en el teléfono. [Historial oficial](https://github.com/cubing/cubing.js/releases) · [Notas de 0.66.1](https://github.com/cubing/cubing.js/releases/tag/v0.66.1)
