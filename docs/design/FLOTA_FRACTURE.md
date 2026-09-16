# Flota Fracture — dirección visual del Acto III

Entrega visual del 16-09-2026. La solicitud autoriza rediseñar las cuatro naves
y el boss como lote. Mecánicas, daño, radios, progresión y hazards conservan su
contrato. Referencias: [naves premium](../../skills/geometry-survivor-svg/references/ship-art-direction.md)
y [familias](../../skills/geometry-survivor-svg/references/visual-family-direction.md).

## Problema corregido

Los cuatro enemigos iniciales usaban un único `makeEnemy(name, accent)`:
misma proa, alas y reactor, con cuatro colores. No eran cuatro siluetas.
El `flat` del boss tampoco correspondía a sus piezas de High. La nueva fuente
comparte solamente el envoltorio SVG y el ensamblaje; cada nave tiene geometría
propia y el master se deriva de sus cuatro piezas en orden.

## Contrato y decisiones de silueta

Frente local -Y; centro (0,0); enemigos en frame `-32 -32 64 64`, boss en
`-56 -56 112 112`. La lectura se comprueba a 32/48/64/96 px y en el compositor
Pixi de producción. Caps de gameplay existentes: 6/4/5/4 enemigos y un boss.

| Nave / verbo | Alternativas consideradas | Elección y diferencia frente a referencias |
| --- | --- | --- |
| Fracture Gunner / disparar | Aguja de artillería; ala transversal; batería asimétrica | Batería: cargador a babor y cañón largo a estribor. La aguja se acercaba a Fast; el ala simétrica a Chaser. Acero azulado, recámara oscura y óptica cian. |
| Thorn Bastion / presurizar | Bloque rectangular; corona abierta; coraza de seis escamas | Coraza dentada compacta. El bloque repetía Tank y la corona Elite. Escamas de cobre, bordes claros solo en caras expuestas y cámara coral encerrada. Centro macizo, sin falso paso seguro. |
| Zigzag Reaver / cortar lateralmente | Flecha axial; boomerang simétrico; alas escalonadas en Z | Z con superficies adelantada y retrasada y eje quebrado. La flecha repetía Fast/Charger; el boomerang aproximaba Orbiter. Cerámica oliva, cavidades verdes y motores ámbar. |
| Rift Miner / sembrar | Anillo distribuidor; trípode; doble silo rectangular | Dos depósitos verticales y puente horizontal con visor. Se descartan el anillo cercano a Orbiter y los tres brazos de Prism Weaver. Gris lavanda, cargas hundidas y compuertas inferiores. |
| Fracture Engine / asediar | Mandala radial; dos torres verticales; martillo transversal | Martillo: puente ancho adelantado, quilla profunda, hornos traseros y reactor rectangular segmentado. La mandala repetía Sentinel/Warden; dos torres se parecían al Miner. Titanio ceniza, biseles marfil y cámara coral. |

Las alternativas son estudios de masa en la lámina, no variantes de producción
ni diseños aprobados por el usuario. Los materiales del Tank y la claridad de
ensamblaje del Charger sirven como referencia de acabado, no como molde.

## Piezas, profundidad y movimiento

`rear → wings → hull → cockpit` significa motores/chasis → mecanismo periférico
→ blindaje → óptica o reactor. Se conservan las cuatro texturas y el despiece
existente; `wings` no obliga a dibujar alas de avión en cada enemigo.

- Gunner: cargador y cañón unidos por el bloque de recámara. El conjunto del
  arma tiene retroceso axial de 1.4 unidades; no se desplaza lateralmente como
  un ala. En aviso/ataque mira a la posición capturada por la simulación, incluso
  si la nave retrocede. La boca dibujada es cosmética: no altera el origen de daño.
- Thorn: seis placas solapadas con el recipiente central. Dientes replegados
  cortos; la expansión de piezas en ataque es 3.5%. El hazard sigue siendo la
  fuente del alcance real de las púas, no el tamaño de estos detalles.
- Reaver: soportes y motores diagonales solapados con el fuselaje quebrado.
  Giro pequeño del conjunto de estabilizadores, no piezas que se despeguen.
- Miner: depósitos conectados por travesaño visible; compuertas con recorrido
  de 0.65 unidades durante carga. Casco rígido, sin aleteo de silos.
- Engine: travesaño de proa, batería empotrada, dientes cortos, dos hornos
  traseros y dos puertos de minas. Conserva la maquinaria ambiental y el
  despiece terminal del compositor existente.

Los materiales siguen chasis oscuro → cara media → bisel claro → cavidad →
energía puntual. Cada bisel ocupa una cara real; no se rodea toda la nave de
blanco. Las muescas periféricas son transparencia; el centro mantiene masa.
No hay filtros, gradientes, raster embebido, máscaras ni grupos transformados
que dependan de soporte parcial del parser Pixi.

## Coste y equivalencia Low

| Fuente | Paths del master | Techo |
| --- | ---: | ---: |
| Gunner | 22 | 24 |
| Thorn | 20 | 24 |
| Reaver | 22 | 24 |
| Miner | 20 | 24 |
| Engine | 28 | 28 |

Son paths semánticos simples con subpaths solo para componentes equivalentes.
Las cifras describen fuente, no draw calls. Se reutilizan las 25 texturas ya
existentes: 20 de 64×64 y cinco de 112×112, resolución 1, frame explícito.
Almacenamiento RGBA teórico: 578560 bytes (~565 KiB), sin overhead del backend.
Low conserva el master entero en un sprite; Medium/High cuatro piezas más el
flash existente de enemigos. No hay aumento de sprites, DPR, pools o partículas.
El coste de parseo cambia con los paths; no se afirma coste cero ni FPS de móvil
a partir de capturas headless. Medición física y aprobación artística pendientes.

## Fuentes y verificación reproducible

- Fuente compartida: `src/assets/svg/enemies/FractureEnemySvgMarkup.ts`.
- Lámina: `docs/visual/fracture-reference.html`, incluye comparación con diez
  naves anteriores, tamaños, piezas, claro/oscuro/grises/silueta y Pixi Low/High.
- `node docs/visual/capture-fracture.mjs` con Vite en 5173: 16 poses Pixi,
  despiece/reset, 10 capturas de juego y errores de navegador. Capturas en
  `test-results/fracture-art`, no se empaquetan como assets.
- `FractureEnemySvgMarkup.test.ts`: igualdad de geometría completa master/piezas,
  frame, margen, IDs, prohibiciones y presupuestos. Las pruebas del compositor
  cubren puntería visual, retroceso y limpieza de transforms del pool.

Para futuras iteraciones: mantener estas cinco identidades, cambiar la masa
antes que añadir adornos y revisar el master Low en el mismo cambio. Nunca
reintroducir un único casco recoloreado ni dibujar el boss Low por separado.
Las pruebas estructurales y las capturas no equivalen a aprobación humana.

Evidencia al cierre: typecheck y 415 tests aprobados, build local correcto,
captura automatizada completa sin errores JS/HTTP. Inspección de la comparativa
final y del compositor Pixi realizada. Pendientes: aprobación del usuario,
perfil móvil, builds de portales y smoke completo antes de publicación.
Estado Git y comandos de continuación: `CONTINUACION.md`, bloque Handoff a Luna.
