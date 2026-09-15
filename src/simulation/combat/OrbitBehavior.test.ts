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
  return { behavior, enemies, target };
};

describe('OrbitBehavior evolutions', () => {
  it('Solar Crown adds three blades and keeps all six at a fixed radius', () => {
    const { behavior, target } = createBehavior();
    expect(behavior.setEvolution('solar_crown')).toBe(true);
    expect(behavior.activeBladeCount).toBe(6);
    expect(behavior.currentRadius).toBeCloseTo(94);
    expect(behavior.currentDamage).toBeCloseTo(18);
    expect(behavior.blades).toHaveLength(6);
    const before = target.health;
    for (let index = 0; index < 80; index += 1) {
      behavior.update(0.05, player);
      expect(behavior.blades.every((blade) => blade.active)).toBe(true);
      for (const blade of behavior.blades) {
        expect(Math.hypot(blade.x - player.x, blade.y - player.y)).toBeCloseTo(94, 4);
      }
    }
    expect(target.health).toBeLessThan(before);
  });

  it('Graviton Halo stretches the orbit along its movement axis without a pulse', () => {
    const { behavior, enemies, target } = createBehavior();
    expect(behavior.setEvolution('graviton_halo')).toBe(true);
    const before = target.health;
    behavior.update(0.1, player);
    expect(behavior.pulseState.sequence).toBe(0);
    target.x = behavior.blades[0].x;
    target.y = behavior.blades[0].y;
    enemies.rebuildGrid();
    behavior.update(0.1, player);
    expect(target.health).toBeLessThan(before);
    expect(Math.hypot(behavior.blades[0].x - player.x, behavior.blades[0].y - player.y)).toBeGreaterThan(90);
    expect(behavior.setEvolution('solar_crown')).toBe(false);
  });
});
