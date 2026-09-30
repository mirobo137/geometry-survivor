# Iconos PNG transparentes del selector de Actos

Prueba solicitada por el usuario, 29-09-2026. Son cuatro emblemas generados con
el generador integrado, no SVG envueltos/rasterizados ni recortes de las escenas.
Reemplazan sólo las cuatro imágenes decorativas `.act-emblem` del selector;
no afectan botones, texto, rutas, persistencia ni gameplay. Pendiente aprobación
visual humana y móvil físico.

## Inventario y transparencia

| PNG final | Fuente integrada | Dimensiones fuente | Bytes finales |
| --- | --- | --- | ---: |
| `radial.png` | `exec-814dbe44-8664-4749-9757-531afc062d41` | 1254×1254 | 41,132 |
| `angular.png` | `exec-780628ed-742a-4a83-ad77-2fffb32ee313` | 1254×1254 | 30,249 |
| `fracture.png` | `exec-a3939723-3d7d-47ce-94a1-a95e42d101f8` | 1254×1254 | 31,334 |
| `overdrive.png` | `exec-1c8095d9-423e-4823-83c0-4bea186ea22a` | 1637×961 | 25,009 |

Todos los derivados son PNG **RGBA 160×160**. Suman 127,724 bytes (~128 kB);
base teórica RGBA8 de las cuatro imágenes 409,600 bytes (400 KiB), no memoria
real medida del navegador. Fuentes en biblioteca del host, derivados completos
en este directorio; no dependencias externas ni IA durante runtime.

Generación: `transparent_background=true`. Se verificó alfa mínimo 0/máximo
255 en originales y derivados, y se compusieron los finales sobre navy y blanco
para inspeccionar contornos y huecos; no hay damero ni rectángulo pintado detrás.
Derivación técnica con Pillow: convertir RGBA, `ImageOps.contain` Lanczos dentro
de 160×160 y centrar en canvas RGBA cero, `optimize=True`. No eliminar fondo con
un color aproximado ni estirar el infinito para hacerlo cuadrado.

## Identidad, presentación y carga

- Radial: anillo cardinal concéntrico alrededor de núcleo hexagonal cyan.
- Angular: rombo metálico y flecha/chevron direccionales cyan.
- Fracture: tres fragmentos y reactor romboidal violeta con huecos separados.
- Overdrive: infinito metálico dorado con huecos transparentes.

Orientación frontal; frame fijo cuadrado, ancla central (80,80). Overdrive mantiene
su proporción horizontal dentro del mismo frame. HTML `img` decorativo con
`alt=""`, dimensiones reservadas, `loading="lazy"` y `decoding="async"`.
Tamaño CSS: 56×56 en PC y 48×48 en móvil; objeto `contain`, sin filtro ni
animación. Cuatro instancias, nunca un loop nuevo. Las esquinas estrechas usan
un candado en lugar del badge largo BLOQUEADO para no invadir el icono.

El navegador administra descarga/caché/decodificación. `StartScreen` restaura
el URL empaquetado del SVG anterior en error de imagen, incluyendo un fallo
previo al montaje; listener de un solo disparo. Los cuatro SVG originales siguen
intactos. El texto del botón y sus etiquetas accesibles describen selección y
bloqueo: el color o PNG nunca es el único estado.

## Validación local

Typecheck y build Vite local con `--configLoader runner` verdes. Permanece
warning previo de chunk >500 kB. En 1280×720, 390×844, 320×568 y 640×360:
cuatro PNG decodificados 160×160, sin overflow horizontal, copy dentro del
botón sin solaparse con imagen, igualdad de altura de los cuatro botones y
cabecera/cuadrícula alineadas (0 px). Volver y Jugar conservaron Overdrive sin
seleccionar de nuevo; sin errores de página. Al abortar los cuatro PNG, cuatro
SVG de fallback decodificados y bloqueos disponibles. Capturas ignoradas:
`test-results/act-png-icons/`, incluida `alpha-preview.png` sobre claro/oscuro.
No se ejecutó CI/suite completa ni se midió FPS/memoria física en esta entrega.
No se hizo commit/push.

## Prompts completos

### radial

```text
Use case: stylized-concept. Asset type: ONE isolated premium sci-fi game UI emblem as a PNG cutout on a genuinely TRANSPARENT background (alpha zero outside the object and through its open holes). Square composition. Straight-on orthographic FRONT view, absolutely no perspective tilt. A polished sculpted titanium and dark navy metal symbol with luminous inset energy, sophisticated illustrated 3D material finish matching a cosmic geometric spaceship survival game. Strong simple bold silhouette, thick readable structural parts, designed to remain identifiable at 40-56 screen pixels. Center the icon and keep symmetric transparent padding of 10% on all edges. Very restrained local highlights, no large glow cloud. No backdrop, no stars, no scene, no floor, no ground shadow, no rectangular tile, no enclosing square badge, no text, no watermark, no checkerboard baked into the image. Only the emblem, all floating detached details belong to this one object. Subject: a circular radial instrument emblem: a segmented titanium circular ring with four short cardinal-direction ticks surrounding a solid geometric hexagonal reactor at its center, bright cyan central crystal and cyan ring channels. Precise concentric symmetry. The spaces between the hexagonal core and ring are completely transparent, not painted dark background.
```

### angular

```text
Use case: stylized-concept. Asset type: ONE isolated premium sci-fi game UI emblem as a PNG cutout on a genuinely TRANSPARENT background (alpha zero outside the object and through its open holes). Square composition. Straight-on orthographic FRONT view, absolutely no perspective tilt. A polished sculpted titanium and dark navy metal symbol with luminous inset energy, sophisticated illustrated 3D material finish matching a cosmic geometric spaceship survival game. Strong simple bold silhouette, thick readable structural parts, designed to remain identifiable at 40-56 screen pixels. Center the icon and keep symmetric transparent padding of 10% on all edges. Very restrained local highlights, no large glow cloud. No backdrop, no stars, no scene, no floor, no ground shadow, no rectangular tile, no enclosing square badge, no text, no watermark, no checkerboard baked into the image. Only the emblem, all floating detached details belong to this one object. Subject: an angular navigation emblem: a sculpted titanium DIAMOND outline containing one sharply faceted right-pointing triangular arrowhead and a small detached left chevron, sapphire-cyan energy seams. Crisp diagonal corners and forward-motion identity. Open spaces inside the diamond outline are genuinely transparent.
```

### fracture

```text
Use case: stylized-concept. Asset type: ONE isolated premium sci-fi game UI emblem as a PNG cutout on a genuinely TRANSPARENT background (alpha zero outside the object and through its open holes). Square composition. Straight-on orthographic FRONT view, absolutely no perspective tilt. A polished sculpted titanium and dark navy metal symbol with luminous inset energy, sophisticated illustrated 3D material finish matching a cosmic geometric spaceship survival game. Strong simple bold silhouette, thick readable structural parts, designed to remain identifiable at 40-56 screen pixels. Center the icon and keep symmetric transparent padding of 10% on all edges. Very restrained local highlights, no large glow cloud. No backdrop, no stars, no scene, no floor, no ground shadow, no rectangular tile, no enclosing square badge, no text, no watermark, no checkerboard baked into the image. Only the emblem, all floating detached details belong to this one object. Subject: a fractured geometric emblem: three large detached asymmetrical faceted titanium armor shards forming a broken triangular orbit around a central solid violet luminous diamond reactor. Separate disconnected shards with clearly visible transparent gaps, strong fractured silhouette, purple luminous seams. No enclosing circular ring or rectangular badge.
```

### overdrive

```text
Use case: stylized-concept. Asset type: ONE isolated premium sci-fi game UI emblem as a PNG cutout on a genuinely TRANSPARENT background (alpha zero outside the object and through its open holes). Square composition. Straight-on orthographic FRONT view, absolutely no perspective tilt. A polished sculpted titanium and dark navy metal symbol with luminous inset energy, sophisticated illustrated 3D material finish matching a cosmic geometric spaceship survival game. Strong simple bold silhouette, thick readable structural parts, designed to remain identifiable at 40-56 screen pixels. Center the icon and keep symmetric transparent padding of 10% on all edges. Very restrained local highlights, no large glow cloud. No backdrop, no stars, no scene, no floor, no ground shadow, no rectangular tile, no enclosing square badge, no text, no watermark, no checkerboard baked into the image. Only the emblem, all floating detached details belong to this one object. Subject: an infinity Overdrive emblem: a single bold smooth horizontal figure-eight INFINITY symbol made of thick sculpted ivory-titanium metal edged in warm gold, dark navy inset grooves and amber luminous seams, small pale directional energy arrow at the central crossing. The two infinity loop holes and all surrounding space are truly TRANSPARENT. Readable unmistakable infinity silhouette, no shield behind it.
```


