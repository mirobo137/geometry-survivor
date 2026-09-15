import { describe, expect, it } from 'vitest';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { OrbitBehavior } from './OrbitBehavior';
import type { PlayerState } from '../PlayerModel';

const player: PlayerState = { x: 640, y: 360, radius: 22, health: 100, maxHealth: 100, armor: 0 };

const createBehavior = () => {
  const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
  const target = enemies.pool.acquire();
  if (!target) throw new Error('No se pudo preparar el objetivo de orbit');
  target.kind = 'chaser';
  target.x = player.x + 100;
  target.y = player.y;
  target.radius = 12;
  target.health = 1_000;
  target.maxHealth = 1_000;
  target.speed = 0;
  target.contactDamage = 0;
  target.contactEnabled = false;
  enemies.rebuildGrid();
  const behavior = new OrbitBehavior({
    enemies,
    rollCriticalDamage: (damage) => damage,
    onEnemyDefeated: () => undefined
  });
  behavior.addBlade();
  return { behavior, target };
};

describe('OrbitBehavior evolutions', () => {
  it('Solar Crown changes radius, damage and rotation without adding blades', () => {
    const { behavior } = createBehavior();
    expect(behavior.setEvolution('solar_crown')).toBe(true);
    expect(behavior.currentRadius).toBeCloseTo(69.6);
    expect(behavior.currentDamage).toBeCloseTo(24.3);
    behavior.update(1, player);
    expect(behavior.blades).toHaveLength(6);
    expect(behavior.blades[0].angle).toBeCloseTo(2.43);
  });

  it('Graviton Halo emits a bounded pulse and excludes bosses from its force', () => {
    const { behavior, target } = createBehavior();
    expect(behavior.setEvolution('graviton_halo')).toBe(true);
    const before = target.health;
    behavior.update(3, player);
    expect(behavior.pulseState.sequence).toBe(1);
    expect(target.health).toBeLessThan(before);
    expect(behavior.setEvolution('solar_crown')).toBe(false);
  });
});
