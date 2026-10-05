# Player SVG fallback

`PlayerHullSvg.ts` es el registro único de body/ring/core para Pixi y la vista
de skins. No se mantienen masters completos redundantes ni armas dentro de la
nave. Las muestras de color final están en `docs/visual/fleet-reference.html`;
los PNG son el arte principal del catálogo.

La base cyan comparte `player-body.svg`, `player-ring.svg` y
`player-core.svg`. Cada skin vectorial fallback aporta sus tres piezas en
`skins/<id>/`. Todas usan `viewBox="-32 -32 64 64"`; las firmas adicionales
se generan desde `SkinSignatureSvg.ts`. `PlayerVisualAssets.ts` rasteriza las
piezas una sola vez y `PlayerView` cambia texturas al equipar una skin.

Estas piezas son exclusivamente una ruta de fallback: no cambian colisión ni
estadísticas. Para revisar el catálogo raster, Inicio y combate consumen la
nave PNG seleccionada. Los cañones tienen un catálogo y ancla independientes
en `src/assets/svg/cannons/`.
