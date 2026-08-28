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
