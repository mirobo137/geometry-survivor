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

  it('Event Horizon widens the field while preserving one remote cast', () => {
    const pool = new EnemyPool(1);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new MagneticChargeBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    expect(weapon.setEvolution('event_horizon')).toBe(true);
    advance(weapon, player, 1 / 60);
    expect(weapon.state.pullRadius).toBe(230);
    expect(weapon.state.outerRadius).toBe(170);
    expect(weapon.currentCooldown).toBeCloseTo(6.24);
  });

  it('Polar Collapse exposes a second partial detonation phase', () => {
    const pool = new EnemyPool(1);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new MagneticChargeBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    weapon.setEvolution('polar_collapse');
    advance(weapon, player, 2.3);
    expect(weapon.state.phase).toBe('collapse');
    expect(weapon.state.evolution).toBe('polar_collapse');
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
