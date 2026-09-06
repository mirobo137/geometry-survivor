# EX-02b — Semántica de meta por arma

Fecha: 05-09-2026  
Estado: AUTOMÁTICO OK  
Entrada: matriz reproducible de EX-02a y contrato de §16.6  
Exclusiones: no cambia porcentajes, niveles, precios, save ni cartas de run

## Decisión

Los dos upgrades permanentes del Laboratorio se aplican a los eventos de las
tres armas authored. La palabra «arma» no significa sólo proyectil físico:
significa el evento que produce daño o presión en cada comportamiento.

| Rama | Projectile | Orbit | Chain Lightning |
| --- | --- | --- | --- |
| Impact Matrix / daño | daño de cada proyectil | daño de cada contacto de blade | daño de cada salto |
| Fire Calibration / cadencia | intervalo entre disparos | cooldown de golpe por objetivo | intervalo entre casts |
| Lo que no modifica | velocidad, targeting, TTL o colisión | velocidad de rotación o radio | número de saltos, radio o duración del segmento |

Orbit usa el cooldown por objetivo como su evento de cadencia. Esto aumenta la
frecuencia con que un blade puede volver a golpear al mismo objetivo, pero no
acelera su rotación ni crea blades. Chain usa el intervalo de cast del
`WeaponScheduler`; no repite saltos dentro del mismo cast ni cambia su límite.

## Fuente única

`src/content/meta/PermanentUpgradeDefinitions.ts` contiene
`PERMANENT_UPGRADE_RULES`, que conserva los valores provisionales existentes:

- daño: `+0.05` de multiplicador por nivel, máximo `×1.25`;
- cadencia: `−0.03` de intervalo por nivel, mínimo `×0.75`.

`getPermanentCombatBonuses()` deriva los multiplicadores normalizados para la
simulación. `getPermanentUpgradeEffectLabel()` deriva el texto que consume el
Laboratorio mediante `definition.effectLabel`; por eso preview y gameplay no
pueden divergir por repetir `5%` o `3%` en dos lugares.

La aplicación queda así:

```text
damage(arma) = daño_base(arma) × weaponDamageMultiplier + mejoras_de_run
intervalo_projectile = max(0.18 s, base × weaponCadenceMultiplier) − cartas_de_run
intervalo_orbit_tick = cooldown_por_objetivo_base × weaponCadenceMultiplier
intervalo_chain_cast = cooldown_de_cast_base × weaponCadenceMultiplier
```

Con ambos upgrades en nivel 5, los valores authored observables son:

| Arma | Daño base | Nivel 5 | Intervalo de nivel 0 | Intervalo de nivel 5 |
| --- | ---: | ---: | ---: | ---: |
| Projectile | 14 | 17.5 | 0.550 s | 0.4675 s |
| Orbit hit | 18 | 22.5 | 0.500 s | 0.425 s |
| Chain cast | 10 por salto | 12.5 por salto | 1.200 s | 1.020 s |

Las mejoras de run continúan aplicándose encima de estos valores iniciales
según sus propios contratos. No se mezclan con la moneda ni se reembolsan
compras existentes.

## Implementación y evidencia

- `CombatWeaponSystem` conserva la frontera de armas y distribuye los dos
  multiplicadores a Projectile, Orbit y Chain.
- `OrbitBehavior` conserva su rotación authored y guarda el cooldown de golpe
  por objetivo con el multiplicador permanente.
- `ChainBehavior` conserva máximo de objetivos y duración de segmento; sólo su
  daño base recibe el multiplicador.
- `BalanceCombatScenario` conserva semilla, layouts, duración y cartas de la
  matriz anterior, pero su reporte actual se presenta como matriz general de
  EX-02 para no confundir evidencia histórica con la semántica vigente.

Pruebas específicas:

- `PermanentUpgradeDefinitions.test.ts`: fórmula, clamp, labels y niveles 5;
- `CombatSimulation.test.ts`: daño e intervalos actuales de las tres armas y
  persistencia después de reset;
- `BalanceCombatScenario.test.ts`: aumento monotónico y ratio `×1.25` para las
  tres armas, además de menor intervalo en sus eventos correspondientes.

EX-02b no acepta todavía la potencia final. La ventaja efectiva, el candidato
`+1.5% daño / −1% intervalo` y cualquier ajuste de porcentajes pertenecen a
EX-02c, después de observar esta matriz con la semántica unificada.
