# CubeLab · Traspaso de contexto (24-11-2026, 20:40)

## 1. Qué es
PWA de speedcubing: timer, estadísticas, academia (lecciones y casos), solucionador, entrenador y modo competencia.
- Repo local: `C:\Users\aguil\Proyectos\cubelab` · GitHub: `YaYo-696/cubelab` (rama `main`).
- Vista previa publicada: https://yayo-696.github.io/cubelab/preview/ · la versión estable (raíz) depende de `CUBELAB_RELEASE_REF`.
- Stack: React + TypeScript estricto + Vite PWA, Dexie, Zustand, cubing.js **0.63.8 fijada**, Web Workers,
  Vitest, Playwright 1.65.1 (Edge local, Chromium en CI), i18n es/en.
- Docs del repo: `AGENTS.md`, `README.md`, `docs/ARQUITECTURA.md`, `docs/DECISIONES.md`, `docs/FUENTES.md`.

## 2. Cómo trabajamos
- **Carlos** decide, prueba y hace commit/push. Valida en PC con Edge; el teléfono solo para táctil, instalación u offline.
- **Codex** (ChatGPT) y **Claude** escriben código **en paralelo, 2 y 2**, cada uno en su zona.
  Los fallos se le reportan a **Claude**, que los resuelve o arma el prompt para Codex.
- Una tarea de Codex a la vez, sin "actualizaciones" a mitad. Codex parte **después** del commit y el push de lo anterior.
- Al terminar Codex: `.\tools\diagnostico.ps1 -ConE2E` (con la vista previa cerrada; usa el puerto 4173)
  → prueba manual → commit(s) → `git push` → revisar GitHub Actions en verde.
- Explicarle a Carlos paso a paso, uno por uno y explícito: se distrae.
- Todo lo bloqueado (prerrequisitos, desbloqueos) queda abierto en dev con `UNLOCK_ALL` en `src/config/devFlags.ts`.
  Antes del lanzamiento se apagan **todas** las DEV-FLAG.
- Encabezado obligatorio de cada prompt para Codex:

```
CONTEXTO DE TRABAJO: Claude y tú trabajan en paralelo sobre este repo, los dos escriben código.
- Toca solo los archivos de tu tarea. Si encuentras cambios que no hiciste, no los reviertas: son de Claude.
- Si ves una incongruencia en lo que hizo Claude, NO la corrijas en silencio: anótala en tu reporte en una sección "Incongruencias".
- Al terminar: corre el diagnóstico completo y reporta resultados exactos.
```

## 3. Decisiones tomadas
- **Lanzamiento: solo puzzles WCA.** Los no oficiales (hoy el Pyraminx Duo) se ocultan con `SHOW_UNOFFICIAL` (no se borran datos).
- **Puzzles personalizados: después del lanzamiento.** Idea de Carlos: el usuario pega un JSON (generado por una IA con
  un prompt nuestro), que se guarda solo en su equipo. La comunidad pide puzzles (Duo, 17x17…) y se agregan por actualización.
  Requisitos ya identificados: definición tipo KPuzzle, regla de mezcla, vista 2D primero, validación estricta, solo datos (nunca código).
- **3x3 y 2x2 NO se migran al formato `content-drop`.** Ya comparten el contrato `PuzzleModule` con todos los puzzles
  y tienen lógica propia (quiz generados, reconocimiento OLL/PLL, generadores de casos). La garantía uniforme la da
  una **prueba de contrato única** sobre todos los puzzles WCA (Fase 14-B).
- **Principiante 3x3 renovado:** última capa con 4 algoritmos (`F R U R' U' F'`, Sune repetido con Anti-Sune de atajo, Aa con faros atrás, Ua con la arista resuelta atrás). 2x2 orienta con Sune repetido.

## 4. Estado actual
- Commits del 24-11: Pyraminx/Duo, videos, Skewb, Megaminx, 4x4–7x7, Square-1, Clock, OH/FMC/BLD/MBLD,
  CI estable, contenido Square-1, videos en español, **Fase 13 competencia**, contenido principiante 3x3/2x2. CI verde.
- Academias con contenido verificado: 333, 222, pyram, pyramduo, skewb, minx, 444, clock, sq1.
- `content-drop/<puzzle>/` = zona de contenido de Claude (`algsets.json`, `lessons.json`, `VERIFICACION.md`).
  `content-drop/333-222/` = textos y ejercicios del principiante (se integran a mano, ver su `CAMBIOS.md`).
  `content-drop/_simuladores/` = scripts de verificación de Claude.
- **Fase 14 "Blindaje WCA": cerrada** (commit `feat: blinda los catálogos WCA y la visibilidad de puzzles`, push 24-11).
  A, B, C y E hechos; diagnóstico `FALLAS: 0`, 204 unitarias, 38 e2e. **D quedó pendiente** (ver pendientes).
- Corrección de Claude tras la Fase 14: en el solucionador, las 4 etapas de CFOP 4LLL enlazan a `oll3`/`pll3`
  (antes a las lecciones principiante, que ahora enseñan otras secuencias). Prueba en `tests/unit/solver.test.ts`.

## 5. Pendientes
1. **Fase 14-D (Codex):** e2e de Square-1 con espera de 30 s y medición de la primera mezcla
   (`tests/e2e/side-events.spec.ts` sigue en 10 s; `audit-flows.spec.ts` en 15 s). Prompt entregado a Carlos.
2. **Lecciones que faltan (pedir ok a Carlos antes):** 5x5, 6x6, 7x7, 3BLD/4BLD/5BLD/MBLD, FMC, OH. Tienen timer, no academia.
3. **Fases siguientes:** smart cubes y Stackmat → app APK/escritorio. Puzzles personalizados: después del lanzamiento.
4. **`PRE-LANZAMIENTO` (se revisa al final de todo):**
   - `UNLOCK_ALL = false` y `SHOW_UNOFFICIAL = false` (buscar todas las `DEV-FLAG`).
   - Actualizar `CUBELAB_RELEASE_REF`.
   - cubing.js: fijada en 0.63.8, hay 0.66.1. Evaluar en una fase aparte con todas las pruebas; no actualizar a ciegas.
   - Teléfono: reinstalar la PWA desde `/preview/` después de exportar un respaldo (la instalada se quedó en la fase 4).
5. Carlos va a probar la página a fondo; sus hallazgos van a Claude.
6. Opcional, no aprobado: cruz con margarita como opción para principiantes.

## 6. Datos útiles
- Contrato `content-drop` v1: `algsets.json {version:1, sets:[{id, name{es,en}, stage, cases:[{id, name{es,en}, group, setup, algs[], source}]}]}`,
  `lessons.json {version:1, lessons:[{id, title, objective, body (markdown es/en), algSetRefs, demos:[{setup, alg}], prerequisites}]}`.
  `source` = URL http(s) o `generated:...` (pyram exige URL). Prefijos de set: `skewb-`, `minx-`, `444-`, `sq1-`, `clock-`.
- Reglamento WCA usado: 4b3 (distancia mínima), A3a1 (inspección), 9b (formatos), 12c (Square-1), 12g (Clock), 12d (Megaminx).
- Para saber el estado de git sin terminal: `.git/logs/HEAD` (commits) y `.git/logs/refs/remotes/origin/main` (pushes).
