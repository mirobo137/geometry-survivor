# Naves y cañones PNG

Decisión visual aprobada el 30-09-2026; migración solicitada y completada en
`main` en `e22d837` el 01-10-2026. Las correcciones posteriores de previews y
diagnóstico se preparan localmente, sin commit/push automático. La revisión
artística en móvil físico sigue pendiente; no es una condición Git aún sin cumplir.
Dirección de producción: [Arte híbrido](ARTE_HIBRIDO.md).

## Catálogo entregado para revisión

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

## Validación de la migración y revisión pendiente

`npm run build:local` pasó: typecheck, 120 archivos de test / 577 pruebas y
compilación local. Los smoke enfocados pasaron para las ocho parejas de nave y
cañón en una partida high, Manta en low/high, selección/guardado en el locker,
Ivory Spear en gameplay con pausa/resize/reinicio y scroll/alineación móvil.
La compra de naves, compra de cañones, preview PNG y oferta rewarded pasaron
después de actualizar las expectativas del nuevo cosmético gratuito.

La suite amplia de 79 smoke no se completó en el entorno remoto. Ese entorno bloqueó la descarga de
Chromium de Playwright con HTTP 403; las pruebas enfocadas usaron el Chromium del
sistema y una configuración temporal. La pasada amplia encontró aserciones de
guardado/selector antiguas —corregidas y repetidas— y luego fallos de timeout o
stream en recorridos generales de Laboratorio/Overdrive. No afirmo que los 79
smoke estén verdes.

Capturas locales para revisar:

- `test-results/skin-refresh/ships-contact.png` y `cannons-contact.png`: las
  ocho ilustraciones de cada catálogo.
- `test-results/skin-refresh/ships-locker.png` y `cannons-locker.png`: ambas
  pestañas del menú con las ocho fichas visibles.
- `test-results/skin-refresh/combat-manta-bloom.png`: partida con Manta y
  Bloomwake equipados.

La migración ya está en `main`; el bloque anterior describe la entrega remota,
no un estado Git sin publicar. La auditoría posterior en Windows pasó 577 tests,
19 smoke enfocados y los tres builds. Encontró deformación en previews, un
diagnóstico obsoleto y documentación Git desactualizada: son el alcance del ajuste
local solicitado. No equivale a ejecutar toda la suite ni aprobar el arte humano.

`node scripts/qa-tethered.mjs` usa el compositor `raster-player-skin`, el cañón
Ivory Spear explícito y comprueba carga PNG también en la ruta ordinaria, además
del fallback al abortar el cañón. Ejecutar contra preview en 4173, después de
Playwright porque éste limpia `test-results/`. Las regresiones de UI están en
`tests/browser/tethered.checks.ts`: aislamiento por pestaña, proporción/encuadre
de las ocho naves y cañones en 320×568, 390×844, 800×450 y 1280×720.
La matriz se reparte entre desktop y móvil para no duplicar recorridos en CI.
El modal limita también sus filas y mínimos intrínsecos de SVG; los disparos
conservan margen superior para no recortarse en landscape bajo.

Corrección local comprobada: typecheck, 577 pruebas, tres builds, 11 smoke
enfocados y repetición final de 3 smoke (matriz de previews y compra de fondos)
tras el ajuste de margen/grid. Los 7 unitarios de previews se repitieron verdes.
El diagnóstico reparado pasó sus seis casos. No se ejecutó toda la suite ni
se hizo perfil en móvil físico. Servidor para revisión: `http://localhost:5173/`.

Ajuste posterior de miniaturas horizontales: typecheck, 8 unitarios de previews,
build local y 3 smoke (matriz PC/móvil y compra/equipado de cañones) pasaron.
Las capturas de 1280×720 y 390×844 se revisaron; la regresión comprueba los
ocho cañones y proyectiles dentro de su tarjeta también a 320×568 y 800×450.
El modal ampliado conserva dos cañones incluso con movimiento reducido.

Extensión autorizada el 03-10: la portada de Inicio muestra la nave equipada y
su nombre, usando el PNG y frame lógico existentes (56/64). Cambia sólo al
confirmar equipamiento, también en compras/rewarded; se restaura desde el save
al recargar y al regresar de combate. No añade una segunda preferencia guardada.
El compositor DOM de Inicio no crea texturas Pixi ni precarga la flota;
contrato de encuadre, carga y fallback: [Inicio](../../src/assets/images/ui/home/README.md).

## Propulsión reactiva

Ampliación autorizada el 03-10-2026 para mejorar presencia visual con coste
acotado. El casco sigue siendo un único PNG; no vuelve el ensamblaje por piezas.
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

Comprobación local del 03-10: build local/typecheck/unitarias, builds Poki y
CrazyGames, cuatro smoke PC/móvil de nave y los trece casos del diagnóstico
pasaron. Capturas revisadas. En la escena stress congelada, habilitar el efecto
añadió dos draw calls (Low 9→11; High 10→12). El renderer fue SwiftShader y los
tiempos quedaron dentro del ruido de resolución del reloj: no se infiere una
ganancia ni pérdida de FPS a partir de esa muestra. Pendiente aceptación visual
y perfil en móvil físico. No se ejecutó la suite browser completa.

## Respuesta reactiva de cañones

Extensión visual solicitada el 03-10-2026 con el mismo criterio que los motores.
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

Comprobación de la primera versión, antes del refinamiento de tamaño/cable/vapor:
typecheck, suite completa (126 archivos), tres builds bajo
15 MB, 26 unitarias enfocadas y cinco smoke (ocho parejas PNG, compra/equipado,
doce evoluciones y pausa/resize/reinicio PC/móvil) pasaron. Los veinte casos del
diagnóstico pasaron y sus capturas se revisaron. En stress congelado, mostrar
la nueva vista añadió una draw call (Low 9→10, High 10→11) en SwiftShader.
Es una comparación con/sin esta vista, no anterior/después del renderer completo
ni una medición de FPS de gameplay o GPU móvil física. Pendiente aceptación
humana del feel; no se ejecutó la suite browser completa.

Refinamiento tamaño/cables/vapor comprobado con build local/typecheck/unitarias,
pruebas enfocadas de anclajes/vapor, tres targets bajo 15 MB y cuatro smoke de
encuadre y pausa/resize/reinicio PC/móvil (14.5 s). Veinte casos del diagnóstico
y dos repeticiones de vapor final Low/High pasaron; capturas revisadas. Modo
`--vapor-only` guarda la comprobación corta en `test-results/cannon-vapor/`.
Stress congelado: Low 11→12 y High 12→13 draw calls con/sin feedback en
SwiftShader. El atlas sigue en 16 KiB; son medidas de draw calls, no FPS físicos.
Validación humana de tamaño/naturalidad y rendimiento en teléfono pendiente.

Fuera del bloque: shaders, nueva derrota, física/hitboxes de cables, cambios de
balance y validación en móvil físico.
