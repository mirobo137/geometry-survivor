# EX-07e — campaña Angular y entrada por calibración

**Estado:** **APROBADO/CERRADO en composición y game feel por validación
humana — 12-09-2026.** La calibración final de daño, vida y resistencia sigue
separada en EX-02c y no reabre esta puerta salvo que produzca una regresión de
lectura, evasión o softlock.

## Alcance de esta entrega

EX-07e conecta el primer consumidor real del Acto II sin adelantar la
calibración final de vida, daño, spawn ni porcentajes del Laboratorio de
EX-02c.

La composición authored de Acto II es:

`Orbiter → Charger → Splitter → Prism Weaver → Pulse Ring → hazard angular → Orbital Warden`

El acto mantiene la duración provisional de 260 segundos antes de abrir al
boss. Las cifras de cadencia y daño actuales son de integración y deberán
medirse al cerrar la puerta humana de EX-07d y la calibración posterior.

## Contrato técnico

- `ANGULAR_ACT_DEFINITION` compone perfiles de enemigos, hazards y
  `ANGULAR_WARDEN_ACT_DEFINITION`.
- `AngularActDirector` consume esa definición sin copiar la lógica de spawn.
- `CombatSimulation` usa Pulse Ring y Angular Sweep durante la fase normal de
  Angular; Laser y Radial Pulse siguen perteneciendo a Radial.
- El Warden del acto inicia a `260 s`; su drill continúa iniciando en `0 s`.
- Arena, input, colisiones, pool y render siguen compartiendo contratos del
  engine; cambiar de acto no crea una segunda simulación global ni altera la
  frontera de Pixi.

### Secuencia de arena Angular

Angular inicia en hexágono y cambia de forma cada 40 s: a los 40 s transforma a
cuadrado, a los 80 s a círculo, a los 120 s vuelve a hexágono, a los 160 s a
cuadrado y a los 200 s a hexágono. El cierre pre-boss empieza a los 248.05 s,
termina a los 250 s y transforma a círculo, dejando 10 s estables antes del
Warden a los 260 s. Cada intervención anuncia durante 1.20 s y hace morph
durante 0.75 s. El cuadrado tiene el mismo despeje mínimo que el hexágono para
evitar una contracción silenciosa: sus esquinas abren rutas, no quitan el único
refugio.

Es una regla de frontera, no una regla nueva de hazards. Pulse Ring y Angular
Sweep conservan sus timers, daño, telegraph, ataque, recovery y patrones; sólo
consultan la misma frontera interpolada para que su geometría y colisión nunca
prometan una salida fuera de la arena.

### Hallazgo visual no bloqueante: destello del cuadrado

El destello ligero observado no procede ya de un pulso periódico de opacidad:
`ArenaView` mantiene `arenaSegments.alpha = 0.86` y existe una regresión que lo
comprueba. La correlación determinista es otra: las ventanas cuadradas son
`40–80 s` y `160–200 s`, mientras las dos expansiones globales comienzan a los
`60 s` y `180 s`. Cada expansión activa simultáneamente:

- crecimiento de radio durante `1.25 s`, que reconstruye la frontera dinámica;
- una resonancia exterior durante `2.8 s`;
- una onda de expansión durante `0.58 s`.

Por ello ambos destellos caen dentro del cuadrado y sus lados largos los hacen
más perceptibles. No es aleatorio, no cambia la hitbox y no se observó efecto
en movimiento, daño o rendimiento. Se registra como `VIS-A2-01`, deuda visual
menor y no bloqueante.

La explicación coincide con el contrato documentado de PixiJS 8: `Graphics`
es geometría retenida, se recomienda usar `clear()` con moderación y evitar
reconstrucciones por frame; además, las transparencias superpuestas se mezclan
por primitiva. Referencia oficial:
[Graphics — Performance Best Practices](https://pixijs.com/8.x/guides/components/scene-objects/graphics#performance-best-practices).

Una corrección futura debe separar la animación de expansión de la geometría
estable del marco o evaluar `GraphicsContext` precalculados con medición. No se
autoriza apagar el aviso de expansión, cambiar la forma o añadir filtros para
ocultar el síntoma.

## Selector y gating

El botón `Actos` del menú abre el selector. `Radial` está siempre disponible;
`Angular` se añade a `unlockedActs` sólo al liquidar una victoria de Radial.
El guardado subió a schema 6 y las migraciones antiguas conservan Radial como
único acto válido. IDs repetidos o desconocidos se eliminan.

La campaña principal siempre comienza en Radial. Tras derrotar a Core Sentinel,
la intermisión ofrece exactamente tres calibraciones authored para iniciar
Angular desde cero: `Projectile`, `Orbit` o `Chain`. Un Acto II bloqueado no se
puede activar desde la UI normal.

El selector de actos desbloqueados se conserva como acceso de repetición y
prueba. No expone modos `Quick Act`/`Expedition`: entrar a Angular por esa vía
usa las mismas tres calibraciones y nunca hereda la build del Acto I.

## Intermisión y reinicio authored

Después de una victoria de Radial, la liquidación de NOVA y la recompensa son
idempotentes. `Terminar` vuelve al menú y `Repetir Acto I` empieza una run
limpia. La intermisión de campaña muestra las tres calibraciones en lugar de
un botón ambiguo de modo.

Al seleccionar una calibración se reconstruyen director, arena, pools, boss y
progresión del nuevo acto. Se aplican únicamente sus tres mejoras authored;
no se llama a `UpgradeApplier.snapshot()` de la run anterior. Así el Acto II
se puede probar sin la ventaja acumulada del Acto I y cada opción ofrece una
identidad jugable distinta sin regalar NOVA adicional.

## Prism Weaver: ataque anclado al cuerpo

Prism Weaver es el cuarto enemigo de control espacial del Acto II. Su patrón de
tres radios se aproxima a un punto authored, avisa, activa el barrido y se
reposiciona para el siguiente cast. El punto de aproximación se calcula desde
el centro lógico de arena, pero eso no define el origen del ataque.

Durante `telegraph` y `active`, el origen lógico es siempre `state.x/state.y`.
`PrismWeaverBehavior.intersectsPlayer()` mide la posición del player respecto al
enemigo y `PrismWeaverTelegraphView` dibuja una geometría local trasladada a
la misma posición. Esta simetría es obligatoria: un hazard de un enemigo nunca
debe parecer emitido por el centro de la arena. Puede extenderse fuera del
radio jugable si el enemigo se encuentra cerca del borde; la lectura debe
mantener el cuerpo como emisor.

La geometría se construye una vez por secuencia/radio, usa capas base/core/edge y
nodos, y el pool está limitado a `activeCap = 3`. El cambio de anclaje no altera
daño, vida, cadencia ni el balance diferido de EX-02c.

## Pruebas reproducibles

- `?act=angular&debug=1&quality=low|medium|high`: menú con Angular si el save
  ya contiene `unlockedActs: ['radial', 'angular']`; Play abre las tres
  calibraciones.
- `?prism=1&debug=1&quality=low|medium|high`: drill aislado de Prism Weaver.
- `?warden=1&debug=1&quality=low|medium|high`: drill aislado del boss.
- `?angular=1&debug=1&quality=low|medium|high`: drill aislado del hazard.

Puerta automática cubierta en esta entrega:

- composición de Act II y umbral del Warden en `CombatSimulation.test.ts`;
- definición y perfiles en `ActDefinitions.test.ts`;
- migración de desbloqueos en `SaveStore.test.ts`;
- transición de estado en `GameState.test.ts`;
- reinicio authored, tres calibraciones y desbloqueo en `Game.test.ts`;
- selector/gating y entrada Angular en `tests/browser/game.smoke.spec.ts`;
- `npm run typecheck`, `npm test -- --run` y `npm run build:local`.

## Cierre y pendientes trasladados

La aprobación humana acepta la composición Angular, las calibraciones de
entrada, las familias enemigas, los hazards, la arena cambiante y Orbital
Warden como base completa del Acto II. La evidencia automática indicada arriba
y la aprobación de producto cierran EX-07e; `VIS-A2-01` no bloquea el avance.

Permanecen fuera de esta puerta:

1. EX-02c: calibración final de daño, vida, resistencia, spawn y porcentajes.
2. La muestra cuantitativa ampliada de runs, útil para EX-02c pero no requerida
   para volver a decidir si la identidad del acto funciona.
3. La recompensa y transición II→III, que pertenecen al consumidor real del
   Acto III y no deben inventar todavía `unlockedActs` de III ni Overdrive.
