# Vistas Pixi de enemigos

Cada enemigo complejo tiene una carpeta propia para su compositor y pruebas:

```text
enemies/
└─ turtle/
   ├─ TurtleVisual.ts
   └─ TurtleVisual.test.ts
```

`CombatEntitiesView` coordina el pool; las vistas por enemigo solo aplican
texturas, capas y transforms al contrato `EnemyRenderState`.

El feedback transversal vive en `../fx/EnemyImpactFxView.ts`: recibe impactos
detectados por cambios de vida y derrotas confirmadas por `Game`, y reutiliza
anillos/fragmentos con un presupuesto fijo. Las vistas por enemigo no deciden
daño, XP, colisiones ni la vida útil de esos efectos.
