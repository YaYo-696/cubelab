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

## Fase 1 · Cronometraje y recuperación

El reloj monótono mide la preparación, inspección y resolución. Date.now ordena los registros persistidos. El temporizador congela el resultado al detener y reutiliza el UUID en los reintentos. La transacción Dexie comprueba la sesión y escribe una vez. Hasta la confirmación se mantiene una copia pendiente en memoria y, cuando el navegador lo permite, en localStorage para recuperarla al volver al timer. Borrar marca deletedAt y deshacer retira la marca.

La cola mantiene una mezcla visible y una de reserva por modalidad activa. Las mezclas propias pasan por el validador del módulo y se identifican como manuales. Las pruebas del repositorio usan fake-indexeddb solo en desarrollo y las pruebas de recarga usan IndexedDB real en Edge. El ao5 provisional se calcula con los cinco tiempos visibles de la sesión.

Cuando la sesión de un intento pendiente ha desaparecido, la recuperación lo guarda en la sesión principal de su evento. La creación o reactivación de esa sesión y la inserción del intento comparten una transacción. El UUID se conserva y la copia pendiente se limpia después de la confirmación.

## Fase 2 · Estadísticas, sesiones y respaldo

- Precisión WCA según 9f1 y 9f2. Se suma la penalización al tiempo bruto y se trunca el single a centésimas por debajo de diez minutos y a segundos desde diez minutos. Las medias usan los singles normalizados y se redondean a la unidad más cercana. La división exacta a media unidad redondea hacia arriba. Ao5 elimina los dos extremos y falla con dos DNF según 9f8 y 9f9. Mo3 incluye los tres intentos y falla con un DNF según 9f10 y 9f11. En 333bf el resultado principal es el mejor single por 9b3a y 9f6. 9b3b reconoce ao5 por separado. Mo3 se muestra como estadística de práctica. [Reglamento WCA, artículo 9](https://www.worldcubeassociation.org/regulations/#article-9-events)
- Los aoN desde 12 recortan ceil(N × 0,05) en cada extremo, como csTimer con el ajuste de porcentaje predeterminado. Los DNF ocupan el extremo peor. La media global excluye DNF y se presenta solo como valor actual. Cada ventana de PB se forma dentro de una sesión. El historial reúne los récords cronológicos de todas las sesiones mediante [eventId+createdAt]. [Cálculo de recorte de csTimer](https://github.com/cs0x7f/cstimer/blob/master/src/js/stats/timestat.js#L11-L28)
- Los árboles Fenwick mantienen conteos y sumas por valor para cada ventana en O(log U), con U tiempos distintos. El worker calcula la sesión y el historial de PB fuera del hilo de interfaz. La pantalla conserva hasta tres resultados por conjunto observado y descarta la caché al cambiar los datos. La prueba de 10.000 intentos fija 1.000 ms para calcular todas las métricas de sesión y el historial de PB del evento, excluyendo IndexedDB y renderizado.
- Las gráficas usan SVG nativo y aprovechan el formateador ya existente. El módulo aislado de gráficos, con React externo, pesó 2.714 bytes minificados y 1.234 bytes gzip en esbuild. La vista limita la tendencia a unas 500 marcas por serie y pagina el historial en grupos de 25.
- Fusionar mueve intentos y archiva el origen. El respaldo JSON v1 incluye las seis tablas Dexie y conserva borrados recuperables. Importar agrega datos, acepta registros idénticos y rechaza colisiones con contenido distinto. Los ajustes de texto del respaldo se aplican en la misma transacción. CSV usa fecha ISO, tiempo bruto en ms y penalización separada. La comparación con csTimer se hace mediante entrada manual.

## Fase 3A · Academia

- Cada puzzle tiene un curso con identificador estable y revisión. Los prerrequisitos se verifican tanto al mostrar la lección como dentro de la transacción que escribe LessonProgress. Completar exige acertar todas las preguntas. El mejor puntaje y la primera fecha de finalización se conservan al repetir.
- Course y AlgSet se cargan mediante las funciones del módulo de puzzle. PracticeProvider devuelve una preparación por caso y permite conectar el solucionador por etapas sin reescribir las lecciones. TwistyPlayer se importa de forma diferida. Los controles de paso usan el indexador de la versión fijada de cubing.js.
- La media de la sesión tiene únicamente valor actual. El historial de PB incluye los single, mo3 y aoN con ventanas definidas.

## Fase 3A.1 · Visualización y evaluación

- El modelo de tiempo de TwistyPlayer 3D actualiza la misma marca temporal en la comparación 2D. Las caras ocultas son adhesivos guía flotantes del mismo reproductor. Las figuras de los minitests dentro de una lección usan 2D. La evaluación muestra una pregunta visual 3D a la vez. El timer carga el visor 3D bajo demanda.
- Las lecciones toman sus preguntas del banco etiquetado por habilidad, nivel y puzzle. Cada evaluación toma doce preguntas con orden mezclado y cobertura de habilidades. Las recomendaciones aceptan evidencias de respuesta o de práctica cronometrada, con un objetivo de tiempo aportado por el entrenador.
- Dexie v2 añade el historial de evaluaciones. Los respaldos v2 lo contienen y el importador admite v1. Los identificadores de curso, lección y revisión conservan el avance anterior. Las lecciones que usan notación avanzada exigen completar esa lección para abrirse.
