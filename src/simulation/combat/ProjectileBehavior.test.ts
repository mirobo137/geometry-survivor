import { describe, expect, it } from 'vitest';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { EnemyPool, ProjectilePool } from './EntityPools';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { ProjectileBehavior } from './ProjectileBehavior';
import type { PlayerState } from '../PlayerModel';

const player: PlayerState = {
  x: 640,
  y: 360,
  radius: 22,
  health: 100,
  maxHealth: 100,
  armor: 0
};

const setup = () => {
  const enemies = new EnemySystem(new EnemyPool(8), new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
  const targets = [100, 150, 200, 250, 300].map((offset) => {
    const enemy = enemies.pool.acquire();
    if (!enemy) throw new Error('No se pudo preparar el objetivo');
    enemy.kind = 'chaser';
    enemy.x = player.x + offset;
    enemy.y = player.y;
    enemy.radius = 12;
    enemy.health = 1_000;
    enemy.maxHealth = 1_000;
    enemy.speed = 0;
    enemy.contactDamage = 0;
    enemy.contactEnabled = false;
    return enemy;
  });
  enemies.rebuildGrid();
  const projectiles = new ProjectilePool(8);
  let evolution: 'rail_lance' | 'pulse_volley' | null = null;
  const behavior = new ProjectileBehavior({
    enemies,
    projectiles,
    isTwinEmitterEnabled: () => false,
    getProjectileDamage: () => 14,
    getProjectileSpeed: () => 460,
    getProjectileEvolution: () => evolution,
    rollCriticalDamage: (damage) => damage,
    onEnemyDefeated: () => undefined
  });
  return { behavior, enemies, projectiles, targets, setEvolution: (value: typeof evolution) => { evolution = value; } };
};

describe('ProjectileBehavior evolutions', () => {
  it('Rail Lance pierces targets with decreasing bounded damage', () => {
    const { behavior, enemies, projectiles, targets, setEvolution } = setup();
    setEvolution('rail_lance');
    // Align the targets with the real muzzle-to-target ray. Rail Lance keeps
    // its authored direction after each pierce; it does not retarget between
    // enemies, so this validates the intended through-line collision.
    for (let index = 1; index < targets.length; index += 1) {
      targets[index].y = 360 + index * 15.17;
    }
    enemies.rebuildGrid();

    behavior.fire(player);
    expect(projectiles.activeCount).toBe(1);
    const startX = projectiles.states[0].x;
    for (let index = 0; index < 60; index += 1) behavior.update(1 / 60);

    expect(projectiles.states[0].x).toBeGreaterThan(startX);
    expect(targets[0].health).toBeCloseTo(979, 4);
    expect(targets[1].health).toBeCloseTo(981.1, 4);
    expect(targets[2].health).toBeCloseTo(983.2, 4);
    expect(targets[3].health).toBeCloseTo(985.3, 4);
    expect(targets[4].health).toBeCloseTo(985.3, 4);
    for (let index = 0; index < 120; index += 1) behavior.update(1 / 60);
    expect(projectiles.activeCount).toBe(0);
  });

  it('Pulse Volley creates a narrow three-shot fan from one muzzle', () => {
    const { behavior, projectiles, targets, setEvolution } = setup();
    setEvolution('pulse_volley');

    behavior.fire(player);
    expect(projectiles.activeCount).toBe(3);
    expect(new Set(projectiles.states.slice(0, 3).map((state) => state.vy)).size).toBe(3);
    expect(projectiles.states.slice(0, 3).every((state) => state.evolution === 'pulse_volley')).toBe(true);
    expect(projectiles.states.slice(0, 3).map((state) => state.damage)).toEqual([17.5, 17.5, 17.5]);
    const before = targets[0].health;
    for (let index = 0; index < 30; index += 1) behavior.update(1 / 60);
    expect(targets[0].health).toBeLessThan(before);
  });
});
