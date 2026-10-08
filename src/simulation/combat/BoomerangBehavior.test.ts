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
    expect(behavior.fire(player)).toBe(true);

    expect(boomerangs.activeCount).toBe(5);
    expect(boomerangs.states.slice(0, 5).map((state) => state.fanOffset)).toEqual([-2, -1, 0, 1, 2]);
    expect(boomerangs.states.slice(0, 5).every((state) => state.travelLimit < behavior.currentOutboundDistance)).toBe(true);
    expect(behavior.fire(player)).toBe(false);
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

    expect(enemy.health).toBeCloseTo(1_000 - 13 * 1.25 * 2, 4);
    expect(left.health).toBeLessThan(1_000);
    expect(right.health).toBeLessThan(1_000);
    expect(boomerangs.activeCount).toBe(0);
  });

  it('keeps separate per-phase hit ledgers for bounded overlapping Comet casts', () => {
    const { behavior, boomerangs, enemy, player } = setup(18);
    behavior.setEvolution('twin_comet');
    expect(behavior.fire(player)).toBe(true);
    expect(behavior.fire(player)).toBe(true);
    expect(behavior.fire(player)).toBe(true);
    expect(behavior.fire(player)).toBe(false);
    expect(boomerangs.activeCount).toBe(15);
    expect(new Set(boomerangs.states.filter((state) => state.active).map((state) => state.twinCometLedgerSlot))).toEqual(
      new Set([0, 1, 2])
    );

    for (let index = 0; index < 120; index += 1) behavior.update(1 / 60, player);

    expect(enemy.health).toBeCloseTo(1_000 - 13 * 1.25 * 6, 4);
    expect(boomerangs.activeCount).toBe(0);
  });

  it.each([30, 60, 144])('Comet return tracks a moving player until capture at %i Hz', hz => {
    const { behavior, boomerangs, player } = setup(8);
    behavior.setEvolution('twin_comet');
    behavior.fire(player);
    const dt = 1 / hz;
    for (let index = 0; index < Math.ceil(1.5 * hz); index += 1) {
      player.x += 210 * dt;
      behavior.update(dt, player);
    }
    expect(boomerangs.activeCount).toBe(0);
  });

  it.each([30, 60, 144])('Comet Quintet relaunches within its rank VI interval at %i Hz', hz => {
    const { behavior, boomerangs, player } = setup(8);
    for (const rank of [2, 3, 4, 5, 6] as const) expect(behavior.setRank(rank)).toBe(true);
    behavior.setEvolution('twin_comet');
    behavior.fire(player);
    for (let index = 0; index < Math.ceil(1.1 * hz); index += 1) behavior.update(1 / hz, player);
    expect(boomerangs.activeCount).toBe(0);
    behavior.fire(player);
    expect(boomerangs.activeCount).toBe(5);
  });

  it('Singularity travels the trimmed extended range, splits into six nearest distinct homing shards, and never explodes', () => {
    const { behavior, enemies, enemy, boomerangs, player } = setup(8);
    behavior.setEvolution('singularity_return');
    expect(behavior.currentOutboundDistance).toBe(225);
    behavior.fire(player);
    const endpoint = player.x + 225;
    const targets = Array.from({ length: 6 }, () => enemies.spawn(0, 270));
    targets.forEach((target, i) => {
      if (!target) throw new Error('missing target');
      Object.assign(target, { x: endpoint + 90, y: player.y + (i - 2.5) * 55, health: 1000, radius: 12, speed: 0 });
    });
    // The carrier's first victim is behind the split, outside its search radius.
    enemy.x = player.x + 30;
    enemies.rebuildGrid();
    for (let i = 0; i < 100 && behavior.pulseState.sequence === 0; i++) behavior.update(1 / 60, player);
    expect(behavior.pulseState).toMatchObject({ active: true, x: endpoint, y: player.y, radius: 42 });
    const shards = boomerangs.states.filter(s => s.active);
    expect(shards).toHaveLength(6);
    expect(shards.every(s => s.fragment && s.phase === 'homing' && s.curveStartX === endpoint)).toBe(true);
    expect(new Set(shards.map(s => s.targetIndex)).size).toBe(6);
    expect(shards.map(s => s.fanOffset)).toEqual([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]);
    expect(shards.map(s => enemies.getState(s.targetIndex))).toEqual(expect.arrayContaining(targets));
    expect(shards.every(s => s.ageSeconds < 1 / 60)).toBe(true); // no newborn double tick
    expect(targets.every(t => t!.health === 1000 && t!.slowSeconds === 0)).toBe(true);
    expect(enemy.health).toBeCloseTo(1000 - 13 * 1.25);
    for (let i = 0; i < 100; i++) behavior.update(1 / 60, player);
    // Guidance prefers distinct targets, but a closer enemy can physically intercept a shard.
    expect(targets.reduce((damage, target) => damage + 1000 - target!.health, 0)).toBeCloseTo(13 * 1.25 * 6);
    expect(boomerangs.activeCount).toBe(0);
  });

  it.each([30, 60, 144])('all six guided shards can hit a lone boss without slow or stun at %i Hz', hz => {
    const { behavior, enemies, enemy, boomerangs, player } = setup(8);
    Object.assign(enemy, { kind: 'boss', x: player.x + 490, radius: 20 });
    enemies.rebuildGrid();
    behavior.setEvolution('singularity_return');
    behavior.fire(player);
    for (let i = 0; i < hz * 3; i++) behavior.update(1 / hz, player);
    expect(behavior.pulseState.sequence).toBe(1);
    expect(enemy.health).toBeCloseTo(1000 - 13 * 1.25 * 6);
    expect(enemy.slowSeconds).toBe(0);
    expect(enemy.stunSeconds).toBe(0);
    expect(boomerangs.activeCount).toBe(0);
  });

  it('reserves the entire fork capacity and releases empty homing shards by TTL', () => {
    const { behavior, enemies, boomerangs, player } = setup(8);
    enemies.pool.reset();
    enemies.rebuildGrid();
    behavior.setEvolution('singularity_return');
    for (let i = 0; i < 10; i++) behavior.fire(player);
    expect(boomerangs.activeCount).toBe(1);
    for (let i = 0; i < 100 && boomerangs.states.filter(s => s.active && s.fragment).length < 6; i++) behavior.update(1 / 60, player);
    expect(boomerangs.states.filter(s => s.active && s.fragment)).toHaveLength(6);
    expect(boomerangs.activeCount).toBe(6);
    for (let i = 0; i < 130; i++) behavior.update(1 / 60, player);
    expect(boomerangs.activeCount).toBe(0);
    const tiny = setup(2);
    tiny.behavior.setEvolution('singularity_return');
    tiny.behavior.fire(tiny.player);
    expect(tiny.boomerangs.activeCount).toBe(0);
  });

  it('consumes a shard at the first swept collision, not the first pool index or every target on the path', () => {
    const { behavior, enemies, enemy, boomerangs, player } = setup(8);
    enemy.x = player.x + 550;
    const first = enemies.spawn(0, 270)!;
    Object.assign(first, { x: player.x + 485, y: player.y, radius: 12, health: 1000, speed: 0 });
    enemies.rebuildGrid();
    behavior.setEvolution('singularity_return');
    behavior.fire(player);
    for (let i = 0; i < 100 && behavior.pulseState.sequence === 0; i++) behavior.update(1 / 60, player);
    const shard = boomerangs.states.find(s => s.active)!;
    for (const other of boomerangs.states) if (other !== shard) boomerangs.release(other);
    Object.assign(shard, { x: player.x + 450, y: player.y, directionX: 1, directionY: 0,
      targetIndex: enemies.pool.states.indexOf(enemy), targetGeneration: enemy.generation });
    behavior.update(0.1, player);
    expect(shard.active).toBe(false);
    expect(first.health).toBeCloseTo(1000 - 13 * 1.25);
    expect(enemy.health).toBe(1000);
  });

  it('keeps launching at the authored cadence while earlier six-fragment fans are still active', () => {
    const { behavior, enemies, boomerangs, player } = setup(18);
    enemies.pool.reset();
    enemies.rebuildGrid();
    behavior.setEvolution('singularity_return');
    behavior.fire(player);
    for (let i = 0; i < 100 && behavior.pulseState.sequence === 0; i++) behavior.update(1 / 60, player);
    expect(boomerangs.activeCount).toBe(6);
    for (let i = 0; i < 65; i++) behavior.update(1 / 60, player);
    behavior.fire(player);
    expect(boomerangs.activeCount).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < 100 && behavior.pulseState.sequence < 2; i++) behavior.update(1 / 60, player);
    expect(behavior.pulseState.sequence).toBe(2);
    expect(boomerangs.activeCount).toBe(12);
    expect(boomerangs.states.filter(state => state.active && state.fragment)).toHaveLength(12);
  });

  it('retargets from the fixed split point after an enemy slot is recycled and follows moving targets', () => {
    const { behavior, enemies, enemy, boomerangs, player } = setup(8);
    enemy.x = player.x + 490;
    enemies.rebuildGrid();
    behavior.setEvolution('singularity_return');
    behavior.fire(player);
    for (let i = 0; i < 100 && behavior.pulseState.sequence === 0; i++) behavior.update(1 / 60, player);
    const previousGeneration = enemy.generation;
    enemies.pool.release(enemy);
    // The stale pool index must not silently track this out-of-search-range replacement.
    const recycled = enemies.pool.acquire()!;
    Object.assign(recycled, { x: 5000, y: 5000, health: 1000, radius: 12 });
    const nearby = enemies.spawn(0, 270)!;
    Object.assign(nearby, { x: player.x + 500, y: player.y + 60, health: 1000, radius: 12, speed: 0 });
    enemies.rebuildGrid();
    behavior.update(1 / 60, player);
    const shards = boomerangs.states.filter(s => s.active);
    expect(shards.every(s => s.targetGeneration !== previousGeneration || enemies.getState(s.targetIndex) === nearby)).toBe(true);
    expect(shards.every(s => enemies.getState(s.targetIndex) === nearby)).toBe(true);
    nearby.y += 35;
    enemies.rebuildGrid();
    for (let i = 0; i < 100; i++) behavior.update(1 / 60, player);
    expect(nearby.health).toBeLessThan(1000);
    expect(recycled.health).toBe(1000);
    behavior.clearTransient();
    expect(behavior.currentEvolution).toBe('singularity_return');
    expect(boomerangs.states.every(s => !s.active && !s.fragment && s.targetIndex === -1)).toBe(true);
    behavior.reset();
    expect(behavior.currentEvolution).toBeNull();
  });
});
