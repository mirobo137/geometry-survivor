# Biblioteca SVG

Los assets vectoriales se organizan por dominio y despues por identidad:

```text
svg/
├─ characters/
│  └─ player/          # master, piezas y contrato del jugador
├─ enemies/
│  └─ turtle/          # master, piezas, pruebas y ficha de la tortuga
└─ ui/
   └─ level-up/        # marcos e iconos de cartas
```

La carpeta `ui/start/` contiene la marca y la escena ambiental del menú
inicial. La escena se monta una sola vez en el DOM y sus grupos se animan con
CSS, sin crear una segunda simulación.

Cada carpeta de personaje o enemigo debe contener su master SVG, las piezas
animables (si existen), una ficha README y sus pruebas estructurales. Los
archivos comparten `viewBox`, frame de textura, ancla y escala cuando se
componen en Pixi.
