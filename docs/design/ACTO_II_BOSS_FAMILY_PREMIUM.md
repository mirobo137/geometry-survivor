# Orbital Warden — astrolabio articulado y efectos de inducción

Revisión 12-09-2026 solicitada tras rechazar la primera ciudadela y sus trazos
básicos. Esta revisión sustituye la receta anterior de rombos y flechas.
Referencia ejecutable: /docs/visual/warden-reference.html. La aceptación
artística sigue pendiente del usuario; los tests no la conceden.

## Silueta y contrato SVG

Verbo: un compás mecánico de tres brazos que se compromete con una trayectoria.
Comparación de masas en la lámina: ciudadela (demasiado cerca de Core Sentinel),
aguja (demasiado cerca de Fast) y triskelion segmentado (elegido por giro,
espacios negativos periféricos y orientación reconocible). El centro es macizo
porque la colisión del boss sigue siendo circular.

- Frame del boss: -56 -56 112 112; centro (0,0), frente -Y.
- 24 paths: rear 3, wings 12, hull 5, cockpit 4. Techo existente 28.
- Rear: soporte de tres brazos, retorno profundo y uniones visibles.
- Wings: tres hoces cerámicas con biseles selectivos, retornos azul pizarra y
  condensadores cobre. Hull: huso largo con planos claros/oscuros.
- Cockpit: cavidad estrecha con cristal cian y una sola cara marfil.
- Las réplicas son la misma silueta a 55% de coordenadas, con frame 64×64.
  No inventar una nave distinta para representar una copia.
- Master idéntico a concatenar rear → wings → hull → cockpit. Texturas
  compartidas rasterizadas una vez con frame explícito. Low usa el master;
  Medium/High añaden oscilación limitada de brazos y despiece existente.
- La orientación acompaña la velocidad real durante el desplazamiento.
  Reset restaura la rotación; las animaciones usan el reloj de presentación.

Cinco texturas 112×112 por boss (245 KiB RGBA teóricos), cinco 64×64 de réplica
(80 KiB teóricos). No se incrementaron dimensiones, DPR ni filtros. Estas
cifras no son una medición de memoria del dispositivo.

## Continuidad de movimiento obligatoria

El salto anterior ocurría porque updateMovement volvía a proyectar al boss
sobre la órbita original después del ataque. Orbital Warden ahora permanece en
el punto de llegada durante recovery y los avisos siguientes.

Charge calcula la intersección del rayo con el círculo interior disponible,
descontando radio del casco y margen; termina dentro de la arena. Curve toma
el radio y ángulo de la posición real al comprometerse, nunca un radio nominal
que desplace el casco al entrar en active. El siguiente ataque nace allí.
La integración del movimiento ocurre dentro de cada subpaso de fase.
Las regresiones comprueban ambos endpoints, recovery y comienzo del arco.

Secuencia vigente: sweep → charge → curve → replicas → ring. Se mantienen
un hit por cast de movimiento, copias destructibles y el balance final diferido
a EX-02c. Esta corrección no integra todavía la campaña de EX-07e.

## Locomoción de presencia del Warden

Orbital Warden ya no permanece inmóvil entre ataques. En `intro`, `sweep`,
`ring` y `recovery` realiza una deriva orbital lenta y determinista: comunica
que el boss está vivo, obliga a leer su posición y evita que el encuentro se
sienta como una torreta estática. La deriva no busca al jugador ni cambia los
patrones de daño.

La primera órbita toma el radio real de spawn. Después de `charge` o `curve`,
la siguiente órbita toma el punto de llegada y conserva su radio; nunca vuelve
a proyectar el boss al círculo nominal anterior. El cambio se hace en el mismo
subpaso de simulación, así que no hay salto visible entre `active`, `recovery`
y el siguiente aviso.

`charge-telegraph` y `curve-telegraph` congelan el origen y el vector ya
comprometido. Cuando empieza `active`, el boss ejecuta esa ruta aunque el
jugador ya esté dentro de ella; la presencia del jugador no puede cancelar un
ataque que ya fue anunciado. `replicas-telegraph` también conserva su origen.
Sólo la locomoción ambiental queda pausada en esos estados bloqueados.

Regla para futuros bosses: separar siempre locomoción ambiental y movimiento de
ataque. Al salir de un ataque, anclar la nueva trayectoria a la posición real
del endpoint antes de aplicar velocidad; jamás corregirla a posteriori desde
la capa visual.

## WardenAttackView: carga, recorrido y lanzamiento

BossView delega Charge, Curve y Replicas a una instancia persistente de
WardenAttackView. Su constructor prepara toda la geometría. render sólo cambia
position, rotation, scale, alpha y visible; ninguna textura o path nuevo.

- Charge: tres plumas cortas delante del casco anuncian dirección, sin dibujar
  el alcance entero. Durante active, una estela laminada de hasta 230 unidades
  afina anchura y alpha hacia atrás. El núcleo ocupa una fracción de la banda;
  el cobre se concentra en un borde. Nunca dejar el rastro como rectángulo.
- Curve: las plumas se colocan tangentes al arco comprometido. La estela sigue
  el arco realmente recorrido, con longitud limitada a 1.15 radianes y
  desvanecimiento posterior. Funciona en ambos sentidos, sin asumir ángulos
  crecientes. No conectar cada extremo con el origen ni completar el círculo.
- Replicas: dos cámaras de tres mordazas en los puntos reales de aparición.
  Durante el aviso cierran y absorben fragmentos; al activarse abren y expulsan
  doce fragmentos como máximo entre ambas cámaras. Las copias nacen en esas
  posiciones. El centro de cada cámara sigue despejado para ver la nave.
- Recovery: alpha cae con (1-progress)^2. El rastro es residuo visual; el daño
  de Charge/Curve pertenece al casco en movimiento, no al camino ya recorrido.
- Un collar discontinuo acompaña al casco y marca carga sin llenar la pantalla.

Presupuesto de la vista: 12/16/20 marcadores de ruta y otros tantos segmentos
de estela en Low/Medium/High; seis mordazas, doce fragmentos y un collar.
43/51/59 Graphics asignados, mutuamente ocultos según fase (no todos visibles).
Las capas materiales están dentro del mismo Graphics; no hay filtro/glow.
Low conserva las tres cámaras/mordazas y todos los puntos de amenaza.
El BossView heredado aún reconstruye barra y sweep/ring de forma acotada;
no atribuirles la garantía de geometría estática de la vista nueva.

## AngularSweepView: inducción sectorial

La cuña opaca y la rejilla se sustituyen por tres láminas largas curvas:
base tinta, cara violeta/cobre y filo caliente. Se estrechan en ambos extremos
y permanecen dentro del sector. Un campo tenue mantiene reconocible todo el
sector peligroso aunque las láminas tengan separaciones decorativas.
Esas separaciones internas NO son refugios.

Dos límites exactos, una corona exterior y un emisor de mordazas definen la
superficie dañina. La escala activa es exactamente 1: no pulsar el contenedor
completo ensanchando visualmente el daño. La geometría se construye sólo al
cambiar secuencia/radio y gira con el ángulo simulado. Recovery elimina la
superficie y conserva únicamente residuos.

Cada arco independiente inicia beginPath. El arco interior de un sector
cerrado utiliza recorrido inverso explícito; de lo contrario puede recorrer
el complemento del círculo. Conservar las pruebas de reutilización y reset.

## Validación y continuación

La previsualización Angular debe conservar la misma composición de producción:
el aviso usa rieles segmentados, una cámara de calibración tenue, remates en
los extremos y chevrones tangenciales; nunca una línea continua de alcance.
La lámina ejecutable muestra `telegraph`, `active` y `recovery` con el mismo
`AngularSweepView`, en tamaño suficiente para revisar la lectura en Low y High.

- Lámina real: casco anterior/nuevo, tres masas, 32/48/64/96 px, estados Pixi,
  fondo oscuro/claro y variantes Low/High.
- Capturas: node docs/visual/capture-warden.mjs con Vite en 5173.
- Drills: ?warden=1&debug=1&quality=low|medium|high y
  ?angular=1&debug=1&quality=low|medium|high.
- Automatización: regresión de endpoints y continuidad, geometría reutilizada,
  equivalencia de SVG, typecheck/build y smoke dirigido a ambos drills.
- Pendiente humano: suavidad percibida, legibilidad durante combate y FPS en
  móvil físico. Un screenshot headless no certifica rendimiento.

Antes de añadir otra capa, comprobar si aporta origen, material, dirección o
transición. Si sólo agrega líneas, revisar proporción, espacio y ritmo.
