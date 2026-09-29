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

const setup = (boomerangCapacity = 2) => {
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

  const boomerangs = new BoomerangPool(boomerangCapacity);
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

  it('uses its retained direction without a target and reset clears active motion', () => {
    const { enemies, enemy, boomerangs, behavior, player } = setup();
    enemy.health = 0;
    enemies.rebuildGrid();
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(1);
    behavior.reset();

    enemies.pool.reset();
    enemies.rebuildGrid();

    behavior.unlock();
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(1);
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

  it('Comet Quintet sweeps with five short blades and damages each target once per phase', () => {
    const { boomerangs, behavior, enemies, enemy, player } = setup(8);
    expect(behavior.setEvolution('twin_comet')).toBe(true);
    behavior.fire(player);

    expect(boomerangs.activeCount).toBe(5);
    expect(boomerangs.states.slice(0, 5).map((state) => state.fanOffset)).toEqual([-2, -1, 0, 1, 2]);
    expect(boomerangs.states.slice(0, 5).every((state) => state.travelLimit < behavior.currentOutboundDistance)).toBe(true);
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(5);

    const left = enemies.spawn(0, 270);
    const right = enemies.spawn(0, 270);
    if (!left || !right) throw new Error('No se pudo preparar el abanico de enemigos');
    for (const [target, fanIndex] of [[left, 0], [right, 4]] as const) {
      const blade = boomerangs.states[fanIndex];
      target.x = blade.curveEndX;
      target.y = blade.curveEndY;
      target.speed = 0;
      target.health = 1_000;
      target.maxHealth = 1_000;
      target.radius = 12;
    }
    enemies.rebuildGrid();
    for (let index = 0; index < 100; index += 1) behavior.update(1 / 60, player);

    expect(enemy.health).toBeCloseTo(1_000 - 13 * 1.1 * 2, 4);
    expect(left.health).toBeLessThan(1_000);
    expect(right.health).toBeLessThan(1_000);
    expect(boomerangs.activeCount).toBe(0);
  });

  it('Singularity Return targets a dense remote group, damages the whole blast and slows survivors', () => {
    const { behavior, enemies, enemy, boomerangs, player } = setup();
    expect(behavior.setEvolution('singularity_return')).toBe(true);
    const group = [enemies.spawn(0, 270), enemies.spawn(0, 270), enemies.spawn(0, 270)];
    if (group.some((target) => !target)) throw new Error('No se pudo preparar el grupo remoto');
    for (const [index, target] of group.entries()) {
      target!.x = player.x - 180 + index * 12;
      target!.y = player.y + (index - 1) * 20;
      target!.speed = 0;
      target!.health = 1_000;
      target!.maxHealth = 1_000;
      target!.radius = 12;
    }
    const positions = group.map((target) => [target!.x, target!.y]);
    enemies.rebuildGrid();
    behavior.fire(player);
    expect(behavior.pulseState.active).toBe(false);
    expect(boomerangs.states[0].directionX).toBeLessThan(0);
    expect(boomerangs.states[0].travelLimit).toBeLessThan(behavior.currentOutboundDistance);

    for (let index = 0; index < 100; index += 1) {
      behavior.update(1 / 60, player);
      if (behavior.pulseState.sequence === 1) {
        expect(behavior.pulseState.active).toBe(true);
        expect(behavior.pulseState.x).toBeLessThan(player.x);
        expect(behavior.pulseState.radius).toBe(155);
        expect(enemy.health).toBe(1_000);
        for (const [groupIndex, target] of group.entries()) {
          expect(target!.health).toBeLessThan(1_000);
          expect(target!.slowSeconds).toBe(1.5);
          expect(target!.slowMultiplier).toBe(0.45);
          expect([target!.x, target!.y]).toEqual(positions[groupIndex]);
        }
        return;
      }
    }
    throw new Error('Singularity Return no detonó sobre el grupo remoto');
  });

  it('Singularity Return damages bosses without applying movement control', () => {
    const { behavior, enemy, player } = setup();
    enemy.kind = 'boss';
    expect(behavior.setEvolution('singularity_return')).toBe(true);
    behavior.fire(player);
    for (let index = 0; index < 50 && behavior.pulseState.sequence === 0; index += 1) {
      behavior.update(1 / 60, player);
    }
    expect(behavior.pulseState.sequence).toBe(1);
    expect(enemy.health).toBeLessThan(1_000);
    expect(enemy.slowSeconds).toBe(0);
    expect(enemy.stunSeconds).toBe(0);
  });

  it('Singularity Return uses the same physical blast edge for damage and control', () => {
    const { behavior, enemies, boomerangs, player } = setup();
    expect(behavior.setEvolution('singularity_return')).toBe(true);
    behavior.fire(player);
    const endpoint = boomerangs.states[0].curveEndX;
    const inside = enemies.spawn(0, 270);
    const outside = enemies.spawn(0, 270);
    if (!inside || !outside) throw new Error('No se pudieron preparar los blancos del borde');
    for (const [target, margin] of [[inside, -0.5], [outside, 0.5]] as const) {
      target.x = endpoint + 155 + 12 + margin;
      target.y = player.y;
      target.radius = 12;
      target.speed = 0;
      target.health = 1_000;
      target.maxHealth = 1_000;
    }
    enemies.rebuildGrid();
    for (let index = 0; index < 60 && behavior.pulseState.sequence === 0; index += 1) {
      behavior.update(1 / 60, player);
    }
    expect(behavior.pulseState.sequence).toBe(1);
    expect(inside.health).toBeLessThan(1_000);
    expect(inside.slowSeconds).toBeGreaterThan(0);
    expect(outside.health).toBe(1_000);
    expect(outside.slowSeconds).toBe(0);
  });
});
