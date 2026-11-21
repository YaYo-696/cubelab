# CubeLab

Cronómetro offline de speedcubing para 2×2, 3×3 y 3×3 a ciegas. Guarda el intento, la mezcla y sus penalizaciones en la sesión del evento. [Arquitectura](docs/ARQUITECTURA.md) · [Decisiones](docs/DECISIONES.md)

## Arranque en PC

Con Node 22.16 o posterior y npm, ejecutar desde esta carpeta:

```sh
npm install
npm run dev
```

## Diagnóstico de aceptación en Windows

Desde PowerShell, en la raíz del repo con las dependencias instaladas, ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\diagnostico.ps1 -ConE2E
```

El diagnóstico comprueba dependencias y tipos, ejecuta lint, filtros, Vitest y build, revisa el manifiesto y el service worker, y ejecuta Playwright con Edge. Devuelve código 0 si pasa y guarda el detalle en `diagnostico-*.log`. La opción `-Rapido` ejecuta un subconjunto. Para instalar desde cero según el lockfile, usar `npm.cmd ci`.

## Comprobaciones

```sh
npm run lint
npm test
npm run build
npm run test:e2e
```

En Windows, Playwright usa el Microsoft Edge instalado mediante el canal `msedge`. En otros sistemas usa Chromium de Playwright. Para elegir Chromium explícitamente en otro equipo Windows, usar `$env:CUBELAB_E2E_BROWSER = "chromium"` en PowerShell. En CI se puede fijar `CUBELAB_E2E_BROWSER=chromium` en el entorno del job, ejecutar `npx playwright install --with-deps chromium` allí y correr el build y los e2e. Para volver al valor predeterminado en PowerShell, ejecutar `Remove-Item Env:CUBELAB_E2E_BROWSER -ErrorAction SilentlyContinue`.

`npm run test:filter` verifica con KPuzzle las distancias exactas a ambos lados del umbral en las 24 orientaciones y recorre 1.000 muestras por modalidad.

Vitest genera 1.000 mezclas por modalidad activa y comprueba cada una con un modelo independiente de cubing.js. El test de navegador sirve el build de producción, activa el modo sin conexión y pide una mezcla. `npm run format` formatea el proyecto con Prettier.

## Teléfono y PWA

Para abrir la interfaz en la misma Wi-Fi, ejecutar `npm run dev -- --host 0.0.0.0` y usar la dirección Network que imprime Vite. Para probar instalación y workers que requieren un contexto seguro, servir el contenido de `dist/` por HTTPS con un certificado de confianza en el teléfono. En PC se puede usar `npm run preview` y abrir localhost. En Android usar la opción de instalar del navegador. En iOS, abrir en Safari y elegir Compartir → Agregar al inicio. Tras la primera carga completa, activar el modo avión, cerrar, reabrir y generar una mezcla de cada evento.

### Prueba de producción en un teléfono

**Android por USB**. Con las Android Platform Tools en PATH, la depuración USB activada y el teléfono autorizado, ejecutar en el PC:

```powershell
adb devices
adb reverse tcp:4173 tcp:4173
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

En Chrome del teléfono abrir `http://localhost:4173`. El reenvío permite usar localhost como contexto seguro. Instalar CubeLab desde el menú de Chrome, abrirla una vez, cerrar, desconectar el cable y activar modo avión con Wi-Fi apagado. Reabrir desde el icono y generar una mezcla para 2×2, 3×3 y 3×3 a ciegas. Comprobar la etiqueta de criterios WCA y abrir una lección. Cambiar el idioma, cerrar y confirmar que se conserva al reabrir.

**Android o iPhone por Wi-Fi con HTTPS local**. Con mkcert instalado en el PC, seleccionar la IPv4 de la interfaz Wi-Fi usando `ipconfig`. En PowerShell, desde el repo y con el build generado:

```powershell
$ip = Read-Host 'IPv4 Wi-Fi del PC'
$cert = Join-Path $env:TEMP 'cubelab-cert.pem'
$key = Join-Path $env:TEMP 'cubelab-key.pem'
mkcert -cert-file $cert -key-file $key $ip
mkcert -CAROOT
Write-Host "Abrir https://${ip}:4173"
npx.cmd --yes --package=http-server@14.1.1 -- http-server dist -a $ip -p 4173 -S -C $cert -K $key -c-1
```

Transferir al teléfono únicamente el certificado público `rootCA.pem` de la carpeta indicada por `mkcert -CAROOT`. Instalarlo como CA de confianza. En iOS activar también la confianza total para esa raíz en Ajustes → General → Información → Ajustes de confianza de certificados. Con ambos dispositivos en la misma Wi-Fi, abrir la URL impresa en Chrome o Safari y comprobar que el certificado se acepta. En iPhone usar Compartir → Agregar al inicio. Repetir la comprobación en modo avión indicada arriba. Cerrar el servidor con Ctrl+C al terminar y retirar la confianza de prueba del teléfono si se habilitó solo para esta sesión.

### Aceptación de la fase 1

En Windows ejecutar `npm.cmd ci` y después `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\diagnostico.ps1 -ConE2E`. Vitest incluye los límites del timer, las entradas manuales y el repositorio Dexie con fake-indexeddb. Playwright prueba la PWA de producción en Edge, el guardado por teclado, la recarga y una inspección con +2 mediante un reloj simulado.

En PC, seleccionar la modalidad y la sesión. Con inspección habilitada, una pulsación de espacio inicia la inspección. Mantener espacio hasta «Listo», soltar para correr y pulsar una tecla para detener. Probar soltar antes del umbral, activar y quitar +2 y DNF, comentar y borrar/deshacer. En ingreso manual, 1:02.34 y 62.34 deben producir el mismo tiempo. Para probar notación, introducir R U3 y comprobar que se señala el 3. En 3×3 a ciegas, la primera presión ya prepara el timer.

En Android abrir la PWA de producción con adb reverse como se indica arriba. Verificar que se ve «Últimos cinco tiempos» y anotar el contador de una sesión. Activar modo avión, desconectar el USB y completar **12 intentos cronometrados consecutivos en la misma sesión**. Mantener el dedo hasta «Listo», soltar para correr y tocar para detener. Verificar que el contador aumentó en 12, anotar los últimos cinco y el ao5, cerrar por completo y reabrir desde el icono. El contador, los cinco tiempos y el ao5 deben coincidir. Si el teléfono ya tenía la fase 0, abrir primero con conexión al servidor actualizado y dejar que el service worker descargue la nueva versión.

### Aceptación de la fase 2

Ejecutar el diagnóstico de aceptación de Windows con Edge. Incluye el límite de 1.000 ms para estadísticas completas y PB con 10.000 intentos, las transacciones de sesiones y la restauración JSON con Playwright.

En Estadísticas, elegir el evento y la sesión. Después de cinco intentos, abrir el desglose del ao5. Cambiar +2 en un intento antiguo y revisar tanto la nueva media como los descartes. Crear otra sesión del mismo evento y mover un intento con su casilla de selección. Fusionar las sesiones y verificar el conteo. Exportar JSON y restaurarlo en un perfil desechable del navegador. El CSV exporta los intentos activos y el JSON incluye también los borrados recuperables. No hace falta borrar el perfil habitual.

En Android, abrir el build actualizado usando el procedimiento USB anterior. En modo avión, confirmar que funcionan el panel, el gráfico, el desglose y la edición. Exportar el JSON desde el teléfono y conservarlo antes de probar la importación en otro perfil.

Para contrastar con csTimer, activar el recorte predeterminado del 5 % por extremo e ingresar 10.00, 12.00 (+2), 14.00, 15.00, 18.00 (DNF), 11.00, 13.00, 10.00, 12.00 (+2), 9.00, 16.00 y 12.00. Single actual/mejor 12.00/9.00, mo3 12.33/11.00, ao5 12.00/11.33, ao12 12.90/12.90. Media 12.55. El mejor valor histórico de la media acumulada de CubeLab es 10.00. Los promedios de 25 intentos o más quedan vacíos.
