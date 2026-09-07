# Geometry Survivor — actos, meta y Overdrive

Fecha de decisión: 05-09-2026.

Este documento fija la dirección de producto que acompaña a
`PLAN_DESARROLLO.md` §16. Define el contrato de experiencia de los actos y el
modo infinito; el prototipo espacial del Acto I ya está implementado, pero la
campaña completa, sus transiciones y Overdrive siguen siendo entregas futuras.

## Decisión principal

Geometry Survivor tendrá tres actos cortos con identidad espacial propia y un
modo infinito opcional posterior llamado **Overdrive**.

- Los actos tienen una regla aprendible, un boss y una victoria clara.
- `Expedition` enlaza Acto I → II → III conservando la build.
- `Quick Act` permite repetir un acto desbloqueado sin heredar una run previa.
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
render usa una polilínea de 36 puntos y redibuja sólo cuando cambia el estado
geométrico; no crea SVG, partículas ni objetos por enemigo o por frame. El
boss conserva por ahora sus patrones existentes, de modo que este slice mide
la diferenciación de la arena y la presión de los láseres sin mezclar todavía
un rediseño completo de encuentro.

Este prototipo no crea aún `ActDefinition`, save nuevo, selección de actos,
otros polígonos ni Overdrive. La validación automática está cubierta; la
pregunta de si el cambio produce la diversión y diferenciación esperadas
requiere una prueba humana en desktop y móvil antes de convertirlo en el
contrato final del Acto I.

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
en un solo cambio. Pulse Ring y el hazard angular deben dejar una salida
legible; el boss no recibe empuje ni una combinación que cierre todos los
sectores. Calibration ofrece una plantilla de entrada, no una build arbitraria.

### Acto III — Fracture

Es la prueba de dominio y el cierre de la campaña principal. Barreras y
conexiones modifican rutas, pero nunca nacen debajo del jugador: deben anunciarse
al menos 0.8 s y mantener un corredor de cuatro diámetros del player. Resonant
Aura conserva una banda interior segura y Fracture Engine combina reglas ya
conocidas antes de introducir presión adicional.

## Modos y transiciones

1. **Quick Act:** el jugador selecciona un acto desbloqueado y una plantilla de
   Calibration. Empieza sin estado de una run anterior, obtiene la recompensa
   de ese acto y vuelve a menú/intermisión con una victoria explícita.
2. **Expedition:** empieza en Radial, crea una build y pasa por los tres actos.
   Cada boss abre una intermisión con `Continuar` y `Terminar`. Terminar entre
   actos es una salida exitosa, no una derrota; continuar conserva armas,
   evoluciones, cartas y recursos de la build.
3. **Final de campaña:** derrotar a Fracture Engine concede la victoria de la
   Expedition y desbloquea Overdrive una sola vez. El jugador puede terminar
   ahí o continuar opcionalmente con la misma build.
4. **Overdrive desde menú:** después de desbloquearlo, también puede iniciarse
   como modo separado con una Calibration válida; no depende de restaurar una
   Expedition incompleta.

Una recarga no restaurará una Expedition a mitad de acto hasta que exista un
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
4. cerrar el prototipo y luego implementar Acto I/`ActDefinition` y su
   transición en EX-06;
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
- Quick Act no hereda estado; Expedition conserva la build entre actos;
- una victoria/desbloqueo/recompensa es idempotente tras repetir callbacks o
  recargar;
- Overdrive mantiene caps de entidades/FX y no degrada legibilidad móvil;
- diez runs por acto y sesiones prolongadas de Overdrive se registran antes de
  cerrar sus puertas humanas;
- el balance final de enemigo/player/Laboratorio se decide con esa evidencia,
  no con la presente especificación.
