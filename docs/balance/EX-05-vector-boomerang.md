# EX-05 — Vector Boomerang base

Estado: **CERRADO POR DECISIÓN DE PRODUCTO para este hito**; implementación
automática, puertas previas y validación humana base aprobadas. La auditoría
EX-05e de ticks/rendimiento queda diferida y no bloquea el acto siguiente.

Esta ficha fija el primer consumidor nuevo de la arquitectura extraida de
armas. No modifica el dano de las armas existentes, la geometria de la arena,
la vida de enemigos ni la pasada de balance EX-02c. La variante entra en el
catalogo jugable tras el cierre de EX-03; la vida/resistencia de enemigos y el
balance general siguen deliberadamente pendientes.

## Ficha numerica inicial (DEC-01)

| Parametro | Valor | Regla |
| --- | ---: | --- |
| Dano base | 13 | una vez por fase y por enemigo |
| Velocidad de salida | 360 u/s | vector fijo elegido al lanzar |
| Velocidad de retorno | 430 u/s | apunta cada tick a la posicion actual del player |
| Radio de colision | 11 u | hitbox circular de la pieza |
| Distancia de salida | 250 u | medida desde el origen del lanzamiento |
| TTL | 2.2 s | libera el slot si no captura antes |
| Cooldown | 1.25 s | scheduler fijo, sin catch-up mientras esta bloqueada |
| Maximo activo | 3 | limite de gameplay; el pool tiene 8 slots |

La comparacion con Projectile es deliberadamente conservadora: Bumeran tiene
13 frente a 14 de dano, menos velocidad y cooldown mas largo. Su valor esta en
la doble ventana de alineacion, no en limpiar la pantalla. La salida bloquea
el vector hacia el objetivo mas cercano al momento del disparo; el regreso
persigue al player y puede cambiar de angulo si este se mueve.

## Contrato de simulacion

- La trayectoria, las fases y los impactos viven en
  `src/simulation/combat/BoomerangBehavior.ts`; la vista nunca inventa una
  curva ni decide dano.
- La colision es barrida entre posicion anterior y nueva posicion, usando la
  spatial grid vigente. Asi no se saltan enemigos cuando el tick avanza varios
  pixeles.
- Cada slot mantiene dos ledgers fijos: salida y retorno. El ledger guarda la
  generacion del enemigo, no solo su indice; un slot reciclado puede recibir
  el impacto de la nueva fase sin producir un tercer impacto en la fase actual.
- Un enemigo derrotado se libera mediante el callback normal de
  `CombatSimulation`; no se crea una ruta de recompensas paralela.
- Sin target no se adquiere una pieza. Pool lleno, target liberado, player
  muerto, borde del mundo o TTL no pueden dejar un slot activo indefinidamente:
  el regreso sigue apuntando a la ultima posicion del player y el TTL es el
  ultimo guardarrail.
- `reset()` libera todos los slots, borra ambos ledgers y restablece la fase;
  pausa no avanza la simulacion y el reinicio no conserva piezas activas.

La carta de adquisicion es `vector_boomerang`. El limite global es de tres
armas: Projectile ocupa el primer espacio; Orbit, Chain y Bumeran son armas
adicionales. Una cuarta adquisicion se filtra, mientras las mejoras de las
armas ya equipadas conservan su validez. No hay expulsion automatica.

## Contrato visual premium de bajo coste

El master esta en `src/assets/svg/weapons/vector-boomerang.svg`. Usa el frame
explicito `-24 -24 48 48`, apunta a `+X` y no contiene filtros, mascaras,
`foreignObject`, imagenes incrustadas ni texto dependiente del runtime. Pixi
lo rasteriza una vez; el aura, wake, nucleo y trail son piezas cacheadas y se
reutilizan en los ocho roots del pool.

La orientacion visual se calcula con la velocidad real: salida cian y retorno
violeta. El trail es un abanico con punta, no una linea rectangular; Low lo
reduce a una sola senal corta, Medium conserva aura/wake y High anade mas
presencia. El cambio de fase modifica lectura, alpha y pulso, pero nunca la
posicion ni el hitbox. No se crean arrays, texturas, sprites ni filtros dentro
del render caliente.

## Evidencia automatica de esta entrega

- `BoomerangBehavior.test.ts`: salida/retorno, player en movimiento, captura,
  ausencia de target, reset, slot reciclado por generacion, player muerto,
  pool lleno y expiracion de TTL.
- `WeaponScheduler.test.ts`: arma opcional bloqueada sin acumulacion y orden
  de disparo tras desbloquear.
- `UpgradeApplier.test.ts`: adquisicion y limite de tres armas.
- `WeaponView.test.ts`: ocho roots acotados, orientacion por velocidad, cambio
  de fase y limpieza.
- `VectorBoomerangSvg.test.ts`: frame, orientacion, primitives acotadas y
  ausencia de tags inseguros.

Validacion actual: `typecheck` correcto; suite completa 77 archivos/261 tests;
build local, Poki y CrazyGames correctos; smoke browser 24/24 en 2.6 minutos.
El warning conocido del chunk principal mayor de 500 kB permanece visible.
El usuario confirmó que el Búmeran funciona perfectamente en partida bajo
movimiento, con otras armas activas y bajo presión; su validación humana base
queda aprobada. EX-05 queda cerrado por decisión de producto para este hito.
La comparación de ticks 30/60/144 Hz y el stress de combinaciones permanecen
como EX-05e diferido, no como resultado medido ni bloqueo del plan.
