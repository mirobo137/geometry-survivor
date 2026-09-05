# Enemy SVG masters

Los enemigos se organizan por identidad dentro de `enemies/<id>`. Cada grupo
mantiene su master, piezas, ficha y pruebas. Usan un `viewBox` centrado y se
convierten una sola vez en texturas Pixi cacheadas. La simulacion conserva sus
radios y reglas; el SVG solo define la representacion visual.

El [Tank de referencia](tank/README.md) demuestra blindaje por planos, cavidad
de reactor y ensamblaje. Su master compuesto se utiliza también en Low para
conservar la silueta. La extensión autorizada a Chaser, Fast, Elite y boss
se detalla en [la guía por familias](../../../../skills/geometry-survivor-svg/references/visual-family-direction.md).
Los cuatro enemigos comunes tienen master Low completo; el boss usa una
instancia modular independiente con frame 112×112. Lámina viva:
`docs/visual/fleet-reference.html` desde la raíz del repositorio.
Seguir la referencia `ship-art-direction.md` enlazada desde la skill SVG antes
de construir otra nave. No copiar la silueta del Tank a todos los roles.

| Asset | Rol | ViewBox | Ancla | Render | Instancias |
| --- | --- | --- | --- | --- | --- |
| `chaser/chaser.svg` | scout / enemigo comun (master de nave) | `-32 -32 64 64` | `(0, 0)` | 4 texturas Pixi | hasta 250 |
| `chaser/chaser-rear.svg` | motores y sombra del scout | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por scout |
| `chaser/chaser-wings.svg` | alas del scout | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por scout |
| `chaser/chaser-hull.svg` | casco del scout | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por scout |
| `chaser/chaser-cockpit.svg` | cabina y nucleo del scout | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | una por scout |
| `turtle/turtle.svg` | referencia visual y base historica | `-32 -32 64 64` | `(0, 0)` | textura Pixi | no se instancia en combate |
| `turtle/turtle-shell.svg` | caparazon de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-limbs-front.svg` | patas delanteras de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-limbs-rear.svg` | patas traseras de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-head.svg` | cabeza direccional de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `fast/fast.svg` | Fast / perseguidor veloz | `-32 -32 64 64` | `(0, 0)` | 4 texturas Pixi | hasta 250 |
| `tank/tank.svg` | Tank / resistente | `-32 -32 64 64` | `(0, 0)` | 4 texturas Pixi | hasta 250 |
| `elite/elite.svg` | Elite / amenaza prioritaria | `-32 -32 64 64` | `(0, 0)` | 4 texturas Pixi | hasta 250 |

Todas las naves estan orientadas hacia `-Y` y se rotan como contenedor segun el
vector de movimiento. Sus colores son explicitos porque Pixi no consume CSS
externo; el contorno y la silueta mantienen la lectura sobre la arena oscura.
La tortuga se conserva como referencia de composicion y contrato, pero el
`chaser` activo usa la nave scout para respetar la tematica espacial.

Cada master de nave se divide en cuatro piezas alineadas al mismo viewBox y se
convierte en texturas una sola vez. El runtime anima motores, alas, casco y
cabina mediante `position`, `rotation`, `scale` y `alpha`, sin reconstruir XML.
La rasterizacion pasa explicitamente el frame `(-32, -32, 64, 64)`; depender de
los limites visibles de cada pieza cambiaria su centro y destruiria la
composicion.

## Ficha de revision reutilizable

- **Frente base:** proa/cabina hacia `-Y`; el runtime usa el vector de velocidad
  y un offset de `+PI/2` para orientar el contenedor.
- **Ancla:** centro de masa en `(0, 0)`; las piezas no alteran radio ni
  colisiones.
- **Animacion:** motores pulsantes, alas con sway, casco con respiracion y
  cabina con bob direccional. Amplitudes pequenas y congeladas durante pausa.
- **Orden de capas:** rear/motores -> wings/placas -> hull/casco ->
  cockpit/core; la proa conserva la lectura direccional.
- **Muerte:** copia visual pooled de las cuatro piezas, separacion de
  420 ms y desaparicion; no retiene la entidad logica.
- **Gate visual:** reconocer la silueta en negro, frente/lateral/trasera con
  movimiento y lectura a 32 px sobre fondos oscuro y claro antes de crear otra
  familia.
- **Gate tecnico:** un `viewBox` y escala comun, texturas parseadas una vez,
  transforms por frame y sin dependencias externas.

Las futuras criaturas deben copiar esta ficha y cambiar solo lo que aporte una
diferencia funcional o de identidad; no se aceptan variantes direccionales
duplicadas del SVG.
