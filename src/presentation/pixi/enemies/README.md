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
`cockpit`) y aplica transforms locales al contrato `EnemyRenderState`. Splitter
usa `splitterDepth` para escalar sus hijos por transform, no para crear otra
textura. En
calidad Low queda activo el casco, que conserva la entidad real y su silueta,
pero se omiten piezas decorativas, flash y animacion secundaria.

Prism Weaver sigue el mismo ensamblaje y añade un telegraph pooled independiente
en `PrismWeaverTelegraphView`: tres radios facetados comparten un solo root que
rota durante `active`. La geometria se construye al cambiar el cast o el radio,
no por frame. Low conserva base, core y nodos esenciales; Medium/High agregan
la capa de borde sin filtros ni texturas nuevas.

`CombatEntitiesView` coordina el pool; las vistas por enemigo solo aplican
texturas, capas y transforms al contrato `EnemyRenderState`.

El feedback transversal vive en `../fx/EnemyImpactFxView.ts`: recibe impactos
detectados por cambios de vida y derrotas confirmadas por `Game`, y reutiliza
anillos/fragmentos con un presupuesto fijo. Las vistas por enemigo no deciden
daño, XP, colisiones ni la vida útil de esos efectos.
