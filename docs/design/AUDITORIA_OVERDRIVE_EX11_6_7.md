# Auditoría de Overdrive después de EX-11.6/7 — 17-09-2026

Estado: **NO CERRADO**. Auditoría solicitada tras observar una nave Core Sentinel
con el nombre Orbital Warden durante la primera vuelta. Este informe no aplica
correcciones a producción ni cambia el balance. Complementa la auditoría
OD-A01–A08 anterior; no invalida sus correcciones particulares.

Contrato: [PLAN_INFINITO.md](PLAN_INFINITO.md). Se inspeccionó el checkout local
con los cambios pendientes de navegación Actos/Infinito y Acto III/Overdrive.

## Lo que sí corresponde al plan

| Tramo de primera vuelta | Boss real | Multiplicador de vida |
|---|---|---|
| 1 | Core Sentinel | ×1 |
| 2 | Orbital Warden | ×3 |
| 3 | Fracture Engine | ×6 |

Una reproducción en CombatSimulation generó los tres bosses y comprobó su
`EnemyState.bossId` y vida máxima contra la definición base: pasó. El incremento
de vida de la primera vuelta es intencional; no debe eliminarse como reparación.
EnemySystem aplica el factor a vida máxima, sin multiplicar daño de contacto,
velocidad ni XP por ese factor. No hay evidencia aquí de una resistencia
porcentual nueva. El balance final sigue pendiente.

## Hallazgos por prioridad

### OD-B01 — Alta: todas las naves de boss vuelven al aspecto Core Sentinel

**Reproducido.** `BossShipVisual.reset()` llama a `setBossId('core-sentinel')`.
`CombatEntitiesView` ahora conserva tres instancias, configuradas una vez en su
constructor, y resetea las tres sin restaurar su identidad. La transición de
Game invoca `view.resetPresentation()`; los siguientes renders eligen la
instancia Warden/Fracture, pero sus texturas ya son las de Core.

Archivos: `src/presentation/pixi/enemies/BossShipVisual.ts:100`,
`src/presentation/pixi/CombatEntitiesView.ts:310,500`, `src/app/Game.ts:1162`.
Puede afectar también a campaña cuando se reinicia la presentación.

Corrección: mantener identidad en el reset visual o restituirla explícitamente
desde el propietario. Probar transición I→II→III y repetición en low/high con
texturas distintas. El test actual de BossShipVisual incluso espera volver a
Core: ese supuesto antiguo ya no sirve para tres instancias persistentes.

### OD-B02 — Alta: el superviviente de una pareja pierde sus ataques especiales

**Reproducido en el árbitro real.** `skip()` cede el turno cuando muere un boss,
pero `onStart()` del superviviente vuelve a asignar prioridad al muerto. Después
de ese ataque y de esperar diez segundos, `canStart()` sigue devolviendo false.
El boss puede conservar movimiento/contacto, pero deja de ejecutar especiales.

Archivo: `src/simulation/combat/CombatSimulation.ts:112–155`.
Corrección: registrar participantes vivos y arbitrar solo entre ellos; si queda
uno, permitir su ciclo normal. Probar ambas órdenes de muerte y muerte durante
un especial con amenaza persistente.

### OD-B03 — Alta: un tramo con pareja pierde los hazards desde el principio

**Reproducido.** `doubleBossEncounter` se fija al crear/reconfigurar el tramo,
antes de que entren los bosses. Los cuatro sistemas de hazards reciben
`!doubleBossEncounter` como permiso de inicio. En una simulación de 120 segundos
del tramo 10 con pareja forzada se observaron cero fases no-idle y cero bosses.

Archivo: `src/simulation/combat/CombatSimulation.ts:268,695–743,909`.
El contrato pide suspender nuevos peligros durante el encuentro doble, no
durante toda la cronología previa. Además el árbitro no comprueba que hayan
terminado los peligros ya anunciados antes de dar permiso a los bosses.

Corrección: separar pareja programada, entrada/drenaje y encuentro activo.
Validar hazards antes del segundo 250 y el paso ordenado a los especiales.

### OD-B04 — Alta: se puede saltar a otro tramo por la ruta pública y cobrar

**Confirmado por trazado de código; no se modificó un guardado real.**
`src/main.ts:190` acepta `od-stage` aunque falte `debug=1`, pero solamente
`debug=1` marca la partida como diagnóstica. Un guardado desbloqueado puede abrir
`?mode=overdrive&od-stage=10`, jugar y liquidar récord de tramos como si hubiese
completado los nueve anteriores (`overdriveStage - 1`).

Corrección: todo salto de etapa debe requerir diagnóstico o forzarse a tramo 1.
Centralizar la política de entrada y probar guardado y recompensa del acceso
público con parámetros manipulados, además de la ruta diagnóstica.

### OD-B05 — Media: retirarse se trata como muerte y puede ofrecer revive

**Confirmado por trazado.** `Game.onPauseWithdraw()` termina mediante
`finishRun('game-over')`. `openGameOverSummary()` calcula revive por ese outcome
sin distinguir retirada. Con anuncio disponible retrasa la liquidación, y el
jugador puede recibir una oferta para revivir después de elegir cobrar.
La confirmación tampoco explica que no existe reanudación tras cerrar.

Archivo: `src/app/Game.ts:369,1322`.
Corrección: conservar la causa terminal retirada y liquidar de forma definitiva
una sola vez, sin revive. Validar aceptar/cancelar y oferta publicitaria tardía.

### OD-B06 — Media: falta reserva de recursos antes de los avisos

**Confirmado por inspección.** Los emisores adquieren proyectiles/minas cuando
detona el ataque; si el pool está lleno retornan cero o una ráfaga parcial.
BossSystem anuncia batería/minas sin reservar capacidad y no trata ese fallo.
La reserva de dos slots enemigos solo limita el spawn normal: los hijos del
Splitter y las réplicas adquieren directamente del mismo pool.

Archivos: `src/simulation/fracture/FractureThreatSystem.ts:101,127`,
`src/simulation/bosses/BossSystem.ts:332,342,650`,
`src/simulation/enemies/EnemySystem.ts:248`,
`src/simulation/combat/CombatSimulation.ts:791`.

Consecuencia: avisos sin ataque o con menos proyectiles y posible retraso de
entrada de bosses por saturación. No se observó daño invisible en esta auditoría.
Corrección: reservar recursos antes del aviso, proteger slots frente a todos
los productores y probar saturación real de los tres pools.

### OD-B07 — Media: el fallback de 25 NOVA no existe

**Confirmado por inspección.** Después de agotar el contenido ordinario,
UpgradeApplier solo considera potencia y reparación. Con todas las potencias
en su tope y vida completa puede devolver `[]`; no existe efecto de conversión
a NOVA. Una subida en ese estado deja la elección sin cartas aplicables.

Archivo: `src/simulation/progression/UpgradeApplier.ts:181–200,322` y
`src/content/upgrades/UpgradeDefinitions.ts`.
Es un extremo de sesión larga, no una explicación de problemas en primera vuelta.
Corrección: implementar el fallback aprobado con límite de recompensa y test
de todas las reservas agotadas/vida completa.

### OD-B08 — Media: las rutas de parejas no entran directamente al encuentro

**Confirmado por trazado.** `od-pair` elige los tipos pero no adelanta el reloj.
Solo `boss=1` controla `initialElapsedSeconds` en main, y lo calcula por `act`,
no por el director Overdrive. Las URLs documentadas con pareja empiezan desde
cero y exigen esperar el boss.

Archivo: `src/main.ts:192,289`.
Corrección: el atajo de pareja debe usar el tiempo del encuentro del director
y ser siempre diagnóstico. Como ayuda temporal, tramo 10 + `boss=1&act=fracture`
inicia a 250 s; no sustituye la reparación del contrato de rutas.

### OD-B09 — Media: «Continuar al Overdrive» todavía abre otro menú

**Confirmado por trazado.** El nuevo callback de victoria navega a
`?mode=overdrive`; main fuerza `startOnMenu` para ese modo público y Game.start
abre StartScreen. El usuario debe volver a pulsar JUGAR. La afirmación anterior
de que el botón ya entraba directamente al combate fue demasiado amplia.

Archivos: `src/app/Game.ts:283,388`, `src/main.ts:293`.
Corrección: distinguir la entrada directa autorizada tras victoria del acceso
normal de menú, verificar desbloqueo y comenzar una partida limpia. Probar desde
la pantalla de victoria hasta gameplay, no solo comprobar la URL de destino.

### OD-B10 — Baja: selección de parejas con coste creciente por tramo

**Confirmado por inspección.** `shouldUseDoubleBoss()` recorre desde el tramo 10
hasta el actual y acumula un array de todos los resultados. El array es temporal,
no una fuga persistente demostrada, pero cada consulta requiere tiempo/memoria
lineales. Se aceptan etapas hasta Number.MAX_SAFE_INTEGER.

Archivo: `src/simulation/acts/OverdriveActDirector.ts:154`.
Corrección: conservar estado acotado de las últimas elecciones; limitar accesos
directos a valores seguros y ofrecer reconstrucción reproducible controlada.
No ejecutar una URL con una etapa extrema para probarlo: puede bloquear el hilo.

## Evidencia y límites

## Estado de correcciones de esta auditoria

Estado actual: **CORREGIDO EN EL CHECKOUT LOCAL; PENDIENTE DE VALIDACION HUMANA Y PUSH**.

- OD-B01: la vista conserva la identidad de cada familia de boss al resetear.
- OD-B02: el arbitro conserva participantes vivos y el ultimo boss puede volver a ejecutar especiales.
- OD-B03: los hazards pueden iniciar antes de la ventana del boss doble y los activos terminan normalmente.
- OD-B04: `od-stage` y `seed` solo se aceptan con `debug=1`; el acceso publico vuelve al tramo 1.
- OD-B05: una retirada es terminal definitiva y no ofrece revive.
- OD-B06: bateria, minas y replicas reservan capacidad antes del aviso; las reservas se liberan al limpiar.
- OD-B07: existe `overdrive_nova` como reserva final de 25 NOVA, limitada a diez conversiones por run.
- OD-B08: `od-pair` diagnostico inicia el reloj en la ventana correcta del boss.
- OD-B09: continuar desde la victoria del Acto III usa `autostart=1`; la entrada normal conserva el menu.
- OD-B10: la seleccion de parejas usa solo los dos estados anteriores, sin array creciente.

Validacion posterior: `npm run typecheck` paso; la suite completa de Vitest paso
con 107 archivos y 463 tests; las pruebas browser dirigidas de gating, menu y
Overdrive pasaron (3 tests). Falta validacion humana de transiciones 1->2->3,
parejas en las tres calidades y una prueba manual de retirada antes de cerrar
EX-11.6/7.

Se ejecutaron cuatro reproducciones temporales con Vitest, un worker:

1. Conservar las texturas Warden después de reset: **falló**.
2. Permitir nuevos especiales del superviviente tras su primer ataque: **falló**.
3. Mantener hazards antes de la entrada de pareja durante 120 s simulados: **falló**, 0 activaciones.
4. Boss real y vida base escalada en tramos 1/2/3: **pasó**.

Comando: `npx vitest run src/simulation/combat/Overdrive.audit.test.ts --pool=threads --poolOptions.threads.singleThread=true`.
El archivo temporal fue retirado después de capturar los resultados; no se
dejaron tests rojos nuevos en la suite ni se corrigió producción en esta auditoría.
Los otros siete hallazgos proceden del trazado de código, no de una run visual.

No se midieron FPS ni memoria física, no se volvió a jugar toda la primera
vuelta y no se comprobó qué commit exacto mostraba Pages en las capturas.
La reproducción local explica la discrepancia nombre/nave mostrada; no prueba
que nunca pueda existir otro error de rotación en una build distinta.

## Orden recomendado de reparación

1. OD-B01: identidad visual y regresión de transición de los tres bosses.
2. OD-B02/B03: árbitro, superviviente y cronología previa del encuentro doble.
3. OD-B04/B05: aislamiento de atajos y retirada definitiva.
4. OD-B06/B07: presupuestos reales y fallback de agotamiento.
5. OD-B08/B09: accesos de prueba y continuación directa.
6. OD-B10: límites de reconstrucción y sesión larga.

Reabrir el cierre de EX-11.6/7. La suite anterior no cubría estas interacciones:
la prueba de dos bosses solo verificaba su aparición y la de continuación solo
la navegación. El criterio de cierre requiere el comportamiento completo.
