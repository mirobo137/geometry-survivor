# Enemy SVG masters

Los enemigos usan un `viewBox` centrado y se convierten una sola vez en una
textura Pixi cacheada. La simulacion conserva sus radios y reglas; el SVG solo
define la representacion visual.

| Asset | Rol | ViewBox | Ancla | Render | Instancias |
| --- | --- | --- | --- | --- | --- |
| `turtle.svg` | chaser / enemigo comun (fallback estatico) | `-32 -32 64 64` | `(0, 0)` | textura Pixi | hasta 250 |
| `turtle-shell.svg` | caparazon animable | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por chaser |
| `turtle-limbs-front.svg` | patas delanteras | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por chaser |
| `turtle-limbs-rear.svg` | patas traseras y cola | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por chaser |
| `turtle-head.svg` | cabeza direccional | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por chaser |

La tortuga esta orientada hacia `-Y` y puede rotarse como contenedor cuando el
movimiento direccional se incorpore. Sus colores son explicitos porque Pixi no
consume CSS externo; el contorno y la silueta mantienen la lectura sobre la
arena oscura.

El master se divide tambien en `turtle-shell.svg`, `turtle-limbs-front.svg`,
`turtle-limbs-rear.svg` y `turtle-head.svg`. Son piezas alineadas al mismo
viewBox y se convierten en texturas una sola vez para permitir rotacion,
balanceo de patas y bob de cabeza sin reconstruir XML.

## Ficha de revision reutilizable

- **Frente base:** cabeza hacia `-Y`; el runtime usa el vector de velocidad y
  un offset de `+PI/2` para orientar el contenedor.
- **Ancla:** centro de masa en `(0, 0)`; las piezas no alteran radio ni
  colisiones.
- **Animacion:** patas delanteras y traseras balanceadas, bob leve de cabeza y
  respiracion del caparazon. Amplitudes pequenas y congeladas durante pausa.
- **Gate visual:** reconocer la silueta en negro, frente/lateral/trasera con
  movimiento y lectura a 32 px sobre fondos oscuro y claro antes de crear otra
  familia.
- **Gate tecnico:** un `viewBox` y escala comun, texturas parseadas una vez,
  transforms por frame y sin dependencias externas.

Las futuras criaturas deben copiar esta ficha y cambiar solo lo que aporte una
diferencia funcional o de identidad; no se aceptan variantes direccionales
duplicadas del SVG.
