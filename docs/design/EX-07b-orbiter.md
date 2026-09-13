# EX-07b — Orbiter: ficha de primera familia Angular

**Estado:** refinamiento de comportamiento integrado y automático OK; la
composición del Acto II ya fue aprobada, pero esta variante necesita una nueva
validación humana en desktop/móvil antes de considerarse cerrada.

**Alcance de esta ficha:** define exclusivamente la primera familia enemiga del
Acto II. No autoriza añadir Charger, Splitter, Pulse Ring, hazard angular,
Orbital Warden, selector de Acto II, guardado de Expedition ni balance global.
Los valores numéricos son provisionales hasta EX-02c.

## 1. Intención jugable

El Orbiter enseña la idea que distingue Angular de Radial: una amenaza puede
**seguir tu posición, fijar un foco local y recorrer una curva alrededor de él**,
en vez de regalar un carril idéntico en el centro de la arena. La decisión que
debe provocar es:

> «Me está cerrando el espacio; ya vi desde dónde comenzará y hacia qué lado
> girará. Salgo de esa curva antes de que se comprometa».

No debe ser un enemigo con más vida ni una pared que encierra al player. Su
trabajo es convertir la posición del jugador en una ruta local legible y evitar
que acampar en una esquina vuelva inútil la amenaza. Charger y Splitter añaden
presión a ese lenguaje; el Orbiter debe poder leerse solo.

## 2. Contrato de comportamiento

### Espacio y sectores

- El centro lógico de la arena sólo sirve para mantener el mundo fijo, limitar
  el punto de seguimiento y tirar el Orbiter hacia dentro cuando el jugador
  está cerca de una pared. Nunca es el origen automático del ataque.
- La configuración conserva **ocho sectores de 45°** como canal determinista
  de variación. El sector y el sentido ya no describen un carril fijo del mapa:
  sesgan el lado de aproximación y el foco local de cada nave.
- Cada Orbiter compromete un arco de **90°** alrededor de un foco capturado
  cerca del player. El `commitCap` inicial sigue siendo uno; por tanto la
  composición no convierte la curva local en una cortina simultánea.
- Las garantías de sectores libres pertenecen a hazards globales como Angular
  Sweep. El telegraph del Orbiter anuncia su propia ruta y siempre deja al
  jugador la respuesta de salir del arco o rodear el foco.

### Máquina de estados

| Fase | Duración/propuesta | Regla de simulación | Lectura para el jugador |
| --- | ---: | --- | --- |
| `approach` | hasta alcanzar la distancia de seguimiento | Entra desde fuera y actualiza un punto de seguimiento alrededor de la posición actual del player. Mantiene una distancia authored, un pequeño sesgo lateral y daño de contacto. | Nave que corrige su posición y se prepara cerca del jugador, no en el centro del mapa. |
| `telegraph` | 0.70 s | Captura el foco local, radio, ángulo de inicio y sentido. La posición del player puede cambiar después, pero la ruta anunciada no se cancela ni se reposiciona. El casco conserva daño de contacto. | Compuertas laterales abiertas + arco discontinuo de 90° trasladado al foco + chevrons de giro. |
| `commit` | 0.95 s | Recorre el arco capturado desde la posición exacta que tenía al terminar `approach`. No hace homing durante el movimiento; su casco conserva daño de contacto. | La nave dibuja una curva local; salir de ella antes del compromiso es la respuesta. |
| `recovery` | 0.60 s | Se retira desde el endpoint real hacia fuera y vuelve a `approach`; no regresa al primer ancla ni salta al centro. Su casco conserva daño de contacto. | Compuertas cierran y el foco se disipa sin crear otro collider. |

La transición es siempre `approach → telegraph → commit → recovery`. No hay
ataque instantáneo, homing durante `commit` ni giro de 180° inesperado. El
riel no inflige daño: únicamente el casco mantiene su daño de contacto normal
en todas las fases. Un Orbiter puede morir en cualquier fase; el pool lo libera
sin dejar una ruta visual huérfana.

### Geometría de la ruta y respuesta segura

- Durante `approach`, la nave busca un punto a `followDistance` del player con
  `followLateralOffset` según su sentido. Si ese punto cae fuera del círculo,
  usa un staging interior; no colapsa la distancia hasta aparecer dentro del
  jugador. La colisión continúa siendo circular.
- Al comenzar `telegraph`, `routeCenterX/Y`, `routeRadius` y el ángulo de
  inicio quedan capturados. El centro se obtiene cerca del player, con un
  pequeño desplazamiento hacia el interior y una variación determinista por
  sector. El origen físico de la ruta es exactamente `state.x/state.y` en ese
  instante.
- Durante el telegraph, mover al player no cambia la ruta; esa estabilidad es
  la señal de juego limpio. La respuesta válida es salir del arco anunciado,
  rodear su extremo o usar el espacio interior, sin exigir una esquina fija.
- El riel es una guía, no un segundo collider ni un laser. Sólo el círculo de
  colisión de la nave hace daño y el daño respeta el cooldown global de
  contacto existente.
- En la primera entrega Angular, sólo se permite **un Orbiter en `commit` a la
  vez**. Orbiters adicionales pueden acercarse o esperar, pero no convierten
  la lección inicial en una cortina de contacto.

## 3. Datos authored provisionales

Estos valores viven juntos en contenido, no dispersos en `EnemySystem`. Son
una base de test y no un cierre de vida, daño, experiencia o economía.

| Campo | Valor inicial | Razón / límite |
| --- | ---: | --- |
| `kind` | `orbiter` | Nueva familia, no recolor de `elite`. |
| `radius` | 17 u | Similar a Chaser pero con espacio para leer su orientación. |
| `maxHealth` | 32 | Provisional; no se calibra hasta EX-02c. |
| `contactDamage` | 9 | Provisional; lo aplica el collider circular del casco en todas las fases. |
| `experience` | 3 | Recompensa provisional por amenaza de ruta. |
| `spawnCost` | 2 | Permite al director sustituir presión, no sumar masa sin límite. |
| `approachSpeed` | 94 u/s | Debe llegar a la banda sin parecer Fast. |
| `followDistance` | 116 u | Mantiene una amenaza cercana sin pegarse al player durante la aproximación. |
| `followLateralOffset` | 30 u | Descentra la aproximación y evita recorridos colineales idénticos. |
| `attackFocusInset` | 28 u | Lleva el foco ligeramente hacia dentro cuando el player está junto al borde. |
| `attackFocusLateralOffset` | 22 u | Desplaza de forma authored el foco entre Orbiters del mismo cast. |
| `commitAngularSpeed` | 1.65 rad/s | Recorre 90° en ~0.95 s; debe salir de una definición, no de un literal en el loop. |
| `activeCap` | 6 | Tope de familia; no amplía el pool global de 250 enemigos. |
| `commitCap` | 1 | Mantiene la primera lección legible. |
| `minimumFreeArc` | 90° | Reserva documental para un futuro director multi-Orbiter; hoy la seguridad se limita por `commitCap = 1`. |

El cap se aplica antes de adquirir un slot del pool. El stress existente sigue
teniendo el tope global de 250: una futura variante de stress con Orbiters
**reemplaza** enemigos del reparto actual, nunca sube el contador a 256.

## 4. Responsabilidades de implementación

La implementación posterior se divide por responsabilidad, sin meter reglas de
sectores dentro de Pixi:

| Área | Responsabilidad concreta |
| --- | --- |
| `src/content/enemies/EnemyDefinitions.ts` | Declarar `orbiter` y su configuración authored agrupada. No usar el color como fuente de comportamiento. |
| `src/simulation/enemies/OrbiterBehavior.ts` | Máquina de estados pura, seguimiento, captura determinista del foco, ruta y velocidad. Debe ser testeable sin Pixi. |
| `EntityPools` / snapshot de combate | Añadir sólo estado simulado necesario: fase, sentido, progreso, ángulo, foco/radio capturados y generación/reset seguro. El snapshot expone únicamente la lectura que necesita presentación. |
| `EnemySystem` | Delegar la actualización del Orbiter a la conducta anterior y mantener idéntico el camino de Chaser/Fast/Tank/Elite. No convertirlo en un manager de actos. |
| Director Angular real | Decide cuándo intenta reservar y compone caps; no nace hasta que exista el primer consumidor jugable de Acto II. No se añade un menú o ActDefinition vacío. |
| `EnemyShipVisual` / vista de telegraph | Anima texturas cacheadas y muestra fase/sentido; no calcula seguimiento, daño ni rutas. El telegraph sólo traslada la geometría recibida al foco capturado. |

`EnemyBehavior` no se convierte todavía en una jerarquía genérica: hay un
segundo tipo de movimiento realmente distinto y una responsabilidad coherente,
por lo que un colaborador puro `OrbiterBehavior` está justificado. Charger y
Splitter decidirán después si comparten una abstracción real; no deben ser
forzados a ella por adelantado.

## 5. Contrato visual premium

El casco se conserva. El aviso tiene una revisión vigente en
[ANGULAR_ART_PREMIUM.md](ANGULAR_ART_PREMIUM.md): ocho plumas curvas afinadas,
sin riel sólido, puntos ni diamantes terminales. Esa receta sustituye la
presentación inicial del riel en esta ficha; no cambia trayectoria ni daño.

### Ficha de asset

```text
id: enemy-orbiter
rol: centinela angular / amenaza de recorrido anunciado
verbo visual: una abrazadera orbital segmentada que toma un carril y lo recorre
referencia de acabado: Tank para planos y ensamblaje; Elite para presencia,
  sin copiar su corona abierta, paleta ni silueta
ancla: centro de masa (0, 0)
frame: -32 -32 64 64
frente base: -Y; el contenedor rota por velocidad o sentido de recorrido runtime
colisión: círculo de radio 17; la cavidad visual no es un hueco atravesable
silueta elegida: cuerpo compacto en herradura incompleta, con dos compuertas
  laterales desfasadas y un núcleo direccional adelantado
lectura no cromática: abertura de las compuertas + chevrons/riel quebrado
piezas: rear → wings → hull → cockpit
calidades: Low usa master plano completo; Medium/High usan cuatro piezas
presupuesto: máximo 20 primitivas por master, cinco texturas 64×64 compartidas,
  sin filtros, máscaras, blur, gradientes ni SVG parseado durante gameplay
```

Antes de dibujar el XML definitivo, producir exactamente tres siluetas negras
de 32 px: una herradura compacta, una cometa segmentada y un anillo con proa.
La elegida en esta ficha es la herradura **sólo si** obtiene al menos 8/10 en la
rúbrica de silueta, personalidad, función, legibilidad y coherencia. Si falla,
se elige una de las otras dos con el mismo contrato; no se tapa la falla con más
adornos.

Construcción de la elegida:

1. `rear`: dos propulsores cortos encajados detrás de la cavidad, no llamas ni
   un halo permanente.
2. `wings`: compuertas de la herradura, con un solape visible sobre el casco.
   En `telegraph` se separan hasta 1.8 u y hacen un único pulso; en `commit`
   retornan a 0.9 u. Esa apertura es señal funcional, no ataque nuevo.
3. `hull`: chasis grafito, placa azul gris, bisel claro localizado y retorno
   oscuro. Debe conservar una muesca frontal a 32 px.
4. `cockpit`: núcleo pequeño cian dentro de pozo oscuro, adelantado hacia el
   frente. Su pulso suave es ambiental y se congela en pausa.

Paleta propuesta: chasis `#151B35`, placa `#4C5D93`, bisel `#B8C8FF`, cavidad
`#090D1E`, energía `#65E6FF`. La dirección de giro usa chevrons claros y el
ritmo de las compuertas; no depende únicamente del cian/ámbar. El riel de
telegraph se dibuja con `Graphics` reutilizado, con subpaths independientes y
una geometría por reserva; durante su vida sólo cambia alpha/transform. El
contenedor se traslada al foco local capturado: nunca se redibuja un círculo en
`ARENA_CENTER`, no se reconstruye cada frame, no tiene glow por entidad y nunca
tapa player, hazards ni telegraphs de prioridad mayor.

La muerte reutiliza las cuatro piezas ya rasterizadas en `EnemyDefeatFxView`;
las compuertas salen tangencialmente y el núcleo se apaga. Low usa la muerte
plana existente. No crear fragmentos, partículas o texturas por enemigo.

## 6. Validación obligatoria al implementar

### Automática

1. Contenido: `orbiter` declara todos los valores, el cap no supera el pool y
   ningún otro tipo cambia sus números o conducta.
2. Comportamiento puro, con semilla: seguimiento, sector/sentido deterministas;
   orden de fases; ruta local que empieza en la posición capturada; casco con
   contacto en todo el ciclo; liberación por muerte/reset.
3. Seguridad: el jugador no puede dejar al Orbiter sin objetivo por quedarse en
   una esquina; el aviso deja tiempo y espacio para salir; el commit se conserva
   si el player entra al riel anunciado y nunca hay más de un commit inicial.
4. Loop: mismo resultado relevante a 30/60/144 Hz bajo timestep fijo; sin
   asignaciones masivas, sin consulta O(n²) ni recursos Pixi desde simulación.
5. Render: las cuatro piezas usan frame compartido, Low conserva el master
   completo, el pool restaura texturas al reciclar, pausa congela animación y
   el telegraph distingue sentido con forma además de color.
6. Regresión: Chaser/Fast/Tank/Elite, boss, stress global y reset siguen
   funcionando. El escenario de estrés Angular no sobrepasa 250 enemigos,
   300 proyectiles, 150 pickups ni 150 FX reales.

### Humana

- En desktop y móvil, sin mirar documentación: ¿se entiende antes de moverse
  desde qué punto local partirá el arco y hacia qué lado?
- ¿Si el player se queda en una esquina, el Orbiter se aproxima y genera una
  amenaza local visible en vez de orbitar inútilmente el centro?
- ¿El jugador puede salir del arco con control touch sin que el Orbiter cambie
  de idea al último instante?
- ¿La nave se reconoce como familia nueva a 32/48/64 px y Low conserva su
  identidad sin reducir la señal crítica?
- ¿Una composición con amenazas existentes conserva lectura de player,
  Laser, pulso y borde de arena?

Registrar dispositivo, calidad, semilla/escenario, FPS y cualquier punto donde
la salida parezca falsa. «Se ve premium» o un build verde no sustituyen estas
pruebas.

## 7. Implementación inicial y prueba aislada

`?orbiter=1&debug=1&quality=high` abre **Orbiter Drill** directamente, sin
menú, oleadas normales, boss, Laser, pulso radial ni autofire. Conserva una
sola nave Orbiter y repite su ciclo para que el jugador pueda observar y cruzar
el arco sin que una build o niveles lo oculten. Es una ruta de desarrollo; no
es un selector de Acto II, no otorga recompensas y no altera una run normal.

La responsabilidad quedó localizada así:

- `OrbiterBehavior` ejecuta las fases puras; `EnemySystem` conserva el cap y
  sólo delega para `kind: 'orbiter'`.
- El snapshot expone fase, sector, sentido, progreso, foco/radio local y
  secuencia. La presentación compone las cuatro texturas cacheadas y
  `OrbiterTelegraphView` dibuja el riel una vez por `sequence`, trasladándolo
  al foco sin reconstruirlo por frame. Su `root` queda en `(0, 0)` porque los
  slots ya reciben coordenadas mundiales; el centro se aplica una sola vez.
- Low conserva master completo y ruta; Medium/High conservan las cuatro piezas
  y apertura sutil de compuertas. La muerte reutiliza `EnemyDefeatFxView`.

Comprobado automáticamente en esta revisión: suite dirigida
Orbiter/EnemySystem/telegraph `14/14`, typecheck, suite completa **92 archivos /
349 pruebas** y `npm run build:local`. La inspección visual humana del drill y
la run Angular queda pendiente en PC y móvil; no sustituye la medición móvil.
El warning conocido del chunk principal mayor de 500 kB permanece sin relación
con Orbiter.

## 8. Criterio de cierre de esta subtarea

Orbiter queda integrado en el consumidor Angular real y la composición del acto
ya fue aprobada. Este refinamiento reabre únicamente la validación humana de su
lectura y evasión; no reabre el balance de EX-02c ni la aprobación del resto de
familias. Charger, Splitter y Prism Weaver conservan sus contratos propios.
