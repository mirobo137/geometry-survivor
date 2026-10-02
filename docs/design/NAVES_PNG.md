# Naves y cañones PNG

Decisión visual aprobada el 30-09-2026; migración solicitada y completada en
este checkout el 01-10-2026. Falta la revisión visual humana solicitada antes de
pasar el trabajo a `main`. Dirección de producción: [Arte híbrido](ARTE_HIBRIDO.md).

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

## Validación local y revisión pendiente

`npm run build:local` pasó: typecheck, 120 archivos de test / 577 pruebas y
compilación local. Los smoke enfocados pasaron para las ocho parejas de nave y
cañón en una partida high, Manta en low/high, selección/guardado en el locker,
Ivory Spear en gameplay con pausa/resize/reinicio y scroll/alineación móvil.
La compra de naves, compra de cañones, preview PNG y oferta rewarded pasaron
después de actualizar las expectativas del nuevo cosmético gratuito.

La suite amplia de 79 smoke no se completó. Este entorno bloqueó la descarga de
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

La aprobación visual y el paso a `main` siguen pendientes de la persona usuaria.
No se hizo commit, push ni publicación.

Fuera del bloque: la nave equipada en la portada de Inicio, shaders o propulsión
separada, nueva derrota, física/hitboxes de cables, cambios de balance y prueba
en móvil físico.
