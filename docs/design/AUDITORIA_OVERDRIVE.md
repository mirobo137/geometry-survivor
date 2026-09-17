# Auditoría de Overdrive — 17-09-2026

Base auditada: `cdd3fa5` (EX-11.1–EX-11.5). Solicitud: revisar y documentar
correcciones para Luna antes de avanzar. Esta entrega no corrige runtime.

**Resultado: REQUIERE CORRECCIONES antes de EX-11.6.** La suite actual pasa,
pero no cubre varios incumplimientos del contrato. No repetir las cinco
subtareas desde cero: reparar los puntos siguientes y añadir regresiones.

Fuentes: [plan vigente](../../PLAN_DESARROLLO.md),
[contrato Infinito](PLAN_INFINITO.md),
[ejecución](../PLAN_EJECUCION.md). Aplicar las skills canónicas de arquitectura,
gameplay y validación. Las reglas y las correcciones son independientes del modelo.

## Lo que sí está establecido

- Modo separado de `ActId`, fórmulas y director reutilizando contenido existente.
- Migración a esquema 7 con desbloqueo inicialmente falso y combinación de récords.
- Límite inicial de tres armas y apertura monotónica a seis al evolucionar tres.
- Multiplicadores de potencia separados, cap y reset; reservas fuera del catálogo base.
- Simulación conserva separación de Pixi, DOM y SDK. La búsqueda de imports y usos
  inversos en `src/simulation` no encontró dependencias de esas capas.
- No se ampliaron pools para acomodar seis armas.

La modularidad de capas se mantiene. El área que necesita más cuidado es la
coordinación de `Game`: transición, lifecycle, reset y liquidación deben tener
contratos y pruebas explícitos antes de incorporar un segundo boss. Evitar
agregar más condiciones dispersas o construir otro engine.

## Correcciones previas a EX-11.6

### OD-A01 — Alta: la ruta debug escribe progreso real

Ubicación: `src/app/Game.ts`, constructor (`saveStore`), `settleTerminalRun`,
`requestDoubleNova`; entrada en `src/main.ts`.

`mode=overdrive` sólo entra mediante debug, pero usa el SaveStore real.
La liquidación sólo excluye `weaponPath`; Overdrive paga NOVA y modifica `best`.
Contradice §9 del contrato y la documentación de los presets efímeros.

Evidencia ejecutada: con `Game` en Overdrive, 100 s y 100 bajas, llamar al flujo
de fin de partida y liquidarlo invocó `saveStore.save` con `{ nova: 103 }`.
Se usó un store simulado, por lo que esta auditoría no alteró una cartera real.

Corrección: identificar explícitamente una run diagnóstica e impedir sus
recompensas, récords y desbloqueos, incluida duplicación. No bloquear para
siempre toda run Overdrive: la futura entrada pública sí tendrá recompensa.
No confundir guardar ajustes con guardar progreso de una run artificial.

Aceptación: presets starter/three-evolved/six-evolved, muerte, reinicio,
duplicación y callbacks tardíos no cambian cartera, récords ni desbloqueos;
campaña conserva liquidación idempotente. Cubrirlo con store espía.

### OD-A02 — Alta: la transición ignora pérdida de foco

Ubicación: `Game.beginOverdriveStageTransition`, `pauseForLifecycle`, `onTick`;
`GameState.enterPause`/`completeOverdriveTransition`.

La transición usa `setTimeout(3000)`. `enterPause()` sólo acepta `playing`, así
que una pérdida de foco durante `overdrive-transition` no registra la pausa.
El callback cambia a `playing` sin comprobar que la ventana siga activa.

Evidencia ejecutada con fake timers: entrar en transición, llamar a
`pauseForLifecycle`, avanzar 3000 ms deja `phase === 'playing'`.
Esto confirma el problema de estado; no equivale a medir ejecución de frames
en un navegador móvil en background.

Corrección: conservar intención de pausa y tiempo restante de transición;
reanudar únicamente con el lifecycle permitido. Resolver cartas pendientes
antes de cualquier nuevo paso de combate. Coordinar audio y plataforma sin
duplicar notificaciones. Cubrir también pérdida de contexto WebGL.

Aceptación: ocultar/volver durante los tres segundos, blur, pausa, context
loss y level-ups pendientes; no avanza combate ni recargas mientras está
pausado y el retorno no deja overlays ni callbacks huérfanos.

### OD-A03 — Alta: la prioridad muerte/boss depende del orden de eventos

Ubicación: `CombatSimulation.update`/`defeatEnemy`; `Game.updateSimulation`.

Hallazgo por inspección del orden de ejecución: las armas pueden emitir
`bossDefeated` antes de `fractureThreats.update`, que después puede emitir
`playerDamaged`. `Game` procesa la lista en orden y retorna inmediatamente
tras el primer boss derrotado. Por tanto omite daño posterior de ese tick y
puede curar/iniciar transición en lugar de resolver una muerte simultánea.
No se ejecutó un encuentro físico de reproducción en esta auditoría.

Corrección: resolver todos los daños pertinentes y la supervivencia del tick
antes de comprometer la transición. Si hay revive y todos los bosses ya
murieron, conservar la transición pendiente: no depender de volver a recibir
un evento de derrota que ya se consumió. Mantener un único resultado terminal.

Aceptación: ordenar artificialmente eventos como boss→daño letal y daño
letal→boss debe producir el mismo resultado; comprobar revive aceptado,
rechazado y daño no letal. Añadir integración con una amenaza Fracture.

### OD-A04 — Media: las reservas aparecen antes del agotamiento real

Ubicación: `UpgradeApplier.composeCampaignChoices`, cálculo de
`selectedIds`/`ordinaryRemaining` (aproximadamente líneas 181–193).

Se consideran agotadas las mejoras que sólo están seleccionadas en la mano
o excluidas por reroll. Ofrecer una carta no significa haberla adquirido.

Evidencia ejecutada: con seis familias evolucionadas, semilla `0x5eed`, agotando
las mejoras normales, se obtuvo una mano mixta:

```text
projectile_mastery_tempo
overdrive_power_orbit
overdrive_power_magnetic_charge
```

La prueba actual dice que no debe aparecer una reserva mientras quede una
normal, pero no comprueba esa afirmación: aplica las normales y omite las
reservas de las manos mixtas.

Corrección: comprobar elegibilidad global de contenido normal antes de
aplicar exclusiones de presentación/reroll. Las reservas sólo empiezan tras
agotamiento real. Si quedan menos cartas, usar la política explícita de mano
reducida; no introducir un cambio silencioso de diseño.

Aceptación: cero manos mixtas antes del agotamiento, también con una o dos
normales restantes y al rerollear. Después: tres potencias con vida completa;
con vida incompleta, Reparación y dos potencias cuando sean elegibles. El
reroll excluye las cartas actuales: documentar la excepción de Reparación
ya ofrecida, en vez de prometer que siempre reaparece.

### OD-A05 — Media: maestría universal desaparece al adquirir la cuarta arma

Ubicación: `UpgradeApplier.hasThreeEvolvedFamilies`,
`getScheduledUniversalMastery`, `canApply('universal_weapon_mastery')`.

La condición sigue siendo `activeFamilies.length === 3`. La ampliación del
arsenal está bien, pero las comprobaciones posteriores no fueron adaptadas a
cuatro, cinco y seis como exige §6 del contrato.

Evidencia ejecutada: seis armas evolucionadas y maestrías aún disponibles,
`canApply('universal_weapon_mastery') === false`.

Corrección: mantener la condición exacta para campaña y definir el predicado
Overdrive compatible con el arsenal ampliado. Preservar prioridad/rotación
de evoluciones pendientes y caps de maestría; no reabrir ramas excluyentes.

Aceptación: matrices de tres/cuatro/cinco/seis familias, con evoluciones
pendientes y completas, más reroll y cambio de tramo. Campaña sigue en tres.

### OD-A06 — Media: cronología del boss incorrecta desde tramo 10

Ubicación: `OverdriveActDirector.bossDefinition`/`bossStartSeconds`;
`BossSystem.update` usa `definition.startSeconds` directamente.

Evidencia ejecutada: tramo 10 devuelve `bossDefinition.startSeconds === 260`.
El contrato §4 pide 250 s para TODOS los tramos desde el 10. También afecta al
boss Angular cuando su definición de campaña empieza a 260 s. El test actual
sólo comprueba tramos 4 y 6.

Corrección: separar tipo de boss de instante de aparición. No basta con
cambiar el getter `bossStartSeconds`: el consumidor real usa la definición.
No mutar las definiciones compartidas de campaña.

Aceptación: comprobar aparición real en 249,99/250 s para 10, 11 y 12 y
cronologías originales en 1–9 y campaña.

### OD-A07 — Media: cap de vida aplicado al factor, no a la vida final

Ubicación: `OverdriveDefinitions.getOverdriveHealthMultiplier`;
`EnemySystem.configureEnemy`/`configureBoss`.

El factor se limita a 1e9 pero después se multiplica por vida base. El contrato
§2 limita el RESULTADO a 1e9. Evidencia ejecutada: un boss de tramo `1e12`
alcanzó **520.000.000.000** HP. Es un caso extremo de seguridad, no una
estimación del balance alcanzable jugando.

Corrección: cap final coherente desde vida base, escala y coeficiente de
hijo/réplica, sin aplicar dos veces el escalado. Validar índices enteros seguros
también: `normalizeOverdriveStage` permite valores finitos fuera del rango en
que `stage + 1` incrementa de forma fiable.

Aceptación: normales, invitados, hijos, réplicas y bosses; tramos grandes,
NaN/Infinity, frontera del cap y progresión segura del contador de tramo.

### OD-A08 — Media: reinicio conserva el tramo avanzado y pierde el preset

Ubicación: `Game.resetRunState`/`clearRunPresentation`/`activateRun`.

`clearRunPresentation` borra build y XP pero no devuelve director ni
`overdriveStage` a su entrada. `resetRunState` tampoco vuelve a aplicar
`od-build`, que sólo se prepara en `activateRun`.

Evidencia ejecutada: iniciar tramo 1, completar transición a 2 y limpiar la run
conserva `actDirector.stageState.stage === 2`. La ausencia de reaplicación del
preset se verificó por inspección del flujo de reinicio.

Corrección: distinguir estado inicial de QA del tramo vivo. Reiniciar debug
debe reconstruir su etapa/semilla/build de entrada; la futura run pública
empezará en tramo 1 y build limpia. Reconfigurar también arena, hazards y boss.

Aceptación: restart desde pausa y muerte tras avanzar varios tramos, con los
tres presets; comprobar dificultad inicial, build, XP, recargas y etiquetas.

## Pendientes adicionales de estabilidad y cobertura

- `UpgradeApplier.acquisitionOrder` añade una entrada por selección sin limitar
  el historial. Reparación es repetible indefinidamente. Aplicar el presupuesto
  de últimos 256 registros de §7, conservando totales/stacks independientes.
  `LevelProgression.sync` también usa un bucle por nivel sin validar finitud:
  tratar lotes enormes/Infinity antes del cierre de estabilidad de EX-11.
- Revisar limpieza de FX en transición: `beginOverdriveStageTransition` limpia
  simulación pero no llama a una limpieza de presentación; `presentationDelta`
  vale cero durante transición. Falta verificar visualmente que no congela ni
  arrastra FX de impacto/muerte al nuevo tramo. Es una comprobación pendiente,
  no un parpadeo observado en un teléfono.
- Las pruebas de EX-11.5 verifican getters para seis armas y una rama por familia,
  pero no impactos reales de las doce evoluciones y fuentes secundarias.
  Añadir casos representativos de daño, potencia repetida aditiva, conservación
  al cambiar tramo y reset de todas las familias.
- Los caps de pasivas 6/9 están documentados en el plan de ejecución, pero son
  una elección reciente de implementación; incluirlos en la revisión de balance.
  No presentar esos valores como balance humano aprobado.

## Qué sigue siendo trabajo futuro legítimo

EX-11.6: dos instancias de boss, propietario de amenazas/FX, arbitraje de ataques,
pool reservado y condición de terminar sólo después de ambos.
EX-11.7 y cierre: retirada, conversión final a NOVA, recompensa/records y
conexión real de `unlockOverdrive`, menú público, contadores y QA prolongado.
La ausencia de esas funciones no se clasifica aquí como regresión de EX-11.1–5.
La fuga de guardado debug sí debe resolverse ahora porque la ruta ya existe.

## Orden de trabajo para Luna

1. OD-A01: aislamiento de progreso de las rutas de prueba.
2. OD-A02 y OD-A03: lifecycle y prioridad de resolución de fin de tick.
3. OD-A08: reinicio reproducible y reconstrucción de estado inicial.
4. OD-A04 y OD-A05: composición/elegibilidad de cartas.
5. OD-A06 y OD-A07: cronología y límites numéricos.
6. Acotar historial y completar regresiones de transición/armas. Registrar
   resultados por ID y ajustar las afirmaciones de documentación a lo probado.
7. Retomar EX-11.6 sólo después de cerrar lo anterior. Las puertas humanas
   siguen abiertas hasta observarlas en Pages; no certificar móvil desde Vitest.

## Evidencia y límites de esta auditoría

Windows/PowerShell, checkout `cdd3fa5`, 17-09-2026:

```text
npm run typecheck
npx vitest run --pool=threads --poolOptions.threads.singleThread=true
```

Resultado: typecheck OK; **107 archivos / 451 tests OK**. Se usaron
`GOMAXPROCS=1` y `NODE_OPTIONS=--max-old-space-size=4096` en Vitest.
Las sondas temporales documentadas arriba comprobaron el comportamiento actual
defectuoso; se retiraron tras la auditoría y no se versionan como tests que
legitimen un bug. Luna debe transformar esos casos en regresiones con la
expectativa correcta al implementar las soluciones.

No se reejecutaron builds (entrega documental), browser, FPS ni pruebas físicas
de móvil. Los tres builds de la entrega anterior son evidencia histórica,
no nuevas mediciones. No se consultó web: los hallazgos dependen de reglas
internas y código, sin cambios de API externa.
