# Vistas Pixi de enemigos

Cada enemigo comun se compone con piezas SVG cacheadas y una sola vista pooled.
La antigua tortuga queda conservada unicamente como master SVG de referencia en
`src/assets/svg/enemies/turtle/`; ya no tiene una ruta de rendering en runtime.

```text
enemies/
└─ turtle/
   ├─ TurtleVisual.ts
   └─ TurtleVisual.test.ts
```

`EnemyShipVisual` usa cuatro texturas por familia (`rear`, `wings`, `hull` y
`cockpit`) y aplica transforms locales al contrato `EnemyRenderState`. En
calidad Low queda activo el casco, que conserva la entidad real y su silueta,
pero se omiten piezas decorativas, flash y animacion secundaria.

`CombatEntitiesView` coordina el pool; las vistas por enemigo solo aplican
texturas, capas y transforms al contrato `EnemyRenderState`.

El feedback transversal vive en `../fx/EnemyImpactFxView.ts`: recibe impactos
detectados por cambios de vida y derrotas confirmadas por `Game`, y reutiliza
anillos/fragmentos con un presupuesto fijo. Las vistas por enemigo no deciden
daño, XP, colisiones ni la vida útil de esos efectos.
