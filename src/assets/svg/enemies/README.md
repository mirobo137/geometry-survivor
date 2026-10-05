# Enemy SVG fallbacks

Los enemigos usan sus cuerpos PNG transparentes como arte principal. Se
conservan masters SVG completos sólo cuando `CombatEntitiesView` los consume
como fallback de carga; las piezas modulares de enemigos comunes quedaron
obsoletas y se retiraron. Los PNG y sus contratos viven en
[`src/assets/images/enemies/`](../../images/enemies/).

Masters comunes que permanecen como fallback:

- `chaser/chaser.svg`
- `fast/fast.svg`
- `tank/tank.svg`
- `elite/elite.svg`
- `orbiter/orbiter.svg`
- `charger/charger.svg`
- `splitter/splitter.svg`
- `prism-weaver/prism-weaver.svg`
- `warden-replica/warden-replica.svg`

Los tres bosses conservan sus SVG de entrada y fallback: Core Sentinel y
Orbital Warden usan módulos SVG; Fracture Engine y sus enemigos usan las
definiciones deterministas de `FractureEnemySvgMarkup.ts`. No retirar esas
fuentes mientras sigan conectadas al render.

Los assets mantienen orientación superior hacia `-Y`, ancla en `(0, 0)` y
frame lógico de 64×64 para enemigos comunes / 112×112 para bosses. La
simulación conserva radios y reglas; el arte no modifica colisiones. La lámina
de revisión está en `docs/visual/fleet-reference.html`.
