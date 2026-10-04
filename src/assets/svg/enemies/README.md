# Enemy SVG masters

Los masters SVG originales se conservan como referencias editables. En combate
los cuerpos completos usan los PNG transparentes versionados en
`src/assets/images/enemies/`; las entradas modulares de bosses mantienen sus
piezas SVG. La simulacion conserva sus radios y reglas; el arte solo define la
representacion visual.

El [Tank de referencia](tank/README.md) demuestra blindaje por planos, cavidad
de reactor y ensamblaje. La guía histórica por familias está en
[visual-family-direction](../../../../skills/geometry-survivor-svg/references/visual-family-direction.md).
Las 13 familias comunes y tres bosses tienen un PNG de cuerpo completo. Los
bosses conservan su instancia modular de entrada en frame 112×112. Lámina viva:
`docs/visual/fleet-reference.html` desde la raíz del repositorio.
Seguir la referencia `ship-art-direction.md` enlazada desde la skill SVG antes
de construir otra nave. No copiar la silueta del Tank a todos los roles.

| Asset | Rol | ViewBox | Ancla | Render | Instancias |
| --- | --- | --- | --- | --- | --- |
| `chaser/chaser.svg` | scout / enemigo comun (master de nave) | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `chaser/chaser-rear.svg` | motores y sombra del scout | `-32 -32 64 64` | `(0, 0)` | referencia SVG | no runtime |
| `chaser/chaser-wings.svg` | alas del scout | `-32 -32 64 64` | `(0, 0)` | referencia SVG | no runtime |
| `chaser/chaser-hull.svg` | casco del scout | `-32 -32 64 64` | `(0, 0)` | referencia SVG | no runtime |
| `chaser/chaser-cockpit.svg` | cabina y nucleo del scout | `-32 -32 64 64` | `(0, 0)` | referencia SVG | no runtime |
| `turtle/turtle.svg` | referencia visual y base historica | `-32 -32 64 64` | `(0, 0)` | textura Pixi | no se instancia en combate |
| `turtle/turtle-shell.svg` | caparazon de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-limbs-front.svg` | patas delanteras de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-limbs-rear.svg` | patas traseras de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `turtle/turtle-head.svg` | cabeza direccional de referencia | `-32 -32 64 64` | `(0, 0)` | textura Pixi cacheada | referencia |
| `fast/fast.svg` | Fast / perseguidor veloz | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `tank/tank.svg` | Tank / resistente | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `elite/elite.svg` | Elite / amenaza prioritaria | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `orbiter/orbiter.svg` | Orbiter / arco angular | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `charger/charger.svg` | Charger / ariete angular | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `splitter/splitter.svg` | Splitter / nave de fractura angular | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | hasta 250 |
| `prism-weaver/prism-weaver.svg` | Prism Weaver / controlador de tres radios | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | cap authored 3 |
| `boss/boss.svg` | Core Sentinel / boss centinela | `-56 -56 112 112` | `(0, 0)` | PNG de cuerpo + SVG de entrada/fallback | 1 |
| `boss/orbital-warden.svg` | Orbital Warden / boss angular | `-56 -56 112 112` | `(0, 0)` | PNG de cuerpo + SVG de entrada | 1 |
| `warden-replica/warden-replica.svg` | replica destructible del Warden | `-32 -32 64 64` | `(0, 0)` | PNG compartido + SVG fallback | 2 |

Todas las naves estan orientadas hacia `-Y` y se rotan como contenedor segun el
vector de movimiento. Las piezas comunes bajo `enemies/<id>/` siguen disponibles
para edición y comparación, pero sus SVG independientes ya no se cargan al
runtime. `FractureEnemySvgMarkup` sigue ensamblando esos cuatro masters SVG de
fallback mientras se decodifican los PNG.
La tortuga se conserva como referencia de composicion y contrato, pero el
`chaser` activo usa la nave scout para respetar la tematica espacial.

Prism Weaver es la referencia para enemigos de control espacial: su nave usa
tres capas funcionales (motores, placas de celosia y nucleo prisma) y el
telegraph fuera del SVG dibuja tres sectores separados. El SVG no contiene el
alcance del peligro ni decide colisiones; esa lectura pertenece a
`PrismWeaverTelegraphView` y `PrismWeaverBehavior`.

Los componentes SVG comunes siguen documentando la construcción de cada master,
pero la animación actual aplica `position`, `rotation`, `scale` y `alpha` sobre
una sola imagen. La rasterización PNG conserva explícitamente el frame
`(-32, -32, 64, 64)`; depender de los límites visibles alteraría su centro.

La replica del Warden conserva las coordenadas de la familia grande reducidas
explicitamente al 55% en cada `d`. Esto es obligatorio: el parser
`Graphics.svg()` de Pixi recorre un `<g>` pero no aplica su atributo `transform`;
ademas, los paths originales llegan hasta aproximadamente `-54..48`, fuera del
frame de 64 px, y Pixi los recortaria al generar la textura. No reemplazarlo
por offsets por pieza ni ampliar el frame sin revisar la escala de la entidad.

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
