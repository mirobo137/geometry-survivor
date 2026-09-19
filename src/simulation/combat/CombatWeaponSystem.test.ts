import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { PlayerModel } from '../PlayerModel';
import { CombatWeaponSystem } from './CombatWeaponSystem';

describe('CombatWeaponSystem', () => {
  it('uses Magnetic Charge evolution cooldowns unless a drill explicitly overrides them', () => {
    const enemies = new EnemySystem(new EnemyPool(1), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapons = new CombatWeaponSystem(enemies, () => undefined);
    const player = new PlayerModel();
    weapons.unlockMagneticCharge();
    expect(weapons.applyMagneticChargeEvolution('event_horizon')).toBe(true);
    expect(weapons.currentMagneticChargeCooldown).toBeCloseTo(6.24);

    const casts: number[] = [];
    let previousSequence = 0;
    for (let step = 0; step < 1_200 && casts.length < 2; step += 1) {
      weapons.update(0.01, player.state, {
        projectileEnabled: false,
        orbitEnabled: false,
        chainEnabled: false,
        boomerangEnabled: false,
        pulseRingEnabled: false,
        magneticChargeEnabled: true,
        magneticChargeArena: ARENA_RADIUS
      });
      if (weapons.magneticCharge.sequence > previousSequence) {
        casts.push((step + 1) * 0.01);
        previousSequence = weapons.magneticCharge.sequence;
      }
    }

    expect(casts).toHaveLength(2);
    // Event Horizon: travel .42 + 3.4-second hold + recovery .36, then its
    // authored 6.24-second idle cooldown. It intentionally has no collapse.
    expect(casts[1] - casts[0]).toBeCloseTo(10.42, 1);
  });
});
