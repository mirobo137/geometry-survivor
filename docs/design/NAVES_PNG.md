# Naves y cañones PNG

Decisión visual aprobada el 30-09-2026; migración solicitada y completada en
`main` en `e22d837` el 01-10-2026. Las correcciones posteriores de previews y
diagnóstico se preparan localmente, sin commit/push automático. La revisión
artística en móvil físico sigue pendiente; no es una condición Git aún sin cumplir.
Dirección de producción: [Arte híbrido](ARTE_HIBRIDO.md).

## Catálogo entregado para revisión

- Ocho naves: Ivory Spear como nave base más Aurora Strider, Eclipse Prism,
  Solar Bastion, Verdant Vector, Obsidian Relay, Nova Warden y Manta Veil.
- Ocho cañones: siete modelos originales reemplazados por PNG más el cañón
  Ivory Spear original como octavo modelo.
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
  Los cañones comparten el frame lógico 20×26 en un SVG DOM escalado uniformemente.
  La composición `thumbnail` rota el conjunto 90° y usa un viewBox 92×44 para
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

Fuera del bloque: la nave equipada en la portada de Inicio, shaders o propulsión
separada, nueva derrota, física/hitboxes de cables, cambios de balance y prueba
en móvil físico.
