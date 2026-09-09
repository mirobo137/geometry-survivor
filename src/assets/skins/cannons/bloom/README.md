# Bloomwake · ficha híbrida

- **Rol:** paquete cosmético de cañón; no cambia daño, velocidad, colisión ni selección de objetivos.
- **Identidad:** emisor floral de cristal SVG, proyectil semilla SVG y estela de pétalos PNG.
- **Frente:** el cañón apunta hacia `-Y`; el runtime rota el par de emisores con el jugador.
- **PNG:** `bloom-trail.png`, RGBA 128×128, una textura compartida por el pool. Se carga de forma diferida sólo al equipar Bloomwake en Medium/High; Low conserva el ribbon procedural para proteger el presupuesto.
- **Fallback:** si el PNG no decodifica, la receta `bloom` usa la misma estela procedural y el SVG del proyectil sigue siendo visible.
- **Fuente:** imagen generada con el prompt de estela floral translúcida definido en `docs/design/ARTE_HIBRIDO.md`; se eliminó el fondo blanco y se redujo a 128 px.
- **Validación:** comprobar alpha, request único en High, cero request inicial y cero request en Low; inspeccionar menú y partida en fondo oscuro.
