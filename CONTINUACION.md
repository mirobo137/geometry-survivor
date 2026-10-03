# Geometry Survivor — continuación operativa

Actualizado: 03-10-2026. Base Git de esta entrega: `7df6c92` (`arreglos auditoria`).
Este archivo es un snapshot, no reemplaza `PLAN_DESARROLLO.md` ni el estado Git.

## Solicitud vigente y siguiente acción

El usuario solicita usar su música para todo el juego. Integración local del
03-10: `src/assets/audio/music/general-theme.mp3`, misma pista en loop para
Inicio/consolas/resumen (70%) y actos/Overdrive (35%), multiplicados por el
control musical persistente. Fade de 450 ms; menú/partida no reinician el seek.
No modifica los SFX ni el save. Pausa/background detiene audio; recuperar foco
retoma sólo pantallas no jugables, no reanuda una partida pausada.
Contrato/procedencia: [Música general](src/assets/audio/music/README.md).

Original del usuario intacto fuera del repo: 8,788,430 bytes / 359.760 s
(el nombre dice 36.3s, pero dura casi seis minutos). Copia MP3 con pérdida a
32 kHz estéreo / 64 kbps: 2,878,892 bytes. Howler usa HTML5 Audio, no un buffer
Web Audio de seis minutos. Nada de MP3/AudioContext antes del primer gesto;
una pista/nodo musical y un contexto vivo compartido con SFX; sin timers
de reintento tras error. Prueba siguiente: aceptación auditiva del usuario de
compresión, volumen 35% en combate, fatiga/loop largo y móvil físico.
Verificar derechos comerciales antes de distribución; metadatos Suno no
equivalen a permiso. Sin commit/push/publicación autorizado.

Verificación: typecheck, 124 archivos / 607 unitarias verdes y tres builds;
14 smoke enfocados verdes (1.1 min) más dos RES-01 (7.7 s), desktop/Pixel 5
emulado: niveles nativos 0.70/0.35, slider/mute, posición continua, menú desde
pausa, blur/focus, red fallida/tardía, contexto suspendido y cero decodificación
Web Audio de música. Descarga inicial sigue bajo 5 MB. Chromium cancela tramos
bufferizados y sigue por otro Range: el smoke sólo excluye `net::ERR_ABORTED`
de esta pista HTML5; conserva errores reales/404 y todos los demás assets.
Artefactos completos: local 14,866,007 bytes con mapas, Poki 9,949,357 y
CrazyGames 9,949,363, bajo 15 MB; quedan ~134 KB de margen en local, por lo que
no añadir copias musicales ni subir bitrate sin revisar el presupuesto.
Warning previo JS >500 KB persiste. Suite browser completa, audición humana,
móvil físico, SDKs y deploy no ejecutados en esta ampliación.
Se conserva Vite 5173 del usuario (PID 1732), sin reiniciarlo ni duplicarlo:
148.6 MiB privados / 121.2 MiB RAM al chequeo (snapshot, no prueba de horas).
El preview temporal 4173/Chromium cierra al terminar cada grupo de pruebas.

Entrega anterior: personalizar Inicio con la nave equipada. Integración local
del 03-10: casco y nombre reales del catálogo, mismo PNG/proporción que Skins y
combate; cambia al equipar, comprar y recibir rewarded. No cambia al inspeccionar.
Al volver al menú/recargar lee `skins.selected`, sin otro save ni assets nuevos.
Un único casco DOM, carga finita y fallback SVG; sin nuevo loop/texturas Pixi.
Contrato vigente: [Inicio](src/assets/images/ui/home/README.md).
Prueba siguiente: cambiar nave en Skins y regresar a Inicio en PC/móvil.
Shaders/propulsión y derrota nueva siguen pendientes. Sin commit/push autorizado.
Validación de esta ampliación: `npm run build:local` correcto (typecheck y
unitarias), builds Poki/CrazyGames correctos y 18 smoke enfocados verdes en
1.1 min: ocho skins entre PC/móvil, inspección sin equipar, reload, compra,
rewarded, regreso desde combate, encuadre/rotación, carga lenta/fallida/tardía.
Capturas revisadas: `test-results/*Inicio-muestra*/home-violet.png` (PC) y
`home-obsidian.png` (móvil emulado). Sin regresión en los checks de animación.
Artefactos completos: local 11,986,224 bytes (con mapas), Poki 7,070,102 y
CrazyGames 7,070,108, bajo 15 MB. `survivor-core.png` queda conservado como
referencia, fuera del build; no se borraron assets. Persiste warning de chunk
JS >500 KB previo. Suite browser completa, móvil físico y deploy no ejecutados.
Se conserva el Vite del usuario en 5173 (PID 1732), sin reiniciarlo ni duplicarlo;
al cierre del chequeo: 139.6 MiB privados / 106 MiB RAM (snapshot, no prueba de horas).
El preview temporal 4173 y Chromium de las pruebas cerraron al terminar.

Entrega anterior del 03-10: balas/estelas PNG más vistosas y más tamaño de cañones en
combate y Skins. Entrega local: ocho paquetes originales (16 PNG, 86,229 bytes)
y cañones +20% visual (24×31.2, mismo pivote). Cabezas 36×18; Low conserva PNG
sin descargar/renderizar cintas. Medium/High reutilizan cuatro bandas del pool
existente y caché compartida, con fallback y material estable por disparo.
Evoluciones conservan sus cuerpos PNG propios. Contrato, prompts y rutas:
[Balas PNG](src/assets/fx/projectiles/README.md).
No se autorizaron commit/push/publicación, ni cambios de balance/economía/saves.

Prueba siguiente: aceptación humana del tamaño/presencia de cañón y balas en
Skins/combate, especialmente móvil físico. Ruta existente de revisión:
`/?weapon-path=projectile&debug=1&cannon=helix&quality=high` (cambiar `cannon`).
No borrar el arte vectorial de fallback, ni volver a cargar todo el catálogo
al iniciar. Shaders/propulsión siguen pendientes; nave equipada en Inicio abordada arriba.

Verificación del 03-10: typecheck, 124 archivos / 601 unitarias y builds local,
Poki y CrazyGames correctos; 14 smoke enfocados pasaron en 1.9 min (desktop/móvil:
encuadre, compra, carga lenta/fallida, pausa/resize y doce evoluciones).
Artefactos completos: local 12,244,958 bytes con mapas, Poki 7,329,924,
CrazyGames 7,329,930, todos bajo 15 MB. Persiste warning previo del chunk JS
>500 KB; no bloquea el build ni es una medición de rendimiento físico.

QA de materiales: las ocho recetas en Low/High renderizaron PNG reales sin
errores; 300 cabezas por pool, Low sin petición/capa de cola y High con 480
sprites de cinta. Stress adicional con 250 enemigos/300 balas mantuvo todos
esos límites, cero errores. Evidencia/capturas: `test-results/projectiles/`.
El headless usa ANGLE/SwiftShader (software); sus FPS bajos no aprueban el
presupuesto físico ni demuestran una regresión sin comparación anterior.
Se informa el resultado/límite en [Balas PNG](src/assets/fx/projectiles/README.md).
No se ejecutó la suite browser completa en esta entrega ni se probó móvil físico.
Servidor de revisión iniciado con Node 24.19.0/Vite 7.3.6 en
`http://127.0.0.1:5173/`. El diagnóstico cerró su preview y Chromium al finalizar;
se deja sólo el dev server del proyecto para revisión humana.

La auditoría de recursos y sus correcciones quedaron en `main` (`7df6c92`).
Entrada histórica: [auditoría de recursos](docs/audits/AUDITORIA_RECURSOS_2026-10-02.md).
Conservar su evidencia y límites; este incremento visual autorizado no cierra
las puertas de publicación/SDKs/i18n ni las pruebas humanas pendientes.
La [guía de ejecución](docs/PLAN_EJECUCION.md) contiene la cola vigente.

Seguimiento: [correcciones por ID y evidencia](docs/audits/CORRECCIONES_RECURSOS_2026-10-02.md).
Verificación del 02-10 (no repetir como medición de esta entrega): typecheck,
595 unitarias y tres builds correctos (~7,26 MB runtime por target;
local completo con mapas: ~12,16 MB). Suite browser completa: 89 correctas / 9,4 min,
exit 0, cierre automático sin ayuda. Diagnóstico de recursos: 6 escenarios,
20 recorridos + 60 modales + 10 reinicios, cero errores. Vite completó 601,9 s, RSS final ~152 MiB,
sin errores ni eventos dist; no certifica una sesión de horas.
SDKs reales e i18n completo siguen EX-09, no cerrados. Los anuncios simulados
ya no conceden recompensas fuera del target local. No sustituir prueba larga ni
aceptación humana con estos checks; sin publicar.

## Estado que no hay que reconstruir

- Actos I–III, seis familias de armas, evoluciones, Overdrive, NOVA y flujo
  rewarded local están implementados. La aceptación humana de actos/Overdrive
  fue registrada el 22-09 y el baseline de balance EX-02c el 28-09; son evidencia
  histórica, no una medición de memoria ni QA del checkout actual.
- Laboratorio V2: once ramas, cinco rangos, ofertas rotativas y Vitalidad
  rewarded, con guardado. El usuario aplazó las pruebas humanas visuales/táctiles
  el 29-09; siguen pendientes según [su contrato](docs/design/LABORATORIO_META_V2.md).
- Catálogo actual: ocho naves y ocho cañones PNG. Naves muestra sólo casco;
  Cañones muestra módulo/disparo/estela. Gameplay combina nave, dos módulos y
  cables. Ver [NAVES_PNG](docs/design/NAVES_PNG.md) y procedencia en sus READMEs.
- Inicio, cartas, actos, fondos y arsenal tienen arte raster además de SVG/
  Graphics. No asumir «todo es SVG» ni prometer menor memoria por ser PNG.
- Música: Howler; SFX: ZzFX, coordinados por `src/audio/AudioService.ts`.
- `src/main.ts` aún compone `LocalPlatform` en todos los targets. Tener bundles
  `local`, `poki` y `crazygames` no significa SDKs reales ni QA de portal: EX-09
  permanece pendiente.

## Node/Vite y memoria: evidencia separada

La referencia del repositorio es Node 24 LTS (`.node-version`: 24.19.0); CI usa
la rama 24. El watcher actual excluye `dist/**`, reportes y temporales.
[VITE_MEMORY](docs/performance/VITE_MEMORY.md) conserva el incidente de Node
22.14.0 y pruebas acotadas posteriores: no demuestra el disparador exacto del
episodio histórico de ~30 GB ni certifica estabilidad durante horas.

Memoria del servidor Node, heap de Chromium, caché de imágenes decodificadas y
texturas/GPU son medidas diferentes. Carga tardía no prueba por sí sola una fuga.
Usar el informe nuevo para resultados de esta auditoría, no copiar cifras de
sesiones anteriores como si acabaran de medirse. No asumir que un Vite histórico
sigue activo: comprobar procesos/puertos antes de iniciar o detener servidores.

## Puertas pendientes antes de publicación

1. Resolver los bloqueantes reproducibles del informe de recursos, en una
   entrega autorizada y con regresiones concretas.
2. Comprobar carga fría/caché, navegación repetida, reinicios y sesiones largas;
   medir memoria y descarga de forma separada del game feel.
3. Retomar la prueba humana del Laboratorio y del arte de la flota; perfil físico
   en teléfono modesto sigue sin demostrarse por un móvil potente o emulado.
4. EX-09: adaptadores reales separados, lifecycle/ads/save, presupuestos de
   descarga efectivos, texto internacionalizable y QA en Inspector/Preview.
5. Sólo entonces preparar artefactos/metadatos y una submission autorizada.

OD-F01 (`Asalto`, ritmo de Overdrive por puntos) es
[propuesta futura](docs/design/OVERDRIVE_RITMO_POR_PUNTOS.md), no modo existente.
Expedition fue eliminado; no crear guardado ni pantallas para esa propuesta antigua.

## Para retomar aquí o en otra PC

Leer `AGENTS.md` → este snapshot → [§22 del plan](PLAN_DESARROLLO.md#ejecucion-vigente)
→ [guía vigente](docs/PLAN_EJECUCION.md) → skill/contrato de la tarea elegida.
Comprobar `git status --short --branch`, `git log -5 --oneline`, `node --version`
y scripts actuales antes de trabajar. Conservar cambios ajenos.

Las pruebas actuales, warnings y límites de la sesión están en el informe de
auditoría. Los resultados antiguos están fechados en los contratos/archivos;
no prueban que la suite actual completa haya pasado. Registrar el próximo ID
exacto tras cada entrega. Commit/push/deploy requieren autorización vigente.

Índice documental: [docs/README.md](docs/README.md).
Historial íntegro recuperable: [sesiones anteriores](docs/archive/CONTINUACION_HASTA_2026-10-02.md).
No volver a pegar ese historial en el snapshot; añadir sólo el estado vigente
y enlazar evidencia de sesión cuando sea necesaria.
