# Level-up UI

## Contrato de interaccion

`LevelUpCardInteraction.ts` define los eventos semanticos `focus`, `blur`,
`press` y `select`, ademas del layout de cada carta. La UI emite estos eventos;
no conoce Pixi ni crea efectos de gameplay.

Al seleccionar una carta se aplica una confirmacion breve de 220 ms. El boton
queda marcado con `aria-pressed`, las otras opciones se atenuan y el callback de
seleccion se ejecuta despues del feedback. `getCardLayouts()` expone centros,
tamanos y tonos relativos al overlay para que la capa de presentacion sincronice
un efecto sin recalcular geometria en cada frame.

Esta carpeta contiene la experiencia visual y de interacción del menú de cartas.

- `LevelUpOverlay.ts` solo orquesta el DOM, el foco y la selección. No decide daño,
  XP, rareza ni efectos de gameplay.
- `UpgradeCardVisual.ts` es el registro data-driven de icono, tono y categoría por
  `UpgradeId`. Añadir una carta visual requiere extender ese mapa, no duplicar
  markup en el motor.

El texto y el área táctil permanecen en botones HTML nativos para accesibilidad y
para que Poki/CrazyGames puedan instrumentar la interacción. El marco y los iconos
son SVG code-first, escalables y compartidos; la simulación no importa este módulo.
