# Geometry Survivor

Prototipo web del MVP de *Geometry Survivor*. El juego está construido para ejecutarse primero en navegador y publicarse en GitHub Pages, con destinos separados para pruebas locales, Poki y CrazyGames.

Para retomar el desarrollo, consulta el [plan único de pendientes](PLAN_DESARROLLO.md), el [índice de documentación](docs/README.md) y la skill de la tarea. No hay un snapshot o plan de ejecución paralelo.

## Arranque local

Usar Node.js 24 LTS (versión de referencia en `.node-version`), como en CI.
Este archivo indica la versión; no instala ni actualiza Node automáticamente.
Se documentó una incidencia de crecimiento de memoria en Windows con Node
22.14.0. Usar la referencia actual y el watcher corregido; las pruebas breves
no certifican una sesión de horas. Ver [diagnóstico y medición](docs/performance/VITE_MEMORY.md)
y la [auditoría de recursos](docs/audits/AUDITORIA_RECURSOS_2026-10-02.md).

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite. Para ver el panel técnico añade `?debug=1`.

La orientación primaria es portrait para móvil. En landscape el juego usa un viewport 1280×720 para aprovechar pantallas de PC y portales de escritorio; no se fuerza a girar el dispositivo.

El stress de combate de Fase 2 se ejecuta con `?stress=1`. Inicializa 250 enemigos y 300 proyectiles reales, mantiene visible el panel técnico y sirve para comprobar el peor caso en el mismo móvil. Se puede combinar con `&debug=1`, aunque no es necesario.

Para probar el encuentro del boss sin esperar 4:20, usa `?boss=1`. Este atajo de desarrollo inicia el reloj en el umbral oficial del boss, coloca la arena en su estado correspondiente y muestra el panel técnico; la URL normal continúa empezando en `0:00`.

## Validación y builds

```bash
npx playwright install chromium
npm run validate
npm run test:browser
npm run build:local
npm run build:poki
npm run build:crazygames
npm run preview
```

Los artefactos quedan en `dist/local`, `dist/poki` y `dist/crazygames`. Los tres targets usan todavía `LocalPlatform`; sus SDK reales y QA de portales siguen pendientes en EX-09. Construir esas carpetas no demuestra integración comercial.

`npm run test:browser` reconstruye `dist/local` y ejecuta Playwright en Chromium (desktop y un proyecto emulado Pixel 5): carga, teclado/pointer/touch, pausa/reanudación, matriz de resize, level-up, almacenamiento local, context loss y errores de consola/red. El juego desbloquea audio después de la primera interacción; Howler reproduce la fuente musical del prototipo y ZzFX genera los efectos. `?spike=audio` conserva la prueba técnica aislada, no sustituye la ruta de audio del juego.

Los scripts de build ejecutan typecheck y unitarios antes de compilar; `validate` y `test:browser` también encadenan verificaciones. Para diagnóstico de rendimiento, distinguir tiempo de tests, compilación, browser y despliegue. El contrato de CI está en [CI_DEPLOY](docs/CI_DEPLOY.md).

La instalación de Chromium es necesaria una sola vez por máquina (`npx playwright install chromium`). El workflow de GitHub Actions la instala automáticamente.

## Publicación y límites

El repositorio y GitHub Pages ya están configurados: no ejecutar de nuevo el arranque histórico (`git init`, recrear remoto o bootstrap) para continuar.

El workflow `.github/workflows/deploy.yml` publica `dist/local` en GitHub Pages tras un push a `main` o ejecución manual, sólo después de typecheck, unitarios, tres builds y todos los shards browser. Una validación local no demuestra que el workflow remoto haya pasado. Commit, push y publicación requieren autorización de la solicitud vigente.

GitHub Pages prueba el target local. Antes de publicar comercialmente faltan los adaptadores reales y pruebas en Poki Inspector/CrazyGames Preview, así como las puertas de carga, recursos y presupuestos descritas en el [plan vigente](PLAN_DESARROLLO.md).
