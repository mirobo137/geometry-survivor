# UI ilustrada: selector de actos

Seguimiento 02-10-2026: consumidores de placas usan WebP RGB 640×426 q88/method6,
derivado por `scripts/derive-act-plates.py`. PNG originales/prompts conservados.
Total publicado de las cuatro placas: 246.590 bytes (antes 1.750.591). Comparación
visual realizada, sin cambio de composición o resolución; la memoria RGBA teórica
no baja al comprimir. [Medidas y pruebas](../../../../../docs/audits/CORRECCIONES_RECURSOS_2026-10-02.md).
Las cifras/formato del apartado original siguiente documentan aquella entrega.

Prueba vigente adicional: los cuatro emblemas del selector usan PNG RGBA
transparentes generados (160×160, 127,724 bytes entre todos), con SVG previo
como fallback. [Iconos transparentes: prompts y contrato](icons/README.md).

## Botones completos de rutas — ampliación 29-09-2026

Autorización nueva del usuario: cuatro ilustraciones diferentes cubren todo el
botón, no sólo una miniatura. Los títulos/descripciones/nombre del boss siguen
siendo hijos HTML del botón, agrupados en `.act-route-copy` y anclados al
fondo mediante flex. El arte no representa fielmente un boss: evoca la geometría
de la ruta. Los emblemas SVG existentes refuerzan identificación y fallback.

| Recurso | ID fuente integrado | Bytes PNG |
| --- | --- | ---: |
| `act-radial.png` | `exec-5b249031-8272-4b6c-b8c6-34a18ce8d2a6` | 404,892 |
| `act-angular.png` | `exec-530533ea-58a4-488e-a6bd-463c19111295` | 436,700 |
| `act-fracture.png` | `exec-c78a238e-d2ee-4bfa-ab37-c337959b989c` | 431,811 |
| `act-overdrive.png` | `exec-8a4732a6-0909-4891-a5d4-e2fce388b55e` | 477,188 |

Fuentes: PNG 1536×1024 de la biblioteca del host, `transparent_background=false`.
Derivados de producción: PNG RGB 640×426, Lanczos y `optimize=True` en Pillow.
El formato PNG se conserva para esta prueba solicitada; los cuatro archivos
suman 1,750,591 bytes (~1.75 MB decimal), más que un derivado WebP de resolución
similar. Si se aprueba el arte, se puede evaluar compresión WebP por comparación
visual; no supone regenerar las escenas ni cambiar navegación.
Base RGBA8 calculada de las cuatro placas: 4,362,240 bytes (~4.16 MiB), sin
contabilizar copias/caché/overhead. No es memoria real medida.

Se dibujan como fondo CSS de `::before`, sin filtros ni animación. `cover`
recorta según la proporción del botón; no estira. La gradiente oscurece la zona
del texto. Selección/foco/checkmark y badge BLOQUEADO son DOM/CSS, no pintura.
Los cuatro botones conservan iguales alturas por fila y textos dentro del
hit area. El color claro de Overdrive seleccionado sobreescribe el estilo
antiguo dorado, que dejaba letras oscuras sobre el arte navy.

La cabecera utiliza `.act-header-rail`: misma reserva de scrollbar y padding
horizontal que el cuerpo. Sus bordes coinciden con `.act-options` y el botón
iniciar, incluso cuando aparece scroll, sin anchos mágicos por dispositivo.

Build local y revisión de 1280×720, 390×844, 320×568 y 640×360 verdes: bordes
header/grid iguales (deltas 0 px), sin overflow/solapamiento, copy dentro de los
botones y cuatro PNG HTTP 200. Chromium no solicitó esas imágenes antes de
abrir Actos. Se comprobaron selección de Overdrive, volver/reabrir/seleccionar
Radial/iniciar, bloqueos de campaña, selección con Enter, resize en vivo y
fallback abortando las cuatro imágenes. Capturas ignoradas:
`test-results/act-buttons-art/`. Sigue pendiente aprobación artística y móvil
físico; no se corrió CI ni se hizo commit/push.

## Prompts completos de los cuatro botones

Generador integrado (no CLI/API externa). Cada bloque produjo un recurso distinto.

### radial

```text
Use case: stylized-concept. Create ONE opaque production illustration for the ENTIRE background of a premium sci-fi game's act-selection button. Landscape 3:2 image. Highly polished illustrated 3D game key art, sculpted titanium/ivory geometric machinery, convincing materials and luminous energy, dark navy cosmic setting, cinematic depth. Not a UI mockup. Composition must remain legible cropped to a wide desktop button or a narrow portrait mobile button: main motif centered horizontally in the UPPER HALF, with dark low-detail navy atmosphere in the bottom 40% reserved for live HTML text. Important silhouette fits central 60% of width; no indispensable details at far edges. Cohesive Geometry Survivor spaceship/cosmic geometric aesthetic. Paint the entire rectangular surface edge to edge, no external margins. No letters, no numbers, no logos, no text, no icons, no selection checkmark, no frame or border: those are HTML. Subject: a monumental concentric orbital arena, concentric sculpted circular rings enclosing a small bright hexagonal turquoise core, circular geometry and radial energy spokes. Cyan and icy teal illuminated channels with subtle gold details. Calm precise ordered radial identity. NOT a conventional spaceship.
```

### angular

```text
Use case: stylized-concept. Create ONE opaque production illustration for the ENTIRE background of a premium sci-fi game's act-selection button. Landscape 3:2 image. Highly polished illustrated 3D game key art, sculpted titanium/ivory geometric machinery, convincing materials and luminous energy, dark navy cosmic setting, cinematic depth. Not a UI mockup. Composition must remain legible cropped to a wide desktop button or a narrow portrait mobile button: main motif centered horizontally in the UPPER HALF, with dark low-detail navy atmosphere in the bottom 40% reserved for live HTML text. Important silhouette fits central 60% of width; no indispensable details at far edges. Cohesive Geometry Survivor spaceship/cosmic geometric aesthetic. Paint the entire rectangular surface edge to edge, no external margins. No letters, no numbers, no logos, no text, no icons, no selection checkmark, no frame or border: those are HTML. Subject: a magnificent angular cosmic citadel, diamond-shaped and triangular faceted metallic structures interlocking around a sharply luminous blue-violet diamond core, diagonal aligned light corridors. Sapphire and pale blue energy with ivory metal. Strong angular silhouette, asymmetrical depth, clearly NOT a circular ring.
```

### fracture

```text
Use case: stylized-concept. Create ONE opaque production illustration for the ENTIRE background of a premium sci-fi game's act-selection button. Landscape 3:2 image. Highly polished illustrated 3D game key art, sculpted titanium/ivory geometric machinery, convincing materials and luminous energy, dark navy cosmic setting, cinematic depth. Not a UI mockup. Composition must remain legible cropped to a wide desktop button or a narrow portrait mobile button: main motif centered horizontally in the UPPER HALF, with dark low-detail navy atmosphere in the bottom 40% reserved for live HTML text. Important silhouette fits central 60% of width; no indispensable details at far edges. Cohesive Geometry Survivor spaceship/cosmic geometric aesthetic. Paint the entire rectangular surface edge to edge, no external margins. No letters, no numbers, no logos, no text, no icons, no selection checkmark, no frame or border: those are HTML. Subject: a shattered geometric celestial engine landscape, broken irregular black titanium and ivory plates suspended around a purple-white crack of energy, fractal floating fragments and torn luminous seams, dramatic purple/magenta highlights, no fire. Distinct fractured mass, chaotic geometry, clearly NOT concentric rings or neat diamond architecture.
```

### overdrive

```text
Use case: stylized-concept. Create ONE opaque production illustration for the ENTIRE background of a premium sci-fi game's act-selection button. Landscape 3:2 image. Highly polished illustrated 3D game key art, sculpted titanium/ivory geometric machinery, convincing materials and luminous energy, dark navy cosmic setting, cinematic depth. Not a UI mockup. Composition must remain legible cropped to a wide desktop button or a narrow portrait mobile button: main motif centered horizontally in the UPPER HALF, with dark low-detail navy atmosphere in the bottom 40% reserved for live HTML text. Important silhouette fits central 60% of width; no indispensable details at far edges. Cohesive Geometry Survivor spaceship/cosmic geometric aesthetic. Paint the entire rectangular surface edge to edge, no external margins. No letters, no numbers, no logos, no text, no icons, no selection checkmark, no frame or border: those are HTML. Subject: an extraordinary pair of linked luminous orbital passages forming a horizontal infinity figure-eight shape, segmented ivory and golden mechanical arcs with a deep amber energy bridge, tiny distant fractured orbiting structures, golden-white light streaks flowing into the depths. Navy/amber/gold palette. Powerful endless acceleration identity, clearly distinguishable from a single circular arena.
```



Fecha: 29-09-2026. Integrado por autorización del usuario como una sola prueba
de UI; pendiente aprobación artística y revisión en móvil físico antes de
extender a portada, Laboratorio u otras pantallas.

## Recurso y consumidor

- `orbital-gate.webp`: 1200×400, RGB, 76,892 bytes.
- Fuente generada: PNG 2172×724, conservado en la biblioteca del host;
  generación integrada, ID `exec-50d39811-d905-4d89-8a75-f05a62bf3f0a`.
- Derivado: Pillow, Lanczos a 1200×400, WebP quality=82, method=6.
- Consumidor: `#start-act-view .console-header::before` en `start-panels.css`.
  Vite resuelve el URL y publica el archivo con hash; el juego no depende del
  PNG externo ni llama a IA durante ejecución.
- Una placa estática decorativa, sin filtros, animaciones ni loop adicional.
  Texto, navegación, iconos y selección siguen siendo HTML/SVG. No representa
  un boss ni introduce una mecánica de portales.
- El tamaño del fondo es `auto 100%`, alineado a la derecha: no se deforma.
  Una gradiente oscurece el texto y aumenta protección en móvil; si falla la
  descarga, permanece el fondo sólido legible con todos los controles.
- La cabecera se compacta en landscape corto. PC ajusta ligeramente padding
  e iconos de las rutas para conservar el botón de iniciar visible a 1280×720.
  Las ventanas pequeñas mantienen scroll en el cuerpo, no en la navegación.
- Base RGBA8 calculada: 1,920,000 bytes (~1.83 MiB), no una medición de memoria
  del navegador. No se midieron FPS ni consumo en dispositivos físicos.

En preview local, Chromium no solicitó la imagen mientras Actos estaba oculto;
la descargó al abrir esa consola (HTTP 200). Es una observación del navegador
probado, no un contrato universal de caché/memoria.

## Prompt completo

```text
Create a premium raster illustration for a sci-fi survival game's ACT SELECTION header, not a full UI mockup. Landscape wide banner composition, approximately 3:1. Deep ink navy outer space with atmospheric subtle blue mist and sparse stars. The right 55% features an impressive ancient-futuristic geometric orbital gate floating in space, a concentric ring of sculpted ivory-titanium segmented armor with precise cyan illuminated grooves, warm gold inset details and a luminous turquoise core, smaller fractured angular pieces orbiting it; premium highly polished illustrated 3D game key art with substantial material detail, dramatic but controlled rim lighting, beautiful depth and readable bold silhouette. Gate center at x75%, y50%, all significant parts within central vertical 70% so this asset crops gracefully into a shallow horizontal header. The LEFT 45% is mostly dark navy open space with only low-contrast mist, deliberately clean negative space for HTML headings and navigation. Elegant cyan/navy/ivory/gold palette, consistent with a premium cosmic geometric spaceship game. Not cartoon fantasy, not flat vector. NO typography, NO letters, NO logo, NO UI frames, NO buttons, NO baked-in interface. Output one standalone opaque illustration suitable as an actual lightweight web game header background.
```

`transparent_background=false`. Inspeccionar una regeneración tanto sola como
en la cabecera; no hornear textos/botones en la imagen ni cambiar los iconos
de campaña por detalles decorativos ambiguos.

## Comprobaciones de esta entrega

Build local Vite con `--configLoader runner` verde; permanece el warning
preexistente de chunk >500 kB. Capturas y comprobaciones de layout en
1280×720, 390×844, 320×568 y 640×360: sin overflow horizontal ni solapamiento
header/cuerpo, cuerpo >80 px, carga del arte correcta y sin errores de página.
Volver, reabrir, seleccionar Radial e iniciar funcionan en los cuatro tamaños.
Iniciar visible sin scroll en 1280×720 y 390×844; disponible por scroll en las
dos ventanas más pequeñas. Capturas locales ignoradas:
`test-results/act-header-art/`. No se ejecutó la suite completa ni CI; no se
hizo commit/push. La aceptación artística sigue siendo del usuario.

## Accesos de Inicio: configuración, bitácora y ruleta — 07-10-2026

Se agregaron tres placas de fondo para completar visualmente la fila de
interacción del menú. Son ilustraciones opacas sin copy horneado: sus focos
quedan hacia la derecha y la zona izquierda oscura conserva contraste para los
títulos/estados HTML. Configuración abre ahora un `<dialog>` modal nativo fuera
del flujo del grid; Escape, el botón de cerrar y el backdrop lo cierran, el foco
regresa al acceso y el contenedor no crece. Los otros accesos conservan sus
fondos actuales.

| Archivo | Motivo | PNG original | Derivado WebP | Bytes final |
| --- | --- | ---: | ---: | ---: |
| `home-cards/settings-control-console.webp` | Tres reguladores holográficos y un dial de calibración | 1932×814 · 2,041,344 B | 960×404 | 46,554 |
| `home-cards/retention-flight-log.webp` | Bitácora/prisma con sello estelar de desafío | 1932×814 · 2,190,044 B | 960×404 | 64,636 |
| `home-cards/daily-reward-wheel.webp` | Aro de premio segmentado con un sector raro iluminado | 1932×814 · 2,383,144 B | 960×404 | 79,218 |

Total transferido de los tres derivados: **190,408 bytes**. Conversión
Lanczos a 960 px de ancho con FFmpeg/libwebp, calidad 84 y compresión 6. Son
placas RGB opacas (`transparent_background=false`), sin texto ni logos. La
base RGBA teórica de las tres imágenes a resolución derivada es 4,654,080 B
(~4.44 MiB), no una medición de memoria real. Fondo estático CSS, sin filtros
ni animaciones. Si una descarga falla, se conserva el degradado CSS; el texto
y los controles siguen disponibles. No se midió rendimiento en dispositivo
físico.

Procedencia: herramienta ImageGen integrada. Referencia de estilo: captura del
menú adjunta por el usuario, únicamente para paleta y acabado; composición y
motivos nuevos. IDs de generación: Configuración
`exec-21f7aa89-4db9-4761-867b-4f4d555ba2ee`, Bitácora
`exec-a7b8a9b4-5a81-4ddd-a8f3-3cc565fe0643`, Ruleta
`exec-7c265dff-c30b-4d35-8059-d2d8b57f6c26`.

### Prompts completos

#### Configuración

```text
Use case: stylized-concept
Asset type: wide home-menu feature-card background for a sci-fi survival game
Primary request: create an atmospheric visual for the Settings / controls button, using the attached menu screenshot only as a reference for its dark cinematic space palette, luminous cyan highlights, and premium game-art finish
Scene/backdrop: deep navy orbital command space, subtle depth and a few restrained stars
Subject: a compact holographic control console made from three elegant vertical tuning rails and a central glowing calibration dial, presented as an environmental visual motif, not as a literal UI screenshot
Style/medium: polished painterly 3D game illustration, crisp materials and controlled glow, compatible with the reference game menu
Composition/framing: very wide landscape feature-card crop, main control motif on the right half, keep lower-left area darker and visually quiet so HTML title copy remains readable; no borders or card frame
Lighting/mood: cool cyan and ice-blue emitted light with restrained warm gold pinpoints, calm and precise
Constraints: no text, no letters, no numbers, no logos, no watermark; do not render a complete interface or buttons; dark enough to sit behind white menu labels; coherent with the attached reference, but an original scene
```

#### Retos y Bitácora

```text
Use case: stylized-concept
Asset type: wide home-menu feature-card background for a sci-fi survival game
Primary request: create a visual for the Challenges & Flight Logbook button, matching the attached generated Settings card only as a shared reference for dark cinematic space, cyan highlights, restrained gold details, and premium painted 3D game art; this must have its own clearly different motif
Scene/backdrop: dark deep-space archive chamber with subtle star dust and layered depth
Subject: a compact floating pilot flight-log prism, partly open, showing a bright star-shaped challenge seal and a few abstract mission-record glyph marks as light only
Style/medium: polished painterly 3D game illustration, tactile dark metal and translucent holographic glass, clean silhouette
Composition/framing: very wide landscape home-menu card crop, focal archive prism toward the right half, lower-left stays dark and uncluttered for HTML title and status text; no borders or card frame
Lighting/mood: cyan/ice-blue holographic light with a small warm amber reward glint, purposeful and rewarding
Constraints: no readable text, no letters, no numbers, no logos, no watermark; do not render a complete interface, panel, or button; preserve strong dark contrast under white copy; original art, not a recolor of the reference
```

#### Ruleta diaria

```text
Use case: stylized-concept
Asset type: wide home-menu feature-card background for a sci-fi survival game
Primary request: create a visual for the Daily Wheel reward button, matching the immediately previous generated home-card art only as a reference for dark cinematic space, cyan highlights, warm restrained gold, and premium painterly 3D finish; use a distinct motif
Scene/backdrop: deep navy orbital reward-vault space, subtle star particles and a distant planet
Subject: a large elegant roulette-like energy ring with ten subtle radial divisions and one brilliant rare reward sector, a small glowing crystalline prize at its center; it should read as a daily spin/reward opportunity without showing numbers or text
Style/medium: polished painterly 3D game illustration, intricate but legible ring, metallic gold filigree mixed with cyan reactor glass
Composition/framing: very wide landscape home-menu card crop, place the luminous ring on the right half, keep the lower-left dark and simple for HTML title and status text; no borders or card frame
Lighting/mood: inviting gold rim-light with cool blue-cyan glow, celebratory but still in the game's restrained space aesthetic
Constraints: no text, no letters, no numbers, no logos, no watermark; do not render a complete interface, panel, or button; no clutter under the menu copy; original scene with a clear wheel silhouette
```

### Validación de integración

Typecheck, las 142 suites unitarias (836 pruebas) y `build:local` pasaron.
El smoke de Chromium para escritorio y móvil pasó en 320×640, 390×844,
640×360 y 1280×720: abrir Configuración no cambia la altura del panel; Escape,
backdrop y el botón cierran el modal, actualizan `aria-expanded` y conservan
el foco/navegación. Las tres tarjetas muestran fondo ilustrado y gradiente,
y no hay texto recortado en los botones.

La primera comprobación reveló que la cuadrícula principal seguía en dos
columnas a 320 px y que las tarjetas quedaban comprimidas; se ajustaron ambas
cuadrículas de accesos a una columna bajo 480 px. También se cerró el elemento
`<dialog>` con su etiqueta correcta: el parser HTML había reparado el marcado
incorrecto y creado columnas implícitas que estrechaban la portada. El smoke
actual cubre ambas regresiones.

Vite publica las placas como recursos del build; sus URLs se comprueban en
Chromium y no dependen de ImageGen en runtime. No se probó en móvil físico, CI
ni Pages, y no se hizo commit/push.
