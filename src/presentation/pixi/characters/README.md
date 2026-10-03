# Vistas Pixi de personajes

Las vistas de personajes se agrupan por identidad y solo consumen contratos de
estado de simulacion:

```text
characters/
└─ player/
   ├─ PlayerView.ts
   └─ PlayerVisualAssets.ts
```

`PlayerView` compone la nave PNG y los cañones enlazados de `TetheredShipView`,
con las piezas SVG cacheadas como fallback. `PlayerPropulsionView` anima motores
y `CannonFeedbackView` consume el disparo aceptado para recoil, flare y pulso
de cable. Ambas usan sprites fijos y fuentes pequeñas con ownership explícito.
`PlayerVisualAssets` rasteriza los masters del fallback con el frame común.
No contienen reglas de daño, movimiento, upgrades o input. Contratos y extensión
del catálogo: [Naves PNG](../../../../docs/design/NAVES_PNG.md).
