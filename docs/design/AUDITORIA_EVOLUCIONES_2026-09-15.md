# Auditoría acotada de evoluciones — 15-09-2026

## Alcance y evidencia

La revisión inicial fue estática sobre `436e312`; esta corrección posterior
modificó gameplay, render, pruebas y documentación. Las líneas históricas son
orientativas para ese commit: localizar también por símbolo. Los escenarios
que continúan marcados como humanos son propuestas de validación, no evidencia
de una sesión visual manual.

Se revisaron Pulse Ring, Magnetic Charge, su integración en CombatWeaponSystem,
su presentación en WeaponView, pruebas relacionadas y el flujo enfocado de
cartas en Game. No es una auditoría exhaustiva de todas las armas, economía,
guardado, anuncios, enemigos, plataformas o rendimiento.

Aplicar las skills canónicas de gameplay, rendering y validation. Sus reglas
exigen separar simulación/presentación, probar daño por fase y no confundir
tests verdes con aprobación visual o rendimiento medido.

## Estado de resolución — 15-09-2026

**A01–A08 están corregidos en código y cubiertos por typecheck, 390 pruebas
unitarias y build local.** Este documento conserva cada hallazgo como contrato
de regresión y explica qué debe mantener Luna si modifica estas armas. El smoke
browser completo quedó bloqueado por su inestabilidad previa y no se cuenta
como resultado verde de esta entrega.

- A01: resets de Pulse Ring/Magnetic Charge limpian su evolución interna;
  behavior y CombatSimulation reutilizados cubiertos.
- A02/A03: Echo registra una vez por onda y reinicia radio al reanclarse.
- A04: Compression no rota el cono; Polar recibe radio de frente, disco final
  y contador de pulsos desde simulación, sin encoger el ancho dañino.
- A05: Magnetic Charge ya no tiene un cache paralelo de cooldown fuera del
  behavior; los drills conservan su override explícito.
- A06: dirección se actualiza en idle y queda congelada al disparar.
- A07: los tests ahora distinguen onda/fase y el borde angular real.
- A08: CONTINUACION y el plan señalan las notas históricas y esta auditoría.

La aprobación humana de Solar Crown y de los actos no se revoca. EX-02c,
balance global, validación integrada completa y revisión visual humana siguen
pendientes: esta tarea no los abre ni los declara aprobados.

Las secciones A01–A08 conservan la evidencia **previa a la corrección** para
explicar el motivo de cada regresión. Su título y el estado anterior prevalecen
sobre los verbos históricos dentro de cada apartado.

## A01 — resuelto (P1 histórico): evolución interna no se limpiaba al reset

Evidencia: `src/simulation/combat/PulseRingWeaponBehavior.ts`, `reset()`
(aprox. 183), y `MagneticChargeBehavior.ts`, `reset()` (222).
Ambos limpian `state.evolution`, pero no `this.evolution`. `setEvolution()`
rechaza una elección si la variable interna no es null. CombatWeaponSystem
llama esos resets al reiniciarse.

Consecuencia: reutilizar la misma instancia puede conservar reglas de la
evolución anterior y bloquear otra elección, aunque el snapshot parezca limpio.

Corrección: reiniciar explícitamente el estado interno y los parámetros
derivados; conservar únicamente los bonos permanentes previstos. Comprobar el
reset de las seis familias, sin reescribir las que ya funcionan.

Aceptación:

- Evolucionar → reset → desbloquear: rank I, evolución null, parámetros base
  con meta conservada y ningún impacto/estado visual residual.
- Elegir la rama contraria después del reset debe funcionar.
- Cubrir behavior y reutilización por CombatWeaponSystem, no solo construir
  una instancia nueva en cada test.

## A02 — resuelto (P1 histórico): Echo Shock no distinguía impactos por onda

Evidencia: `PulseRingWeaponBehavior.hitAlongSweep()` (232–246). El ledger
admite dos golpes por cast sin guardar cuál onda golpeó. Un enemigo que siga
dentro de la banda en actualizaciones consecutivas puede gastar ambos golpes
en wave 0, con multiplicador 1; wave 1 queda bloqueada para ese objetivo.

Corrección: registrar por generación de enemigo, lanzamiento y onda. No
resolverlo aumentando el tope. Mantener los multiplicadores actuales hasta
que una decisión de balance autorice cambiarlos.

Aceptación: objetivo durable e inmóvil (boss para evitar knockback), un único
golpe de daño base en wave 0 y uno de 0.45 del daño base en wave 1. Críticos
desactivados. Nunca dos golpes de wave 0. Repetir con slot reutilizado.

## A03 — resuelto (P1 histórico): Echo Shock podía barrer un radio heredado al cambiar de onda

Evidencia: `PulseRingWeaponBehavior.update()` (154–175). Al pasar de recovery
a la segunda onda se cambia el origen, pero no se reinicializa inmediatamente
el radio. Si queda tiempo dentro del mismo update, `previousRadius` conserva
el extremo de la primera onda; `syncState()` calcula el comienzo de la segunda.
La colisión barre entonces un intervalo grande alrededor del origen nuevo.

Es un defecto condicionado por cómo el timestep cruza la transición, no una
afirmación de que ocurra en todos los lanzamientos.

Corrección: inicializar la geometría de cada fase/onda antes del siguiente
barrido. Nunca mezclar radio previo de un cast con el origen del siguiente.

Aceptación: mover al player antes del eco y colocar un objetivo lejos del
radio inicial pero dentro del radio final nuevo. No debe dañarse en el primer
instante del eco; solo cuando el frente llegue. Probar transición exacta y
con remanente de dt, comparando 1/30, 1/60 y 1/144 s en el behavior.

## A04 — resuelto (P1 histórico): geometría visible y dañina divergían

Evidencia: `src/presentation/pixi/WeaponView.ts`, actualización de Pulse Ring
(515–528) y Magnetic Charge (583–612).

- Compression Wave construye el sector con el eje capturado, pero las capas
  activas agregan rotaciones distintas. La colisión conserva el eje fijo.
- Polar rota band/rails por `state.rotation`, mientras `hitPolarFronts()` usa
  `state.polarAngle` fijo. También escala todo el frente, reduciendo su ancho;
  la colisión mantiene ancho 24u. La escala mínima visual 0.08 tampoco coincide
  con una contracción física que llega a cero.
- El núcleo final tiene radio físico `outerRadius * 0.43`. La animación del
  core no representa explícitamente ese radio ni los dos momentos de impacto.

Corrección: renderizar la geometría dañina desde el snapshot de simulación.
Conservar giros libres solo en adornos inequívocos, no en bordes que comunican
alcance. Distinguir halo decorativo de superficie dañina. Mantener materiales,
contraste y jerarquía premium; no añadir blur, filtros o parsing SVG por frame.

Aceptación: comparar límites en inicio, mitad y final del ataque, con objetivos
justo dentro/fuera; eje de Compression fijo después del aviso. Verificar
Low/High y reduced motion; estos ajustes no cambian el área de daño. Polar
debe mostrar dos acentos de impacto alineados con los pulsos físicos y un
núcleo cuyo alcance se pueda leer. La aprobación visual sigue siendo humana.

## A05 — resuelto (P1 histórico): cooldown magnético calculado, pero sobrescrito al integrar

Evidencia: `CombatWeaponSystem.applyMagneticChargeEvolution()` (390) solo
delega; `update()` (476) pasa `this.magneticChargeCooldown`. Ese caché se
actualiza por rank/bonos, pero no al evolucionar. En MagneticChargeBehavior,
`applyEvolutionTuning()` multiplica el cooldown por 1.2 / 1.25.

Consecuencia: el getter del behavior puede indicar una cadencia diferente de
la que realmente usa la partida después de elegir Event Horizon/Polar Collapse.

Corrección: una fuente de verdad para la cadencia; preservar los overrides
explícitos de laboratorio. Evitar un segundo cálculo paralelo de la fórmula.

Aceptación: probar el sistema integrado sin override, midiendo espera idle
entre casts antes/después de evolucionar. Separar duración activa de espera:
no confundir cooldown con tiempo total entre inicios. Cubrir meta y rank VI.

## A06 — resuelto (P2 histórico): Compression usaba dirección antigua tras el cooldown

Evidencia: `PulseRingWeaponBehavior.update()` (148–151) retorna en idle antes
de `updateMovementDirection()`. `fire()` captura `directionX/Y` previamente
guardados, y CombatWeaponSystem actualiza el behavior antes del scheduler.

Consecuencia: moverse/cambiar rumbo durante el descanso no actualiza el eje
del siguiente aviso. Incluso la primera captura puede conservar el valor
por defecto aunque el player ya se haya movido.

Corrección: seguir la última dirección válida también durante idle cuando
corresponda; congelar exclusivamente el eje del cast activo. Definir el
fallback sin movimiento y conservar el contrato de apuntar por movimiento.

Aceptación: terminar un ataque, cambiar rumbo 90° durante idle y disparar:
el nuevo aviso usa el rumbo reciente. Moverse después del aviso no lo rota.
Probar primer cast, player inmóvil y reset.

## A07 — resuelto (P2 histórico): pruebas demasiado permisivas para los contratos declarados

Evidencia:

- `MagneticChargeBehavior.test.ts` (124–152) exige `damages.length >= 2` en
  toda la secuencia: no distingue frente de dos pulsos finales.
- `PulseRingWeaponBehavior.test.ts` (66) verifica llegada a wave 1 y pérdida
  de vida, no qué onda hizo cada golpe ni cuánto.
- El test de Compression «including edge overlap» (126) coloca centros entre
  -0.93 y +0.93 rad, dentro de los ±55° del sector: no demuestra el caso de
  centro fuera y radio del enemigo intersectando el borde angular.

Corrección: registrar objetivo, fase/onda, tiempo y cantidad de cada impacto
en fixtures deterministas; críticos apagados, blancos durables, grid actualizado
si se mueven. No agregar instrumentación persistente al juego solo por el test.

Aceptación: dos pulsos finales separados para un enemigo presente en ambos;
ningún daño fuera del área; borde angular con centro fuera pero cuerpo dentro,
y control apenas más lejos sin intersección. Para Polar probar también entrada
tardía: hoy el contador objetivo puede entregar pulsos acumulados al entrar.
Ese último comportamiento requiere decidir si es intencional antes de cambiarlo.
No llamar «daño prolongado validado» a cualquier descenso de vida.

## A08 — resuelto (P2 histórico): documentación vigente mezclada con estados históricos

Evidencia: `CONTINUACION.md` abre con seis rutas conectadas, pero después
titula «Vigente: ... R1 parcial» y dice que faltan las demás. Plan §16.5 dice
«Solo plan, no código v2» y describe Solar Crown espiral; §22.1s/t documenta
la implementación y seis cuchillas fijas. Las notas posteriores tienen
precedencia explícita, pero la lectura aislada sigue siendo propensa a error.

Acción documental: identificar bloques históricos y enlazar el estado actual,
sin borrar decisiones anteriores ni cambiar el diseño. Esta entrega añade
avisos de precedencia y este registro de pendientes, no declara correcciones.

Importante: el hito global 7 está implementado para `weapon-path` con I→VI;
no asumir que la campaña normal ya migró íntegramente a esa progresión.
No convertir la migración pendiente de campaña en un bug ni implementarla
como arreglo de esta auditoría sin la autorización correspondiente.

## Secuencia de trabajo para Luna / cualquier agente

1. Leer AGENTS, estado actual y skills; comprobar Git y si los hallazgos siguen
   vigentes. Reproducir primero con tests que fallen por la causa indicada.
2. Lote funcional: A01, A02/A03 juntos, A05 y A06. Parche pequeño por contrato,
   sin cambiar HP, economía, familias aprobadas o reglas de elección.
3. Lote visual: A04 después de estabilizar snapshots. Usar guías de efectos
   existentes y comparar con geometría física, no solo screenshots bonitas.
4. A07 acompaña cada corrección; no dejar sus pruebas para el final. Actualizar
   A08 al entregar, separando implementado, probado automáticamente y aprobado.
5. Una corrección se cierra con evidencia específica, no por «suite verde».
   Registrar comando, resultado, escenario manual pendiente y commit.

Validación económica inicial (no ejecutada en esta auditoría):

```powershell
npx vitest run src/simulation/combat/PulseRingWeaponBehavior.test.ts src/simulation/combat/MagneticChargeBehavior.test.ts src/simulation/combat/CombatSimulation.test.ts
npm run typecheck
```

Agregar las regresiones a los archivos existentes pertinentes; los casos de
integración pueden entrar por CombatSimulation. No existe actualmente un
CombatWeaponSystem.test.ts independiente. Si cambia
WeaponView, ejecutar también `npx vitest run src/presentation/pixi/WeaponView.test.ts`.
Al cerrar el lote, una validación integrada proporcionada al cambio. Recordar
que `npm run test:browser` ya llama build:local, y este ya ejecuta typecheck y
unitarias: no encadenar redundancias por rutina. No quitar puertas de CI.

Prueba humana breve, sin exigir diez runs para estas correcciones:

- `/?weapon-path=pulse-ring&debug=1&quality=high`: progresión, hito y una rama;
  reiniciar sin recargar y elegir la otra.
- `/?weapon-path=magnetic-charge&debug=1&quality=low`: repetir el reinicio.
- `/?evolution=echo-shock&scenario=mass&debug=1` y equivalentes
  `compression-wave`, `event-horizon`, `polar-collapse`: comprobar lectura en
  masa; usar `scenario=single` para separar hits. Verificar slugs en el código
  si estas rutas cambian. No asumir que hay servidor levantado.

No se certifican FPS, memoria ni todas las evoluciones con esta revisión.
Antes de prometer «sin costo», medir. No agregar infraestructura de profiling,
dependencias o una reescritura general para resolver estos ocho puntos.
