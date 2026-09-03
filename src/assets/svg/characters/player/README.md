# Player SVG

Contrato reservado para el jugador:

- declarar frente base, ancla de colision y `viewBox` antes de dibujar;
- separar solo piezas con lectura clara (sombra, anillo, cuerpo, nucleo,
  canones y acentos);
- rasterizar piezas con el mismo frame logico y ancla;
- animar transforms cacheados, sin reconstruir SVG por frame;
- validar silueta, contraste, estados y legibilidad a 32/48/64/96 px.

El master `player.svg` y las piezas compartidas (`player-shadow`, acentos y
cañones) usan `viewBox="-32 -32 64 64"`. Cada skin aporta `body`, `ring` y
`core` propios: cyan vive junto al master; violet, amber y emerald están en
`skins/<id>/`. `SkinSignatureSvg.ts` añade la firma orbital. `PlayerVisualAssets.ts`
rasteriza todas las piezas una sola vez; `PlayerView` cambia texturas al
equipar una skin. Siguen siendo tokens de presentación: `?skin=violet`,
`?skin=amber` o `?skin=emerald` no cambian colisión ni stats.

Los canones ya no pertenecen a `PLAYER_SKINS`: cada paquete de
`src/assets/svg/cannons/` incluye emisores, proyectil y receta de estela. El
marco del canon sigue siendo `64x64` para que sus anclas coincidan con el
origen logico del disparo. `?cannon=curve`, `?cannon=smoke` y
`?cannon=rainbow` permiten revisar las variantes en una run.
