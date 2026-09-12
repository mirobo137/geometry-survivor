# Prism Weaver

Cuarta nave de la familia angular. Su verbo visual es un **telar astral**: tres
brazos de registro abiertos rodean un huso prismático estrecho, con un iris teal
que concentra el cast. Las muescas oscuras entre brazos forman espacio negativo
real en la silueta; no es un fuselaje convencional con alas recoloreadas.
No reutiliza la silueta del Orbiter, Charger o Splitter.

- `prism-weaver.svg` es el master y debe ser exactamente `rear -> wings -> hull -> cockpit`.
- Todas las piezas comparten `viewBox="-32 -32 64 64"` y centro `(0, 0)`.
- El frente apunta a `-Y`; la vista Pixi orienta el contenedor con la velocidad.
- Low conserva el master como silueta; Medium/High separan las cuatro piezas.
- La fuente tiene 21 primitivas: contra-peso (5), brazos/telar (5), casco (7)
  e iris (4), bajo el techo de 24. No introducir filtros, gradients, masks ni
  un contorno blanco general para "mejorarla".
- La jerarquía debe sobrevivir a 32 px: chasis oscuro -> placas azul acero ->
  bisel localizado -> cavidad oscura -> energía teal/ámbar sólo en registros,
  juntas e iris. El frente `-Y` se reconoce por la corona prismática clara.
- El alcance y los tres radios no viven en el SVG: los dibuja
  `PrismWeaverTelegraphView` y la colision la resuelve `PrismWeaverBehavior`.
- La geometria se cachea al aparecer el cast; no se crea SVG ni Graphics dentro
  del loop por frame.

La nave es un consumidor de Acto II, no una decision de balance final. Sus
valores provisionales quedan aislados hasta EX-02c.
