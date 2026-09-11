import { describe, expect, it } from 'vitest';
import { BoomerangPool, EnemyPool } from './EntityPools';
import { BoomerangBehavior } from './BoomerangBehavior';
import { EnemySystem } from '../enemies/EnemySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import type { PlayerState } from '../PlayerModel';

const basePlayer: PlayerState = {
  x: 640,
  y: 360,
  radius: 22,
  health: 100,
  maxHealth: 100,
  armor: 0
};

const setup = () => {
  const player: PlayerState = { ...basePlayer };
  const enemyPool = new EnemyPool(8);
  const enemies = new EnemySystem(enemyPool, new SpatialGrid(1280, 720));
  const enemy = enemies.spawn(0, 270);
  if (!enemy) throw new Error('No se pudo preparar el enemigo del búmeran');
  enemy.x = player.x + 150;
  enemy.y = player.y;
  enemy.speed = 0;
  enemy.radius = 12;
  enemy.maxHealth = 1_000;
  enemy.health = 1_000;
  enemy.contactDamage = 0;
  enemies.rebuildGrid();

  const boomerangs = new BoomerangPool(2);
  const defeated: number[] = [];
  const behavior = new BoomerangBehavior({
    enemies,
    boomerangs,
    rollCriticalDamage: (damage) => damage,
    onEnemyDefeated: (defeatedEnemy) => {
      defeated.push(defeatedEnemy.generation);
      enemies.pool.release(defeatedEnemy);
    }
  });
  behavior.unlock();
  return { enemies, enemy, boomerangs, behavior, defeated, player };
};

describe('BoomerangBehavior', () => {
  it('hits once on outbound and once on return, then captures the moving player', () => {
    const { enemy, boomerangs, behavior, player } = setup();

    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(1);
    for (let index = 0; index < 42; index += 1) behavior.update(1 / 60, player);

    const outbound = boomerangs.states[0];
    expect(outbound.active).toBe(true);
    expect(outbound.phase).toBe('returning');
    expect(enemy.health).toBe(987);

    player.x += 60;
    for (let index = 0; index < 40; index += 1) behavior.update(1 / 60, player);

    expect(enemy.health).toBe(974);
    expect(boomerangs.activeCount).toBe(0);
  });

  it('does not fire without a target and reset clears active motion', () => {
    const { enemies, enemy, boomerangs, behavior, player } = setup();
    enemy.health = 0;
    enemies.rebuildGrid();
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(0);

    enemies.pool.reset();
    enemies.rebuildGrid();

    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(0);

    behavior.fire(player);
    behavior.update(0.1, player);
    behavior.reset();
    expect(boomerangs.activeCount).toBe(0);
    expect(boomerangs.states.every((state) => !state.active && state.ageSeconds === 0)).toBe(true);
  });

  it('distinguishes a recycled enemy slot on the return and captures a dead player safely', () => {
    const player: PlayerState = { ...basePlayer };
    const enemyPool = new EnemyPool(1);
    const enemies = new EnemySystem(enemyPool, new SpatialGrid(1280, 720));
    const enemy = enemies.spawn(0, 270);
    if (!enemy) throw new Error('No se pudo preparar el enemigo reciclable');
    enemy.x = player.x + 150;
    enemy.y = player.y;
    enemy.speed = 0;
    enemy.radius = 12;
    enemy.maxHealth = 1_000;
    enemy.health = 1_000;
    enemies.rebuildGrid();

    const boomerangs = new BoomerangPool(1);
    const behavior = new BoomerangBehavior({
      enemies,
      boomerangs,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: (defeatedEnemy) => enemies.pool.release(defeatedEnemy)
    });
    behavior.unlock();
    behavior.fire(player);
    for (let index = 0; index < 42; index += 1) behavior.update(1 / 60, player);
    expect(enemy.health).toBe(987);

    const previousGeneration = enemy.generation;
    enemies.pool.release(enemy);
    const recycled = enemies.pool.acquire();
    if (!recycled) throw new Error('No se pudo reciclar el slot enemigo');
    recycled.x = player.x + 150;
    recycled.y = player.y;
    recycled.radius = 12;
    recycled.health = 1_000;
    enemies.rebuildGrid();

    player.health = 0;
    for (let index = 0; index < 40; index += 1) behavior.update(1 / 60, player);
    expect(recycled.generation).not.toBe(previousGeneration);
    expect(recycled.health).toBe(987);
    expect(boomerangs.activeCount).toBe(0);
  });

  it('respects the pool cap and releases a cast when its TTL expires', () => {
    const { boomerangs, behavior, player } = setup();
    behavior.fire(player);
    behavior.fire(player);
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(2);

    boomerangs.states[0].lifetimeSeconds = 0.01;
    behavior.update(0.1, player);
    expect(boomerangs.states[0].active).toBe(false);
    expect(boomerangs.activeCount).toBe(1);
    behavior.reset();
    expect(boomerangs.activeCount).toBe(0);
  });
});
