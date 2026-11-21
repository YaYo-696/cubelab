# CubeLab · Propuesta de arquitectura

**Fase 0 · Aprobada con ajustes · 20 de noviembre de 2026**

CubeLab empezará con dos módulos, 2×2 y 3×3. Cada uno aportará su notación, sus mezclas y sus contenidos. Ambos usarán el mismo cronómetro, historial y sistema de lecciones. El flujo principal debe funcionar en un teléfono en modo avión después de la primera carga completa.

## Organización del proyecto

| Ruta propuesta | Responsabilidad |
|---|---|
| `src/app/` | Componer rutas, registro de módulos y servicios. Vite, React y TypeScript estricto. Seis destinos: Timer, Academia, Entrenador, Solucionador, Estadísticas y Ajustes. |
| `src/core/timer/`, `stats/`, `sessions/` dentro de `core/` | Transiciones, resultados y sesiones. Funciones de dominio que se pueden probar con un reloj simulado. |
| `src/core/storage/` | Repositorios Dexie, importación, exportación y migraciones. IndexedDB es la fuente de los datos persistentes. |
| `src/core/academy/`, `trainer/` dentro de `core/` | Navegación de lecciones, progreso y calendario de repaso. |
| `src/core/competition/`, `hardware/` dentro de `core/` | En fases posteriores, reglas de rondas y adaptadores de dispositivos. |
| `src/puzzles/registry.ts`, `src/puzzles/{222,333}/` | Catálogo con carga diferida, adaptador de cubing.js y datos versionados de métodos, casos y cursos. |
| `src/workers/` | Trabajos de mezcla, generación de casos y búsqueda de soluciones. |
| `src/ui/`, `src/i18n/` | Componentes accesibles para teclado y pantalla táctil, tema oscuro inicial y catálogos español/inglés. |
| `public/`, `tests/unit/`, `tests/e2e/`, `docs/` | Iconos instalables, pruebas Vitest y Playwright, decisiones técnicas y fuentes. Vite generará el manifiesto y el service worker con vite-plugin-pwa. |

El núcleo define los contratos. La aplicación le inyecta el registro y los repositorios. Añadir Pyraminx, por ejemplo, requiere crear su módulo y registrarlo. El cronómetro seguirá recibiendo una mezcla y una política de inspección. Zustand conserva la selección actual y el estado de interacción. Al recargar, las sesiones y los resultados se reconstruyen desde Dexie.

## Contrato de cada módulo

La mecánica pertenece al puzzle. La inspección, la mezcla y el formato de ronda pertenecen a la modalidad. Esta distinción permite que 3×3 normal, a una mano y a ciegas compartan las operaciones sobre las piezas.

El contrato TypeScript completo está en [contracts.ts](../src/core/contracts.ts). Los tipos AlgCase, AlgSet, Lesson y Course definen contenido versionado. loadAlgSet(id) y loadCourse(id) cargan catálogos mediante import() dinámico. Stage incluye nameKey, moves y explanationParams para traducir explicaciones con datos. El generador recibe caseId y AbortSignal. El worker reproduce la mezcla, verifica su patrón y solo entonces devuelve { scramble, verified: true }. Las pantallas montan ui.preview y ui.inputPanel como componentes opcionales con carga diferida.

El cargador devuelve el módulo una vez preparado su modelo. Cada módulo conoce su tipo de estado. La notación se normaliza al entrar y devuelve un error con la posición del movimiento inválido. Los nombres y las explicaciones usan claves de traducción. Los cursos y conjuntos de algoritmos se referencian por identificador estable para poder cargar su contenido al entrar en la pantalla correspondiente.

El campo `quality` permite presentar una solución corta de 3×3 y reservar «óptima» para una búsqueda que demuestre el mínimo en la métrica indicada. Antes de entregar un resultado, el worker reproduce los pasos sobre el estado mezclado, comprueba el objetivo de cada etapa y valida el estado final. El entrenador comprueba cada caso contra una posición de referencia identificada independientemente del algoritmo que se evalúa.

## Integración de cubing.js y trabajo en segundo plano

| Necesidad | Integración propuesta y comprobación |
|---|---|
| Mezclas | El worker llama a `randomScrambleForEvent('222')` o `randomScrambleForEvent('333')` desde `cubing/scramble` y devuelve el texto de `Alg.toString()`. La documentación muestra ambos códigos y señala limitaciones del filtrado. Un solucionador acotado rechaza las posiciones con distancia inferior al minSolveDistance de EventRules. Los mínimos son 4 para 2×2, 2 para 3×3, 6 para Pyraminx, 7 para Skewb y 11 para Square-1. Square-1 requiere además un giro / legal. Las modalidades a ciegas incorporan una orientación uniforme. Después de aceptar la posición, la interfaz muestra «Mezcla generada con criterios WCA». Se comprueban 1.000 muestras por evento activo. [WCA 4b3](https://www.worldcubeassociation.org/regulations/#4b3) [API de mezclas](https://js.cubing.net/cubing/scramble/) |
| Estado | El filtro inicial representa las pegatinas por posición y normal de la cara. El oráculo independiente de Vitest carga el `KPuzzle`, obtiene su patrón inicial y aplica `KPattern.applyAlg`. La verificación de resuelto debe aceptar las orientaciones globales equivalentes en 2×2 y 3×3. Vitest cubrirá un cubo girado entero, una cara girada y un algoritmo seguido de su inverso. [Modelo KPuzzle](https://js.cubing.net/cubing/kpuzzle/) · [API de KPattern](https://js.cubing.net/cubing/api/classes/kpuzzle.KPattern.html) |
| Vista | Un componente React crea `TwistyPlayer` de `cubing/twisty` bajo demanda. Recibe el identificador visual del puzzle y la secuencia ya validada. El cronómetro debe poder arrancar mientras se carga la vista. [API de cubing.js](https://js.cubing.net/cubing/) |

Cada solicitud al worker lleva un identificador de trabajo, de puzzle y de evento. Al cambiar de sesión se descartan respuestas obsoletas. Se prepara una mezcla por adelantado y se congela la mezcla del intento al empezar. El worker recibe mensajes de cancelación y, si una búsqueda bloqueante agota su presupuesto, el cliente puede terminarlo y crear otro. Los mensajes contienen datos serializables. Las instancias de KPuzzle viven en el contexto que las usa.

**Versión y distribución.** La referencia de API consultada se identifica como `0.66.2-dev`. Las funciones anteriores están documentadas. Se fija cubing@0.63.8 en package.json. [Registro de decisiones](DECISIONES.md). [Referencia de API](https://js.cubing.net/cubing/api/classes/kpuzzle.KPattern.html) · [Paquete npm](https://www.npmjs.com/package/cubing)

El proyecto declara su código original bajo MPL-2.0 o GPL-3.0-or-later. Propongo usar la opción MPL para distribuir CubeLab gratis o de pago. La distribución incluirá los avisos aplicables y el acceso al código fuente de la versión cubierta que se entrega, incluidas las modificaciones que CubeLab distribuya. Los archivos propios de CubeLab pueden conservar su licencia. Se conservarán también las atribuciones de terceros del paquete fijado. [Licencias del proyecto](https://github.com/cubing/cubing.js#license) · [Preguntas frecuentes de Mozilla](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)

## Datos locales y migraciones

| Tabla | Clave e índices de consulta | Datos persistentes |
|---|---|---|
| Session | `id`, `eventId` | Nombre, puzzle, modalidad, creación y fecha opcional de archivo. |
| Solve | `id`, `[sessionId+createdAt]`, `[eventId+createdAt]` | Sesión, eventId, mezcla exacta, fecha, origen, penalización, comentario, parciales y reconstrucción opcionales. Resultado discriminado por tiempo bruto en ms, movimientos o cubos resueltos/intentos y tiempo. |
| TrainerCase | `[puzzleId+setId+caseId]`, `dueAt` | Estado de aprendizaje, intentos, aciertos, mejor marca, suma y cantidad de tiempos válidos, última práctica y próximo repaso. |
| LessonProgress | `[courseId+lessonId]` | Revisión del contenido, finalización y puntuación del cuestionario. |
| CompetitionRound | `id`, `[eventId+createdAt]` | Modalidad, revisión del reglamento, formato, corte, límites, mezclas en orden y referencias a intentos. |
| Settings | `key` | Valor validado por clave para idioma, tema, inspección y preferencias de entrada. |

El cronómetro asigna el UUID antes de guardar. El repositorio inserta el intento y actualiza su ronda en una sola transacción. Un reintento con el mismo UUID reconoce la escritura previa. Archivar una sesión conserva sus intentos. Las estadísticas se calculan desde el resultado bruto y la penalización, de modo que editar un +2 actualiza los promedios sin alterar la medición original.

Dexie empieza en `version(1)`. Cada cambio posterior añade una versión y su transformación transaccional. Las copias JSON llevan una versión de exportación independiente. Antes de importar, se validan tipos, referencias y duplicados. Un error aborta la transacción completa. Una prueba por migración abrirá una base de la versión anterior y comprobará IDs, tiempos, penalizaciones y relaciones después de actualizar. Una segunda apertura verificará que se mantienen los datos.

## Cronómetro

| Estado | Acción | Resultado |
|---|---|---|
| `idle` | Iniciar inspección habilitada | `inspecting`. Guardar el instante de inicio. |
| `idle` o `inspecting` | Mantener espacio o la zona táctil | `holding`. Conservar el origen y el reloj de inspección. |
| `holding` | Soltar antes del umbral | Regresar al origen. Si había inspección, continúa desde el instante inicial. |
| `holding` | Alcanzar el umbral propuesto de 300 ms | `ready`. Mostrar una señal de preparación con texto y color. |
| `ready` | Soltar | `running`. Fijar la penalización y el instante de salida con la misma lectura del reloj. |
| `running` | Nueva pulsación de parada | `stopped`. Capturar el tiempo, bloquear entradas repetidas y guardar el intento. |
| `stopped` | Escritura confirmada y control liberado | `idle` con la mezcla siguiente. Si falla la escritura, conservar el intento para reintentar. |

Se mide con un reloj monótono. El refresco visual solo pinta la diferencia entre marcas. Con inspección, al soltar antes de 15 000 ms se inicia limpio, desde 15 000 ms se asigna +2 y desde 17 000 ms se registra DNF. Los tests cubrirán 14 999, 15 000, 16 999 y 17 000 ms, repetición de tecla y cancelación del contacto durante la preparación. [Reglamento WCA, A4d](https://www.worldcubeassociation.org/regulations/#A4d)

## Catálogo oficial de referencia

Formatos de ronda completa según el artículo 9 de la edición publicada el 1 de abril de 2026. Ao5 descarta los dos extremos y promedia los tres resultados centrales. Mo3 promedia los tres. BoX toma el mejor resultado entre X intentos. En Ao5 un DNF puede descartarse como peor resultado y dos DNF producen un promedio DNF. [Reglamento WCA, eventos y resultados](https://www.worldcubeassociation.org/regulations/#article-9-events)

| Evento | Código | Ronda completa |
|---|---|---|
| 2×2×2 | 222 | Ao5 |
| 3×3×3 | 333 | Ao5 |
| 4×4×4 | 444 | Ao5 |
| 5×5×5 | 555 | Ao5 |
| 6×6×6 | 666 | Mo3 |
| 7×7×7 | 777 | Mo3 |
| 3×3×3 a una mano | 333oh | Ao5 |
| Clock | clock | Ao5 |
| Megaminx | minx | Ao5 |
| Pyraminx | pyram | Ao5 |
| Skewb | skewb | Ao5 |
| Square-1 | sq1 | Ao5 |
| 3×3×3 a ciegas | 333bf | Bo5 |
| 4×4×4 a ciegas | 444bf | Bo3 |
| 5×5×5 a ciegas | 555bf | Bo3 |
| 3×3×3 en menos movimientos | 333fm | Bo1, Bo2 o Mo3 |
| 3×3×3 múltiple a ciegas | 333mbf | Bo1, Bo2 o Bo3 |

Las fases de corte se configuran por ronda. La modalidad de duelo directo está admitida para finales de 3×3, 4×4, 3×3 a ciegas y 3×3 a una mano. Esas reglas se incorporarán al simulador de competición. [Reglamento WCA, 9b](https://www.worldcubeassociation.org/regulations/#9b)

## Aceptación del futuro esqueleto

1. Compilar con TypeScript estricto, ejecutar ESLint, Vitest y una prueba de navegación Playwright. El registro deberá cargar los dos módulos iniciales y resolver sus nombres en ambos idiomas.
2. Probar en escritorio con teclado y en un teléfono con controles táctiles. Para revisar la navegación en la misma red, iniciar Vite con `npm run dev -- --host 0.0.0.0` y abrir en el teléfono la dirección de red indicada por Vite.
3. Probar la instalación móvil sobre HTTPS de confianza con la versión de producción. El service worker precargará la interfaz, las traducciones y los recursos locales del MVP, incluidos módulos dinámicos, workers y archivos de datos necesarios. Tras completar la caché, cerrar la app, activar el modo avión y volver a abrirla. Al implementar el timer, repetir la prueba generando una mezcla de cada evento y recuperando el último intento tras reiniciar.

El esqueleto implementa el catálogo, la navegación y el flujo de mezclas. La aceptación de instalación y funcionamiento offline requiere ejecutar el build y la prueba de navegador con las dependencias instaladas.
