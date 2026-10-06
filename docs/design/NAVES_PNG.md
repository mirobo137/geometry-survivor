# Naves y cañones PNG

Contrato vigente para las naves y cañones raster, su animación y la selección en
el juego. El estado de aceptación y las puertas abiertas están únicamente en
[PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md). Dirección de producción:
[Arte híbrido](ARTE_HIBRIDO.md).

## Catálogo y contrato visual

- Diez naves: Ivory Spear, Aurora Strider, Eclipse Prism, Solar Bastion,
  Verdant Vector, Obsidian Relay, Nova Warden, Manta Veil, Scarlet Corsair y Nautilus Ark.
- Diez cañones: los ocho modelos conservados más Gyre Coil y Rift Saw.
  Identidad, precios y procedencia del lote final: [Catálogo diez](CATALOGO_DIEZ.md).
- Una imagen PNG RGBA transparente por nave completa, con motor integrado y
  orientación cenital. No se separan alas, casco o reactor.
- Un PNG por cañón, reutilizado por los dos módulos enlazados. Boca y pivote
  conservan la colocación del prototipo aprobado.
- Catálogo en Skins → Naves y Skins → Cañones; tarjetas y modales enseñan el
  mismo PNG que usa combate. Sólo la vista modal seleccionada anima.
- Naves muestra únicamente la nave completa, sin cañones/cables; Cañones
  muestra un cañón con un disparo/estela horizontal en cada tarjeta y los dos
  módulos verticales en el modal ampliado, siempre sin casco/cables.
  Es una separación del locker, no un cambio de ensamblaje durante combate.
- El menú principal presenta la nave equipada y su nombre usando el mismo PNG;
  sólo cambia tras confirmar el equipamiento. No añade una preferencia guardada
  ni precarga toda la flota desde el compositor DOM.
- La nave DOM obtiene su proporción de `PLAYER_SHIP_RASTER_ART` (56/64),
  con ancho/alto automáticos y máximos relativos para caber sin deformarse.
  Los cañones comparten el frame lógico 30×39 (ajuste posterior del 03-10,
  +25% respecto a 24×31.2) en un SVG DOM escalado uniformemente, con el mismo pivote.
  La composición `thumbnail` rota el conjunto 90° y usa un viewBox 98×44 para
  aprovechar la tarjeta ancha sin recortar. Es independiente de `animated`:
  reducir movimiento no cambia la composición del modal.
- Solicitud expresada de generar arte original: los SVG antiguos no se usaron
  como referencia de forma; sus paletas sólo continúan la identidad cromática.
  Los conceptos, prompts literales, fuente, tamaño de origen y derivado están
  en [`fleet-skin-image-sources.json`](../../scripts/fleet-skin-image-sources.json).

## Guardado, runtime y límites

Se mantienen IDs, nombres, precios, propiedad previa y elección de cañón
independiente. Nuevos perfiles empiezan con Ivory Spear equipada; perfiles
existentes conservan sus elecciones y reciben Ivory Spear/cañón gratis sin
cambiar schema. La selección del jugador sigue siendo cosmética.

`TetheredShipView` carga sólo las texturas equipadas mediante `Image` antes de
`Texture.from`, comparte la textura de ambos cañones y reutiliza el flash de
daño de la nave. PlayerView mantiene su ruta vectorial anterior como fallback.
Slots reales `(±27, −11)`, colisión22, apuntado y simulación permanecen intactos.
No se añade física a cables, nodos por frame, filtros, partículas o animaciones
de gameplay.

Tamaños/coste y fichas por catálogo:
[naves](../../src/assets/skins/ships/README.md) y
[cañones](../../src/assets/skins/cannons/README.md). Los dieciséis PNG suman
741,025 bytes (~723.7 KiB); las texturas Pixi equipadas representan 320 KiB
RGBA8 teóricos. Eso no mide caché de miniaturas, memoria total o FPS.

Extensión del 03-10: balas y estelas raster originales por cosmético, incluyendo
Ivory Spear con identidad propia. No sustituye el arte propio de las evoluciones
ni amplía hitboxes. Contrato, coste añadido y rutas: [Balas PNG](../../src/assets/fx/projectiles/README.md).

## Regresión del catálogo

`TetheredAssets.test.ts` verifica imágenes, transparencia, dimensiones y slots.
`tests/browser/tethered.checks.ts` cubre persistencia, fallback, selección y
encuadre en móvil/escritorio. `node scripts/qa-tethered.mjs` prueba el compositor
del jugador contra un preview local y guarda diagnósticos en `test-results/`.
El estado actual de las pruebas y la revisión en teléfono físico vive en
`PLAN_DESARROLLO.md`, no en esta ficha.

Extensión autorizada el 03-10: la portada de Inicio muestra la nave equipada y
su nombre, usando el PNG y frame lógico existentes (56/64). Cambia sólo al
confirmar equipamiento, también en compras/rewarded; se restaura desde el save
al recargar y al regresar de combate. No añade una segunda preferencia guardada.
El compositor DOM de Inicio no crea texturas Pixi ni precarga la flota;
contrato de encuadre, carga y fallback: [Inicio](../../src/assets/images/ui/home/README.md).

## Propulsión reactiva

El casco sigue siendo un único PNG; no vuelve el ensamblaje por piezas.
`PlayerPropulsionDefinitions` define los puertos traseros de cada nave en su
frame lógico 56×64. Al sustituir arte, revisar estos puntos junto con el PNG.

`PlayerPropulsionView` hornea una sola textura blanca de 32×64 RGBA8 (8 KiB de
píxeles, no memoria total del renderer), compartida por todos sus chorros y
coloreada con la paleta de la skin. Pool fijo de 3/6/9 sprites para Low/Medium/High;
sólo se muestran los puertos existentes. Sin partículas emitidas, historial,
filtros, shaders personalizados, timers ni nuevas descargas. El render sólo
cambia posición, tamaño, tinte, visibilidad y alpha; no reconstruye geometría.
El coste es pequeño y acotado, no nulo ni una garantía de FPS en móvil físico.

La potencia crece al moverse y decae al parar; usa el reloj de presentación para
congelarse en pausa. `prefers-reduced-motion` conserva una capa sin oscilación.
Muerte, reinicio y cambio de skin limpian el estado. Destruir el contenedor libera
la textura y su fuente; no destruirla por sprite porque la comparten. Se elimina
la antigua estela Graphics que se dibujaba cada frame y luego se ocultaba al
cargar el PNG. No cambia velocidad, hitbox, daño ni apuntado de cañones.

Regresión de capacidad/pausa/reset/reduced-motion/destrucción en
`PlayerPropulsionView.test.ts`. `node scripts/qa-propulsion.mjs` levanta y cierra
su propio preview 4173 y navegador: revisa ocho skins, Low/Medium, movimiento
reducido y stress PC/móvil emulado; guarda capturas y `report.json` en
`test-results/propulsion`. Ejecutar tras el build local y después de Playwright
(que limpia test-results). Compara draw calls y render con/sin chorros en la
misma escena stress congelada; incluye `gl.finish`, no mide FPS de gameplay ni
GPU de teléfono físico.

El perfil, las pruebas de pausa/reset/reduced-motion/destrucción y el diagnóstico
de stress están descritos en `PlayerPropulsionView.test.ts` y
`node scripts/qa-propulsion.mjs`. El diagnóstico de Chromium/SwiftShader no
certifica FPS ni coste GPU en teléfono físico.

## Respuesta reactiva de cañones

Los cañones usan feedback visual acotado con el mismo criterio que los motores.
Los ocho cañones PNG tienen un retroceso inmediato y retorno exponencial de
hasta 200 ms; cada emisor conserva su propio tiempo de disparo, incluyendo
alternancia y doble cañón. Distancia final máxima según cosmético ~2.9–3.9u
en el PNG, sin variar el origen/velocidad/daño de la bala real. Se acepta el
`ShotRenderState` existente copiando sus escalares porque la simulación reutiliza
el descriptor. El fogonazo queda en el origen mundial del disparo aun si la
nave gira, se mueve o recibe squash de daño.

`CannonFeedbackView` prepara una sola fuente de 64×64 RGBA8 (16 KiB de píxeles,
no memoria total), dividida en tres frames: flare direccional, brillo pequeño y
corona geométrica. Tras el refinamiento solicitado, son 4/8/12 sprites fijos en
Low/Medium/High: Low conserva dos flares y dos bocanadas; Medium añade brillo
y dos pulsos; High añade corona y una segunda bocanada por cañón.
Normal blend, transformaciones/alpha/tinte, cero filtros,
timers, partículas emitidas o nuevas descargas. El atlas se crea una vez por
PlayerView; se destruyen sus tres Texture y después su fuente compartida al
destruir el contenedor. No destruirlo por sprite.

Los pulsos de recuperación recorren el cable visible entre 35 y 230 ms después
de disparar, usando `TetheredShipView.sampleCable` sobre la polilínea visible.
El cable se deriva de una curva cúbica con ocho segmentos, holgura según
separación y controles que se acomodan exponencialmente. Cada cañón conserva
su puerto fijo del casco al girar; el extremo trasero sigue exactamente su PNG.
Dos buffers Float32 reutilizados (144 bytes de puntos) sirven a los trazos
metálicos y al pulso. Es una animación acotada sin solver físico. Pausa congela efectos
y retroceso; derrota/reinicio/cambio de cañón limpian los dos emisores. Movimiento
reducido usa sólo dos flares de 90 ms y 35% del retroceso. La nueva vista elimina
el fogonazo y los sockets Bloomwake de Graphics reconstruidos por frame.
Los proyectiles, sus estelas PNG y las dos evoluciones conservan su arte y reglas.
La vista DOM del locker conserva su composición horizontal/modal actual.

Refinamiento posterior del 03-10: cañones 25% mayores en combate y Skins
(30×39); thumbnail ampliado a 98×44 para no recortar la culata. Vapor gris
tenue tras cada disparo, cálido en Cinder Bloom: se desplaza desde el origen
mundial, expande y desaparece en menos de 0.5 s. Una bocanada por boca en
Low/Medium y dos en High; cero con movimiento reducido. Reutiliza el frame
de brillo del mismo atlas de 16 KiB, sin imágenes/partículas acumulativas.

Para ampliar el catálogo: añadir el perfil a
`src/content/visual/CannonFeedbackDefinitions.ts` (longitud/ancho/corona y
retroceso en unidades lógicas). `Record<CannonSkinId, ...>` exige cubrir el nuevo
ID. El color se toma de `CannonSkinDefinitions`; no generar otro atlas ni subir
el número de sprites. Comprobar también la boca y cableAnchor del PNG en
`SkinRasterAssets`, y revisar tiro/retorno con aim opuesto al movimiento,
alternancia, doble cañón, pausa y Low. Los tiempos comunes viven en el mismo
archivo de perfiles, sin modificar la cadencia de simulación.

`CannonFeedbackView.test.ts` verifica origen mundial, descriptor reutilizado,
emisores independientes, pausa, pool/fuente compartida, reduced-motion y
destrucción. `TetheredShipView.test.ts` comprueba que el punto del pulso sigue
la polilínea real con aim/recoil; `PlayerView.test.ts` prueba la integración.
`node scripts/qa-cannon-feedback.mjs` usa su propio preview 4173/navegador y
guarda las ocho recetas Low/High, Medium, reduced-motion y stress en
`test-results/cannon-feedback/`. Ejecutar tras build local y después de
Playwright. `--baseline` sirve para capturar el build antiguo antes de compilar
los cambios. Rutas existentes: `/?weapon-path=projectile&cannon=bloom&quality=high`
y `/?evolution=pulse-volley&scenario=mass&cannon=helix&quality=high`.

La regresión de `CannonFeedbackView.test.ts`, `TetheredShipView.test.ts` y
`PlayerView.test.ts` cubre origen, emisores, pausa, pool compartido,
reduced-motion y destrucción. `node scripts/qa-cannon-feedback.mjs` captura las
recetas Low/Medium/High y stress; sus draw calls en SwiftShader no son FPS de
gameplay ni medición de GPU móvil. El estado de aceptación vive en el plan único.
