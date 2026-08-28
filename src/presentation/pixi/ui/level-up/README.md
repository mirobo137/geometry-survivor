# FX de cartas de level-up

`LevelUpFxView` dibuja el feedback premium detras de las cartas HTML:

- aura y aura interior en `Graphics` para foco/hover;
- escala y atenuacion de las cartas desde CSS, conservando texto, foco y hit-area
  nativos;
- anillo, rayos y rafaga determinista de 24 sprites reutilizados al confirmar;
- tono tomado del mismo `UpgradeCardTone` que usa la tarjeta SVG;
- deteccion de `prefers-reduced-motion` para omitir movimiento y rafaga;
- `eventMode = none`, por lo que Pixi nunca roba el toque al boton.

La vista recibe anclas logicas una vez al abrir o redimensionar el overlay. Tiene
su propio reloj de UI y un limite fijo de particulas para mantener el coste
predecible en moviles. No se anade `pixi-filters` en este slice: `Graphics` y un
pool pequeno son suficientes para validar la sensacion; un glow filtrado queda
como spike medido posterior, con calidad Low/High explicita.
