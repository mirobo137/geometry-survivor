# Velo de Marea / Tidal Veil

- ID del juego: `tidal-veil`. Rol: atmósfera cosmética pintada detrás de arena
  y entidades; no es geometría de gameplay.
- Máster base: `tidal-veil.png`, generado con el generador de imágenes
  integrado de Codex el 26-09-2026. Sin imágenes de referencia externas, texto
  ni alpha.
- Runtime: `tidal-veil.webp`, derivado del máster con ffmpeg/libwebp calidad 92.
  Dimensiones 1254×1254; 98,632 bytes. El máster PNG mide 1,707,898 bytes.
- Memoria base estimada de textura RGBA8 decodificada: ~6.0 MiB. No incluye
  buffers/overhead de navegador o GPU. No confundirla con los bytes WebP.
- Composición: centro 55% oscuro y despejado; corrientes amplias y asimétricas
  en el perímetro. Cover cuadrado uniforme; portrait y landscape recortan zonas
  distintas intencionalmente sin estirar X/Y.
- Corrientes: `tidal-veil-currents.png` es una capa RGBA 1254×1254 de 1,180,427
  bytes generada con la lámina base como referencia de estilo/paleta. Sus
  regiones periféricas se recortaron de forma determinista con ffmpeg:
  - corriente A: origen `(0,0)`, región `820×820`, salida
    `tidal-veil-current-a.webp` 512×512, 69,140 bytes;
  - corriente B: origen `(650,600)`, región `604×654`, salida
    `tidal-veil-current-b.webp` 448×484, 67,656 bytes.
  Ambas salidas WebP conservan canal alpha (`yuva420p`). Memoria RGBA8 estimada
  combinada: ~1.83 MiB; no es una medición del uso total de GPU.
- Motion de placa (regla compartida para las siete placas raster): Medium/High
  aplican paneo máximo de ±12×10 unidades lógicas y zoom respirado de 0–1.5%
  sobre el mismo Sprite, con ciclos de 28–38 s. La prueba inicial (±2.5×2 px,
  0.4%) se percibió demasiado tenue y se amplificó. El cover añade 2.5% de
  overscan, suficiente para el recorrido; no se crean bitmaps, texturas, filtros
  ni geometría. Low y
  `prefers-reduced-motion` dejan la placa inmóvil. Implementación común:
  `StaticRasterBackgroundView`.
- Corrientes: tras comprobar que el movimiento
  inicial era imperceptible y que faltaba presencia en dos esquinas, Medium/High
  dibujan cuatro sprites de corriente a partir de dos texturas compartidas:
  A arriba-izquierda, B abajo-derecha, A espejo-X arriba-derecha, B espejo-X
  abajo-izquierda. Cada una tiene fase/ritmo independiente: A ±38×22 unidades
  lógicas (18/24 s), B ±30×34 (23/17 s), A espejo ±33×25 (20/19 s), B espejo
  ±34×30 (21/25 s). Alpha base por esquina 0.24/0.22/0.20/0.18 y respiración
  no-flash de ±7% relativo. Las instancias extra no crean bitmaps ni memoria de
  textura adicional. Low y `prefers-reduced-motion` muestran las capas estáticas.
  Sin filtros, shaders, partículas o geometría por frame.
- Consumo: `TidalVeilBackgroundView` carga las tres texturas Pixi sólo al
  equipar (placa + dos overlays); los cuatro sprites comparten las dos texturas
  de corriente. Los WebP de las corrientes suman 136,796 bytes. Los recursos quedan
  compartidos durante la vida de la aplicación y no se destruyen al cambiar de
  fondo. Fallo de corriente conserva la lámina y no afecta gameplay.
- Locker/preview: `tidal-veil-currents-preview.webp` (512×512, 55,128 bytes)
  compone las dos corrientes fuente estáticas encima de la misma lámina; CSS la
  refleja horizontalmente para cubrir las cuatro esquinas. No anima en UI. Si
  el navegador la decodifica, representa ~1 MiB RGBA adicional en caché.
- Economía: `priceNova=0`, no resta NOVA ni muestra anuncio; la selección se
  guarda como cualquier otro fondo.
- Prueba: `docs/visual/background-reference.html` y
  `docs/visual/capture-background.mjs`.

## Órbita de Nacre — placa pictórica

- ID `nacre-orbit`; conserva el SVG code-first original en
  `src/assets/svg/backgrounds/nacre-orbit.svg`, pero ese archivo ya no se usa
  en runtime.
- Generada con la función integrada de creación de imágenes de Codex el
  26-09-2026. El primer master no usó referencias; el master actual es una
  edición con ese arte previo como referencia para preservar estilo y mover
  planeta/luna a una zona segura de recorte. Sin texto incrustado.
- PNG master `nacre-orbit.png`: 1254×1254, 1,923,399 bytes, RGB opaco.
  Runtime WebP `nacre-orbit.webp`: 1254×1254, 165,842 bytes, calidad 92.
  Preview WebP `nacre-orbit-preview.webp`: 512×512, 29,528 bytes. Textura de
  runtime RGBA8 estimada: ~6.0 MiB. No se midió la memoria real de GPU.
- Concepto: planeta anillado en penumbra arriba a la izquierda y luna pequeña
  inferior derecha; pigmento cósmico, estratos nebulares petrol/índigo y
  reflejos bronce mínimos. Centro 55% casi negro. Cover uniforme en ambas
  orientaciones; CSS usa la miniatura WebP y Pixi la placa completa, ambas
  derivadas del mismo PNG master. La textura Pixi se carga al equipar.
- Ajuste de recorte 26-09-2026: el primer master perdía planeta/luna en paisaje
  16:9. Una edición ImageGen los movió hacia el perímetro interior (planeta
  aprox. x/y 28%, luna x/y 72%), para mantener ambos reconocibles en cover
  landscape y portrait sin llevarlos al centro de combate.
- El SVG previo permanece como versión editable y posibilidad de rollback, no
  como fallback automático. Si falla la carga raster, se conserva el fondo base
  oscuro seguro.

Prompt final:

```text
Use case: stylized-concept
Asset type: premium square full-screen painted background plate for a 2D top-down survivor game, replacing a simpler vector atmosphere while preserving its recognizable identity.
Primary request: create a richly finished, original painterly environment called “Órbita de Nacre”, with the visual depth and material polish of an expensive cosmic matte painting, but quiet enough for intense gameplay.
Scene/backdrop: immense midnight interstellar space. A large shadowed ringed planet sits partly beyond the upper-left edge; its broad layered rings arc only through the outer perimeter. A small distant moon rests near the opposite lower-right edge. Surrounding them are deep soft nebular strata and subtle nacre-like mineral haze.
Style/medium: refined hand-painted digital matte illustration; layered pigments, sophisticated soft cloud edges, atmospheric depth, restrained detail, premium finish. Not flat vector art and not photoreal space photography.
Composition/framing: square 1:1 master, designed for uniform cover crops in landscape and portrait. Keep the central 55% nearly black, calm, low-detail and open for player, enemies, projectiles, arena and HUD. Place all rich texture at the far edges and corners. Planet/moon remain peripheral.
Lighting/mood: quiet, vast, elegant, cinematic chiaroscuro; soft reflected rim light, no dramatic flare.
Color palette: midnight navy, desaturated petrol teal, smoky indigo, muted silver-blue and tiny antique-bronze reflections.
Materials/textures: subtle atmospheric cloud layers, mineral pigment, dim dusty ring texture, nuanced planet surface bands.
Constraints: background only, no text, logo or watermark; preserve a large empty gameplay center and low visual contrast behind combat. No bright pinpoint objects or thin luminous lines.
Avoid: ships, characters, planets other than the single ringed planet and one small moon, crystals, flowers, geometry, arena borders, grids, reticles, lasers, lightning, projectile-like dots, bright star clusters, crisp debris, high-frequency noise, strong gold streaks crossing the center, or anything that resembles a gameplay hazard.
```

Iteración de composición para cover dual:

```text
Recompose the supplied square painted background while preserving its premium painterly finish and midnight navy/petrol palette. Move the shadowed ringed planet inward to the upper-left inner perimeter around x=28%, y=28%, with rings near the top/left edges; move the small moon inward around x=72%, y=72%. Both silhouettes must remain recognizable in square-to-16:9 landscape and square-to-9:16 portrait cover crops while feeling peripheral in the full square. Keep the central 55% nearly black and quiet; neither body nor bright ring crosses the combat center. Preserve soft edge cloud strata, low contrast, no new objects, text, lines, stars or gameplay shapes. Square, opaque background plate.
```

## Flor del Ocaso — placa pictórica

- ID `vesper-bloom`; conserva el SVG original en
  `src/assets/svg/backgrounds/vesper-bloom.svg` como referencia editable, no
  como recurso de runtime.
- Generada con la función integrada de creación de imágenes de Codex el
  26-09-2026. El primer master no usó referencias; el master actual es una
  edición con ese arte previo como referencia para conservar su firma y ajustar
  el recorte dual. Sin texto incrustado.
- PNG master `vesper-bloom.png`: 1254×1254, 1,848,503 bytes, RGB opaco.
  Runtime WebP `vesper-bloom.webp`: 1254×1254, 143,270 bytes, calidad 92.
  Preview WebP `vesper-bloom-preview.webp`: 512×512, 29,622 bytes. Textura de
  runtime RGBA8 estimada: ~6.0 MiB; no es medición total de GPU.
- Concepto: flor mineral de seis pétalos en periferia superior derecha, núcleo
  perlado tenue, humo violeta/mauve y costuras teal. Centro 55% oscuro y
  despejado; la flor se movió hacia el perímetro interior para seguir visible en
  cover landscape y portrait. Silueta y paleta propias; no es un recolor de
  Nacre o Tidal Veil.
- Ajuste de recorte 26-09-2026: el primer master perdía el motivo en landscape.
  Una edición ImageGen mueve el centro perlado cerca de x=73%, y=27%, con pétalos
  anchos, periféricos y legibles en ambas orientaciones.
- CSS y Pixi usan la misma placa artística: mini WebP 512×512 para locker y
  WebP 1254×1254 para partida, ambos con cover uniforme; Pixi carga al equipar.
  El SVG previo se conserva para rollback, no como fallback automático.

Prompt final:

```text
Use case: stylized-concept
Asset type: premium square full-screen painted background plate for a 2D top-down survivor game, replacing a simpler vector atmosphere while preserving its recognizable identity.
Primary request: create a richly finished, original painterly environment called “Flor del Ocaso”, with the visual depth and material polish of an expensive cosmic matte painting, distinct from a ringed-planet background.
Scene/backdrop: a mysterious astral bloom made of six broad, asymmetrical mineral petals, floating at the far upper-right perimeter and partly cropped by the frame. The petals are dark, layered, sculptural and softly faceted, with an intimate dim pearl core; around the far edges, smoky interstellar veils curl like slow vapor.
Style/medium: premium hand-painted digital matte illustration, layered pigment and subtle brushed mineral texture, atmospheric depth, elegant and tactile; not flat vector art, not photoreal macro flora.
Composition/framing: square 1:1 master, designed for uniform cover crops in portrait and landscape. Keep the central 58% nearly black, calm and open for player, enemies, projectiles, arena and HUD. Keep the bloom at the far upper-right outside the core combat area; perimeter wisps in all four corners but broken/asymmetric with large empty gaps.
Lighting/mood: late twilight, gentle internal nacre light on petal edges, cinematic low-key illumination, no bloom or flare.
Color palette: midnight navy, muted violet, dusty mauve, blue-green teal seams and tiny pale-rose pearl accents; subdued and harmonized.
Materials/textures: layered obsidian-like petals with satin mineral edges, wispy colored vapor and very subtle particulate pigment embedded in the broad masses.
Constraints: background plate only; no text, logo, watermark; retain low contrast under gameplay; keep the central combat area empty and dark; game-screen readability takes priority.
Avoid: ringed planets, moons, ships, characters, obvious flower petals crossing the center, sharp crystal shards, radial weapon-like spikes, geometric arena borders, grids, reticles, lasers, lightning, bright pinpoint stars, projectile-like dots, high-frequency grain, strong luminous outlines, high-contrast marks that resemble enemies or hazards.
```

Iteración de composición para cover dual:

```text
Recompose the supplied square painterly background, preserving its premium mineral-matte finish and midnight navy, muted violet/mauve, restrained teal/rose palette. Move the six-petal astral bloom inward from the extreme top-right to an upper-right inner-perimeter position around x=73%, y=27%, sizing the broad asymmetric petals so the motif survives both square-to-16:9 landscape and square-to-9:16 portrait cover crops. Keep the central 55% nearly black, quiet and open; no petal, bright core or sharp fragment enters the combat center. Keep vapor soft, broken and peripheral; no added objects, text, stars, grids or gameplay-like shapes. Square, opaque background plate.
```

## Fondos existentes elevados con imagen generada — 26-09-2026

Los cuatro temas originales conservan ID, nombre, desbloqueo, precio y lugar en
el locker. Se reemplaza sólo su acabado procedural por una placa pictórica
generada; no se apilan gradientes/estrellas CSS genéricos encima. Los másteres
son originales, cuadrados, RGB opacos, sin texto y sin referencias de entrada.
Se derivan a WebP 1254×1254 calidad 92 para Pixi y WebP 512×512 calidad 90 para
el locker. Pixi carga cada placa sólo al seleccionarla; la miniatura no se
decodifica como textura de combate. Cada tema usa el mismo encuadre por cover
uniforme en landscape, portrait y calidades Low/Medium/High.

| ID | Identidad pictórica | PNG master | WebP runtime | Preview WebP |
| --- | --- | ---: | ---: | ---: |
| `deep-space` | Nebulosa azul/índigo sobre vacío profundo | 1,492,255 B | 51,464 B | 10,520 B |
| `ion-storm` | Vapor teal/cian ionizado | 1,537,147 B | 84,598 B | 21,208 B |
| `solar-drift` | Nubes de plasma cobre/ámbar | 1,780,077 B | 124,572 B | 26,058 B |
| `crystal-field` | Estratos amplios de geoda violeta y teal | 1,853,662 B | 129,802 B | 26,650 B |

La placa decodificada a RGBA8 supone ~6 MiB de memoria de textura por tema que
se haya equipado al menos una vez; WebP reduce transferencia/almacenamiento,
no la memoria ya decodificada. Sólo una se dibuja a la vez, pero la caché puede
retener texturas de varios temas hasta cerrar la aplicación. No se declara una
medición de FPS ni de memoria GPU. El tema inicial `deep-space` conserva su
precio cero y los otros mantienen sus precios originales.

### Dirección de generación archivada

Estas descripciones resumen la dirección visual utilizada y sirven para crear
iteraciones compatibles; no sustituyen revisar cada salida dentro del juego.

- **Deep Space / Vacío profundo:** placa premium pictórica de espacio profundo;
  nubes minerales azul noche e índigo alrededor del perímetro, sin objeto focal,
  con centro 55% casi negro, sereno y de bajo detalle. Evitar estrellas puntuales
  de alto contraste, líneas, naves, retículas y cualquier elemento de gameplay.
- **Ion Storm / Tormenta iónica:** nubes anchas de vapor teal/cian ionizado,
  difusas y separadas, algunas corrientes rotas en los márgenes. Centro oscuro y
  despejado; evitar rayos, zaps finos, puntos de luz y retícula para no imitar
  el arma de rayo.
- **Solar Drift / Deriva solar:** deriva atmosférica cálida de pigmento cobre,
  bronce apagado y ámbar, depositada sobre todo en los bordes. El acento más
  luminoso queda periférico; conservar centro de combate de bajo contraste y
  evitar disco solar, arcos limpios, flare y trazos lineales.
- **Crystal Field / Campo cristal:** paredes/estratos minerales y facetas
  anchas violetas con pequeños reflejos teal en las esquinas, enmarcando un
  vacío central oscuro. No dibujar cristales afilados pequeños que parezcan
  enemigos, shards de proyectil o peligros.

Prompts de referencia para re-generar o iterar estas familias:

```text
DEEP SPACE — Generate an original premium painterly square background plate for a top-down geometry survivor. An immense deep-space gulf with layered midnight-blue, indigo and restrained petrol mineral nebula clouds confined to the far perimeter and broken across all four corners. No central focal subject. Keep the central 55% nearly black, low-detail and open for combat. Quiet cinematic depth, broad brush-scale cloud structure, no bright pinpoints, stars, planets, moons, ships, crystals, geometry, arena outlines, text, lasers or lightning. Fully opaque square image; designed for uniform cover crops in 16:9 landscape and 9:16 portrait.

ION STORM — Generate an original premium painterly square background plate for a top-down survivor game: broad separated clouds of ionized teal and muted cyan vapor, softly turbulent and mineral-textured, with a few dim edge-lit folds near the corners. Keep the central 55% dark, sparse and unobstructed. No lightning bolts, thin electrical filaments, bright dots, weapons, ships, planets, reticles, geometry, text or gameplay-like silhouettes. Low contrast behind players/enemies; square opaque composition safe under landscape and portrait cover crops.

SOLAR DRIFT — Generate an original premium hand-painted square cosmic background plate using restrained burnt copper, dark rust, muted amber and smoky umber vapor. Broad warm plasma-cloud masses drift along the far perimeter, with the brightest area only at an outer corner; no sun disk, ring, clean arc or flare. Preserve a nearly black, low-detail central 55% for active combat. Avoid fine streaks, sparks, stars, projectiles, ships, planets, arena shapes, text and thin luminous marks. Opaque square matte painting, subdued and crop-safe for landscape/portrait.

CRYSTAL FIELD — Generate an original premium painterly square game-background plate with broad geode-like mineral strata and large softly faceted violet formations, accented sparingly with desaturated teal along the outer edges. Arrange the masses like distant walls framing a deep, almost-black central 55% of empty combat space. Facets are broad and low-frequency, never small sharp shards or silhouettes that resemble enemies/projectiles. No grid, arena boundary, reticle, text, ships, stars, laser or lightning. Opaque square composition; restrained contrast and safe cover crop for landscape and portrait.
```

Todas las salidas priorizan centro vacío, detalle de baja frecuencia y masas
periféricas amplias. Estas cuatro pinturas sustituyen el arte procedural
anterior, no la identidad cromática ni el contrato de gameplay. Velo de Marea
fue la primera placa con movimiento. Desde 27-09-2026, las otras seis pinturas
también reciben movimiento periférico: reutilizan y tiñen las mismas dos
texturas transparentes, con deriva independiente en cuatro esquinas. La paleta,
opacidad y ritmo se configuran por tema. Las placas permanecen inmóviles; Low y
`prefers-reduced-motion` congelan las corrientes. El contrato completo está en
`docs/design/FONDOS_PREMIUM.md`.

## Prompt exacto de generación de la lámina base

```text
Use case: stylized-concept
Asset type: premium full-screen background plate for a 2D top-down geometry-survivor game
Primary request: create a distinctive, painterly cosmic background called “Tidal Veil”, a distant field of flowing mineral mist and deep-space vapor, intended to sit quietly behind active gameplay.
Scene/backdrop: an immense dark interstellar gulf; broad soft currents of smoky blue-green and muted indigo drift along the far perimeter, with a few restrained antique-amber reflections embedded in the haze.
Style/medium: premium hand-painted digital matte illustration, subtle layered pigment and atmospheric depth, elegant and cinematic but low contrast, not photorealistic.
Composition/framing: square 1:1 master; composed to crop with cover in both landscape and portrait screens. Keep the central 55% almost-black, calm, sparse, and low-detail for player, enemies, projectiles, arena and HUD readability. Place irregular diffuse cloud masses near the outer edges and corners, asymmetrical and broken apart; preserve useful peripheral art in both horizontal and vertical crops. No central subject.
Lighting/mood: quiet abyssal depth, restrained soft reflected light, no bright focal flare.
Color palette: midnight navy, charcoal, muted petrol teal, smoky blue-violet, tiny aged-bronze accents.
Materials/textures: broad painterly vapor and mineral-like cloud texture only; low-frequency detail, no sharp micro-noise.
Constraints: this must function as a playable game background, not a key art poster. It must remain subdued beneath the arena and combat. No text, logos, watermarks, characters, ships, planets, moons, flowers, crystals, rings, circular motifs, geometric arena borders, grids, reticles, lasers, lightning, projectile-like dots, star clusters, bright pinpoints, or high-contrast thin lines. Avoid placing recognizable shapes in the central gameplay area.
```

## Prompt de generación de corrientes transparentes

La imagen fue generada con el generador integrado de Codex el 26-09-2026. La
lámina base `tidal-veil.png` se usó sólo como referencia de estilo y paleta;
no se volvió a generar ni reemplazar. La salida transparente maestra es
`tidal-veil-currents.png`; las dos texturas runtime y la preview son recortes/
conversiones mecánicas de esa salida.

El arte generado originalmente contiene masas en dos esquinas opuestas. El
runtime reutiliza esas texturas reflejándolas para dar movimiento a las cuatro
esquinas sin inflar descarga ni memoria de bitmaps. En otro fondo, reflejar sólo
si la simetría encaja con su composición; de lo contrario generar overlays
asimétricos específicos. La guía de migración a fondos pintados animados está en
`docs/design/FONDOS_PREMIUM.md`, sección “Receta reutilizable”.

```text
Use case: stylized-concept
Asset type: subtle transparent atmospheric overlay layer for a 2D top-down game background
Input images: Image 1 is the existing Tidal Veil background; use it only as style and palette reference, do not recreate the background.
Primary request: create a genuinely transparent overlay of two broad, very soft mineral-vapor currents that can drift over the existing painted background.
Scene/backdrop: transparent canvas. Place two broken, flowing wisps along opposite outer corners and edges, with broad smoky brush-like shapes in muted petrol teal, deep blue-violet, and extremely restrained antique bronze reflections. Leave the central 60% fully transparent and calm.
Style/medium: premium painterly digital matte atmosphere, soft layered pigment, low-frequency detail matching Image 1.
Composition/framing: square 1:1 overlay, edge-weighted and asymmetrical; shapes remain inside the canvas with transparent margins so the layer can drift slightly without cropping hard edges. Use irregular feathered painterly boundaries, not a regular frame.
Lighting/mood: dim and submerged, low contrast; no focal glow.
Constraints: output real transparency; only vapor/cloud masses, no opaque background. Must remain subtle when composited over Image 1 and not obscure gameplay.
Avoid: text, logos, watermark, planets, moons, ships, characters, stars, particles, dots, crystals, rings, geometry, lines, lightning, bright pinpoints, hard contours, central subject, opaque black fill.
```
