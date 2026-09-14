# Magnetic Charge - receta visual premium

## Corrección de anclaje y vuelo — 14-09-2026

Todas las piezas del destino se construyen alrededor de `(0,0)` local y se
posicionan en `targetX,targetY`. Nunca rotar geometría dibujada en coordenadas
mundiales: gira alrededor del origen del mundo y separa el efecto del daño.
El test de vista comprueba posición y bounds locales centrados.

El vuelo eleva la bomba visualmente con `sin(progress * PI) * 62`, aumenta
su escala a mitad del trayecto y la reduce al aterrizar. La estela es corta
y termina en la bomba elevada; la baliza permanece en el destino real.
Reduced motion elimina elevación y giro. El daño continúa usando el estado
de simulación. Núcleo y piezas del destino se construyen por secuencia.

La detonación conserva límites interior/exterior continuos en todas las
calidades; los paneles son translúcidos con cintas de plasma y filos selectivos.
Los huecos entre paneles son ornamentales, nunca salidas seguras adicionales.
El campo se contrae durante atracción; el residuo se expande y desvanece.

Esta receta define la presentación de la sexta arma activa. La carga debe leerse
como un dispositivo remoto que atrae y colapsa masas; no como otro escudo,
anillo del player o hazard circular de la arena.

## Jerarquía visual

La vista mantiene ocho `Graphics` persistentes dentro de una sola capa:

1. `trail`: estela direccional durante el viaje, con punta y desvanecido;
2. `beacon`: baliza angular en el destino capturado;
3. `field`: ocho flechas segmentadas que apuntan hacia dentro;
4. `backplate`: tinta oscura que separa el daño del fondo;
5. `band`: doce paneles annulares alternando cian, violeta y armadura;
6. `rails`: rieles finos discontinuos y marcas radiales;
7. `core`: núcleo octagonal que se mueve durante el viaje y pulsa al detonar;
8. `residue`: fragmentos radiales de recuperación.

El destino y las formas estáticas se hornean una vez por `sequence`. Sólo se
actualizan por frame la estela, la escala/posición del núcleo y alpha/rotación.
No usar filtros, blur, texturas adicionales ni reconstrucción de paths por
frame.

## Diferenciación

- Pulse Ring nace en el player y se expande como una onda; Magnetic Charge sale
  hacia un destino remoto y permanece allí.
- Orbit Blade es una silueta que gira alrededor del player; Magnetic Charge es
  una baliza anclada a un punto con atracción direccional.
- El hazard radial de la arena es suave y continuo; la detonación usa paneles
  separados, backplate oscuro, núcleo octagonal y un centro vacío claramente
  legible.

## Reglas de construcción

- Todo arco o subforma independiente debe comenzar con `beginPath()` y cada
  estela debe tener `moveTo()` explícito: nunca conectar con el último punto de
  otro arco ni producir una línea diagonal “a la nada”.
- El centro seguro no se rellena con color de daño: el hueco oscuro es una
  señal jugable, no un adorno.
- Los paneles dejan pequeños gaps regulares y una línea de borde selectiva;
  evitar un círculo sólido que se confunda con la arena.
- La estela usa una silueta triangular ancha cerca de la carga, tinta debajo,
  núcleo cian/blanco y tres cortes de luz decrecientes.
- La atracción muestra dirección con flechas hacia el núcleo, no con líneas
  completas entre cada enemigo.
- La detonación pulsa con el progreso de fase y rota capas a velocidades
  distintas; la animación nunca altera la posición lógica ni el daño.

## Presupuesto de calidad

Low conserva `beacon`, `core`, backplate y `band`: el jugador debe entender
origen, destino, centro seguro y zona dañina. Oculta `field`, `rails` y
`residue`, pero no cambia tamaños, fases ni telegraph.

Medium mantiene el campo con ocho flechas y rieles reducidos. High mantiene las
ocho capas, acentos blancos/dorados y residuo. Todas las variantes evitan
`filters` y reutilizan la geometría cacheada para ser seguras en móvil.

## Revisión visual

Probar el drill en `quality=low` y `quality=high`, capturar viaje, atracción,
detonación y recovery, y confirmar que:

- el destino se distingue del player;
- la banda no parece un ring del hazard radial;
- el centro seguro permanece vacío;
- la estela no deja líneas huérfanas;
- High añade detalle sin cambiar la lectura de Low.
