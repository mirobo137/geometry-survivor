# EX-07b — Splitter angular

Ficha e implementación del tercer enemigo Angular del Acto II. Esta entrega
se mantiene aislada hasta que exista la composición real del acto; no altera
las oleadas ni el balance aprobado del Acto I.

## Verbo y decisión

**Verbo:** fracturarse. El jugador decide si elimina al Splitter cerca de su
ruta actual —aceptando dos fragmentos pequeños— o lo mantiene a distancia y
limpia el espacio con más seguridad. La muerte sigue siendo una recompensa,
pero tiene una consecuencia espacial legible.

El padre se mueve de forma directa hacia el jugador. Al recibir el golpe letal
libera exactamente dos hijos laterales. La profundidad máxima es 1: los hijos
no vuelven a dividirse. No hay daño nuevo, proyectil ni hazard asociado a la
fractura; sólo aparecen dos enemigos con sus colliders propios.

## Contrato de simulación

`SPLITTER_DEFINITION` concentra los valores authored del prototipo:

- padre: radio 21, velocidad 62, vida 46, contacto 12;
- dos hijos, profundidad 1, escala de radio 0.72, velocidad 1.20, vida 0.52
  y daño de contacto 0.70;
- cap de familia 8, offset lateral 20 y profundidad máxima 1.

Estos valores sirven para leer la mecánica y quedan fuera de la recalibración
final de vida/daño. `EnemySystem.spawnSplitterChildren` adquiere cada slot sólo
si sigue disponible el pool y el cap de Splitter. Si el pool está lleno puede
crear cero o un hijo; nunca sobrepasa la capacidad global.

La simulación emite el evento normal `enemyDefeated` para el padre y los hijos.
La experiencia de cada entidad conserva la economía existente. El render
recibe `splitterDepth` sólo para diferenciar el tamaño y la respiración del
hijo; presentación no decide la división.

## Drill reproducible

Abrir:

`http://localhost:5173/?splitter=1&debug=1&quality=high`

El drill desactiva boss, Laser, Pulse Ring y oleadas normales, pero conserva el
autofire authored para que el jugador vea el ciclo completo. La lectura
esperada es: un padre se aproxima, recibe disparos, desaparece con el FX de
muerte modular y dos hijos aparecen a los lados; éstos mueren sin crear una
nueva generación. El debug muestra `mode: splitter-drill` y `splitter: N active |
depth D`.

## Dirección visual premium

`src/assets/svg/enemies/splitter/` contiene cinco fuentes centradas en
`-32 -32 64 64`: master, rear, wings, hull y cockpit. El master coincide con
las piezas en el orden rear → wings → hull → cockpit. La silueta usa casco
diamante partido, placas gemelas, planos de retorno, biseles selectivos y un
nucleo dual. No copia el arco del Orbiter ni la proa del Charger.

En High/Medium se animan las cuatro piezas cacheadas; en Low se conserva el
master completo. El hijo se reduce por transform, no por una segunda textura.
La muerte usa `EnemyDefeatFxView` pooled y el anillo/impacto existente; no se
crean Graphics por entidad o frame.

## Validación y puerta

Automático: master y piezas estructuralmente iguales, ids prefijados, sin
filtros/recursos externos, cap del drill, profundidad acotada, separación
lateral y render con la familia registrada. Ejecutar typecheck, tests y build.

Humano pendiente: inspeccionar la nave a 32/64/96 px, silueta en claro/oscuro,
la transición padre → hijos y la legibilidad bajo caos. No marcar la familia
aprobada ni cerrar EX-07 hasta probarla en el consumidor Angular real.
