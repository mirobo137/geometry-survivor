# Nave vinculada — prueba visual, revisión 30-09-2026

Estado: cañones/cables y nave de una sola imagen **aprobados por el usuario**.
Skin nueva `spearhead` / Ivory Spear, GRATIS y equipable en Skins → Naves;
selección/propiedad persistentes con schema actual, sin pérdida de progreso.
Sustituye casco + propulsor. Migración del catálogo autorizada para próxima
sesión, no ejecutada aquí: [Naves PNG](../../../../docs/design/NAVES_PNG.md).
Contrato general: [Arte híbrido](../../../../docs/design/ARTE_HIBRIDO.md).

## Cómo probar

- Uso normal: Inicio → Skins → Naves → Ivory Spear → Desbloquear gratis y equipar.
- Ruta directa de desarrollo: `/?skin=spearhead&act=radial&cannon=basic`.
- Partida normal: `/?ship-preview=tether&act=radial&skin=cyan&cannon=basic`.
- Menú y vuelta a jugar: `/?ship-preview=tether&skin=cyan&cannon=basic`.
- Densidad: `/?ship-preview=tether&evolution=rail-lance&scenario=mass&debug=1`.
- Comparar `&quality=low` / `&quality=high` y la misma URL sin `ship-preview`.

La skin elegida se guarda en localStorage y funciona sin URL especial.
La opción histórica `ship-preview=tether` sigue como override de comparación:
esa opción no se guarda, la selección del locker sí. Esta skin incluye módulos
PNG aprobados y conserva el paquete de proyectil/estela sin sobrescribir
cannonSkins. Modelo PNG fijo es una excepción temporal; migración restablecerá
modelo de cañón por ID. Tarjeta estática y modal con movimiento suave y
reduced-motion; mismos PNG y dimensiones relativas que el juego.

## Una nave, cañones independientes

Verbo: **huir con la nave y responder con módulos vinculados**. Referencia:
`src/assets/images/ui/home/survivor-core.png`, conservada sin modificación.
ImageGen adaptó esa nave a cámara cenital, quitó los cuatro pequeños módulos
adosados y dejó el motor/pluma corta integrados en UNA imagen. Conserva proa,
alas fijas, reactor cian, titanio marfil, recesos azul marino y bordes dorados.
No es un SVG rasterizado ni una nave reconstruida por piezas.

| PNG | Maestro RGBA | Final | Bytes | Uso lógico/ancla |
| --- | --- | --- | ---: | --- |
| [tether-ship.png](tether-ship.png) | 1254×1254 | 256×256 | 65,997 | 56×64, centro 0.5/0.5 |
| [tether-cannon.png](tether-cannon.png) | 1217×1292 | 128×128 | 13,178 | 20×26, punta 0.5/0.08, dos instancias |

Eliminados del repositorio los derivados antiguos `tether-hull.png` y
`tether-engine.png` por petición explícita. Sus maestros generados permanecen
en la carpeta del host: recuperables allí, no por Git mientras fueran untracked.
Cañón y PNG del menú originales se conservan.

Frente: **−Y**. Centro del player y radio físico22 intactos. No interpretar
alas, cables ni módulos como nuevas zonas de colisión. Dos cañones comparten
textura; flash de daño comparte la imagen completa de la nave.
Los cables conectan dos puertos distintos `(±11,7)` a los conectores traseros
de los módulos, por debajo de la nave. Ocho segmentos por cable, capa oscura
y filamento cian; nunca rayos, daño, IA o física de cuerda.

Las puntas usan los slots reales `PROJECTILE_MUZZLE_OFFSETS`: `(±27,−11)`,
rotados con el tiro. Apuntado independiente del movimiento, sin suavizar para
no separar boca y proyectil. Los módulos se redistribuyen alrededor de la nave
al girar: no son drones libres. Retroceso visual24% del kick existente, sin
cambiar el spawn del tiro.

Orden: cables → nave completa → cañones → flash. PlayerView original queda
como fallback: sólo se oculta al cargar AMBAS texturas. Destello de boca y
escudo existentes siguen por encima, usando datos reales de simulación.

## Movimiento, calidad y lifecycle

La nave gira como una sola unidad con el movimiento. Propulsor/pluma están
pintados en el mismo PNG; NO tienen animación independiente en esta revisión.
Cable mantiene flexión de baja amplitud, menor curvatura en Low; reduced-motion
elimina oscilación. Sin filtros, timers, partículas ni pools extra.
Reloj de presentación congela la pose al pausar. Daño usa flash aditivo.
Derrota conserva desplazamiento/fade existentes de nave y módulos; no se
implementó una nueva animación de muerte. Reset/revive reutilizan instancias.

## Coste y propiedad

**79,175bytes (~77.3KiB) de archivos; 320KiB RGBA8 teóricos**, sin mipmaps,
cachés ni overhead. Frente al prototipo anterior: una descarga/textura y un
sprite menos; −11,524bytes de archivos y −64KiB RGBA8 teóricos.
Esto NO mide memoria total ni FPS. Las piezas/texturas originales todavía
permanecen asignadas ocultas para fallback: la ruta opt-in añade contenedor,
cuatro sprites (nave, dos cañones, flash) y una Graphics.
Una migración aprobada podrá sustituir la ruta antigua en lugar de retenerla.

Loader usa Image/Texture.from tras load; comparte Promise/fuentes durante la
aplicación y reinicios. Las vistas no destruyen texturas compartidas.
Error/decode mantiene originales; no reintenta por frame. Vista destruida no
recibe arte asíncrono. Sin skin u override no se cargan texturas Pixi; abrir
catálogo sí puede descargar los PNG para miniaturas lazy/caché de URL.

Los PNG mantienen alpha del generador: rango0–255, cuatro esquinas0.
Derivación sólo normaliza resolución con Lanczos y optimiza PNG; no fabrica
alpha ni dibuja SVG. Frames cuadrados; proporciones lógicas en TetheredAssets.

## Procedencia y prompts íntegros

Generados con **ImageGen integrado**, referencia del repositorio, no CLI/API
de pago ni placeholders. Prompt literal y maestro de cada asset:
[tether-image-sources.json](../../../../scripts/tether-image-sources.json).
Derivación: [prepare-tether-art.py](../../../../scripts/prepare-tether-art.py).
Runtime necesita sólo los DOS PNG versionados, no carpetas privadas del host.
Regenerar desde maestros o prompts/referencia; rutas de maestros no son assets.

## Siguiente experiencia propuesta, no implementada

Mostrar la nave equipada en Inicio reforzaría pertenencia y continuidad con
combate: el jugador vería su elección, no una nave genérica. Integrar la imagen
dinámica en el elemento separado `#start-mark` existente, sin hornearla en los
fondos portrait/landscape ni generar una portada entera para cada skin.
Una identidad/maestro por nave, derivados adecuados a menú/juego, carga sólo
del seleccionado y fallback. No hace falta desmontar la nave para conseguirlo.

Propulsión localizada podría añadirse después como overlay acotado o shader
limitado al motor; no deformar toda la imagen para simular empuje. Comparar con
un pequeño FX reutilizable antes de adoptar filtros; shaders no son gratis.
No existe medición física para afirmar cuál será más barato. Muerte nueva y
catálogo completo son decisiones posteriores a aceptar esta prueba.

## Verificación y aceptación

Unit: slots/pivotes en cinco orientaciones, puertos distintos, texturas
compartidas, conteo estable de CINCO hijos, daño/retroceso, pausa, reset,
decode/disposal y cabeceras RGBA/dimensiones/peso; ausencia de PNG obsoletos.
Smoke desktop/móvil: DOS descargas, pausa, resize y reinicio.
QA: `node scripts/qa-tethered.mjs` sobre preview4173, después de Playwright
(éste limpia test-results). Captura desktop/móvil emulado × Low/High y verifica
cero requests ordinarios/fallback con descarga del cañón abortada.

Validación anterior del prototipo: typecheck, 120 archivos/575 tests y builds
local/Poki/CrazyGames comprobados. Skin equipable: 120 archivos/578 tests,
typecheck, tres builds y cuatro smokes desktop/móvil pasaron tras repetir
secuencialmente por falta de memoria del Vite anterior. Detalles en CONTINUACION.
Warning preexistente de chunk JS >500kB permanece. Dos smokes y cuatro sesiones
QA Low/High desktop/móvil completados sin pageerrors; pause/resize/reinicio,
cero descargas ordinarias y fallback al abortar cañón comprobados. Capturas en
test-results/tethered; emulación no demuestra FPS en móvil físico.
Aceptación artística del PNG único confirmada. Falta prueba en móvil físico y
lectura de cables/módulos en densidad. No reabrir balance ni validar Laboratorio.
Sin commit/push.
