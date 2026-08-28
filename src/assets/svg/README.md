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

Cada carpeta de personaje o enemigo debe contener su master SVG, las piezas
animables (si existen), una ficha README y sus pruebas estructurales. Los
archivos comparten `viewBox`, frame de textura, ancla y escala cuando se
componen en Pixi.
