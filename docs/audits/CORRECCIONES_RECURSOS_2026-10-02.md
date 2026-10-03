# Correcciones de la auditoría de recursos

Fecha: 02-10-2026. Base Git: `76a6c78`; cambios locales autorizados por el usuario,
sin commit/push/publicación. Node 24.19.0, Vite 7.3.6, Pixi 8.20.0.
El [informe original](AUDITORIA_RECURSOS_2026-10-02.md) y sus cifras permanecen
como evidencia anterior; este documento no reescribe aquel diagnóstico.

## Alcance y estado por hallazgo

| ID | Corrección aplicada | Límite / comprobación restante |
| --- | --- | --- |
| RES-01 | Boot prepara orientación actual, emblema y nave/cañón equipados. Plazo de 2,5 s para DOM/recetas y 3 s para el conjunto, no espera artificial. Error/decode/timeout conserva UI funcional. | Chromium frío/lento/fallido cubierto; iOS físico y GPU upload no certificados. |
| RES-02 | Registro comparte promesas, decodifica una vez; prepara sólo armas equipadas/ofertadas y escudo. Material estable por slot/sequence para proyectiles, búmeran, pulsos, rayos/explosiones y carga magnética. | No altera simulación ni espera arte para hacer daño. La órbita/escudo continuos pueden adoptar material al quedar listo; no tienen un cast discreto equivalente. Preparación de GPU explícita pendiente si profiling la justifica. |
| RES-03 | Geometría reservada y estados queued/loading/ready/fallback; primer viewport eager, resto lazy. SVG de cañones difiere href hasta estar visible; modal prepara su propio arte. Placas CSS de Actos con fallback sólido. | Imágenes que vencen el plazo conservan fallback hasta nueva apertura/recarga; no se bloquean texto, compra o selección. Móvil físico pendiente. |
| RES-04 | El paquete magnético base consume las cuatro texturas del registro del arsenal, no crea otro Image/Texture para cada URL. | Caché finita por documento; una vista no destruye fuentes compartidas. |
| RES-05 | Cada gesto válido puede recuperar contexto suspendido; null no marca desbloqueo. No recrea SFX si el contexto es el mismo ni abre el gate de una partida pausada. | Unitarias y reproducción Chromium running → suspended → running; retorno/interrupción en iOS pendiente. |
| RES-06 | En menú no se recorren pools/HUD/FX; raíz del mundo oculta. Debug apagado no construye sus métricas; debug de menú habilitado se actualiza a 4 Hz sin mundo. | Se conserva resize/context restore; no se afirma una reducción porcentual de CPU sin comparación instrumental equivalente. |
| RES-07 | Fallback SVG memoizado por pieza/skin solicitada; alias Spearhead comparte cyan/basic. No rasteriza todo el catálogo al construir el registro. | Test mide 2 piezas comunes al crear registro, más piezas solicitadas; no es una medida de VRAM del driver. Masters intactos. |
| RES-08 | Shutdown cancela selección pendiente de level-up, invalida oferta async y cierra overlays antes de apagar audio. | Sigue existiendo un Game por documento. Desmontaje/remontaje completo y destroy de Application no se ofrecen ni se declaran probados. Implementar ownership antes de añadir ese consumidor, no borrar cachés compartidas desde sprites. |
| RES-09 | Cuatro placas WebP derivadas, con originales conservados. CI verifica artefacto completo ≤15 MB y regresión browser verifica descarga inicial ≤5 MB con cuerpos SIN comprimir (conservador). | Warning de chunk >500 kB permanece; no se elevó el límite. FPS/VRAM/red en portales y teléfono requieren medición real; code splitting no se declara resuelto. |
| RES-10 | Los targets no locales deshabilitan rewarded simulado, incluso con `?ad=rewarded`. | PARCIAL: adaptadores SDK reales, lifecycle/save portal y QA Inspector/Preview siguen EX-09, después de sus puertas. No publicar como integración terminada. |
| RES-11 | Sin implementación en esta entrega de recursos. | PENDIENTE: catálogo completo ES/EN + fallback y QA de toda UI/contenido; pertenece a EX-09 según la cola vigente. Traducir sólo portada no lo cierra. |
| QA-01 | Preview de Playwright usa un único Node con API Vite; sin padre npx/npm. Maneja cierre con plazo/conexiones y mantiene strictPort. | Suite completa de 89 casos terminó con exit 0, sin teardown asistido; procesos y puertos de QA comprobados al finalizar. |

No se reabren balance, economía, guardados, pools, catálogo, shaders ni Overdrive
por puntos. Las decisiones técnicas siguen rendering/mobile-performance,
platforms/validation y arquitectura canónicas: preparación selectiva, ownership
compartido, simulación independiente y puertas comerciales separadas.

## Contratos de carga que deben conservarse

- `ArsenalTextures`: un Promise y una Texture por ID; fallo queda cacheado,
  sin reintento por frame. `prepareArsenalTextures` deduplica y tiene deadline.
- `CastArt`: guarda sólo slots de pools existentes, no historial de ataques;
  null también es una decisión. Imagen tardía se habilita en el siguiente ataque.
- `ImageReadiness`: elimina listeners/timer al terminar. Una imagen de modal
  desconectada no restaura foco ni cambia otro modal al terminar tarde.
  Las manos de cartas y modales desconectan su IntersectionObserver al cerrar
  o sustituir contenido, incluso para imágenes que nunca llegaron al viewport.
- Menú no necesita render continuo del mundo. Commit de nueva nave compone
  su pose una vez; el siguiente frame real usa reloj/pose del juego.
- Ready de imagen significa carga/decode, no una garantía sobre subida GPU.
- `LocalAdService(false)` falla cerrado; no convertirlo en SDK de portal ni
  conceder rewards con callbacks simulados fuera del target local.

## Arte de Actos y presupuestos

Derivado reproducible: `scripts/derive-act-plates.py`, Pillow, RGB, WebP q88,
method 6, sin resize, recolor ni regeneración. Revisión visual individual de
los cuatro PNG y los cuatro WebP realizada; misma composición/tamaño 640×426.

| Placa | PNG bytes | WebP bytes | PSNR RGB |
| --- | ---: | ---: | ---: |
| Radial | 404892 | 53236 | 35,47 dB |
| Angular | 436700 | 60214 | 36,12 dB |
| Fracture | 431811 | 60490 | 36,36 dB |
| Overdrive | 477188 | 72650 | 34,38 dB |

Total: **1.750.591 → 246.590 bytes**, 85,9% menos descarga. Las dimensiones y
memoria RGBA teórica NO bajan: compresión no equivale a menor VRAM. Los PNG
originales ya no son importados por consumidores, pero siguen en `src/`.

`scripts/check-build-budget.mjs` falla por artefacto completo >15.000.000 bytes,
incluyendo mapas de depuración de local. No excluye assets. CI lo ejecuta tras los tres builds.
`resources.checks.ts` suma cuerpos descargados en carga fría sin compresión:
pasar ≤5.000.000 es conservador respecto al objetivo inicial comprimido del plan,
no una medición de CDN/Poki/CrazyGames ni del catálogo completo inicial.

## Verificación de esta revisión

[Resumen de comandos y resultados](evidence/2026-10-02-corrections-validation.json).

- TypeScript sin errores; **123 archivos / 595 pruebas unitarias** correctas.
- Tres builds emitidos correctamente; tamaño runtime aproximado **7,26 MB**
  por target, frente al límite de 15 MB. Sigue el warning previo de chunk.
  Artefactos completos finales: local **12.163.071** bytes (incluye sourcemaps),
  Poki **7.259.136** y CrazyGames **7.259.142**; los tres pasan el guard de CI.
- Dieciséis regresiones iniciales de carga/layout/audio/Manta correctas y
  diez focalizadas de cambio de nave/preview/carga correctas tras la revisión.
- Reproducción `qa-resource-audit.mjs --audio-only`: running → suspended →
  running, cero errores. No se sustituye por ella la prueba de iOS físico.
- Observación Vite completada: 601,9 s, RSS final 151,76 MiB / heap usado 69,15 MiB;
  cero errores y aserción de cero eventos dist correcta. Muestras privadas Windows
  separadas: 171,46, 191,98 y 191,82 MiB. No son una medición de peak privado.
  [Resumen persistido](evidence/2026-10-02-corrections-vite-summary.json).
- Suite browser completa final: **89 correctas / 9,4 min / exit 0**, un worker,
  sin servidor reutilizado ni teardown asistido. Incluye 71 casos desktop y
  18 mobile; no certifica Safari/iOS ni hardware físico. El aviso de archivo lento
  es informativo: CI conserva ocho shards y un worker por runner.
- Diagnóstico de recursos completo: **6 escenarios / 221,6 s / cero errores**.
  [JSON crudo de esta revisión](evidence/2026-10-02-corrections-browser.json).
  Incluye 20 recorridos, **60 aperturas/cierres de modales** (escenario ampliado,
  no idéntico al original) y 10 reinicios. Después del primer recorrido: listeners
  **157 → 157**, nodos DOM **2825 → 2823**, escena **3953 → 3953**; tras reinicios,
  listeners **158 → 158** y DOM **2855 → 2856**. Heap post-GC de menú **10,623 →
  11,036 MiB** y reinicios **12,039 → 12,901 MiB**: incremento pequeño, no una
  certificación de ausencia de fuga prolongada. Las fuentes en escena se mantienen
  en 48 durante estos ciclos.
  Con seis armas: Low **12,132 → 13,601 MiB**, High **13,382 → 15,123 MiB**, entre
  las muestras 5 y 60 s; gameplay efectivo final 56/59 s, sin derrota ni errores.
Estas cifras son heap de Chromium, no memoria privada de Node ni VRAM del driver.

Las primeras pasadas completas detectaron dependencias del viejo tick de menú:
commit de PNG, debug `paused: menu` y panel baseline opt-in. Se detuvieron, se corrigieron sus consumidores
(sin forzar clicks ni relajar expectativas) y se repitieron las regresiones.
La pasada interrumpida NO se contabiliza como una suite verde.
Otra pasada alcanzó móvil y detectó una carrera en su test de omitir intro:
la captura diagnóstica anterior al clic podía consumir la duración de la intro.
Se trasladó la captura después del clic y de verificar HUD; no se fuerza el clic,
no se amplían timeouts ni se omiten las aserciones de encuadre/visibilidad.

El JSON crudo de Vite en `test-results/` fue eliminado por el siguiente Playwright;
el resumen distingue muestras conservadas en stdout de una serie cruda completa.
Los diagnósticos independientes ahora escriben en `.tmp/resource-audit/` y
`.tmp/vite-memory/`, ignorados por Git y por el watcher, fuera de esa limpieza.
Al finalizar no quedaron procesos Node de QA ni listeners en 4173/4175/5175.
No adjudicar al juego la causa histórica de los 27–30 GB de Node. Sigue pendiente
la prueba 30–60 min con Overdrive/HMR y una sesión prolongada/dispositivo físico.

API de preview comprobada en la [documentación oficial de Vite](https://vite.dev/guide/api-javascript.html#preview)
y configuración de proceso en [Playwright webServer](https://playwright.dev/docs/test-webserver).

## Siguiente puerta

Después de la validación automática: aceptación humana del Laboratorio/flota,
perfil de móvil modesto y prueba larga de Node/browser por separado. EX-09 debe
implementar un adaptador comercial por entrega más el catálogo ES/EN completo;
necesita artefacto exacto y QA real de portal antes de una publicación autorizada.
