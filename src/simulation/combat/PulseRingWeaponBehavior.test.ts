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

  it('Echo Shock opens a second wave with a two-hit per target ledger', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const target = pool.acquire();
    if (!target) throw new Error('No se pudo preparar el objetivo del eco');
    target.kind = 'chaser';
    target.x = player.state.x + 120;
    target.y = player.state.y;
    target.radius = 18;
    target.health = 1_000;
    target.maxHealth = 1_000;
    target.speed = 0;
    target.contactEnabled = false;
    enemies.rebuildGrid();
    const weapon = new PulseRingWeaponBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    weapon.setEvolution('echo_shock');
    weapon.fire(player.state);
    const before = target.health;
    for (let index = 0; index < 19; index += 1) weapon.update(0.1);
    expect(weapon.state.wave).toBe(1);
    expect(weapon.state.phase).toBe('active');
    expect(target.health).toBeLessThan(before);
  });

  it('Compression Wave opens a directional front without attraction', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const target = pool.acquire();
    if (!target) throw new Error('No se pudo preparar el objetivo de compresion');
    target.kind = 'chaser';
    target.x = player.state.x;
    target.y = player.state.y - 70;
    target.radius = 14;
    target.health = 1_000;
    target.maxHealth = 1_000;
    target.speed = 0;
    target.contactEnabled = false;
    enemies.rebuildGrid();
    const weapon = new PulseRingWeaponBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    weapon.setEvolution('compression_wave');
    weapon.fire(player.state);
    expect(weapon.currentEndRadius).toBe(320);
    const initialX = target.x;
    const initialY = target.y;
    // The directional front does not pull during its telegraph.
    for (let index = 0; index < 4; index += 1) weapon.update(0.1, player.state);
    expect(target.x).toBe(initialX);
    expect(target.y).toBe(initialY);
    // Moving after the warning must not rotate the already captured damage
    // front away from the direction the player was shown.
    player.state.x += 120;
    for (let index = 0; index < 5; index += 1) weapon.update(0.1, player.state);
    expect(target.health).toBeLessThan(1_000);
    expect(target.y).toBeLessThan(initialY);
  });

  it('Compression Wave damages every durable target swept by its front, including edge overlap', () => {
    const pool = new EnemyPool(32);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const targets = [];
    for (let index = 0; index < 24; index += 1) {
      const target = pool.acquire();
      if (!target) throw new Error('No se pudo preparar la masa de compresion');
      const angle = -0.93 + (index / 23) * 1.86;
      const radius = 70 + index * 9;
      target.kind = 'chaser';
      target.x = player.state.x + Math.cos(angle - Math.PI / 2) * radius;
      target.y = player.state.y + Math.sin(angle - Math.PI / 2) * radius;
      target.radius = 10;
      target.health = 1_000;
      target.maxHealth = 1_000;
      target.speed = 0;
      target.contactEnabled = false;
      targets.push(target);
    }
    enemies.rebuildGrid();

    const weapon = new PulseRingWeaponBehavior({
      enemies,
      rollCriticalDamage: (damage) => damage,
      onEnemyDefeated: () => undefined
    });
    weapon.unlock();
    weapon.setEvolution('compression_wave');
    weapon.fire(player.state);

    for (let index = 0; index < 12; index += 1) weapon.update(0.1, player.state);

    expect(targets.every((target) => target.health < target.maxHealth)).toBe(true);
  });
});
