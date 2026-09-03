# Vistas Pixi de personajes

Las vistas de personajes se agrupan por identidad y solo consumen contratos de
estado de simulacion:

```text
characters/
└─ player/
   ├─ PlayerView.ts
   └─ PlayerVisualAssets.ts
```

`PlayerView` compone las piezas SVG cacheadas, aplica hull y firma por skin y
anima idle, orientacion, recoil y flash de daño. `PlayerVisualAssets` es la unica
frontera que rasteriza los masters con el frame comun. No contienen reglas de
daño, movimiento, upgrades o input.
