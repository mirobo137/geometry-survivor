import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { PlayerModel } from '../PlayerModel';
import { MagneticChargeBehavior } from './MagneticChargeBehavior';

const advance = (
  weapon: MagneticChargeBehavior,
  player: PlayerModel,
  seconds: number,
  arena = ARENA_RADIUS,
  cooldownSeconds = WEAPON_DEFINITIONS.magneticCharge.cooldownSeconds
): void => {
  const steps = Math.ceil(seconds * 60);
  for (let index = 0; index < steps; index += 1) {
    weapon.update(1 / 60, player.state, arena, cooldownSeconds);
  }
};

describe('MagneticChargeBehavior', () => {
  it('launches to a deterministic remote point and keeps one cast active', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new MagneticChargeBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: () => undefined
    });

    expect(weapon.unlock()).toBe(true);
    advance(weapon, player, 1 / 60);
    const distance = Math.hypot(weapon.state.targetX - player.state.x, weapon.state.targetY - player.state.y);

    expect(weapon.state.phase).toBe('travel');
    expect(distance).toBeGreaterThan(120);
    expect(weapon.fire(player.state, ARENA_RADIUS)).toBe(false);
  });

  it('pulls regular enemies, leaves the boss unpulled, then damages only the annular band', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const defeated: unknown[] = [];
    const weapon = new MagneticChargeBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: (enemy) => defeated.push(enemy)
    });

    weapon.unlock();
    advance(weapon, player, 1 / 60);
    const targetX = weapon.state.targetX;
    const targetY = weapon.state.targetY;
    advance(weapon, player, 0.5);
    expect(weapon.state.phase).toBe('attract');

    const pullTarget = createTarget(pool, targetX + 120, targetY, 'chaser');
    const boss = createTarget(pool, targetX + 120, targetY + 30, 'boss');
    const bossBefore = { x: boss.x, y: boss.y };
    enemies.rebuildGrid();
    advance(weapon, player, 0.2);
    expect(Math.hypot(pullTarget.x - targetX, pullTarget.y - targetY)).toBeLessThan(120);
    expect(boss.x).toBe(bossBefore.x);
    expect(boss.y).toBe(bossBefore.y);

    advance(weapon, player, 1);
    expect(weapon.state.phase).toBe('detonate');
    const band = createTarget(pool, targetX + (WEAPON_DEFINITIONS.magneticCharge.innerRadius + 20), targetY, 'chaser');
    const center = createTarget(pool, targetX, targetY, 'chaser');
    enemies.rebuildGrid();
    const bandBefore = band.health;
    const centerBefore = center.health;
    advance(weapon, player, 1 / 60);

    expect(band.health).toBeLessThan(bandBefore);
    expect(center.health).toBe(centerBefore);
    expect(defeated).toHaveLength(0);
  });

  it('completes recovery and returns to idle before the next seeded cast', () => {
    const pool = new EnemyPool(1);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new MagneticChargeBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: () => undefined
    });

    weapon.unlock();
    advance(weapon, player, 3.2);
    expect(weapon.state.active).toBe(false);
    expect(weapon.state.phase).toBe('idle');
    expect(weapon.state.sequence).toBe(1);

    advance(weapon, player, 1.8, ARENA_RADIUS, 1.8);
    expect(weapon.state.sequence).toBe(2);
    expect(weapon.state.phase).toBe('travel');
  });

  it('clears its internal evolution when a run is reset', () => {
    const pool = new EnemyPool(1);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapon = new MagneticChargeBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    expect(weapon.setEvolution('event_horizon')).toBe(true);
    weapon.reset();
    expect(weapon.currentEvolution).toBeNull();
    expect(weapon.unlock()).toBe(true);
    expect(weapon.setEvolution('polar_collapse')).toBe(true);
  });

  it('Event Horizon holds and damages its remote core, then slows survivors without an explosion', () => {
    const pool = new EnemyPool(2);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new MagneticChargeBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    expect(weapon.setEvolution('event_horizon')).toBe(true);
    advance(weapon, player, 1 / 60);
    const target = createTarget(pool, weapon.state.targetX, weapon.state.targetY, 'chaser');
    enemies.rebuildGrid();
    const before = target.health;
    advance(weapon, player, 1.8);
    expect(weapon.state.phase).toBe('attract');
    expect(weapon.state.pullRadius).toBe(210);
    expect(weapon.state.innerRadius).toBe(64);
    expect(weapon.state.outerRadius).toBe(110);
    expect(weapon.currentCooldown).toBeCloseTo(6.24);
    expect(target.health).toBeLessThan(before);
    // The 3.4s hold ends directly in recovery; it does not create the old
    // damaging collapse. Only enemies that the core actually damaged slow.
    advance(weapon, player, 2.1);
    expect(weapon.state.phase).toBe('recovery');
    expect(target.slowSeconds).toBeGreaterThan(2);
    expect(target.slowMultiplier).toBeCloseTo(0.38);
  });

  it('Polar Collapse pulls harder, stuns with its fronts, then critically punishes stunned survivors', () => {
    const pool = new EnemyPool(2);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const damages: { phase: string; damage: number }[] = [];
    let weapon: MagneticChargeBehavior;
    weapon = new MagneticChargeBehavior({
      enemies,
      rollCriticalDamage: (damage) => {
        damages.push({ phase: weapon.state.phase, damage });
        return damage;
      },
      onEnemyDefeated: () => undefined
    });
    weapon.unlock();
    expect(weapon.setEvolution('polar_collapse')).toBe(true);
    advance(weapon, player, 1 / 60);
    const target = createTarget(pool, weapon.state.targetX, weapon.state.targetY, 'chaser');
    enemies.rebuildGrid();
    const before = target.health;
    let sawCollapse = false;
    for (let index = 0; index < 180; index += 1) {
      weapon.update(1 / 60, player.state, ARENA_RADIUS);
      sawCollapse ||= weapon.state.phase === 'collapse';
    }
    expect(sawCollapse).toBe(true);
    expect(weapon.state.evolution).toBe('polar_collapse');
    expect(target.health).toBeLessThan(before);
    expect(Math.hypot(target.x - weapon.state.targetX, target.y - weapon.state.targetY)).toBeLessThan(76);
    expect(target.stunSeconds).toBeGreaterThan(0);
    const collapseHits = damages.filter((hit) => hit.phase === 'collapse');
    expect(collapseHits).toEqual([
      { phase: 'collapse', damage: WEAPON_DEFINITIONS.magneticCharge.damage * 1.4 }
    ]);
  });

  it('does not stun or amplify Polar Collapse against a boss', () => {
    const pool = new EnemyPool(2);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const damages: number[] = [];
    let weapon: MagneticChargeBehavior;
    weapon = new MagneticChargeBehavior({
      enemies,
      rollCriticalDamage: (damage) => {
        if (weapon.state.phase === 'collapse') damages.push(damage);
        return damage;
      },
      onEnemyDefeated: () => undefined
    });
    weapon.unlock();
    weapon.setEvolution('polar_collapse');
    advance(weapon, player, 1 / 60);
    const boss = createTarget(pool, weapon.state.targetX, weapon.state.targetY, 'boss');
    enemies.rebuildGrid();
    advance(weapon, player, 3);

    expect(boss.stunSeconds).toBe(0);
    expect(damages).toEqual([WEAPON_DEFINITIONS.magneticCharge.damage * 0.45]);
  });
});

const createTarget = (
  pool: EnemyPool,
  x: number,
  y: number,
  kind: 'chaser' | 'boss'
) => {
  const state = pool.acquire();
  if (!state) throw new Error('No se pudo preparar el objetivo de Magnetic Charge');
  state.kind = kind;
  state.x = x;
  state.y = y;
  state.radius = 18;
  state.maxHealth = 1_000;
  state.health = 1_000;
  state.speed = 0;
  state.contactDamage = 0;
  state.contactEnabled = false;
  return state;
};
