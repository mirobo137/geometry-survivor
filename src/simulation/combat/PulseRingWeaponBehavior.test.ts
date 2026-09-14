import { describe, expect, it } from 'vitest';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { PlayerModel } from '../PlayerModel';
import { PulseRingWeaponBehavior } from './PulseRingWeaponBehavior';

describe('PulseRingWeaponBehavior', () => {
  it('captures its origin, sweeps the annulus and pushes each target once', () => {
    const pool = new EnemyPool(8);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const enemy = pool.acquire();
    if (!enemy) throw new Error('No se pudo preparar el objetivo del anillo');
    enemy.kind = 'chaser';
    enemy.x = player.state.x + 120;
    enemy.y = player.state.y;
    enemy.radius = 18;
    enemy.health = 100;
    enemy.maxHealth = 100;
    enemy.contactEnabled = false;
    enemy.speed = 0;
    enemies.rebuildGrid();

    const weapon = new PulseRingWeaponBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: () => undefined
    });
    expect(weapon.unlock()).toBe(true);
    expect(weapon.fire(player.state)).toBe(true);
    player.state.x += 80;

    for (let index = 0; index < 7; index += 1) weapon.update(0.1);
    expect(weapon.state.phase).toBe('active');
    expect(weapon.state.originX).not.toBe(player.state.x);
    const startX = enemy.x;
    for (let index = 0; index < 5; index += 1) weapon.update(0.1);
    expect(enemy.health).toBeLessThan(100);
    expect(enemy.x - startX).toBeCloseTo(10, 5);

    const healthAfterHit = enemy.health;
    weapon.update(0.1);
    expect(enemy.health).toBe(healthAfterHit);
  });

  it('keeps the player weapon independent from the enemy hazard lifecycle', () => {
    const pool = new EnemyPool(2);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const weapon = new PulseRingWeaponBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: () => undefined
    });

    expect(weapon.state.phase).toBe('idle');
    expect(weapon.state.active).toBe(false);
    expect(weapon.fire(new PlayerModel().state)).toBe(false);
    expect(weapon.unlock()).toBe(true);
    weapon.reset();
    expect(weapon.isUnlocked).toBe(false);
    expect(weapon.state).toMatchObject({ phase: 'idle', active: false, radius: 0, sequence: 0 });
  });
});
