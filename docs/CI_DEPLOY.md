# CI y publicación en Pages

El workflow `.github/workflows/deploy.yml` publica `dist/pages`, una copia de
`dist/local` sin source maps ni sus comentarios de referencia. Los mapas y los
bundles JS/CSS exactos del build local se conservan como artefacto de diagnóstico
de Actions durante 30 días. La publicación espera typecheck, unit tests, tres
builds y toda la suite browser; un fallo sigue bloqueándola. `npm ci` usa el
lockfile y Chromium se instala con la versión de Playwright de ese lockfile.

## Incidente de smoke: idioma y arte SVG diferido — 06-10-2026

El run de Actions #205 completó el build, pero seis shards reportaron 25 fallos
finales porque Playwright usó el idioma inglés del runner y varias aserciones
de los smokes esperan el texto español. La configuración fija `es-MX`; la prueba
de idioma móvil sustituye explícitamente `navigator.languages` para seguir
cubriendo detección en inglés. Un fallo intermitente separado leía el `href` de
un módulo SVG antes de que el observador de carga diferida lo restaurara; ahora
la prueba espera el estado `ready` antes de inspeccionarlo. No se cambió el
loader de producción por ese fallo de sincronización. Actions debe validar el
workflow completo en el siguiente run.

El run #206 pasó siete shards; el restante falló cuando un drill de Prism Weaver
seguía en fase `approach` con 4 FPS y agotó una espera de 12 s. Se amplió esa
espera a 30 s, con un timeout total de 90 s para el caso; no se cambió el tiempo
ni la velocidad de ataque del enemigo.

## Ejecución paralela entre runners — 27-09-2026

El job `build` verifica TypeScript, lógica y los tres destinos. Ocho jobs
`browser` arrancan a la vez, cada uno construye `dist/local` desde el mismo
commit y ejecuta una octava parte de los 69 casos Playwright. La división es
por **caso**, porque tres archivos desiguales no se repartirían bien por
archivo. Cada runner mantiene **un solo worker**: el experimento anterior con
dos workers en un runner agotaba Chromium/WebGL. `deploy` depende del éxito de
`build` y de los ocho shards; ningún fallo publica Pages.

Cada shard sube su HTML, capturas y trazas como
`playwright-report-1`…`playwright-report-8`. En un fallo, abrir el artefacto del
shard que falló. La carga local de referencia anterior fue 70/70 en 10,5 min
en serie. La primera corrida con cuatro shards aprobó Pages en casi 10 min;
sus jobs browser terminaron en aproximadamente 4, 6, 8 y 10 min. Falta medir
el resultado con ocho shards.
El reparto cambia tiempo de espera por minutos de runner adicionales, pues
`npm ci`, Chromium y el build local se ejecutan en cada shard. No se quitan
pruebas ni se aumenta el número de reintentos. Los runners estándar del
repositorio público no generan cargos de Actions según GitHub.

Fuentes oficiales: [Playwright CI](https://playwright.dev/docs/ci),
[sharding](https://playwright.dev/docs/test-sharding) y
[jobs dependientes de GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs),
[facturación de Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

## Smoke 8: presupuesto acumulado de Inicio — 30-09-2026

El reporte aportado agota el límite global de 60 s en dos puntos distintos:
después de pulsar Jugar y durante la espera de una imagen al redimensionar.
Eso no demuestra que Jugar deje de funcionar ni que esa imagen tarde 60 s;
falta la traza del runner para atribuir un bloqueo específico. El caso reunía
boot retenido, carga de arte, movimiento, tres consolas, cuatro viewports,
ocho clicks de ajustes e inicio de partida bajo un único presupuesto.

Se separó en dos casos independientes por proyecto (dos casos adicionales
en el total, no uno por tamaño). `cubre la carga desde HTML...` conserva
boot, navegación, movimiento acotado/reduced-motion e inicio real;
`adapta portada y controles al rotar...` conserva los cuatro tamaños,
currentSrc interior/exterior, carga correcta de ambas imágenes, targets ≥44 px,
texto/overflow, abrir/cerrar ajustes e inicio después de rotar a portrait.
El segundo desactiva movimiento antes de cargar. Cada viewport aparece como
test.step en HTML/traza para localizar dónde se consume el tiempo.
No se eliminan aserciones, no se fuerza ningún click y no se amplían timeouts,
reintentos ni la cantidad de workers. El workflow continúa bloqueando el deploy
si falla cualquier shard; no hubo cambios de producción para tapar el test.

Comparación local en Chromium Pixel 5, CPU ralentizada 8× mediante CDP:
el caso original pasó en 49.4 s; separados pasaron dos veces cada uno,
boot/navegación 24.2/24.1 s y responsive 33.9/33.8 s. La ralentización es
un diagnóstico reproducible de margen, no una réplica de Ubuntu ni una medida
de FPS/memoria del juego. El total incluye un boot extra por proyecto;
el objetivo es limitar duración por caso y permitir su reparto entre shards,
no prometer menos minutos acumulados de runner.

El shard 8 completo pasó localmente con `CI=true`: 9/9 en 1.2 min, sin
reintentos. Se usó la configuración de producción salvo el arranque de preview:
se levantó manualmente con el loader runner por la restricción local de OneDrive.
Ese commit enumeraba 75 casos; el listado actual se obtiene con
`npx playwright test --list`. El reparto sigue siendo de ocho shards.
La configuración/copia temporal del diagnóstico no forma parte de la entrega.
Los dos casos de Inicio pasaron también en desktop con CI=true (16.7 s en
total); typecheck, build local y los 528 tests unitarios siguen correctos.
Permanece el warning previo de chunk JS >500 kB, no causante de este timeout.
GitHub debe confirmar el próximo run; este resultado no es un deploy remoto.

Fuentes oficiales consultadas el 30-09-2026:
[presupuesto completo por test](https://playwright.dev/docs/test-timeouts),
[casos independientes](https://playwright.dev/docs/test-parameterize) y
[sesiones CDP](https://playwright.dev/docs/api/class-cdpsession).

## Smoke 4: duplicado de progresión Projectile — 28-09-2026

El shard 4 agotó el timeout de 35 s mientras esperaba la primera subida de
nivel en la ruta de Projectile. En ese mismo shard ya se ejecutaba otro caso
que inicia la misma ruta, espera `projectile_rank_2`, la elige y comprueba el
rango 2/6; ese caso pasó. Se eliminó únicamente el duplicado con timeout
reducido. El comportamiento del juego y la cobertura de progresión se conservan
con el caso restante, cuyo presupuesto de CI es 120 s. No se ha repetido el
workflow completo de GitHub desde este cambio.

## Smoke 3: XP insuficiente antes de morir — 28-09-2026

`abre y resuelve un level-up en gameplay normal` no era solo lento: la captura
local terminó en game over con 6 bajas/6 XP, antes del umbral de 8. El bot
recorría un cuadrado corto alrededor del centro y luego quedaba quieto mientras
esperaba el level-up. El caso ahora usa, dentro del contexto aislado de
Playwright, las mejoras permanentes máximas de daño/cadencia y un recorrido más
amplio; sigue ganando XP mediante bajas reales y conserva las aserciones de las
tres cartas y el reroll. Timeout total: 90 s, sin ampliar reintentos. Pasó tres
veces en la validación local dirigida; el workflow de Actions aún debe confirmar
el arreglo.

## Incidente de Pages — 27-09-2026

El run más reciente falló en cuatro de 64 pruebas browser. Dos esperaban un
catálogo de seis fondos aunque `BackgroundDefinitions` ya declara siete; ahora
comparan cantidad e IDs/orden directamente con esa fuente, evitando que el test
se desactualice cuando crece el catálogo. Una prueba móvil de entrada tomaba
captura y luego intentaba omitir una intro premium de 2.6 s. Ahora comprueba y
pulsa el botón tan pronto es visible; la captura manual queda solo para ejecución
local (Playwright conserva sus artefactos automáticos de CI). La matriz móvil
duplicaba además el viewport 1280×720, ya cubierto por el proyecto desktop; se
quitó solo esa repetición, conservando 320×568, 390×844 y 640×360 en mobile.

Validación local del arreglo: build local, typecheck y 493 tests Vitest pasan;
los dos casos desktop y cinco casos móviles enfocados pasan con `CI=true`.
Falta confirmar el workflow completo en GitHub Actions; el resultado local no
certifica el rendimiento del runner Ubuntu.

## Incidente de septiembre de 2026

Actions informó `Test timeout of 60000ms exceeded` en un caso que recorría
skins, cañones, fondos, laboratorio y audio. La operación en la que termina
el presupuesto total no prueba que esa operación haya consumido los 60 s.
El log no demuestra un fallo de scroll, audio ni un crash previo del browser.
Los errores de sesión cerrada/desconexión al finalizar necesitan contrastarse
con la traza; pueden aparecer durante el cierre por timeout.

La prueba original pasó localmente incluso antes del parche de scroll. Ese
parche volvió a fallar en Actions y se retiró el scroll asíncrono a SFX.
Se conserva el retorno al inicio del panel al salir de Skins/Meta.

## Incidente de Pages — 22-09-2026

El run de Actions procesó 62 casos durante 12.3 minutos y falló con 61/62.
La prueba de pausa buscaba `#pause-overlay button svg` y contaba también el
icono de `#pause-withdraw`, que permanece montado pero tiene `[hidden]` en
campaña. La expectativa de cuatro iconos era para botones visibles. El selector
y la comprobación de hit areas ahora excluyen controles ocultos.

Se ensayó dividir la suite en dos workers con `fullyParallel`. En Windows pasó
62/62 en 6.0 minutos, pero el siguiente run de Actions se degradó severamente:
Chromium registró 2–3 FPS, cerró sesiones y varios tests agotaron sus 35–60 s.
Los errores en cascada muestran que ese paralelismo sobrepasa el presupuesto
real del runner compartido. Se revirtió a un worker
y ejecución por archivo (`fullyParallel: false`); se conserva toda la cobertura,
el retry único y las trazas. Con esa configuración, la suite volvió a pasar
62/62 en 5.5 minutos localmente. Typecheck y 466/466 tests unitarios también
pasaron. La duración real de Actions debe confirmarse en el siguiente run; el
resultado local en Windows no predice el rendimiento Ubuntu.

## Contrato de pruebas

- Compras de skins, cañones, fondos, mejora permanente y configuración son
  cinco casos aislados. Cada compra verifica selección/nivel, save y débito;
  audio conserva la navegación Skins → menú → Meta → menú → Configuración
  → Jugar. La cobertura de gameplay, calidad y móvil continúa activa.
- El timeout global predeterminado es 60 s; algunos escenarios extensos lo
  ajustan de forma explícita. Las acciones tienen 15 s y navegación 30 s para
  distinguir una espera puntual del agotamiento del caso completo.
- Un worker por runner para evitar que boots WebGL, screenshots y pruebas de UI
  compitan por CPU/memoria. CI reparte los casos entre ocho runners; local
  sigue con un worker para depuración reproducible. Se mantiene un reintento;
  no aumentarlo para tapar fallos.
- CI graba traza en el primer reintento. `retain-on-failure` graba todos los
  casos antes de descartar los exitosos; resulta costoso con DOM SVG extenso.
  Local mantiene `retain-on-failure` para diagnóstico sin reintento.
- Las pruebas de pausa cuentan solo controles visibles; acciones exclusivas de
  Overdrive pueden seguir montadas en el DOM bajo el atributo `[hidden]`.
- El workflow conserva HTML, capturas, contexto y trazas por siete días para
  cada shard, incluso si el reintento pasa. Revisar la clasificación flaky en
  el HTML.
- Límite de job: build 20 minutos, cada shard browser 25 minutos y deploy 10
  minutos. No son objetivos de rendimiento ni sustituyen los timeouts por acción.

## Reproducir y diagnosticar

Corrección 02-10-2026: `playwright.config.ts` inicia `node scripts/qa-preview.mjs`
con un único proceso Node/API Vite (sin npx padre), strictPort y cierre acotado.
CI conserva por 30 días `local-source-maps-<commit>`: contiene los `.map` y los
bundles JS/CSS exactos del build local, descargables desde la sección Artifacts
del run de GitHub Actions. Los bundles de diagnóstico conservan su comentario
`sourceMappingURL` enlazado al mapa correspondiente; los mapas tienen
`sourcesContent` para asociar errores del bundle con TypeScript/CSS original.
No se incluyen en Pages. `dist/pages` se prepara desde `dist/local` quitando
`.map` y sólo esos comentarios finales; `scripts/check-build-budget.mjs` aplica
el tope de 15 MB al payload publicado (Pages/Poki/CrazyGames). No se borran los
mapas diagnósticos. La descarga inicial ≤5 MB se verifica en los nuevos checks
browser de recursos.
Esto no certifica un portal ni FPS de móvil físico. [Seguimiento](audits/CORRECCIONES_RECURSOS_2026-10-02.md).

1. Ejecutar `npm run build:local` para que preview sirva el código actual.
2. En PowerShell: `$env:CI='true'` y después `npx playwright test`.
   En bash: `CI=true npx playwright test`.
3. Para un shard: `npx playwright test --shard=1/8`; para un caso:
   `npx playwright test --project=desktop --grep "presenta el menu inicial"`.
4. Descargar `playwright-report-<shard>` del run fallido o flaky. Abrir su
   carpeta HTML con `npx playwright show-report <carpeta>` y la traza con
   `npx playwright show-trace <ruta/trace.zip>`.
5. Examinar duración de acciones anteriores, DOM, consola, red y punto exacto
   de desconexión. Un pase en Windows no certifica el runner Ubuntu.

La concurrencia `pages` prioriza el push más reciente. `Cancelled` por otra
ejecución no significa que el build haya fallado. Validar siempre el run del
commit más reciente; relanzar uno viejo puede competir con él.

No omitir checks ni usar `force`/eventos sintéticos para hacer pasar controles
no interactuables. No prometer estabilidad permanente de servicios externos.

Fuentes oficiales consultadas el 10-09-2026:
[CI](https://playwright.dev/docs/ci),
[timeouts](https://playwright.dev/docs/test-timeouts),
[trazas](https://playwright.dev/docs/trace-viewer).
