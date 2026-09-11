# EX-07b — Orbiter: ficha de primera familia Angular

**Estado:** primera implementación automática lista en drill aislado; pendiente
consumidor Angular real y validación humana en desktop/móvil.

**Alcance de esta ficha:** define exclusivamente la primera familia enemiga del
Acto II. No autoriza añadir Charger, Splitter, Pulse Ring, hazard angular,
Orbital Warden, selector de Acto II, guardado de Expedition ni balance global.
Los valores numéricos son provisionales hasta EX-02c.

## 1. Intención jugable

El Orbiter enseña la idea que distingue Angular de Radial: una amenaza puede
**comprometer un sector y recorrerlo**, en vez de limitarse a perseguir al
player en línea recta. La decisión que debe provocar es:

> «Ya vi qué arco ocupará y hacia qué lado girará; cruzo por el sector
> contiguo libre antes de que complete el recorrido».

No debe ser un enemigo con más vida ni una pared que encierra al player. Su
trabajo es convertir la orientación respecto al centro de la arena en una ruta
legible. Charger y Splitter vendrán después precisamente para añadir presión a
esa ruta; este primer consumidor debe poder leerse solo.

## 2. Contrato de comportamiento

### Espacio y sectores

- La referencia angular es el centro lógico de la arena, nunca el canvas ni la
  posición instantánea del player. El comportamiento conserva por tanto el
  mundo fijo de la simulación ante resize y aspect ratios distintos.
- La arena se divide conceptualmente en **ocho sectores de 45°**. Es una regla
  de simulación/director; el renderer sólo recibe el sector, el sentido y la
  fase que deba mostrar.
- Cada Orbiter reserva como máximo un arco de compromiso de **90°** (dos
  sectores contiguos). Dos Orbiters no pueden reservar el mismo sector ni
  arcos contiguos si con ello desaparece una abertura de 90°.
- El director conserva siempre al menos dos sectores contiguos disponibles
  para cruzar. Si no puede reservarlos, retrasa o descarta ese intento: no
  cambia silenciosamente la ruta segura.

### Máquina de estados

| Fase | Duración/propuesta | Regla de simulación | Lectura para el jugador |
| --- | ---: | --- | --- |
| `approach` | hasta alcanzar la banda | Entra desde fuera y se dirige a su punto de preparación sin perseguir la posición actual del player. Sin daño de contacto. | Nave compacta que toma posición en el borde de un sector. |
| `telegraph` | 0.70 s | Bloquea sector, sentido (`clockwise`/`counterclockwise`) y arco. No inflige contacto aunque se solape accidentalmente; si la ruta se volvió inválida, cancela hacia `recovery`. | Compuertas laterales abiertas + riel discontinuo de 90° + chevrons en el sentido de giro. |
| `commit` | 0.95 s | Recorre el arco reservado con velocidad tangencial. Sólo aquí tiene daño de contacto. Mantiene radio de banda y no reorienta el arco según el player. | La nave gira por el riel anunciado; cruzar por el sector adyacente libre es la respuesta. |
| `recovery` | 0.60 s | Sale radialmente de la banda, sin contacto, libera reserva y espera/cierra el ciclo. | Compuertas cierran y queda un residuo tenue no dañino. |

La transición es siempre `approach → telegraph → commit → recovery`. No hay
ataque instantáneo, homing durante `commit`, giro de 180° inesperado ni daño en
telegraph/recovery. Un Orbiter puede morir en cualquier fase; su reserva se
libera inmediatamente y nunca deja un sector lógico bloqueado.

### Geometría de la ruta y respuesta segura

- Banda de referencia inicial: radio de `min(arenaRadius - 76, 176)` desde el
  centro, reducido sólo si hace falta respetar el radio de la nave, 16 u de
  margen y el borde real de un polígono. No debe inventar una zona atravesable
  dentro del hueco visual de la nave: la colisión continúa siendo circular.
- Antes de mostrar el telegraph, el director comprueba que el player no esté
  ya dentro del cuerpo inicial, del riel activo futuro ni del margen de
  aparición. Si lo está, elige otro sector o pospone la reserva.
- Durante el telegraph, la respuesta válida es moverse hacia cualquiera de los
  dos sectores libres adyacentes al final del arco, idealmente por el lado
  interior de la banda. Intentar cortar el riel anunciado sí debe ser riesgoso
  durante `commit`, pero nunca es la única salida.
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
| `contactDamage` | 9 | Provisional y sólo durante `commit`. |
| `experience` | 3 | Recompensa provisional por amenaza de ruta. |
| `spawnCost` | 2 | Permite al director sustituir presión, no sumar masa sin límite. |
| `approachSpeed` | 94 u/s | Debe llegar a la banda sin parecer Fast. |
| `commitAngularSpeed` | 1.65 rad/s | Recorre 90° en ~0.95 s; debe salir de una definición, no de un literal en el loop. |
| `activeCap` | 6 | Tope de familia; no amplía el pool global de 250 enemigos. |
| `commitCap` | 1 | Mantiene la primera lección legible. |
| `minimumFreeArc` | 90° | Dos sectores libres contiguos garantizados por el director. |

El cap se aplica antes de adquirir un slot del pool. El stress existente sigue
teniendo el tope global de 250: una futura variante de stress con Orbiters
**reemplaza** enemigos del reparto actual, nunca sube el contador a 256.

## 4. Responsabilidades de implementación

La implementación posterior se divide por responsabilidad, sin meter reglas de
sectores dentro de Pixi:

| Área | Responsabilidad concreta |
| --- | --- |
| `src/content/enemies/EnemyDefinitions.ts` | Declarar `orbiter` y su configuración authored agrupada. No usar el color como fuente de comportamiento. |
| `src/simulation/enemies/OrbiterBehavior.ts` | Máquina de estados pura, selección determinista de sector, reserva/liberación, ruta y velocidad. Debe ser testeable sin Pixi. |
| `EntityPools` / snapshot de combate | Añadir sólo estado simulado necesario: fase, sector reservado, sentido, progreso y generación/reset seguro. El snapshot expone únicamente la lectura que necesita presentación. |
| `EnemySystem` | Delegar la actualización del Orbiter a la conducta anterior y mantener idéntico el camino de Chaser/Fast/Tank/Elite. No convertirlo en un manager de actos. |
| Director Angular real | Decide cuándo intenta reservar y compone caps; no nace hasta que exista el primer consumidor jugable de Acto II. No se añade un menú o ActDefinition vacío. |
| `EnemyShipVisual` / vista de telegraph | Anima texturas cacheadas y muestra fase/sentido; no calcula sectores, daño ni rutas. |

`EnemyBehavior` no se convierte todavía en una jerarquía genérica: hay un
segundo tipo de movimiento realmente distinto y una responsabilidad coherente,
por lo que un colaborador puro `OrbiterBehavior` está justificado. Charger y
Splitter decidirán después si comparten una abstracción real; no deben ser
forzados a ella por adelantado.

## 5. Contrato visual premium

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
una geometría por reserva; durante su vida sólo cambia alpha/transform. No se
reconstruye cada frame, no tiene glow por entidad y nunca tapa player, hazards
ni telegraphs de prioridad mayor.

La muerte reutiliza las cuatro piezas ya rasterizadas en `EnemyDefeatFxView`;
las compuertas salen tangencialmente y el núcleo se apaga. Low usa la muerte
plana existente. No crear fragmentos, partículas o texturas por enemigo.

## 6. Validación obligatoria al implementar

### Automática

1. Contenido: `orbiter` declara todos los valores, el cap no supera el pool y
   ningún otro tipo cambia sus números o conducta.
2. Comportamiento puro, con semilla: sector/sentido deterministas; orden de
   fases; ruta tangencial; telegraph/recovery sin contacto; liberación por
   muerte/reset; cancelación segura si el player ocupa la ruta.
3. Seguridad: un commit deja un arco libre de 90°, se rechazan reservas que
   solapen o reduzcan ese arco, y nunca hay más de un commit inicial activo.
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
  qué arco recorrerá y hacia qué lado?
- ¿El jugador puede cruzar el sector libre con control touch sin que el
  Orbiter aparezca bajo él o cambie de idea al último instante?
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
- El snapshot expone fase, sector, sentido, progreso, banda y secuencia. La
  presentación compone las cuatro texturas cacheadas y `OrbiterTelegraphView`
  dibuja el riel una vez por `sequence`, no por frame.
- Low conserva master completo y ruta; Medium/High conservan las cuatro piezas
  y apertura sutil de compuertas. La muerte reutiliza `EnemyDefeatFxView`.

Comprobado automáticamente: typecheck, **85 archivos / 297 pruebas** y
`npm run build:local`. La inspección local High mostró el telegraph, los
chevrons y una única entidad a 60 FPS en `127.0.0.1`; no sustituye la prueba
humana ni una medición móvil. El warning conocido del chunk principal mayor de
500 kB permanece sin relación con Orbiter.

## 8. Criterio de cierre de esta subtarea

Orbiter queda listo como primer prototipo, pero **la lista de enemigos Angular
no está cerrada**: Charger y Splitter continúan explícitamente pendientes y
podrán ampliarse con más familias si la composición validada lo necesita. EX-07b
no se cierra hasta que Orbiter tenga validación humana y viva dentro de un
consumidor Angular real. Calibration conserva por ahora la entrada directa de
depuración; su selector y gating aparecen al habilitar ese consumidor, para no
entregar por error una build inicial superior dentro del Acto I ya validado.
