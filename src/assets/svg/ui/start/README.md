# Start screen SVG assets

## `mark.svg`

- Rol: marca central del menú.
- ViewBox: `-72 -72 144 144`, ancla en el centro.
- Render: SVG inline en `StartScreen` para conservar escalado y recolor CSS.
- Animación: el consumidor gira el SVG completo; el master no contiene
  scripts ni filtros.

## `hero-scene.svg`

- Rol: atmósfera decorativa de la pantalla de inicio.
- ViewBox: `0 0 1200 900`, centrado visualmente para recorte responsive.
- Render: SVG inline único en `#start-scene`; no es una entidad de gameplay.
- Animación: CSS transforma grupos preconstruidos y cambia opacidad o
  `stroke-dashoffset`; nunca se reescribe el XML por frame.
- Accesibilidad: decorativo, `aria-hidden="true"` y sin interacción.
- Restricciones: geometría simple, sin raster, recursos externos, scripts,
  filtros o máscaras complejas. IDs prefijados con `ui-start-hero-`.

Los textos, botones, foco y áreas táctiles continúan siendo HTML en
`index.html`. Si el coste visual futuro lo justificara, la escena podría
convertirse en una textura cacheada durante la entrada al menú, pero no se
recalculará por frame.
