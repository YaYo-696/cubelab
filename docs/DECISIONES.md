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

## Fase 3B · Catálogos y reconocimiento

Los manifiestos de los grupos solo contienen nombres e identificadores. Cada set carga su JSON por separado mediante importación dinámica. El panel calcula las miniaturas cuando se abre un grupo o se muestra una pregunta. Las proyecciones se reutilizan en una caché acotada de 256 imágenes. Cada grupo reutiliza una sola instancia visible del reproductor principal; los minitests de catálogo usan miniaturas SVG.

La identidad del caso se compara en las cuatro orientaciones U. PLL y CLL también admiten cambios cíclicos de los colores laterales. OLL compara la orientación conjunta de aristas y esquinas. CLL exige que la capa inferior esté ordenada y EG compara, además, sus franjas. Se conservan los identificadores y la revisión del curso v1 para que el progreso anterior siga siendo válido.

## Fase 3B.1 · Notación de ejecución

El contenido conserva el agarre y los ajustes de apertura de las secuencias publicadas. El modelo usa la orientación final del algoritmo para preparar y verificar el caso. Las miniaturas y los ejercicios toman el mismo estado inicial por variante. Los sets pasan a revisión 2 con los mismos identificadores y patrones de la fase 3B. Los grupos avanzados requieren Notación avanzada en su propio curso.

## Fase 4 · Desarrollo y solucionador

- La configuración de desarrollo vive en `src/config/devFlags.ts`. UNLOCK_ALL omite los bloqueos de avance y permite registrar el progreso. Una prueba de navegador puede forzar las puertas reales en su sesión. La comprobación de lanzamiento inspecciona las constantes del mismo archivo y el diagnóstico informa un aviso mientras haya alguna encendida.
- El óptimo de 2×2 fija una esquina por rotación de todo el cubo y usa U, R y F. El grafo tiene 7! × 3⁶ = 3.674.160 estados. Cada giro tiene coste uno en HTM y la BFS calcula todas las distancias exactas. IndexedDB almacena una tabla versionada de un byte por distancia. El solver UFLR de cubing.js 0.63.8 no expone un caché persistente de la tabla para esta métrica con orientación libre. En 3×3 se usa directamente el buscador de dos fases que trae la versión fijada. [Código de búsqueda de cubing.js 0.63.8](https://github.com/cubing/cubing.js/tree/v0.63.8/src/cubing/search)
- La cruz usa IDA* con una tabla exacta de cuatro aristas. La opción neutra compara los seis colores y conserva el marco elegido para la reproducción. En F2L se comparan las cuatro ranuras pendientes. Un IDA* acotado con U, R, L, F y B busca mejorar cada inserción que conserva las ranuras cerradas. Si se agota su presupuesto, se usa la ruta de inserciones verificadas que sirvió como cota superior. El método principiante inserta primero las esquinas y usa la inserción de la lección para la segunda capa.
- La última capa separa el ajuste anterior, el algoritmo principal literal del catálogo y el ajuste posterior. En 3×3 se presenta OBTM. Los giros de bloque cuentan uno y un giro de capa media se expresa como dos movimientos de bloque. Las rotaciones valen cero. La prueba de contenido también exige los sufijos de giro del artículo 12 y conserva las familias de notación enseñadas por la academia. [Reglamento WCA, 12a](https://www.worldcubeassociation.org/regulations/#12a)
- El worker reproduce y verifica cada etapa y la solución completa antes de devolverla. AbortSignal termina el worker activo y descarta cualquier respuesta parcial. Los ejercicios de la academia buscan una mezcla real cuya solución por método pasa por la etapa de la lección. CLL y EG usan recetas internas para seleccionar ejercicios. El visor de catálogos conserva sus posiciones de referencia.

## Fase 5 · Entrenador

- El módulo del puzzle anuncia sus catálogos, grupos y objetivos de tiempo. La disponibilidad usa los prerrequisitos de la lección de referencia y el interruptor UNLOCK_ALL. El worker toma la posición canónica del catálogo y elige de forma uniforme uno de los cuatro AUF. Invierte la solución corta de la fase 4 y coteja con KPuzzle tanto el estado exacto como el patrón y las capas protegidas. En PBL la cara inferior conserva su orientación y puede quedar permutada, como exige el caso. Se muestran sus cuatro franjas.
- El repaso automático elige entre los casos vencidos de la selección. Si ninguno está vencido, ofrece el de fecha más próxima. Un fallo vuelve en un minuto, el uso de ayuda en tres y un intento lento en diez. Estos tres resultados reinician la racha. Un éxito cronometrado sin ayuda y dentro del objetivo da un intervalo de uno, dos, cuatro días y así sucesivamente hasta treinta. Tres éxitos consecutivos marcan el caso como aprendido. Un reconocimiento correcto conserva el intervalo y un error de reconocimiento se trata como fallo. Es posible fijar el estado a mano. Los objetivos iniciales son de 4 a 6 segundos según el set.
- El promedio y el mejor tiempo usan los intentos cronometrados resueltos. La tasa de ayuda divide los intentos asistidos por todos los intentos cronometrados. Evaluación recibe el caso más lento de cada set si su promedio supera el objetivo y permite abrirlo directamente. El puntaje y la racha de reconocimiento se muestran para la práctica actual.
- Dexie y el respaldo v3 guardan juntos los agregados y los intentos por UUID. Una transacción registra el intento y actualiza el agregado. La importación comprueba la referencia al caso y admite respaldos v1 y v2, desde los que se conservan los agregados existentes.

### Aislamiento del worker de mezclas

Los workers de mezclas y de casos tienen puntos de entrada y clientes independientes. Vite puede ubicar dependencias compartidas de cubing.js en un punto de entrada de CubeLab. Si un worker interno de cubing.js termina importándolo, el manejador solo procesa el discriminador propio. Los mensajes de Comlink conservan su canal y su formato. El Timer y el Entrenador exponen el mensaje del fallo y permiten reintentar. El cliente termina trabajos sin respuesta a los diez segundos. La prueba de arranque carga los módulos de producción y espera la primera respuesta de cada worker.

## Fase 6 · Cierre del MVP

- La primera apertura ofrece tres pantallas y recuerda su finalización. La ruta de aprendizaje comienza por Notación para el puzzle elegido. Los ajustes se guardan con el modelo existente de Dexie y el borrado vacía sus tablas en una transacción. La caché reconstruible y los archivos instalados de la PWA se conservan.
- Las compilaciones de preview y release tienen distinta base de Vite. El alcance del service worker y el espacio de datos se derivan de esa base. La instalación del precache arranca tras la carga inicial. Se conserva el paquete completo para abrir por primera vez Timer, Academia, Solucionador y Entrenador desde el modo avión.
- Se fijaron ESLint 10.15.0, @eslint/js 10.0.1 y typescript-eslint 8.73.0 por soporte y por los avisos del parser. Se fijaron Vite 6.4.6 y Vitest 4.1.12 para resolver los avisos de sus ramas. Workbox usa glob 14.0.6 mediante un override limitado a ese árbol. npm audit pasó de 15 hallazgos a 0 sin aplicar --force.
- Se probó cubing 0.66.1 en una copia aislada con build y 17 pruebas de academia, entrenador y solucionador. La prueba no redujo el tamaño del motor 3D y aumentó el precache en unos 22 KiB en la compilación de comparación. El MVP conserva 0.63.8, que pasa la auditoría y tiene sus flujos de producción comprobados. [Notas de cubing 0.66.1](https://github.com/cubing/cubing.js/releases/tag/v0.66.1)
- El navegador de referencia para el informe local fue Chrome 157. Lighthouse 13.6.0 dio 99 en Performance y 100 en Accessibility tanto en el build previo como en la primera apertura del nuevo preview. La instalación de Android se valida desde la URL de Pages.
