# Manta Veil — séptima skin híbrida

Estado: candidata visual para aprobación del usuario. Id `manta`, séptima en
el catálogo. Precio de prueba: 0 NOVA, botón PROBAR GRATIS; desbloqueo local
persistente sin regalar monedas ni cambiar las otras skins.

## Identidad y contrato

Verbo: planear. Porcelana nacarada que flexiona alrededor de una quilla estrecha.
Referencia de calidad: planos del Tank y acabado de Nova; no se copia su masa
radial, corona cardinal ni giro orbital. Tres alternativas de silueta en
`docs/visual/manta-silhouettes.html`: ala amplia elegida, aguja descartada por
parecer Fast, corona segmentada descartada por repetirse en el catálogo.

- Frente `-Y`, centro `(0,0)`, frame SVG `-32 -32 64 64`; radio sin cambios.
- SVG: quilla con bisel/cavidad, reactor longitudinal, cola bifurcada.
- PNG: una aleta izquierda, reflejada por código para la derecha. Las dos
  instancias comparten imagen, no dos exportaciones casi iguales.
- Orden: sombra/firma → respaldo vectorial → aletas PNG → cañones → casco →
  reactor/feedback. El respaldo se oculta sólo cuando el PNG está listo.
- Contrato de aleta: `MantaAssets.ts`, tamaño lógico 34×38, ancla `(0.86,0.51)`,
  raíces `(-2,0)` / `(2,0)`. No medir pivotes nuevamente por cada consumidor.
- Flexión de bisagras simétrica, ciclo 3.6 s, amplitud máxima 0.075 rad;
  aumenta suavemente al moverse. Cola balancea, no orbita. Muerte separa las
  mismas aletas; revive/restart restablecen pose en el siguiente render.
- Low/Medium/High conservan las dos aletas: son identidad, no FX descartable.
  Sin blur, filtros por frame, explosiones extra ni cambios de gameplay.

## Coste y carga

PNG generado originalmente 1254×1254, derivado con ImageMagick a 256×256,
RGBA real; esquina alpha cero verificada. Archivo final: **43,207 bytes**,
techo de esta pieza 64 KiB. Imagen base RGBA8: **256 KiB teóricos** en GPU,
sin overhead; NO 256 KiB por aleta. 2 sprites, 1 textura. SVG adicional:
4 texturas 64×64 (body/core/fallback/signature), 64 KiB teóricos. No son
mediciones de VRAM o FPS.

La textura Pixi se carga al seleccionar Manta, también desde un save o URL.
El menú puede descargar el mismo PNG al acercarse su miniatura al viewport;
las imágenes HTML usan lazy y no crean texturas Pixi por miniatura. La preview
seleccionada usa dos img y las mismas piezas SVG; las tarjetas no animan.
El PNG se cachea durante la vida de la aplicación. Las vistas no lo destruyen
individualmente; al cerrar la página el renderer/navegador libera sus recursos.
Errores dejan el respaldo SVG en partida. No reintentar en cada frame.

## Archivos y consumidores

- `manta-wing.png`: derivado de producción versionado, independiente del PC.
- `MantaAssets.ts`: contrato compartido, sin Pixi/DOM.
- `src/assets/svg/characters/player/skins/manta/`: SVG editables y master de
  respaldo. El master es compuesto vectorial, no una copia visual del PNG.
- `PlayerHullSvg.ts`, `SkinSignatureSvg.ts`, `SkinDefinitions.ts`: registros.
- `MantaWingView.ts`: carga/asignación y movimiento Pixi.
- `MantaPreview.ts` / `manta.css`: ensamblaje HTML/SVG, inmóvil si reduced-motion.
- `docs/visual/fleet-reference.html`: comparación 32/64/128 px y modos de color.

## Procedencia y prompt

Generado el 09-09-2026 con la herramienta integrada ImageGen de Codex, no CLI
ni SVG disfrazado de PNG. Original conservado por el host en generated_images,
id `01a03af0-87c0-74e2-bcf9-8f5af6c32697`. El repo no depende de esa ruta.
El derivado conserva transparencia; el tamaño fue optimizado para publicación.

Prompt usado:

> Use case: stylized-concept. Production game sprite component, genuinely transparent RGBA background, no backdrop/checkerboard painted in image. Create ONE detached LEFT WING for a premium top-down sci-fi MANTA RAY spacecraft. Orthographic directly overhead, nose direction UP. This is a separate animatable wing plate, not a whole ship: no cockpit, no central body, no weapons, no text. Single broad swept crescent/triangular fin extending LEFT, pointed outer tip towards upper-left and tapered rear fin towards bottom; mounting root occupies right edge around vertical center. Shape fit inside square with 6 percent transparent padding. Material: opalescent ivory ceramic armor with lustrous pearl and very subtle seafoam/rose interference in broad surfaces, engraved layered featherlike ribs and dark navy recessed channels. Three major curved plates overlap, bright warm ivory leading bevel, deep blue-gray lower edge for real thickness, thin cyan luminous veins recessed inside wing not all around outline. Rich hand-painted stylized 2D/3D game asset, clean strong silhouette readable at 32 px, controlled detail with substantial broad light surfaces, beautiful sculpted volume. Crisp opaque armor edges and truly transparent outside; no external glows, no shadow on a floor, no particles. Keep camera TOP DOWN, not perspective. Output PNG with transparent background. This wing will be mirrored by code for the right wing and paired with SVG keel and reactor; identity is an elegant gliding mechanical manta, not a circular token.

## Prueba móvil sin URL adicional

Inicio → Skins → séptima tarjeta **Manta Veil** → **PROBAR GRATIS** → Volver →
Jugar. Alternativa corta para pruebas: `?skin=manta`; comparar con
`&quality=low` / `&quality=high`. Prueba también cañones girando, daño, pausa,
muerte y reinicio. Aprobar su lectura dentro del caos, no sólo el zoom del menú.
