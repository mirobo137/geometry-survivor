import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { PlayerModel } from '../PlayerModel';
import { CombatWeaponSystem } from './CombatWeaponSystem';
import { getLaboratoryCombatBonuses } from '../../content/meta/LaboratoryDefinitions';

describe('CombatWeaponSystem', () => {
  it('keeps the other weapon cooldowns unchanged when applying an evolution', () => {
    const enemies = new EnemySystem(new EnemyPool(1), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapons = new CombatWeaponSystem(enemies, () => undefined);
    const baseIntervals = {
      projectile: weapons.currentProjectileCooldown,
      orbit: weapons.currentOrbitHitCooldown,
      chain: weapons.currentChainCooldown,
      boomerang: weapons.currentBoomerangCooldown,
      pulseRing: weapons.currentPulseRingCooldown,
      magnetic: weapons.currentMagneticChargeCooldown
    };

    expect(weapons.applyProjectileEvolution('pulse_volley')).toBe(true);
    expect(weapons.applyOrbitEvolution('graviton_halo')).toBe(true);
    expect(weapons.applyChainEvolution('closed_circuit')).toBe(true);
    expect(weapons.applyBoomerangEvolution('twin_comet')).toBe(true);
    expect(weapons.applyPulseRingEvolution('compression_wave')).toBe(true);
    expect(weapons.applyMagneticChargeEvolution('event_horizon')).toBe(true);

    expect(weapons.currentProjectileCooldown).toBe(baseIntervals.projectile);
    expect(weapons.currentOrbitHitCooldown).toBe(baseIntervals.orbit);
    expect(weapons.currentChainCooldown).toBe(baseIntervals.chain);
    expect(weapons.currentBoomerangCooldown).toBe(baseIntervals.boomerang);
    expect(weapons.currentPulseRingCooldown).toBe(baseIntervals.pulseRing);
    expect(weapons.currentMagneticChargeCooldown).toBe(baseIntervals.magnetic);

    const polarWeapons = new CombatWeaponSystem(enemies, () => undefined);
    const baseMagneticInterval = polarWeapons.currentMagneticChargeCooldown;
    expect(polarWeapons.applyMagneticChargeEvolution('polar_collapse')).toBe(true);
    expect(polarWeapons.currentMagneticChargeCooldown).toBe(baseMagneticInterval);
  });

  it('trades a 10% longer Rail Lance interval for heavier hits', () => {
    const createWeapons = () => {
      const enemies = new EnemySystem(new EnemyPool(1), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
      const target = enemies.pool.acquire();
      if (!target) throw new Error('No se pudo preparar el objetivo');
      target.kind = 'chaser';
      target.x = 1_100;
      target.y = 360;
      target.radius = 12;
      target.health = 1_000;
      target.maxHealth = 1_000;
      target.speed = 0;
      target.contactDamage = 0;
      target.contactEnabled = false;
      enemies.rebuildGrid();
      return new CombatWeaponSystem(enemies, () => undefined);
    };
    const base = createWeapons();
    const railLance = createWeapons();
    const player = new PlayerModel();
    expect(railLance.applyProjectileEvolution('rail_lance')).toBe(true);
    const options = {
      projectileEnabled: true,
      orbitEnabled: false,
      chainEnabled: false,
      boomerangEnabled: false,
      pulseRingEnabled: false
    };

    for (let index = 0; index < 60; index += 1) {
      base.update(0.01, player.state, options);
      railLance.update(0.01, player.state, options);
    }
    expect(base.totalShotsFired).toBe(1); // base interval is 0.55s
    expect(railLance.totalShotsFired).toBe(0); // Rail Lance interval is 0.605s
    railLance.update(0.01, player.state, options);
    expect(railLance.totalShotsFired).toBe(1);
  });

  it('keeps Comet Quintet firing at its effective interval while previous fans return', () => {
    const enemies = new EnemySystem(new EnemyPool(1), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapons = new CombatWeaponSystem(
      enemies,
      () => undefined,
      getLaboratoryCombatBonuses({ weapon_cadence: 10 })
    );
    const player = new PlayerModel();
    expect(weapons.unlockVectorBoomerang()).toBe(true);
    for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(weapons.setWeaponRank('boomerang', rank)).toBe(true);
    expect(weapons.applyBoomerangEvolution('twin_comet')).toBe(true);
    for (let mastery = 0; mastery < 3; mastery += 1) expect(weapons.applyWeaponMastery('boomerang', 'tempo')).toBe(true);
    expect(weapons.currentBoomerangCooldown).toBeCloseTo(0.53);

    let casts = 0;
    for (let step = 0; step < 600; step += 1) {
      weapons.update(1 / 60, player.state, {
        projectileEnabled: false,
        orbitEnabled: false,
        chainEnabled: false,
        boomerangEnabled: true,
        pulseRingEnabled: false
      });
      casts += weapons.boomerangStates.filter((state) => (
        state.active && state.evolution === 'twin_comet' && state.fanOffset === 0 && state.ageSeconds === 0
      )).length;
    }

    expect(casts).toBe(18);
  });

  it('uses Magnetic Charge evolution cooldowns unless a drill explicitly overrides them', () => {
    const enemies = new EnemySystem(new EnemyPool(1), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapons = new CombatWeaponSystem(enemies, () => undefined);
    const player = new PlayerModel();
    weapons.unlockMagneticCharge();
    expect(weapons.applyMagneticChargeEvolution('event_horizon')).toBe(true);
    expect(weapons.currentMagneticChargeCooldown).toBeCloseTo(5.2);

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
    // Event Horizon: travel .42 + 2-second hold + recovery .36, then the
    // authored 5.2-second cooldown. It intentionally has no collapse.
    expect(casts[1] - casts[0]).toBeCloseTo(7.98, 1);
  });
});
