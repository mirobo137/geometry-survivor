# Geometry Survivor — actos, meta y Overdrive

Fecha de decisión: 05-09-2026.

Este documento fija la dirección de producto que acompaña a
`PLAN_DESARROLLO.md` §16. Define el contrato de experiencia de los actos y el
modo infinito; el prototipo espacial del Acto I y su contrato `ActDefinition`
ya están implementados. La composición de Acto II y su entrada por
calibración ya tienen un consumidor real en EX-07e; Acto III y Overdrive siguen
siendo entregas futuras.

## Estado de implementación — 12-09-2026

EX-07e conecta el Acto II Angular a la campaña: perfiles de Orbiter, Charger,
Splitter y Prism Weaver, hazards Pulse Ring y Angular Sweep, Orbital Warden a
los 260 s y tres calibraciones de entrada sin heredar la build. La experiencia
ya no expone `Quick Act`/`Expedition` como modos separados. La implementación
automática está aprobada; falta validación humana en PC/móvil, las tres
calidades, runs comparables y la liquidación tras reload. Los números siguen
provisionales y EX-02c permanece diferido.

## Decisión principal

Geometry Survivor tendrá tres actos cortos con identidad espacial propia y un
modo infinito opcional posterior llamado **Overdrive**.

- Los actos tienen una regla aprendible, un boss y una victoria clara.
- La campaña enlaza Acto I → II → III, pero cada acto posterior comienza con
  una calibración authored nueva; no hereda la build del acto anterior.
- El selector de actos desbloqueados sólo es un acceso de repetición/prueba y
  ofrece las mismas tres calibraciones.
- Overdrive comienza después de completar el Acto III dentro de `Expedition` y
  mezcla las reglas ya aprendidas en ciclos cada vez más exigentes.
- Ningún modo obliga a jugar infinito para terminar la experiencia principal.

La vida de enemigos, el daño general y los porcentajes finales del Laboratorio
se calibrarán después. Los números que aparecen en el código hoy son
provisionales y no deben usarse como criterio de balance definitivo.

## Prototipo del Acto I — arena radial cambiante

El primer slice jugable del Acto I conserva la lectura radial del círculo, pero
introduce desde temprano la promesa diferencial del juego: la zona habitable
puede cambiar de geometría y los láseres aprovechan el espacio disponible.
Para que el jugador aprenda la regla sin sentir una trampa, esta primera
versión sólo alterna entre **círculo** y **hexágono**, con cambios authored y
deterministas:

| Tiempo de partida | Cambio | Aviso | Morph | Intención |
| ---: | --- | ---: | ---: | --- |
| 02:12 | círculo → hexágono | 1.4 s | 0.85 s | enseñar que el borde puede adquirir lados |
| 03:30 | hexágono → círculo | 1.4 s | 0.85 s | devolver una referencia conocida y comprobar adaptación |
| 04:48 | círculo → hexágono | 1.6 s | 1.05 s | llevar la regla al tramo del boss |

Durante el aviso aparece el contorno objetivo; durante el morph la frontera se
interpola gradualmente. La simulación usa esa misma frontera para limitar al
jugador y calcular hasta dónde llega un láser lineal. Así, la geometría no es
decoración: cambia la lectura de distancia y la ruta segura. El jugador sigue
teniendo una salida espacial; no se introducen cambios aleatorios ni daño
inevitable.

La identidad geométrica también gobierna la presión del láser. Durante el
`telegraph`, todos los disparos se presentan igual y permanecen quietos: el
jugador no sabe cuál se moverá hasta la detonación. Cuando un disparo móvil
entra en `active`, empieza su barrido horario, prolonga la detonación hasta
terminar el recorrido y puede hacer daño en cualquier punto de esa trayectoria.
En círculo, uno de cada tres disparos es móvil. En la primera intervención
hexagonal el intervalo baja a 14 s y el barrido aparece cada segundo disparo;
en la segunda baja a 10.5 s, aparece en cada disparo, recorre más ángulo y
termina antes. El daño se evalúa durante el ataque contra el ángulo actual, no
contra una línea invisible que salte al final. El patrón sigue siendo
determinista y conserva una ventana de reacción perpendicular.

| Identidad | Intervalo | Barrido | Ángulo | Detonación móvil |
| --- | ---: | ---: | ---: | ---: |
| círculo | 18 s | 1 de cada 3 | 0.34 rad | 0.90 s |
| hexágono, 1.ª intervención | 14 s | cada 2.º | 0.48 rad | 0.84 s |
| hexágono, 2.ª intervención | 10.5 s | cada disparo | 0.68 rad | 0.78 s |

Esta tabla es el contrato de prueba para futuras formas: primero se conserva
la señal y la respuesta segura; después se decide si la nueva geometría merece
otra cadencia, barrido o composición de líneas. No se debe copiar el aumento
de presión a otro acto sin medirlo.

### Presentación premium del láser

La referencia vigente es **Solar Rail**: emisores mecánicos facetados en la
frontera, aviso discontinuo, plasma afinado con núcleo marfil y recuperación
fragmentada que ya no parece dañina. Sustituye la receta anterior de anillos,
capas paralelas y ecos angulares, que no satisfizo al usuario. No cambia la
simulación ni revela el barrido antes de `active`.

La geometría se construye una vez y se anima mediante transformaciones y
alpha. Low conserva los materiales y la señal completa; sólo omite filamentos
decorativos. Para crear o modificar FX, leer
[EFECTOS_PREMIUM.md](EFECTOS_PREMIUM.md), que define receta, presupuesto,
referencia reproducible y validación. La nueva apariencia espera aprobación
humana; no hereda la aprobación de los assets SVG.

La órbita geométrica usa ahora la receta persistente **Prism Aegis**:
carcasa facetada, apertura oscura, núcleo energético, halo segmentado y estela
tangencial breve. La ficha específica está en
[ORBITA_PREMIUM.md](ORBITA_PREMIUM.md) y su referencia reproducible en
`docs/visual/orbit-reference.html`. Las variantes futuras deben conservar una
identidad propia y no reducirse a un rombo plano recoloreado.

La implementación está deliberadamente acotada a `ArenaShape`,
`ArenaBoundary`, `ArenaModel`, `PlayerModel`, `LaserHazard` y sus vistas. El
render usa una polilínea de 144 puntos y redibuja sólo cuando cambia el estado
geométrico; no crea SVG, partículas ni objetos por enemigo o por frame. El
boss conserva por ahora sus patrones existentes, de modo que este slice mide
la diferenciación de la arena y la presión de los láseres sin mezclar todavía
un rediseño completo de encuentro.

La identidad visual premium de la arena está documentada en
[ARENA_FX_PREMIUM.md](ARENA_FX_PREMIUM.md). La receta usa el mismo perímetro
para campo, rieles, nodos, resonancia y shockwave; queda preparada para nuevas
formas sin activar gameplay futuro desde el renderer.

El prototipo histórico no creó save nuevo, selección de actos, otros polígonos
ni Overdrive. EX-06a compuso ese timeline en `ActDefinition` con un único
consumidor Radial; EX-07e es la entrega posterior que ya conecta la campaña
Angular, su selector/gating y la transición I→II. La pregunta de si el pulso y
la composición producen la diversión esperada conserva una puerta humana.

## EX-06a — contrato Radial sin cambio de gameplay

`src/content/run/ActDefinitions.ts` expone únicamente el acto que tiene un
consumidor real: `radial`. Su definición compone las fases de spawn, perfiles de
enemigos, calendario círculo↔hexágono y `Core Sentinel` existentes; no inventa
una recompensa fija ni actos vacíos para poblar el menú. El inicio del boss se
mantiene en 260 s y la duración del contrato se interpreta como la apertura de
la ventana del boss: el final real sigue siendo derrotarlo.

`RadialActDirector` es el único lector de `ActDefinition`. Arena, enemigos,
lásers y combate reciben sus consultas tipadas a través de ese director, de
modo que una futura regla radial no tenga que copiar umbrales en cada sistema.
La prueba seeded compara cadencias y mezcla de enemigos con las funciones
anteriores en 128 muestras, además de comprobar los hitos exactos. Esta unidad
no añade el pulso radial, cambios de balance, save ni selección de actos.

## EX-06b — pulso radial con respuesta posible

El Acto I incorpora una única regla extra: una onda anular alterna entre viajar
del bolsillo interior al exterior y del exterior al interior. Se programa al segundo 92, después
cada 52 segundos y no puede iniciar después del segundo 250; el Core Sentinel
abre a los 260 segundos. Cada cast sigue `telegraph (1.1 s) → active (1.6 s) →
recovery (0.6 s)`. El telegraph muestra anillo discontinuo, dirección y
marcadores, pero no daña. Durante `active` la banda se mueve entre dos
bolsillos no dañinos: un refugio interior de 72 u y otro exterior calculado
dejando espacio para el cuerpo del player. Aplica como máximo un impacto;
`recovery` sólo desvanece el residuo.

El jugador conserva una respuesta espacial: puede leer la dirección y entrar
al bolsillo interior o exterior antes de que llegue la banda. El pulso no
rellena de color una zona segura, porque el campo libre debe seguir
mostrando player, enemigos y láseres. El radio de la banda se comprueba con
colisión barrida entre ticks para no saltar la onda a velocidades válidas.

Laser y pulso se arbitran en la simulación: un hazard ya iniciado nunca se
interrumpe y el otro no inicia mientras su fase no sea `idle`. Una espera que
supere el deadline se descarta; el pulso tampoco inicia con el boss activo.
Así la regla añade expectativa sin convertir la combinación en daño inevitable.

El contrato de contenido está en `RadialPulseDefinition`, la simulación en
`RadialPulseHazard` y la representación premium de bajo coste en
`RadialPulseView`. El daño 16 es provisional y no adelanta EX-02c. La ficha y
la evidencia están en `docs/balance/EX-06b-radial-pulse.md`; falta validación
humana de lectura, comodidad y diversión en desktop/móvil.

## EX-06c — resultado e intermisión del Acto I

Al derrotar al Core Sentinel, el resultado definitivo de la run conserva la
misma liquidación de NOVA idempotente que usa el resto del juego: no se añade
un bonus fijo ni una segunda transacción sin una pasada explícita de economía.
Tras el breve cierre visual, el lifecycle cambia de `victory` a
`act-intermission` y el resumen declara **Acto I · Radial superado**.

El único contenido jugable sigue siendo Radial. Por ello la intermisión ofrece
`Repetir Acto I` y `Volver al menú`, nunca un botón `Continuar` desactivado ni
una promesa de Acto II. Volver al menú invalida callbacks rewarded pendientes
antes de limpiar la presentación; repetir comienza una run nueva y no conserva
build. No se persiste una expedition, un desbloqueo de acto o un snapshot de
run: esos datos sólo se añadirán en EX-07 cuando Angular tenga consumidor real.

Esta frontera es deliberada: el estado conoce la transición de lifecycle, Game
coordina el resultado y la economía, y la UI sólo recibe etiquetas y acciones
válidas. Cuando exista Expedition, `act-intermission` podrá recibir
`Continuar` con una build conservada; esta primera versión no adelanta esa
regla.

## Bucle meta

El menú futuro se organiza en cuatro capas, sin crear una segunda moneda:

| Capa | Función | Regla |
| --- | --- | --- |
| Desbloqueo | abrir actos, Calibration y Overdrive | depende de victorias, no de grind obligatorio |
| Laboratorio | daño y cadencia permanentes actuales | poder pequeño, acotado y pendiente de recalibración |
| Investigación | habilitar armas/evoluciones futuras | desbloquea opciones; no regala daño permanente |
| Locker | skins, cañones, balas, estelas y fondos | cosmético, sin colisión ni ventaja de gameplay |

NOVA sigue siendo la única moneda blanda. Una run entrega su recompensa al
liquidarse una sola vez; la recompensa puede provenir de bajas, tiempo y bonus
de primera victoria según las reglas de economía existentes. Overdrive no paga
una transacción por ciclo: entrega un único resultado al terminar la sesión,
evitando duplicados y farming accidental. La función actual de recompensa
continúa limitada por sus caps hasta que exista evidencia para modificarla.

El progreso deseado para el save futuro es equivalente a:

```ts
type MetaProgress = {
  highestUnlockedAct: 1 | 2 | 3;
  overdriveUnlocked: boolean;
  firstClearClaimed: readonly string[];
  bestByMode: Readonly<Record<string, { timeSeconds: number; score: number }>>;
};
```

Es un contrato de diseño, no una autorización para migrar el save en esta
tarea. La migración sólo se hará cuando exista un consumidor real de actos y
una regresión específica.

## Los tres actos

Cada acto apunta a 4–5 minutos en `Quick Act`. La `Expedition` completa apunta
a 12–15 minutos, pero la duración final se valida con runs y no se fuerza
recortando el reloj incidentalmente.

| Acto | Fantasía | Regla espacial | Contenido | Boss | Aprendizaje |
| --- | --- | --- | --- | --- | --- |
| I — **Radial** | sobrevivir al pulso de la arena | centro, borde, anillos y distancia | Chaser, Fast, Tank, Elite; Laser | Core Sentinel | leer distancia y elegir cuándo cruzar el espacio |
| II — **Angular** | navegar una máquina que gira | sectores, alineación y rotación | Orbiter, Charger, Splitter; Pulse/hazard angular | Orbital Warden | anticipar el sector seguro y orientar la ruta |
| III — **Fracture** | atravesar una arena que se parte | cuerdas, corredores y conexiones | Boundary Runner, Linker, Swarm; barreras temporales | Fracture Engine | combinar distancia, sectores y corredores bajo presión |

### Acto I — Radial

Es el vertical slice vigente y la puerta de entrada. Conserva la arena viva,
Laser, Chaser/Fast/Tank/Elite y Core Sentinel. La expansión de arena, la
distancia al centro y el borde enseñan el lenguaje base. El pulso radial de
EX-06 será la única regla adicional de este acto: tendrá telegraph, una ventana
de respuesta y recuperación; no se añadirá otra familia enemiga para aparentar
progreso.

### Acto II — Angular

Introduce sectores y decisiones de alineación. La primera familia nueva se
implementa antes que las siguientes: Orbiter, Charger y Splitter no se entregan
en un solo cambio. Pulse Ring ya tiene una base aislada con una abertura que
rota durante el daño; el hazard angular ya tiene una hoja con recorrido acotado
y Orbital Warden una familia de riel, embestida fija, arco curvo, réplicas
 destructibles y corredor móvil. EX-07e ya compone estos consumidores en una
 run Angular real y habilita su selección sólo tras vencer Radial. Calibration
 ofrece una plantilla de entrada, no una build arbitraria. La composición del
 Acto II quedó aprobada por validación humana el 12-09-2026; el balance final de
 daño, vida y resistencia permanece diferido a EX-02c.

#### Arena Angular — calendario de espacio, no de balance

El Acto II empieza en **hexágono**, transforma el borde a un **cuadrado
alineado a los ejes**, pasa por **círculo** y **hexágono** varias veces, y
termina en **círculo** diez segundos antes de la entrada del Orbital Warden.
Es una secuencia authored y reproducible, no una selección aleatoria:

| Tiempo | Estado | Lectura/propósito |
| ---: | --- | --- |
| 00:00–00:40 | hexágono estable | presenta lados planos y una ruta angular legible |
| 00:40 | aviso 1.20 s + morph 0.75 s | hexágono → cuadrado; abre rutas diagonales |
| 00:41.95–01:20 | cuadrado estable | obliga a reconsiderar alineación sin cambiar ataques |
| 01:20 | aviso 1.20 s + morph 0.75 s | cuadrado → círculo; libera las esquinas |
| 01:21.95–02:00 | círculo estable | devuelve una lectura radial antes de exigir otra ruta |
| 02:00 | aviso 1.20 s + morph 0.75 s | círculo → hexágono; reintroduce lados y sectores |
| 02:01.95–02:40 | hexágono estable | comprueba que el jugador ya domina la alineación |
| 02:40 | aviso 1.20 s + morph 0.75 s | hexágono → cuadrado; mantiene el cambio de rutas |
| 02:41.95–03:20 | cuadrado estable | exige leer de nuevo las esquinas abiertas |
| 03:20 | aviso 1.20 s + morph 0.75 s | cuadrado → hexágono; devuelve la lectura angular |
| 03:21.95–04:08.05 | hexágono estable | prepara la última transición sin sorpresa de daño |
| 04:08.05 | aviso 1.20 s + morph 0.75 s | hexágono → círculo; cierre pre-boss |
| 04:10–boss (04:20) | círculo estable | espacio predecible durante los 10 s previos y el Warden |

La frontera interpolada es el único contrato: `ArenaBoundary` calcula el
clamp, los extremos de los telegraphs y la geometría de Pixi desde la misma
forma en cada tick. El cuadrado conserva el mismo despeje mínimo que el
hexágono y abre sólo sus esquinas; el morph evita un salto instantáneo al
jugador. No se altera cadencia, daño, HP, spawn, ruta ni fases de Pulse Ring,
Angular Sweep, enemigos o boss. Por eso un hazard conserva su regla, pero su
extremo visual y lógico sigue el borde real.

Las cinco intervenciones de 40 s y el cierre pre-boss se colocan entre inicios
authored de Pulse Ring y Angular Sweep: no se añade una pausa o excepción al
sistema de hazards sólo para el morph, y ningún cast nuevo comienza durante los
0.75 s de transformación.
Un cast ya iniciado conserva su fase y sigue la frontera interpolada.

El destello ligero que aún puede percibirse en el cuadrado queda registrado
como `VIS-A2-01` y no bloquea el acto. Las dos ventanas cuadradas contienen
exactamente las expansiones globales de 60 s y 180 s: durante ellas se combinan
el redibujado del radio, la resonancia y la onda de expansión. La opacidad del
marco es estable y la frontera lógica no parpadea. La investigación y la ruta
de corrección opcional viven en
[`EX-07e-angular-campaign.md`](../balance/EX-07e-angular-campaign.md#hallazgo-visual-no-bloqueante-destello-del-cuadrado).

Al iterar nuevas formas, no añadirlas a esta secuencia por decoración. Primero
definir forma inicial/final, margen mínimo, telegraph, duración de morph,
ventana estable, respuesta segura y prueba de frontera; luego comprobar cerca
de lados y vértices en Low/Medium/High y touch. El boss debe conservar una
forma estable salvo que una mecánica específica diseñada y validada justifique
lo contrario.

### Acto III — Fracture

Es la prueba de dominio y el cierre de la campaña principal. Barreras y
conexiones modifican rutas, pero nunca nacen debajo del jugador: deben anunciarse
al menos 0.8 s y mantener un corredor de cuatro diámetros del player. Resonant
Aura conserva una banda interior segura y Fracture Engine combina reglas ya
conocidas antes de introducir presión adicional.

## Flujo y transiciones

1. **Campaña principal:** comienza en Radial. Cada boss abre una intermisión
   con `Continuar` y `Terminar`. Tras el Acto I, `Continuar` ofrece exactamente
   tres calibraciones: Projectile, Orbit o Chain.
2. **Entrada fresca al acto siguiente:** la calibración elegida aplica sólo sus
   mejoras authored, reinicia el nivel y no importa cartas, armas ni stacks de
   la run anterior. La intención es que el jugador tome decisiones nuevas
   frente a la regla espacial del acto, sin que una build dominante trivialice
   el contenido.
3. **Repetición de acto:** un acto desbloqueado puede abrirse desde el selector
   de actos para probarlo de forma aislada, usando las mismas tres
   calibraciones. No es un modo de reglas distinto.
4. **Final de campaña:** derrotar a Fracture Engine concede la victoria de la
   campaña y desbloquea Overdrive una sola vez. El jugador puede terminar ahí o
   continuar opcionalmente.
5. **Overdrive:** después de desbloquearlo, puede iniciarse como continuación
   infinita con sus ciclos authored; no depende de restaurar una run parcial.

Una recarga no restaurará un acto a mitad de partida hasta que exista un
snapshot determinista de simulación, build, intermisión y recompensa. Antes de
eso, se termina de forma segura y no se paga dos veces.

## Overdrive — infinito opcional

Overdrive no es un cuarto acto narrativo ni reemplaza las victorias de los
tres actos. Es una continuación para dominar la build y perseguir tiempo,
puntuación y récords.

- **Ciclo 0:** presión de Fracture con sus reglas recién aprendidas.
- **Ciclo 1:** mezcla authored de Fracture y Angular.
- **Ciclo 2:** mezcla de las tres familias de reglas, con ventanas de
  recuperación intactas.
- **Ciclos posteriores:** composiciones y patrones authored que aumentan
  densidad, frecuencia, cobertura y combinaciones dentro de caps medidos.

La dificultad debe crecer primero mediante composición, densidad, posición,
frecuencia de patrones y espacio disponible; multiplicar HP sin límite o crear
daño inevitable no es un diseño aceptable. Toda amenaza conserva
`telegraph → attack → recovery`, safe corridors y límites de entidades/FX.
El ciclo sólo termina cuando el jugador muere o abandona; no hay una pantalla
de “victoria infinita”. El resumen registra ciclo alcanzado, tiempo, score,
causa de final y build.

Overdrive usa la misma liquidación idempotente de NOVA que los demás modos y no
entrega premios intermedios por ciclo. Los récords pueden persistirse, pero no
se agregará otra moneda, logros o economía diaria por inferencia.

## Orden de construcción

La decisión de diseño no salta las puertas técnicas:

1. dejar EX-02c **PENDIENTE** hasta la pasada final de vida, daño y meta;
2. terminar la evidencia local de EX-03 y conservar la extracción EX-04;
3. implementar Boomerang en EX-05 para cerrar la frontera del arsenal;
4. cerrar el prototipo y consolidar Acto I/`ActDefinition` en EX-06; EX-06a
   ya formalizó el contrato sin cambiar su gameplay y EX-06b añadirá la regla;
5. implementar Angular, Calibration y su boss en EX-07;
6. integrar Fracture y la victoria de Expedition en EX-10;
7. abrir Overdrive en EX-11, con tabla de ciclos, caps, memoria y recompensa
   comprobadas.

Las evoluciones siguen EX-08 y sólo se agregan al acto que las consume. La
implementación no debe crear el registro de actos, ciclos infinitos ni campos
de save antes de tener un consumidor y pruebas de transición.

## Puertas de aceptación

- un jugador nuevo puede explicar la regla espacial del acto después de verla;
- cada acto tiene una respuesta segura y ninguna combinación produce daño
  inevitable por falta de espacio;
- la calibración de entrada no hereda estado y las tres opciones son legibles;
- una victoria/desbloqueo/recompensa es idempotente tras repetir callbacks o
  recargar;
- Overdrive mantiene caps de entidades/FX y no degrada legibilidad móvil;
- diez runs por acto y sesiones prolongadas de Overdrive se registran antes de
  cerrar sus puertas humanas;
- el balance final de enemigo/player/Laboratorio se decide con esa evidencia,
  no con la presente especificación.
