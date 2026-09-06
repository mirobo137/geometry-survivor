# EX-02a — matriz reproducible del Laboratorio

Fecha: 05-09-2026  
Instrumento: `src/debug/BalanceCombatScenario.ts`  
Prueba: `src/debug/BalanceCombatScenario.test.ts`

## Protocolo

- Semilla declarada: `334462` (`0x51a7e`). En este escenario no se lanzan
  críticos ni director: la semilla queda fijada para que futuras extensiones no
  puedan cambiar silenciosamente la comparación.
- Jugador inmóvil en la posición inicial del modelo, reloj de simulación a
  `60 Hz`, duración de cada pasada: `20 s`.
- Se comparan meta nivel `0` contra meta nivel `5`, aplicando ambos niveles
  permanentes actuales (`weapon_damage` y `weapon_cadence`).
- Se conserva una carta de arma idéntica dentro de cada comparación: ninguna
  para Projectile, `orbit_blade` para Orbit y `chain_lightning` para Chain.
- Los targets son Tanks inmóviles, sin daño de contacto. Las posiciones son
  relativas al jugador:
  - `single`: `(58, 0)`; un objetivo.
  - `dispersed`: `(180, 0)`, `(-180, 0)`, `(0, 180)`; tres objetivos sin saltos
    de cadena entre ellos y fuera del radio de órbita.
  - `dense`: `(58, 0)`, `(-29, 50.23)`, `(-29, -50.23)`; tres objetivos en el
    anillo de órbita y dentro del radio de salto.
- Cada caso ejecuta dos pasadas con la misma configuración: una con cada Tank
  a `72 HP` para tiempo de eliminación, y otra con cada Tank a `100000 HP` para
  DPS sostenido. La métrica `damageApplied` es la suma de los paquetes de daño,
  incluido overkill; `hits` cuenta paquetes que realmente redujeron vida.
- `first kill` es el primer objetivo eliminado, no el tiempo de limpiar todo el
  grupo. El cooldown reportado es el mínimo configurado del arma: intervalo de
  disparo para Projectile, cooldown de impacto para Orbit y cooldown de cast
  para Chain.

## Resultados

| Arma | Layout | Meta | Daño/paquete | Cooldown mínimo | Eliminación: daño / golpes / bajas / primera | Sostenido: daño / golpes / DPS |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Projectile | single | 0 | 14.00 | 0.5500 s | 84 / 6 / 1 / 3.333 s | 504 / 36 / 25.20 |
| Projectile | single | 5 | 17.50 | 0.4675 s | 87.5 / 5 / 1 / 2.383 s | 735 / 42 / 36.75 |
| Projectile | dispersed | 0 | 14.00 | 0.5500 s | 252 / 18 / 3 / 3.583 s | 490 / 35 / 24.50 |
| Projectile | dispersed | 5 | 17.50 | 0.4675 s | 262.5 / 15 / 3 / 2.633 s | 735 / 42 / 36.75 |
| Projectile | dense | 0 | 14.00 | 0.5500 s | 252 / 18 / 3 / 3.333 s | 504 / 36 / 25.20 |
| Projectile | dense | 5 | 17.50 | 0.4675 s | 262.5 / 15 / 3 / 2.383 s | 735 / 42 / 36.75 |
| Orbit | single | 0 | 18.00 | 0.5000 s | 72 / 4 / 1 / 6.750 s | 162 / 9 / 8.10 |
| Orbit | single | 5 | 18.00 | 0.5000 s | 72 / 4 / 1 / 6.750 s | 162 / 9 / 8.10 |
| Orbit | dispersed | 0 | 18.00 | 0.5000 s | 0 / 0 / 0 / — | 0 / 0 / 0.00 |
| Orbit | dispersed | 5 | 18.00 | 0.5000 s | 0 / 0 / 0 / — | 0 / 0 / 0.00 |
| Orbit | dense | 0 | 18.00 | 0.5000 s | 216 / 12 / 3 / 6.750 s | 486 / 27 / 24.30 |
| Orbit | dense | 5 | 18.00 | 0.5000 s | 216 / 12 / 3 / 6.750 s | 486 / 27 / 24.30 |
| Chain | single | 0 | 10.00 | 1.2000 s | 80 / 8 / 1 / 9.600 s | 160 / 16 / 8.00 |
| Chain | single | 5 | 10.00 | 1.2000 s | 80 / 8 / 1 / 9.600 s | 160 / 16 / 8.00 |
| Chain | dispersed | 0 | 10.00 | 1.2000 s | 240 / 24 / 3 / 9.600 s | 480 / 48 / 24.00 |
| Chain | dispersed | 5 | 10.00 | 1.2000 s | 240 / 24 / 3 / 9.600 s | 480 / 48 / 24.00 |
| Chain | dense | 0 | 10.00 | 1.2000 s | 240 / 24 / 3 / 9.600 s | 480 / 48 / 24.00 |
| Chain | dense | 5 | 10.00 | 1.2000 s | 240 / 24 / 3 / 9.600 s | 480 / 48 / 24.00 |

## Lectura de balance

1. **Projectile:** meta 5 pasa de `25.20` a `36.75 DPS` en single-target,
   `+45.8%`, porque combina `+25% daño` con `−15% intervalo`. El primer kill
   baja de `3.333 s` a `2.383 s`.
2. **Orbit:** el layout dense aporta `24.30 DPS` y el disperso `0 DPS`, lo que
   confirma que su decisión es espacial. Meta 5 no cambia ningún valor porque
   los bonuses permanentes actuales sólo llegan al proyectil.
3. **Chain:** el layout single aporta `8.00 DPS` y los grupos conectables
   `24.00 DPS`. El grupo disperso no reduce la contribución en esta configuración
   porque el primer objetivo se elimina antes de que el cast siguiente cambie
   de rama; ese caso debe conservarse al ampliar el instrumento con HP y
   posiciones alternativas. Meta 5 tampoco cambia sus valores.
4. La matriz **no aprueba** todavía el objetivo de ventaja efectiva `10–15%`:
   sólo caracteriza el estado actual. El `+45.8%` de Projectile y el `0%` de
   Orbit/Chain son la evidencia de entrada para **EX-02b**, donde se debe
   decidir la semántica del bonus antes de recalibrar porcentajes en EX-02c.

## Evidencia de ejecución

- `npm run typecheck` — correcto.
- `npm test -- --run src/debug/BalanceCombatScenario.test.ts` — 4/4 tests
  correctos.
- `git diff --check` — correcto; Git sólo informó la conversión normal LF/CRLF
  del working tree.

No se midieron FPS, GPU, memoria, móvil físico ni plataforma: no forman parte
de EX-02a. Tampoco se cambiaron precios, porcentajes, daño del juego ni
descripciones de cartas.
