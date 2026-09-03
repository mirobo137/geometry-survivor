# Siluetas de skins del jugador

Cada skin tiene `body`, `ring` y `core` propios. Comparten `viewBox="-32 -32 64 64"`
y el ancla `(0, 0)` con las piezas comunes (sombra, acentos, cañones).

| id | lectura |
| --- | --- |
| cyan (piezas en la carpeta padre) | hexágono + anillo continuo |
| violet | diamante + marco de esquinas |
| amber | cuña bastión + destellos solares |
| emerald | diamante con hojas + arcos abiertos |

Las firmas siguen en `SkinSignatureSvg.ts`. El runtime rasteriza cada pieza una
vez; no se parsea SVG por frame ni se cambia radio, daño o colisión.
