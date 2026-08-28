# Enemy turtle

Ficha de referencia visual:

- `turtle.svg`: master estatico y fallback.
- `turtle-shell.svg`: caparazon y sombra.
- `turtle-limbs-front.svg`: patas delanteras.
- `turtle-limbs-rear.svg`: patas traseras y cola.
- `turtle-head.svg`: cabeza direccional.
- `TurtleSvgParts.test.ts`: contrato estructural y coherencia con el master.

Todos usan `viewBox="-32 -32 64 64"`, ancla `(0, 0)` y frame de textura
`(-32, -32, 64, 64)`. El orden de capas runtime es patas traseras, patas
delanteras, caparazon y cabeza. El frente base mira hacia `-Y`; la orientacion
se obtiene con la velocidad, no mediante variantes SVG por direccion.
