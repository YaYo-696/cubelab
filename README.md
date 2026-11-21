# CubeLab

Esqueleto de la fase 0 para PC y teléfono. Incluye navegación en español e inglés, dos módulos de cubo, un ejemplo de contenido diferido y generación de mezclas para 2×2, 3×3 y 3×3 a ciegas. El cronometraje interactivo corresponde a la fase 1. [Arquitectura](docs/ARQUITECTURA.md) · [Decisiones](docs/DECISIONES.md)

## Arranque en PC

Con Node 22.16 o posterior y npm, ejecutar desde esta carpeta:

```sh
npm install
npm run dev
```

## Comprobaciones

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

El filtro también tiene una prueba reproducible sin dependencias externas con `node --experimental-strip-types --test tests/filter.mjs`. Usa candidatos controlados e incluye rechazos intencionados.

Vitest genera 1.000 mezclas por modalidad activa y comprueba cada una con un modelo independiente de cubing.js. El test de navegador sirve el build de producción, activa el modo sin conexión y pide una mezcla. `npm run format` formatea el proyecto con Prettier.

## Teléfono y PWA

Para abrir la interfaz en la misma Wi-Fi, ejecutar `npm run dev -- --host 0.0.0.0` y usar la dirección Network que imprime Vite. Para probar instalación y workers que requieren un contexto seguro, servir el contenido de `dist/` por HTTPS con un certificado de confianza en el teléfono. En PC se puede usar `npm run preview` y abrir localhost. En Android usar la opción de instalar del navegador. En iOS, abrir en Safari y elegir Compartir → Agregar al inicio. Tras la primera carga completa, activar el modo avión, cerrar, reabrir y generar una mezcla de cada evento.
