# Arsenal PNG — 30-09-2026

Extensión solicitada por el usuario de la carga magnética a las seis familias,
sus doce evoluciones y el escudo recargable. El lote inicial no cambia reglas.
Revisión de balance 07-10-2026: todas las evoluciones suben el daño por impacto
(+25%; Rail Lance aplica +50% al primero y conserva al menos +5% hasta el
quinto, con un intervalo de disparo 10% mayor).
Singularity Return se divide al 90% del alcance base, con seis fragmentos
guiados de +25% de daño y 2 s de vida; admite hasta tres abanicos simultáneos
en su pool de 18.
Comet Quintet conserva su alcance compacto y retorna 15% más rápido para no
bloquear el relanzamiento. Compression Wave apunta en sentido contrario al
movimiento del jugador. Closed Circuit y Thunderhead conservan sus blancos y
efectos, ahora con +25% de daño directo/explosión. Las dos ramas de cadena
crecen +1 blanco/+30u con Cobertura, hasta tres compras.
Fuente de procedimiento: [Arte híbrido](../../../../docs/design/ARTE_HIBRIDO.md).
La aceptación artística final y la medición en móvil físico siguen pendientes.

## Inventario y procedencia

21 imágenes nuevas, generadas con la herramienta integrada image_gen y
`transparent_background=true`. No son arte de las cartas ni SVG convertidos.
Maestros originales conservados fuera del bundle: rutas y prompts literales
en [manifest de generación](../../../../scripts/arsenal-image-sources.json).
Algunos prompts literales incluyen el prefijo accidental `undefinedSubject:`;
no representa un requisito artístico. El flag de transparencia fue explícito.
Pulse Volley se regeneró tras detectar un rectángulo oscuro; el manifest apunta
al reemplazo aprobado por QA técnica, no al primer resultado.

Optimización mecánica: Pillow/LANCZOS sobre el frame completo, sin pintar,
inventar alpha ni recortar el pivote. Repetible con
`scripts/prepare-arsenal-art.py` si están disponibles los maestros del manifest.

| Asset | Frame | Bytes PNG |
| --- | --- | ---: |
| orbit | 128×128 RGBA | 21,672 |
| solar_crown | 128×128 RGBA | 19,653 |
| graviton_halo | 128×128 RGBA | 22,361 |
| boomerang | 128×128 RGBA | 14,077 |
| twin_comet | 128×128 RGBA | 11,616 |
| singularity_return | 128×128 RGBA | 23,246 |
| projectile | 128×128 RGBA | 17,788 |
| rail_lance | 128×128 RGBA | 14,709 |
| pulse_volley | 128×128 RGBA | 10,090 |
| chain | 128×128 RGBA | 15,775 |
| closed_circuit | 128×128 RGBA | 6,782 |
| thunderhead | 128×128 RGBA | 22,830 |
| pulse_ring | 256×256 RGBA | 81,905 |
| echo_shock | 256×256 RGBA | 72,984 |
| compression_wave | 256×256 RGBA | 56,098 |
| event_horizon | 256×256 RGBA | 102,009 |
| polar_collapse | 128×128 RGBA | 11,732 |
| recharging_shield | 256×256 RGBA | 64,342 |
| thunderhead_burst | 256×256 RGBA | 76,416 |
| singularity_split | 128×128 RGBA | 14,180 |
| singularity_shard | 128×128 RGBA | 10,050 |

Total nuevo: **690,315 bytes** (reemplazo Closed Circuit: −1,002 bytes).
RGBA descomprimido teórico: **2,555,904 bytes** (+384 KiB),
sin mipmaps/overhead ni copias del navegador. No es una medición de GPU/FPS.
Se reutilizan los cuatro PNG existentes de Magnetic Charge para núcleo,
estela, campo y detonación magnética, sin duplicar archivos en el bundle.
Thunderhead y Singularity ya no reutilizan esa detonación.

## Registro y lectura

- Piezas 128², anchor (0.5,0.5), frente de disparos hacia +X; giro de órbita/
  búmeran usa estado real. Siluetas distintas: estrella, corona solar, luna
  gravitacional, V, doble cometa y tríada singular.
- Aros 256²: radio material nominal 110 px, centro abierto y escala por radio
  lógico. No deformar en X/Y. El material es decorativo, no una hitbox.
- Compression Wave: centro del círculo en (72,128), anchor (0.28125,0.5),
  radio frontal 128 px. Mantener ese registro al regenerar, comprobar contra
  la dirección capturada; nunca recentrar por bounding box.
- Carga magnética mantiene los anchors registrados de su prototipo: núcleo
  (0.4907,0.4938) y apertura de detonación (0.5075,0.5023).
- Ribbons: extremos reales, posición media, ángulo del segmento, ancho estable.
  Closed Circuit reemplaza las dos líneas paralelas por filamentos trenzados
  cian/esmeralda con tres diamantes. Conceptos descartados: rayo jagged único
  (demasiado similar a base) y tubo volumétrico (parece estela magnética).
  Procedencia: herramienta integrada image_gen, transparencia real; master
  1280², alpha [0,255], final 128², bbox alpha (0,53)–(127,74), pivot (0.5,0.5).
  Prompt literal y maestro en el manifest; generación sin imagen de referencia.
  Registro vertical del ribbon: 24px nominales para esta franja de 21px,
  tamaño decorativo 17u; no escalar usando el margen transparente del frame.
  Daño conserva su cápsula de ancho 10u; el halo no amplía la hitbox.
  Polar conserva sus tres segmentos radiales de 24u y el disco final publicado
  por simulación: no pinta un triángulo lleno ni agranda el daño.
- Event Horizon permanece durante la atracción y se disipa; jamás termina con
  una explosión. Polar muestra el doble pulso mediante el contador real.
- Echo sigue el radio de ida/regreso; Compression sigue sus tres emisiones,
  no se añaden casts falsos. Echo se desvanece al radio contraído de 30 u,
  tanto en raster como fallback; no reinicia el radio máximo al acabar.
- Thunderhead tiene una descarga dorada ramificada de 256²; la frontera fina
  conserva su radio físico de 70 u. Singularity usa apertura violeta de tres
  brazos de 128², radio decorativo 42 u, y filos individuales de 128² orientados
  según velocidad, sin giro decorativo. La apertura no daña ni indica un AoE.
- Escudo: cúpula de radio 33u, alpha según recarga, una segunda cúpula breve al
  bloquear; arco fino conserva progreso exacto. No significa más resistencia.
- Los cosméticos de cañón mantienen sus cabezas/curvas/estelas authored.
  PNG reemplaza cuerpo básico/evolucionado; otros paquetes reciben material
  PNG en el glow ya presupuestado, no se añade una instancia por bala.

## Ownership, carga y coste

`ArsenalTextures` es propietario de un catálogo cerrado de 25 entradas durante
la sesión de presentación. No carga nada al importarse. Primera utilización:
Image asíncrona → decode → Texture; una sola solicitud por entrada, éxito o
fallo. Los sprites no destruyen esas texturas compartidas. Callbacks sólo
actualizan caché, nunca una vista reseteada/destruida. Volver al menú no recarga.
Un fallo de red/decode/upload mantiene fallback, sin reintento por frame.
Las variantes magnéticas esperan el pack entero. La base conserva su pack
aprobado y su loader; usar base y evolución en la misma sesión puede retener
dos Image/Texture de los recursos compartidos aunque la URL se cachee. El coste
de esa duplicación es acotado a las cuatro texturas antiguas, no por cast.

`RasterArsenalView`: 6 cuerpos orbitales, 8 búmeranes/8 estelas, 13 ribbons,
13 impactos/2 explosiones, 4 ondas/pulsos y 7 piezas magnéticas; 61 sprites
preasignados y una frontera Graphics fina. Escudo: 2 sprites.
Los proyectiles reutilizan el pool existente. No nuevos filtros, shaders,
dependencias, partículas, timers ni RAF. Aros, estelas y explosiones van
debajo de enemigos; cuerpos/ribbons debajo de hazards/player.
Low conserva arte funcional con menor alpha y sin estelas/acento extra;
High añade sólo decoraciones acotadas. Reduced-motion elimina giros
decorativos, no trayectoria, onda real, fases ni información.

## Prueba local

- Base: `/?weapon-path=projectile|orbit|chain|boomerang&debug=1&quality=high`.
- Pulse: `/?weapon=pulse-ring&debug=1&quality=high`.
- Magnetic: `/?weapon=magnetic-charge&debug=1&quality=high`.
- Evolución aplicada: `/?evolution=<slug>&scenario=mass&debug=1&quality=high`.
  Slugs: rail-lance, pulse-volley, solar-crown, graviton-halo, closed-circuit,
  thunderhead, twin-comet (Comet Quintet), singularity-return, echo-shock,
  compression-wave, event-horizon, polar-collapse.
- Usar `quality=low` para comparar, y `scenario=single` para blanco único.
  Son rutas existentes de desarrollo; no escriben progreso.
- Galería y capturas ignoradas en `test-results/arsenal/`.
- QA automatizada reproducible: `node scripts/qa-arsenal.mjs` con preview local
  en 4173; permite filtrar con slugs como argumentos. Inspecciona las texturas
  efectivamente visibles con el hook de desarrollo de Pixi y congela mediante
  el botón real de pausa, no alterando la simulación. No ejecutar mientras
  se reconstruye dist: el preview sirve esos archivos.
- Bases, escudo, reinicio y las doce evoluciones sin PNG:
  `node scripts/qa-arsenal-lifecycle.mjs`. Para adquirir el escudo manualmente:
  `/?card=recharging-shield&debug=1&quality=high`, seleccionar la carta.
- Tests del compositor, loader, fallback y shield en
  `src/presentation/pixi/weapons/`. No confundir emulación con móvil físico.
- Transiciones puntuales: `node scripts/qa-weapon-transitions.mjs` comprueba
  Thunderhead con descarga propia, apertura y seis filos Singularity y fade
  pequeño Echo en Low/Pixel 5 emulado y High. Input y pausa usan la UI real.

## Evidencia del lote inicial

Typecheck y 118 archivos/548 tests unitarios correctos; builds local/Poki/
CrazyGames correctos. Diez smokes desktop dirigidos (incluye pérdida/recuperación
de contexto WebGL) y tres móviles de entrada,
joystick/pausa/rotación y control touch correctos. Veinticuatro
sesiones de evolución Low/Pixel 5 emulado y High/1280×720 mostraron realmente
el PNG correspondiente, sin pageerrors ni errores HTTP. Seis bases y escudo
también mostraron el material; vuelta a menú/inicio funcionó. Las doce
evoluciones siguieron ejecutándose al abortar todos los PNG (fallback).
Sonda separada de 15 s en Chromium headless, PC local, 390×844/DPR1 Low,
`/?stress=1&debug=1&profile=1&quality=low`, después de Jugar: 250 enemigos y
300 proyectiles, cero pageerrors, frameP95 33.40 ms, frameMax 33.40 ms y heap
JS reportado 16.3 MB. Ese stress ejercita proyectiles, no todas las armas/FX
a la vez. No hay comparación antes/después; el ticker medido no certifica
CPU/GPU ni rendimiento del móvil. La primera sonda en menú se descartó.
No son runs completas ni mediciones de GPU/móvil físico. Permanece
el warning previo de chunk JS >500 kB. Falta aprobación artística humana.

## Evidencia de la revisión puntual

Typecheck; 118 archivos/556 tests correctos con `--maxWorkers=2`; tres builds
local/Poki/CrazyGames; tres smokes desktop (evoluciones, pulso y recuperación
WebGL) y uno móvil (joystick, pausa, rotación) correctos. Seis capturas de
transición Low/High muestran las texturas específicas y el Echo contraído,
sin pageerrors/HTTP errors. Bases/escudo/menú y doce fallbacks repetidos correctos.
Una repetición paralela inicial no arrancó por memoria local (Node spawn);
el reintento secuencial y limitado sí pasó. No atribuirlo a CI ni a gameplay.
Después reapareció la falta de memoria en pruebas adicionales: el Vite local
PID 25268 tenía ~28,350 MiB privados; Windows sólo ~720 MiB virtuales libres.
Reiniciado con autorización del usuario, localhost:5173 y LAN disponibles.
No hay evidencia suficiente para atribuir su crecimiento a estos assets o al watcher.
Sin medición nueva de rendimiento ni aprobación en móvil físico. La nueva
Singularity necesita aceptación humana; no se afirma cierre del balance.

## Evidencia del ajuste de seis fragmentos y crecimiento de cadena

Typecheck y 118 archivos/566 tests correctos; tres builds local/Poki/CrazyGames.
Tres smokes desktop (compositor, decisión Closed/Thunder y doce drills aplicados)
y uno móvil (joystick/pausa/rotación) correctos. Seis sesiones de las tres armas
Low/High y seis transiciones sin pageerrors/HTTP errors; se observaron los seis
filos Singularity, no solo el portador. El compositor se verifica además con
13 enlaces y seis filos en Low/High sin crear sprites al repetir120 frames.
Reservas con dos filos antiguos probadas; crecimiento y limpieza/reset correctos;
tick de Circuito único por enemigo incluso con tres cables solapados, probado
a30/60/144Hz. Sustitución Closed Circuit inspeccionada en alpha y gameplay.
Registro vertical ajustado a su franja real para no perder los diamantes al
reducirla. Tres builds y los tests del compositor repetidos tras ese ajuste.
No nueva medición de rendimiento: emulación no certifica móvil físico.
Daño y aceptación visual de la revisión siguen pendientes de prueba humana.
