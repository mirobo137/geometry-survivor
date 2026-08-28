# Level-up UI

Esta carpeta contiene la experiencia visual y de interacción del menú de cartas.

- `LevelUpOverlay.ts` solo orquesta el DOM, el foco y la selección. No decide daño,
  XP, rareza ni efectos de gameplay.
- `UpgradeCardVisual.ts` es el registro data-driven de icono, tono y categoría por
  `UpgradeId`. Añadir una carta visual requiere extender ese mapa, no duplicar
  markup en el motor.

El texto y el área táctil permanecen en botones HTML nativos para accesibilidad y
para que Poki/CrazyGames puedan instrumentar la interacción. El marco y los iconos
son SVG code-first, escalables y compartidos; la simulación no importa este módulo.
