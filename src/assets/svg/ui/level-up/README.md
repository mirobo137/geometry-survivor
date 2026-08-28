# Level-up SVG UI

`card-frame.svg` es un marco decorativo inline con `viewBox="0 0 320 260"`.
Usa variables CSS (`--card-surface`, `--card-line`, `--card-accent`) para que
la misma geometria cambie de familia sin duplicar SVG. `preserveAspectRatio` es
`none` de forma intencional: el marco solo contiene lineas y esquinas que deben
llenar la tarjeta responsive.

`icons.svg` es un sprite inline montado una vez. Las cartas referencian sus
`symbol` con `<use>`; el texto y el hit-area siguen siendo HTML accesible.
No se usan filtros, raster, fuentes externas ni geometria generada por carta.
