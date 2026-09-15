import { describe, expect, it } from 'vitest';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { ChainBehavior } from './ChainBehavior';
import type { PlayerState } from '../PlayerModel';

const player: PlayerState = { x: 640, y: 360, radius: 22, health: 100, maxHealth: 100, armor: 0 };

const setup = (count: number) => {
  const enemies = new EnemySystem(new EnemyPool(10), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
  for (let index = 0; index < count; index += 1) {
    const enemy = enemies.pool.acquire();
    if (!enemy) throw new Error('No se pudo preparar el objetivo de cadena');
    enemy.kind = 'chaser';
    enemy.x = player.x + 100 + index * 30;
    enemy.y = player.y;
    enemy.radius = 12;
    enemy.health = 1_000;
    enemy.maxHealth = 1_000;
    enemy.speed = 0;
    enemy.contactDamage = 0;
    enemy.contactEnabled = false;
  }
  enemies.rebuildGrid();
  const behavior = new ChainBehavior({
    enemies,
    rollCriticalDamage: (damage) => damage,
    onEnemyDefeated: () => undefined
  });
  behavior.unlock();
  behavior.setArenaBoundary(270);
  return { behavior, enemies };
};

describe('ChainBehavior evolutions', () => {
  it('Closed Circuit extends the chain and returns from a loaded arena edge', () => {
    const { behavior, enemies } = setup(5);
    expect(behavior.setEvolution('closed_circuit')).toBe(true);
    const before = enemies.pool.states[0].health;
    behavior.fire(player);

    expect(behavior.segments.filter((segment) => segment.active)).toHaveLength(6);
    expect(behavior.segments[5].x1).toBeGreaterThan(0);
    expect(behavior.segments[5].x2).toBeGreaterThan(0);
    expect(enemies.pool.states[0].health).toBeLessThan(before);
  });

  it('Thunderhead trades one jump for delayed bounded explosions', () => {
    const { behavior, enemies } = setup(3);
    expect(behavior.setEvolution('thunderhead')).toBe(true);
    const linkHealthBefore = enemies.pool.states[2].health;
    behavior.fire(player);
    expect(behavior.segments.filter((segment) => segment.active)).toHaveLength(3);
    expect(behavior.explosions.filter((explosion) => explosion.active)).toHaveLength(2);

    const healthBefore = enemies.pool.states[2].health;
    expect(healthBefore).toBeLessThan(linkHealthBefore);
    behavior.updateSegments(0.2);
    expect(behavior.explosions.some((explosion) => explosion.phase === 'active')).toBe(true);
    expect(enemies.pool.states[2].health).toBeLessThan(healthBefore);
  });
});
