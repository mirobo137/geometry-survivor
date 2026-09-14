# EX-08b - Resonant Aura de jugador (histórico)

> **SUPERSEDIDA.** Esta propuesta fue reemplazada uno por uno por Magnetic
> Charge. El contrato activo está en
> [`EX-08b-magnetic-charge-weapon.md`](EX-08b-magnetic-charge-weapon.md).

Estado: **AUTOMATICO OK; validacion humana pendiente**.

Esta entrega implementa la sexta familia de arma prevista en `PLAN_DESARROLLO.md
16.5`. El usuario autorizo continuar con el siguiente arma; por eso la
validacion humana de Pulse Ring no bloquea esta implementacion. El balance de
EX-02c sigue fuera de alcance.

## Contrato authored provisional

| Parametro | Valor | Proposito |
| --- | ---: | --- |
| Danio | 12 | tick de control a distancia |
| Radio interior | 66 u | centro seguro; no es armadura de contacto |
| Radio exterior | 150 u | banda de dominio cercana |
| Cooldown por objetivo | 0.55 s | evita dano continuo por frame |
| Velocidad visual | 0.72 rad/s | movimiento de la lectura, no de la colision |

La banda sigue al jugador. Un enemigo entra en la banda cuando su propia
circunferencia cruza el intervalo interior-exterior; un enemigo completamente
dentro del radio interior no recibe dano. El boss puede recibir el tick, pero
Aura no empuja, bloquea hazards ni cambia la frontera.

## Simulacion

`ResonantAuraBehavior` es puro y no importa Pixi. Usa la spatial grid existente,
buffers tipados de cooldown y generaciones de pool. Cada objetivo puede recibir
un impacto como maximo cuando su cooldown expira; reciclar un slot no hereda el
cooldown de la entidad anterior. El estado de render expone posicion, radios,
ritmo, rotacion y secuencia; no expone decisiones de dano a la vista.

La carta `resonant_aura` desbloquea el arma y respeta el limite global de tres
armas activas. La carta base no implementa `breathing_halo` ni `prism_wall`;
ambas evoluciones quedan para una entrega posterior y mutuamente excluyente.

## Drill reproducible

`/?weapon=resonant-aura&debug=1&quality=high`

Tambien se puede usar `quality=low`. El drill crea ocho blancos estaticos:
uno en el centro, varios dentro de la banda y otros fuera. Desactiva proyectil,
orbita, cadena, bumeran, Pulse Ring, hazards normales, boss y oleadas. El
debug muestra `mode: resonant-aura-drill`, `enemies: 8/250` y
`aura: active | 66-150`.

## Evidencia automatica

- `ResonantAuraBehavior.test.ts`: centro seguro, banda, exterior, cooldown por
  objetivo, seguimiento del jugador y generaciones.
- `CombatSimulation.test.ts`: drill aislado, ocho blancos, hazards inactivos y
  arma desbloqueada.
- `UpgradeApplier.test.ts`: carta, limite de una copia y catalogo de arma.
- `WeaponView.test.ts`: capas persistentes y equivalencia Low/High.
- `tests/browser/game.smoke.spec.ts`: boot, contadores, estado de Aura,
  captura High y ausencia de errores de runtime.

La revision humana pendiente debe comprobar que el centro se percibe seguro,
que la banda no tapa al player, que Low conserva la lectura y que el tick se
siente como control de distancia. No ajustar aun vida, dano general o spawn.
