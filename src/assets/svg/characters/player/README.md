# Player SVG

Contrato reservado para el jugador:

- declarar frente base, ancla de colision y `viewBox` antes de dibujar;
- separar solo piezas con lectura clara (cuerpo, nucleo, armas, escudo);
- rasterizar piezas con el mismo frame logico y ancla;
- animar transforms cacheados, sin reconstruir SVG por frame;
- validar silueta, contraste, estados y legibilidad a 32/48/64/96 px.

El primer master del jugador se creara cuando termine la referencia visual de
la tortuga y pueda reutilizar sus tokens de paleta, contorno y capas.
