# Player SVG

Contrato reservado para el jugador:

- declarar frente base, ancla de colision y `viewBox` antes de dibujar;
- separar solo piezas con lectura clara (sombra, anillo, cuerpo, nucleo,
  canones y acentos);
- rasterizar piezas con el mismo frame logico y ancla;
- animar transforms cacheados, sin reconstruir SVG por frame;
- validar silueta, contraste, estados y legibilidad a 32/48/64/96 px.

El master `player.svg` y sus seis piezas comparten `viewBox="-32 -32 64 64"`
y frame logico. `SkinSignatureSvg.ts` aporta una firma vectorial adicional por
skin (aurora, prism, solar o verdant); cada firma se rasteriza una sola vez y
se compone como una pieza independiente, no como una silueta circular
duplicada. `PlayerVisualAssets.ts` convierte todas las piezas en texturas una
sola vez; `PlayerView.ts` las compone, orienta y anima con transforms. Las
skins son tokens de presentación y se pueden probar con `?skin=violet`,
`?skin=amber` o `?skin=emerald`.

Los canones ya no pertenecen a `PLAYER_SKINS`: cada paquete de
`src/assets/svg/cannons/` incluye emisores, proyectil y receta de estela. El
marco del canon sigue siendo `64x64` para que sus anclas coincidan con el
origen logico del disparo. `?cannon=curve`, `?cannon=smoke` y
`?cannon=rainbow` permiten revisar las variantes en una run.
