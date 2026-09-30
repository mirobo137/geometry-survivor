# Portada de lanzamiento — Inicio

Entrega autorizada el 29-09-2026; integración y revisión local 30-09-2026.
Dirección: hangar orbital, porcelana/titanio y núcleo cian. El usuario aprobó
Actos y pidió sorprender con Inicio; esta portada espera su aprobación visual.

## Contrato y consumidores

Es arte de **portada**, no una nueva skin equipable ni una promesa de cómo se
verá el player en combate. No participa en colisiones, spawn, daño ni guardado.
La nave se compone sobre un entorno visible DENTRO del menú; ya no depende de
un fondo oculto detrás de un gran panel opaco. Se compararon tres composiciones:
escena detrás del panel (descartada por invisibilidad), ilustración única con
texto pintado (descartada por responsive/accesibilidad) y entorno + nave recortada
+ HTML (elegida: profundidad y texto/acciones adaptables).

Consumidores: `index.html`, `StartScreen.mountScene/mountMark`, `src/ui/home.css`.
Título, ruta seleccionada, botones, estadísticas y foco son HTML real.
Actos, Skins y Laboratorio reutilizan imágenes ya aprobadas en sus accesos;
Configuración conserva su símbolo SVG sobre material CSS, sin generar un
bitmap redundante para representar tres controles.

| Archivo de producción | Original | Derivado | Bytes | Alpha |
| --- | --- | --- | ---: | --- |
| orbital-sanctuary.webp | 1536×1024 RGB | 1200×800 RGB, WebP calidad 84 | 102,678 | opaco |
| orbital-sanctuary-portrait.webp | 887×1774 RGB | 720×1440 RGB, WebP calidad 84 | 119,376 | opaco |
| survivor-core.png | 1254×1254 RGBA | 512×512 RGBA, PNG optimizado | 260,169 | 0–255, cuatro esquinas 0 |

Total de archivos raster de portada: **482,223 bytes (~471 KiB)**.
La ampliación vertical añade sólo 119,376 bytes; reutiliza el PNG de la nave.
La composición vertical fue generada expresamente, no recortada de la panorámica.
El PNG deriva del alpha real del generador; no es SVG rasterizado ni un fondo
eliminado con heurísticas. Redimensionado Lanczos, sin repintar el contenido.
Fuentes de generación conservadas fuera del repo; estos derivados son
autosuficientes y no apuntan a carpetas privadas.

Como referencia RGBA8, panorámica + nave = 4,888,576 bytes (~4.66 MiB);
vertical + nave = 5,195,776 bytes (~4.96 MiB), sin cachés/overhead. No equivale
a memoria de GPU medida ni a un resultado FPS. Rotar puede cargar la otra
variante, por lo que ambas pueden permanecer en caché después del cambio.
Los accesos introducen uso inicial de tres recursos ya existentes, no tres
archivos nuevos: act-radial.png, swift-step.webp y resonant-core.webp. Reusar una
URL evita duplicar el archivo, pero no significa descarga inicial gratuita.

## Layout, movimiento y ownership

- PC: portada a la izquierda, consola de acciones a la derecha; título separado
  del casco. Vertical: portada arriba, consola debajo. Horizontal corto desde
  600 px: dos columnas compactas. Pantallas pequeñas pueden desplazar el panel
  verticalmente; nunca ocultar botones/estadísticas para forzar un encaje.
- Dos vistas estáticas del mismo entorno: dentro del menú y detrás del panel,
  continuando su atmósfera. Ambas usan picture con las mismas URLs; una sesión
  limpia solicita sólo una variante, una vez. La selección portrait coincide
  con el layout apilado: `(max-width: 599px), (max-width: 831px) and (min-height: 541px)`.
  No clasifica por user-agent. La nueva imagen mantiene arquitectura arriba,
  hueco para nave/título y una mitad inferior tranquila bajo los controles.
  Object-fit: cover puede recortar bordes secundarios según la proporción;
  no se promete mostrar cada píxel en todas las pantallas.
- Entorno estático con object-fit: cover y encuadre responsive. No blur,
  filtros Pixi, backdrop-filter, vídeo, shader, partículas ni otro RAF.
- Nave única: frame cuadrado, pivote central, orientación hacia arriba, máximo
  296 px de lado en PC, 192 px en portrait normal y 144 px en landscape corto.
  La deriva CSS usa pequeños desplazamientos/rotación sobre esa superficie.
  Cuatro luces de 6 px completan el movimiento. Dos nubes exteriores reutilizan
  tidal-veil-current-a/b.webp (69,140 + 67,656 bytes existentes), sin generar ni
  copiar nuevas texturas. Sólo se muestran en escritorio ≥832×512: superficies
  de hasta 300 px, deriva 10×8 px en 16 s. Low las conserva estáticas; móvil
  las oculta. No anima el panel ni la placa del entorno a tamaño viewport.
  Las corrientes ya se precargan por el juego: en móvil se observaron ambas
  solicitudes con iniciador img, aunque las nubes CSS estén ocultas. Reutilizar
  el recurso no elimina esa carga existente ni vuelve gratuitas las capas DOM.
- Low/Medium/High conservan el mismo arte DOM; no añade trabajo al renderer
  del campo de batalla. El movimiento se desactiva con reduced-motion y cuando
  Inicio está oculto o se abre Actos/Skins/Laboratorio/selector de entrada.
- StartScreen crea tres Image DOM una vez (dos vistas del entorno + nave),
  reutilizando la vista. El navegador
  posee descarga/decodificación/caché; no se crea ninguna Texture Pixi.
- PNG fallido: mark.svg original como fallback. Entorno fallido: se oculta la
  imagen rota y queda el fondo CSS, manteniendo controles y título. Una carga
  correcta posterior al cambiar de orientación vuelve a mostrar la imagen.
- Sin ensamblaje/muerte/presets de combate: son inexistentes por ser portada.
  Los SVG de inicio previos siguen intactos como referencia/fallback.

## Procedencia y prompts completos

Generador integrado de imágenes de Codex (image_gen), dos llamadas originales
y una variante vertical usando la panorámica como referencia de estilo/mundo;
no CLI/API de pago ni dependencia del generador al jugar.
Uso `stylized-concept`. El screenshot del usuario fue referencia de la UI
anterior, no objetivo de edición.

### Entorno — transparente: false

ID original: `exec-7fc623d4-e74b-4018-a2be-b15aa76ca2cc.png`.

> Use case: stylized-concept. Create ONE premium cosmic game title-screen ENVIRONMENT illustration, not a UI screenshot. Landscape 3:2. A majestic orbital launch sanctuary floating above the luminous turquoise limb of a dark planet: beautifully sculpted broken ivory-titanium docking arcs and a distant amber sun at the far upper-left, layered deep navy and teal aurora mist, restrained stars, incredible spatial depth and refined detailed illustrated 3D game-key-art finish. Geometry, energy and quiet anticipation. The focal launch space is at x38%, y54% and is EMPTY: a clean large low-contrast dark navy space for a separate foreground spacecraft that the code will composite. Architecture frames it from the far left/lower-left rather than filling it. The top-left 25% stays dark and quiet for real HTML title text; the RIGHT 40% is VERY dark navy with minimal detail reserved for an interactive menu panel. No ship, no character, no letters, no typography, no logos, no UI, no buttons, no border, no white rectangular background. Cinematic cyan/navy/ivory with small warm-gold accents, elegant premium space-survival aesthetic, distinguishable from the act-selector portal scenes. Opaque painted background, no giant glowing center distracting from the foreground.

### Nave — transparente: true

ID original: `exec-233d2b08-4978-4e07-a229-f9f51661c54c.png`.

> Use case: stylized-concept. Create ONE isolated HERO GEOMETRIC SPACECRAFT for the cover of a premium cosmic survival game, PNG with genuinely TRANSPARENT background. Square composition, slightly elevated top-down three-quarter view, vertical silhouette with nose pointing upward. This is a compact hexagonal reactor-driven geometric craft, not a humanoid or conventional jet: a radiant CYAN faceted hexagonal crystal at its heart, layered carved ivory-titanium hexagonal armor plates, dark navy inset mechanisms, two substantial swept side fins and four small attached geometric stabilizers, subtle gold accents and precise luminous cyan channels. The silhouette evokes a central hexagonal survivor core with modular orbital armor, readable and beautiful. Impressive premium illustrated 3D game key art with convincing sculpted metal materials, strong elegant bold shapes instead of tiny greebles. Symmetric, complete whole craft inside frame, about 15% transparent padding. Subtle cyan engine light LOCAL to the bottom of the craft, no huge smoke plume or cloud, no backdrop, no planet, no stars, no floor, no shadow on a surface, no text, no logos, no badge, no rectangular tile, no baked checkerboard. Alpha zero around the spacecraft and through any open gaps; this foreground object will float over a separately generated title-screen environment in real web UI.

### Entorno vertical — transparente: false

ID original: `exec-d3465320-a986-4be2-80d1-02d80fdb94cc.png`.

> Use case: stylized-concept. Asset type: portrait environment plate for the full mobile main menu of Geometry Survivor. Image 1 is a STYLE AND WORLD reference, not an image to crop. Create a NEW PORTRAIT 1:2 composition of the SAME orbital sanctuary: ivory/titanium docking architecture with refined warm-gold seams, a dark planetary surface with turquoise atmospheric light and rich navy/cyan nebulae. Premium detailed illustrated 3D space game key art. Recompose the environment for a narrow vertical mobile menu: the TOP 38 percent is the hero space, with elegant broken docking arcs framing the left and far right edges, a small distant warm sun in upper-left, a cyan planet limb crossing near 38 percent height. Leave the central hero area around x65%, y25% EMPTY and navy for a separate transparent ship; keep x8-65%, y5-17% quiet and dark for real HTML title text. The LOWER 62 percent continues as a beautiful subdued very dark navy starfield and soft teal wisps mostly near the outer edges, low contrast behind live interactive buttons. No huge central bright objects behind the lower menu. Keep important architecture readable inside the central 80 percent horizontal safe region, minor atmospheric edges may crop on different screen ratios. The image must feel vertical and intentionally art-directed, not a squeezed or cropped horizontal picture. No spacecraft, character, words, letters, title, UI, buttons, logos, border, watermark. Opaque background, no transparency. Preserve the reference's palette, materials and believable orbital depth; this is an orientation variant of that cover, not a new playable arena.

## Verificación y límites

Comandos reproducibles con el loader runner para el problema local de permisos
de OneDrive:

```powershell
npm run typecheck
npx vite build --mode development --configLoader runner
npx vite preview --mode development --host 127.0.0.1 --port 4173 --strictPort --configLoader runner
npx playwright test --grep "cubre la carga desde HTML|adapta portada y controles"
```

Los smokes de Inicio mantienen la comprobación de movimiento bounded, pausa de
decoración en consolas/reduced-motion, targets ≥44 px y texto dentro de botones.
Comprueban también la variante correspondiente en cuatro viewports y que el
exterior/interior compartan currentSrc. Hay cinco superficies móviles acotadas
(nave + luces), siete en escritorio Medium/High y cinco en Low; cero cuando
se oculta Inicio o se activa reduced-motion.
El límite de la nave sustituyó el viejo badge de <210 px: ahora ≤340 px contando
rotación, manteniendo prohibida la animación de capas grandes. El smoke de ruta
persistente comprueba también el nombre mostrado bajo Jugar. No se aumenta el
timeout. Desde el 30-09-2026, boot/movimiento y la matriz de tamaños tienen
presupuestos independientes: un boot adicional por proyecto evita acumular
toda la UI bajo un solo límite de 60 s. No se retira cobertura ni se añade
un caso por tamaño. Diagnóstico y límites: [CI](../../../../../docs/CI_DEPLOY.md).

Validaciones medidas y pendientes: consultar el snapshot vigente en
[CONTINUACION.md](../../../../../CONTINUACION.md). No se certifican FPS, memoria
real, móvil físico, CI ni publicación por una captura de escritorio.
