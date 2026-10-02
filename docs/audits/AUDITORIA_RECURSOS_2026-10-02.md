# Auditoría de recursos, carga y preparación de publicación

Fecha: 02-10-2026. Código inspeccionado: `d793740` (`node solucion`).
Windows x64; Node **24.19.0**, libuv **1.52.1**, npm **11.17.0**, Vite **7.3.6**,
PixiJS **8.20.0**, Chromium de Playwright.

Alcance autorizado: diagnosticar Node/Vite, recursos del juego y carga tardía,
documentar riesgos prepublicación y depurar documentación. Esta entrega **no
corrige producción, no cambia versiones/balance/saves y no publica**. Se añade
un script de diagnóstico, no otro sistema runtime.

## 1. Dictamen

- **No se reprodujeron los gigabytes de Node/Vite** con el runtime y watcher
  actuales. La mitigación pasó una repetición con los tres builds, pero no se
  conoce con certeza el disparador del episodio histórico de ~30 GB.
- **La carga tardía tiene causas de código confirmadas:** boot no espera el arte;
  menús montan imágenes al abrir; poderes piden texturas desde el primer render.
  Un fallback puede convertirse en PNG a mitad de un ataque.
- **No se demostró una fuga ilimitada en reinicios normales.** Pools, escena y
  listeners se reutilizan. Hay costes acotados, subida de heap que exige prueba
  larga y deuda de destrucción; no declarar «sin fugas» con esta muestra.
- **Se reprodujo recuperación incompleta del audio** después del unlock inicial.
- **No está listo para cierre comercial:** EX-09 sigue pendiente, los targets
  componen `LocalPlatform`, falta inglés/i18n y las puertas de recursos no están
  completamente automatizadas en CI.

## 2. No confundir tres problemas distintos

| Medida/síntoma | Dónde vive | Qué no demuestra |
| --- | --- | --- |
| RSS/heap/external de Vite | Proceso Node de desarrollo | No mide la simulación o las texturas de Chromium. |
| Memoria privada/comprometida Windows | Proceso/sistema | No equivale sólo al heap JS; puede incluir fuga nativa. |
| Heap retenido tras GC y DOM/listeners | Chromium | No incluye toda la memoria de imágenes/GPU. |
| Imagen que aparece tarde | Red, decode, preparación/render | No prueba fuga: puede ser lazy loading mal coordinado. |
| Textura residente después de usarla | Caché/escena/GPU | Puede ser retención intencional acotada, no acumulación por disparo. |

No aumentar heap, paginación o presupuestos como supuesto arreglo. Si reaparece
un proceso de gigabytes, identificar PID/comando/runtime y medirlo. No tomar un
heap snapshot gigante cuando Windows ya está cerca de agotar memoria.

## 3. Evidencia de esta sesión

### Node/Vite

`node scripts/qa-vite-memory.mjs --watch=fixed --seconds=180 --builds`:
un Vite, un Chromium en menú Low, builds secuenciales y corte RSS de 768 MiB.
No se ejecutó de nuevo Node 22.14.0 ni se detuvo un proceso del usuario.

| Dato | Resultado |
| --- | ---: |
| Duración total | 229.3 s |
| RSS pico muestreado, incluido calentamiento | 248.91 MiB |
| RSS final | 56.96 MiB |
| Heap JS usado final | 68.08 MiB |
| External / ArrayBuffers finales | 10.18 / 0.57 MiB |
| Eventos en `dist/**` | 0 |
| Builds development / poki / crazygames | 3 correctos |
| Errores JS del menú | 0 |

Antes de las pruebas, los dos procesos Node observados rondaban 21 MiB privados
cada uno. No había un Vite antiguo de gigabytes en esa muestra. RSS puede bajar
al salir páginas del working set: no interpretar su descenso como ahorro permanente.
Builders y Chromium son procesos distintos del servidor medido. La pequeña
variación de heap tras calentamiento no demuestra fuga ni estabilidad durante horas.

Informe y antecedentes: [VITE_MEMORY](../performance/VITE_MEMORY.md).
La [release oficial libuv 1.50](https://github.com/libuv/libuv/releases/tag/v1.50.0)
confirma correcciones Windows de fugas de fs events; respalda investigar runtime/
watcher, **no prueba** la causa exacta de los ~30 GB. No se pudieron reconsultar
la fuente Node antigua/patch individual en esta sesión; su análisis histórico no
se presenta como evidencia nueva. Se conserva la hipótesis, no una atribución definitiva.

### Browser: carga fría, menús y reinicios

`node scripts/qa-resource-audit.mjs`, sobre `dist/local` nuevo, sin caché previa,
DPR 1, desktop 1280×720 y portrait emulado 390×844. Retraso artificial de **2 s
por request PNG/WebP**, no un ancho de banda/dispositivo físico simulado.

- Al ocultarse boot faltaba arte principal de Inicio en ambos tamaños.
- Al abrir Actos sus cuatro emblemas seguían pendientes; luego se completaron.
- Skins pasó de un preview inicial a ocho miniaturas listas tras la espera.
  El muestreo inmediato puede anteceder al layout/lazy intersection; no atribuir
  a ese primer conteo una garantía de disponibilidad.
- Veinte recorridos Skins/pestañas → Actos → Laboratorio → menú y diez inicios/
  pausas/salidas al menú terminaron sin errores JS/HTTP inesperados.

| Muestra post-GC | Heap MiB | Nodos de escena Pixi | Listeners CDP | Fuentes de textura de escena |
| --- | ---: | ---: | ---: | ---: |
| Menú inicial | 11.721 | 3953 | 126 | 48 |
| Recorrido 1 | 12.335 | 3953 | 161 | 48 |
| Recorrido 5 | 12.519 | 3953 | 161 | 48 |
| Recorrido 10 | 12.845 | 3953 | 161 | 48 |
| Recorrido 20 | 12.832 | 3953 | 161 | 48 |
| Salida de run 1 | 13.287 | 3953 | 161 | 48 |
| Salida de run 5 | 13.704 | 3953 | 161 | 48 |
| Salida de run 10 | 13.954 | 3953 | 161 | 48 |

La meseta de menús es buena señal. La subida de ~0.67 MiB entre run 1 y 10
necesita observarse más tiempo: no certifica fuga ni meseta definitiva. Eran
reinicios breves, no diez runs completas. El conteo de fuentes no incluye caché
global/GPU completa. En el primer informe `nodes` significa nodos Pixi; el script
actual distingue `sceneNodes` del contador DOM para evitar esa ambigüedad.

La primera observación de seis armas se pausó en level-up antes de 60 s y **no
se acepta como combate activo prolongado**. Se corrigió sólo el diagnóstico
para resolver cartas y registrar reloj/estados; repetición `--combat-only`:

| Calidad portrait | Ventana real | Reloj gameplay final | Heap post-GC 5 s → 60 s | Nodos Pixi | Fuentes de escena finales |
| --- | --- | --- | --- | ---: | ---: |
| Low | 60 s de observación más muestreo | 00:57 | 12.603 → 14.069 MiB | 2928 | 53 |
| High | 60 s de observación más muestreo | 00:57 | 13.869 → 15.574 MiB | 3953 | 61 |

Sin errores ni game over. Las pausas breves de cartas explican que gameplay no
alcance 60 s. Hay calentamiento de assets y DOM de cartas; la subida no demuestra
por sí sola una fuga. No es stress de densidad máxima ni prueba de transiciones
avanzadas/bosses dobles. FPS headless no certifica rendimiento móvil ni GPU.

**Audio:** después de completar los gestos del unlock inicial, suspender el contexto
y pulsar Volver en Skins: `running → suspended → suspended`. La UI continuó sin
excepciones, pero el contexto no se recuperó. El primer intento, antes de completar
el unlock propio de Howler, sí se recuperó por sus listeners iniciales; no se contó
como reproducción del fallo. Se indujo suspensión con `AudioContext.suspend()`;
no se midió todavía suspensión/retorno real en iOS o Android.

### Automatizadas y peso

- `npm run typecheck`: correcto.
- `npm test -- --maxWorkers=2 --minWorkers=1`: **120 archivos / 578 pruebas correctas**.
- Tres builds Vite correctos; warning de chunk >500 kB permanece.
- `node node_modules/@playwright/test/cli.js test --workers=1`: **81 casos correctos**,
  exit 0, 16.5 min incluyendo espera de teardown. El cierre fue asistido, no normal:
  ver QA-01 abajo. Archivo desktop principal: 9.1 min. Esta duración no es tiempo
  de compilación Vite; incluye escenarios/esperas y cierre de navegador/servidor.

**QA-01 · Entorno Windows · preview no terminó de cerrar:** después del último
caso y de salir el worker, el runner quedó esperando con los dos procesos propios
del webServer aún activos. Se cerraron exclusivamente PIDs 20716/30340, identificados
en el log de esta ejecución; entonces el runner imprimió `81 passed (16.5m)` y salió
con 0. No se tocaron procesos del usuario. La causa del teardown no está demostrada;
la consulta de procesos por CIM estaba denegada en este entorno. No afirmar que
es fuga, fallo del juego o que ocurre también en CI Linux. Reproducir cierre local
con un caso y preview gestionado por Playwright, observando PID/puerto; comprobar
que no queden servidores tras éxito/error/interrupción. No añadir un timeout mayor
como solución ni cambiar producción por esta incidencia de herramientas.

Al cerrar la sesión no quedaban listeners de QA en 4173/4175/5175; seguían los
dos procesos Node pequeños observados antes de la auditoría, sin detenerlos.

| Artefacto | Archivos | Bytes totales | Bytes sin sourcemaps |
| --- | ---: | ---: | ---: |
| Local | 126 | 13,664,691 | 8,758,417 |
| Poki | 115 | 8,757,868 | 8,757,868 |
| CrazyGames | 115 | 8,757,874 | 8,757,874 |

Chunk principal local **1,121,656 bytes**, gzip offline **293,353 bytes**.
La gzip calculada no demuestra compresión de red en Pages/portal. Artefacto total
no equivale a descarga inicial; no afirmar incumplimiento inicial de Poki sólo
porque el directorio supera 8 MB. Tampoco contar masters no importados de assets
como descarga. El completo está bajo el objetivo 15 MB; falta medir hasta gameplay.

Evidencia preservada (los directorios de pruebas pueden borrarse en otro QA):
[Vite](evidence/2026-10-02-vite-fixed.json),
[browser/carga fría](evidence/2026-10-02-browser.json),
[combate y audio repetidos](evidence/2026-10-02-combat-audio.json),
[resumen de validación y cierre asistido](evidence/2026-10-02-validation.json).

## 4. Hallazgos para corregir

P1: antes del cierre premium/publicación. P2: riesgo/coste acotado con corrección
concreta. P3: deuda condicionada al lifecycle. **Producción no fue corregida.**

### RES-01 · P1 · Boot no representa readiness visual

`src/main.ts:315–317`, `src/app/Game.ts:752–781`, `src/ui/StartScreen.ts:382,414–456`:
se espera inicio/plataforma, se revela Inicio y se oculta boot sin esperar portada
o equipamiento. `decoding=async` no es una barrera. Reproducido en carga demorada.

Preparar portada de orientación actual y recursos equipados esenciales, con plazo,
ready/error y fallback explícitos; revelar composición completa o fallback definitivo.
No cargar todo el catálogo ni añadir segundos artificiales al splash.
Regresión: carga rápida/lenta/fallida, rotación durante boot, CTA utilizable,
sin destello de partida ni espera infinita. Medir bytes/tiempo hasta estado útil.

### RES-02 · P1 · Arte de poderes se solicita en su primer render

`src/presentation/pixi/weapons/ArsenalTextures.ts:60–76`, `RasterArsenalView.ts:195–228`,
`CombatEntitiesView.ts:498`, `WeaponView.ts:334,353,560,625`,
`characters/player/RechargeableShieldView.ts:24`: la primera consulta inicia Image
y devuelve null. No hay prewarm al adquirir/evolucionar y el fallback puede cambiar
a PNG durante un cast. El getter es cacheado, no descarga una imagen por disparo.

Promesas/readiness compartidas de las recetas existentes; preparación selectiva en
pausa de cartas/transición y representación estable por cast. Decode no garantiza
upload GPU preparado: medir antes de añadir preparación selectiva del renderer.
Nunca retrasar daño/cadencia por arte. Probar primer cast de seis armas/doce
evoluciones y escudo con red lenta/error/cache caliente. Los tests actuales
garantizan lazy/fallback, no disponibilidad antes del primer ataque.

### RES-03 · P2 · Menús/cartas sin estado de carga coherente

`src/ui/skins/SkinSelectPanel.ts:69–90`, `TetheredPreview.ts:16`,
`src/ui/level-up/LevelUpOverlay.ts:250,276,330`, `index.html:89–92`,
`src/ui/start-panels.css:97,327–346`: mount al abrir, iconos lazy y fondos CSS
de vistas ocultas se solicitan al mostrarse.

Preparar primer viewport oportunamente y placeholder de tamaño estable; eager sólo
para visibles, lazy para fuera de pantalla. Preparar arte de la mano durante pausa.
Probar apertura/cierre mientras carga, scroll, compras, equipamiento, resize y
errores; texto/acciones siempre operativos sin destruir selección/foco.

### RES-04 · P2 · Dos loaders para el mismo paquete magnético

`WeaponView.ts:859–881` y `weapons/ArsenalTextures.ts:19–22,47–50,64–69` crean Image
distintos para las mismas cuatro URLs. Pixi 8.20 instalado cachea Texture.from(Image)
por objeto: HTTP compartido no implica textura/fuente compartida. Al usar base y
evolución pueden residir dos packs. Es duplicación finita, no fuga por cast.

Unificar adquisición/ownership en el registro consumidor del arsenal. Regresión
base → evolución → reset: mismas fuentes, anclas/fallback conservados y ningún
Sprite destruye una textura compartida.

### RES-05 · P2 · Recuperación incompleta de audio

`src/audio/AudioService.ts:53–70,85`: unlocked verdadero incluso con contexto null;
gestos posteriores no vuelven a music.unlock(), resume sólo abre gates/música si
fue solicitada. `ZzfxSfxBackend.ts:60` descarta con contexto no running. Howler
auto-suspende tras 30 s sin Howl activo; sus listeners iniciales pueden ocultar
el fallo en los primeros clics. Reproducción browser confirmada arriba.

Recuperar contexto desde gesto válido idempotentemente, sin reanudar la partida
pausada, y no marcar SFX listos sin contexto. Regresiones null → segundo gesto;
suspended después del unlock inicial; menú >30 s sin música; retorno iOS. No fuga.

### RES-06 · P2 · Mundo/debug siguen trabajando detrás del menú

`src/app/Game.ts:564,895–1029` recorre vistas/pools/HUD y crea strings/arrays incluso
en menu. Delta cero congela tiempo, no elimina render. `src/debug/DebugPanel.ts:13`
descarta el objeto cuando el caller ya lo construyó.

Reducir tick/render oculto y construir métricas sólo para consumidores habilitados,
conservando resize/context restore/UI. Comparar CPU/GC antes/después. Es presión
evitable, no retención demostrada ni razón para cambiar reglas/balance.

### RES-07 · P2 · Fallback eager de todo el catálogo de player

`characters/player/PlayerVisualAssets.ts:42–119` genera 46 texturas SVG: 28 piezas
de siete skins, 16 cañones, shadow/accent. `src/presentation/PixiGameView.ts:75`
lo ejecuta al construir la vista pese a gameplay PNG equipado.

Gasto acotado de arranque/residencia. Medir rasterización y preparar sólo equipado/
fallback cuando el registro lo permita. No borrar masters/prompts para «ahorrar RAM».

### RES-08 · P3 · Shutdown no es destroy reutilizable

`src/app/Game.ts:783–807` retira ticker propio/global listeners/input/observer/audio,
pero no destruye Application/raíz Pixi/texturas generadas ni cierra LevelUpOverlay
con selección pendiente de 220 ms (`LevelUpOverlay.ts:312`). Overlays conservan
handlers DOM. `main.ts:317` lo llama en beforeunload.

Actualmente existe un Game por documento; reiniciar reutiliza vistas/pools y salir
del documento libera recursos del navegador. **No demuestra fuga por reinicios.**
Antes de soportar desmontaje/remontaje en el mismo documento, ownership y destroy
idempotente, cancelación de callbacks/timers y regresión create/start/destroy.
Nunca destruir WHITE/EMPTY o fuentes compartidas desde cada Sprite.

### RES-09 · P2 · Peso optimizable y puertas de recursos sin enforcement completo

Cuatro placas opacas PNG Actos 640×426 suman **1,750,591 bytes**. WebP derivado
con comparación visual es una optimización concreta. Principal JS >1 MB minificado.
Dividir JS no garantiza por sí solo carga mejor ni elimina arte.

`.github/workflows/deploy.yml` verifica types/unit/build/browser pero no falla
por presupuestos de descarga inicial/completa/runtime del plan. Warning de chunk
no falla CI. Medir hasta gameplay y convertir presupuestos adoptados en checks
reproducibles; no subir límites para aprobar.

### RES-10 · P1 de release · SDKs comerciales pendientes

`src/main.ts:223` compone LocalPlatform en los tres targets. Hay directorios separados,
no init/lifecycle/rewarded/save real de portales. No distribuirlo como integración
terminada ni conceder recompensas de anuncio simulado en un destino comercial.
Es EX-09 pendiente, no regresión del pull.

Adaptador por entrega con init/error/timeout/adblock/callback duplicado y QA real
Inspector/Preview. CrazyGames Basic permite SDK opcional; el plan del proyecto
exige EX-09 y rewarded real requiere integración apropiada para Full. No añadir
anuncios automáticos por inferencia de una recomendación externa.

### RES-11 · P1 de release · Inglés/i18n no completado

index.html lang es, textos españoles embebidos en Inicio/overlays/cartas/contenido,
sin capa completa de claves/fallback inglés. Nombres técnicos ingleses no equivalen
a localización. Es puerta del plan y de
[CrazyGames Gameplay](https://docs.crazygames.com/requirements/gameplay/).

Catálogo ES/EN tipado, fallback inglés y locale portal cuando esté integrado;
QA de plurales, textos largos, botones y accesibilidad sin recortes.

## 5. Revisado sin evidencia de fuga ilimitada

- Arsenal: 25 IDs cerrados; nave/cañón: 16 URLs posibles. Fondos también acotados.
  Crecen al visitar contenido nuevo, no por clave única por disparo.
- Pools FX, números, proyectiles/trails y compositores reutilizan slots; reset
  limpia estados sin construir otra vista completa.
- Audio: voces máximas/cooldowns/cues finitos, desconexión onended y shutdown que
  cancela warmup/desconecta bus. FrameProfiler/baseline tienen buffers/historial acotados.
- Listeners de nodos descartados son recolectables sin referencias externas;
  reemplazar una tarjeta no prueba fuga por sí solo.
- Loaders raster permiten reintento tras fallo, pero el consumidor BackgroundView
  llama render sólo en rebuild/resize/selección, no por tick. No se encontró una
  tormenta de requests porframe por esa ruta; no documentarla como defecto actual.
- Búsqueda de imports Pixi/DOM/audio/plataforma en simulation: sin violación directa
  nueva encontrada. No sustituye auditoría formal de toda función.

## 6. Orden de las siguientes entregas

1. **RES-01/02:** preparación selectiva en presentación con consumidores reales;
   resolver RES-04 en esa frontera. Gameplay y saves intactos.
2. **RES-03:** primer viewport de menús/cartas, placeholders y fallos estables.
3. **RES-05:** recuperar audio con reproducción/test; no sustituir backends completos.
4. **RES-06/07/09:** perfil antes/después, trabajo oculto/derivados y checks CI.
   RES-08 sólo cuando se soporte desmontaje real.
5. **Sesiones largas:** 30–60 min Node dev con builds/HMR y Overdrive activo con
   cartas, transiciones, parejas, menús/equipado/restart/pause/resize/background.
   Node privado/RSS y browser post-GC separados; ante pendiente continua investigar
   referencias/resources antes de tomar snapshots gigantes.
6. **EX-09:** inglés/adaptadores/QA portal con artefacto exacto; después submission
   autorizada. No reabrir balance aprobado sin defecto concreto.

Guía: [PLAN_EJECUCION](../PLAN_EJECUCION.md). Cierre futuro por ID, commit, escenario,
antes/después, regresión y límites; no resolver un hallazgo con tests no relacionados.

## 7. Depuración documental

CONTINUACION 306 KB → 4.8 KB; guía de ejecución 85.6 KB → 11.4 KB:
aproximadamente **96% menos lectura operativa**. Históricos íntegros recuperables
en docs/archive, comparación contra HEAD y 75 enlaces rebasados. Nuevo
[índice documental](../README.md): contratos activos, evidencia fechada y propuestas.
README ya no ordena reinicializar este repositorio.

Se aclaran estados caducados de Infinito/Overdrive y eliminación de Expedition.
EX-02c cerrado; Laboratorio humano/EX-09 pendientes. Se conservan contratos,
prompts/licencias/procedencia y pruebas humanas útiles. No se eliminaron assets,
código ni evidencia necesaria; conservar una especificación implementada sí aporta
referencias para futuras extensiones. La limpieza no es optimización de RAM.

## 8. Fuentes y límites

Consultadas el 02-10-2026, fuentes primarias:

- [Vite 7 server.watch](https://v7.vite.dev/config/server-options#server-watch):
  root y exclusión outDir; outputs de todos los targets deben quedar fuera.
- [PixiJS Assets](https://pixijs.com/8.x/guides/components/assets),
  [garbage collection](https://pixijs.com/8.x/guides/concepts/garbage-collection):
  carga/caché/ownership; contrastar API también con 8.20 instalada.
- [Node 24.19 LTS](https://nodejs.org/id/blog/release/v24.19.0),
  [libuv 1.50](https://github.com/libuv/libuv/releases/tag/v1.50.0): contexto,
  no prueba del disparador histórico.
- [Poki SDK HTML5](https://developers.poki.com/guide/sdk-html5),
  [CrazyGames Technical](https://docs.crazygames.com/requirements/technical/):
  loading/lifecycle/SDK y límites iniciales. Verificar de nuevo al integrar.

No se aprobó publicación, SDK real, Safari/iOS, GPU o móvil modesto. No hubo
snapshot del Node histórico, VRAM completa, sesión de horas o prueba humana nueva
del Laboratorio. Ningún resultado headless sustituye esas puertas.

## 9. Reproducción y preservación

Después de typecheck/unitarios, construir con Vite los tres modes secuencialmente.
El probe Node ya hace esos builds con --builds. El probe browser usa preview en
4175 estricto y cierra servidores/Chromium en finally. Ejecutar **secuencialmente**:

```powershell
node scripts/qa-vite-memory.mjs --watch=fixed --seconds=180 --builds
node scripts/qa-resource-audit.mjs
node node_modules/@playwright/test/cli.js test --workers=1
```

`--audio-only` y `--combat-only` limitan el diagnóstico browser. Los JSON/capturas
se escriben en test-results/resource-audit; Playwright puede limpiarlos al comenzar.
Preservar evidencia necesaria antes, no copiar resultados antiguos como una prueba
del próximo checkout. El script observa; no falla automáticamente por un pop-in
o audio suspendido: revisar sus estados en el informe, no sólo exit code.

El fixture original usaba `acts.unlocked`, campo ignorado por la migración; el
script ya usa `unlockedActs`. Las muestras preservadas de Actos demuestran carga
del panel/emblemas, no entrada a todos los actos desbloqueados. Overdrive sí
estaba desbloqueado en el fixture; la suite browser verifica gating por separado.
