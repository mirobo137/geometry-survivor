# Enemy SVG masters

Los enemigos usan un `viewBox` centrado y se convierten una sola vez en una
textura Pixi cacheada. La simulacion conserva sus radios y reglas; el SVG solo
define la representacion visual.

| Asset | Rol | ViewBox | Ancla | Render | Instancias |
| --- | --- | --- | --- | --- | --- |
| `turtle.svg` | chaser / enemigo comun | `-32 -32 64 64` | `(0, 0)` | textura Pixi | hasta 250 |

La tortuga esta orientada hacia `-Y` y puede rotarse como contenedor cuando el
movimiento direccional se incorpore. Sus colores son explicitos porque Pixi no
consume CSS externo; el contorno y la silueta mantienen la lectura sobre la
arena oscura.
