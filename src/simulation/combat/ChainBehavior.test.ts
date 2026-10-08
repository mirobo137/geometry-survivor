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
  it('Closed Circuit adds two targets and retains all three persistent cables', () => {
    const { behavior, enemies } = setup(5);
    expect(behavior.setEvolution('closed_circuit')).toBe(true);
    const before = enemies.pool.states[0].health;
    behavior.fire(player);

    expect(behavior.currentMaxTargets).toBe(5);
    expect(behavior.segments.filter((segment) => segment.active)).toHaveLength(8);
    expect(behavior.segments.filter(segment => segment.active && segment.persistent)).toHaveLength(3);
    expect(behavior.segments[5].x1).toBeGreaterThan(0);
    expect(behavior.segments[5].x2).toBeGreaterThan(0);
    expect(enemies.pool.states[0].health).toBeLessThan(before);
  });

  it('keeps Closed Circuit anchors at their impact positions when callbacks recycle killed slots', () => {
    const enemyPool = new EnemyPool(3);
    const enemies = new EnemySystem(enemyPool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const originalPositions = [790, 820, 850];
    for (const x of originalPositions) {
      const enemy = enemyPool.acquire();
      if (!enemy) throw new Error('No se pudo preparar el objetivo reciclable');
      Object.assign(enemy, { kind: 'chaser', x, y: 360, radius: 12, health: 1, maxHealth: 1, speed: 0 });
    }
    enemies.rebuildGrid();
    let recycledCount = 0;
    const behavior = new ChainBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: (defeated) => {
        enemyPool.release(defeated);
        const recycled = enemyPool.acquire();
        if (!recycled) throw new Error('No se pudo reciclar el slot derrotado');
        Object.assign(recycled, {
          x: 1_100 + recycledCount * 20, y: 650, radius: 12,
          health: 1_000, maxHealth: 1_000, speed: 0
        });
        recycledCount += 1;
        enemies.rebuildGrid();
      }
    });
    behavior.unlock();
    behavior.setEvolution('closed_circuit');
    behavior.fire(player);

    const cables = behavior.segments.filter((segment) => segment.active && segment.persistent);
    expect(cables).toHaveLength(3);
    expect(cables.map(({ x1, x2 }) => [x1, x2])).toEqual([
      [790, 820], [820, 850], [850, 790]
    ]);
    expect(cables.every(({ x1, x2, y1, y2 }) => Math.hypot(x2 - x1, y2 - y1) > 0)).toBe(true);
  });

  it('Thunderhead retains every base target with only two delayed explosions', () => {
    const { behavior, enemies } = setup(3);
    expect(behavior.setEvolution('thunderhead')).toBe(true);
    const linkHealthBefore = enemies.pool.states[2].health;
    behavior.fire(player);
    expect(behavior.segments.filter((segment) => segment.active)).toHaveLength(3);
    expect(behavior.explosions.filter((explosion) => explosion.active)).toHaveLength(2);

    const healthBefore = enemies.pool.states[2].health;
    expect(healthBefore).toBeLessThan(linkHealthBefore);
    expect(linkHealthBefore - healthBefore).toBeCloseTo(behavior.currentDamage * 1.25);
    behavior.updateSegments(0.2);
    expect(behavior.explosions.some((explosion) => explosion.phase === 'active')).toBe(true);
    expect(enemies.pool.states[2].health).toBeLessThan(healthBefore);
  });

  it('Thunderhead applies both explosion impacts when a target lies in their overlap', () => {
    const { behavior, enemies } = setup(3);
    behavior.setEvolution('thunderhead');
    behavior.fire(player);
    const target = enemies.pool.states[2];
    const healthBeforeExplosions = target.health;

    behavior.updateSegments(0.2);

    expect(healthBeforeExplosions - target.health).toBeCloseTo(behavior.currentDamage * 1.25 * 2);
  });

  it.each(['closed_circuit', 'thunderhead'] as const)('%s retains rank VII targets and grows through coverage without clipping the circuit', evolution => {
    const { behavior, enemies } = setup(10);
    for (const rank of [2, 3, 4, 5, 6, 7] as const) expect(behavior.setRank(rank)).toBe(true);
    expect(behavior.currentMaxTargets).toBe(5);
    behavior.setEvolution(evolution);
    const evolvedTargets = evolution === 'closed_circuit' ? 7 : 5;
    expect(behavior.currentMaxTargets).toBe(evolvedTargets);
    for (let mastery = 1; mastery <= 3; mastery++) {
      behavior.increaseMaxTargets(1);
      expect(behavior.currentMaxTargets).toBe(evolvedTargets + mastery);
    }
    behavior.fire(player);
    expect(enemies.pool.states.filter(enemy => enemy.health < 1000)).toHaveLength(evolvedTargets + 3);
    expect(behavior.segments.filter(segment => segment.active && !segment.persistent)).toHaveLength(evolvedTargets + 3);
    expect(behavior.segments.filter(segment => segment.active && segment.persistent)).toHaveLength(evolution === 'closed_circuit' ? 3 : 0);
    expect(behavior.explosions.filter(explosion => explosion.active)).toHaveLength(evolution === 'thunderhead' ? 2 : 0);
    behavior.clearTransient();
    expect(behavior.currentMaxTargets).toBe(evolvedTargets + 3);
    behavior.setPermanentDamageMultiplier(1.2);
    expect(behavior.currentMaxTargets).toBe(evolvedTargets + 3);
    behavior.increaseMaxTargets(1000);
    expect(behavior.currentMaxTargets).toBe(10);
    expect(() => behavior.fire(player)).not.toThrow();
    behavior.reset();
    expect(behavior.currentMaxTargets).toBe(3);
  });

  it.each([30, 60, 144])('Closed Circuit impacts and cable ticks deal increased damage once per target at %i Hz', hz => {
    const { behavior, enemies } = setup(5);
    behavior.setEvolution('closed_circuit');
    behavior.fire(player);
    const beforeTicks = enemies.pool.states[1].health;
    expect(beforeTicks).toBeCloseTo(1000 - behavior.currentDamage * 1.25);
    // This target touches both adjacent cables and the closing cable: still one hit.
    for (let i = 0; i < Math.ceil(hz * 0.85); i++) behavior.updateSegments(1 / hz);
    expect(enemies.pool.states[1].health).toBeCloseTo(beforeTicks - behavior.currentDamage * 0.2 * 4);
    behavior.updateSegments(1);
    expect(behavior.segments.every(segment => !segment.active)).toBe(true);
  });
});
