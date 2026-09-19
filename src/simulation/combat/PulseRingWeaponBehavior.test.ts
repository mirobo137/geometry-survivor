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
    expect(weapon.setEvolution('echo_shock')).toBe(true);
    weapon.reset();
    expect(weapon.isUnlocked).toBe(false);
    expect(weapon.currentEvolution).toBeNull();
    expect(weapon.unlock()).toBe(true);
    expect(weapon.setEvolution('compression_wave')).toBe(true);
    expect(weapon.state).toMatchObject({ phase: 'idle', active: false, radius: 0, sequence: 0 });
  });

  it('Echo Shock reaches farther, returns through the same target, and never pushes it', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const target = pool.acquire();
    if (!target) throw new Error('No se pudo preparar el objetivo del eco');
    target.kind = 'chaser';
    target.x = player.state.x + 240;
    target.y = player.state.y;
    target.radius = 18;
    target.health = 1_000;
    target.maxHealth = 1_000;
    target.speed = 0;
    target.contactEnabled = false;
    enemies.rebuildGrid();
    const hits: { wave: number; damage: number }[] = [];
    let weapon: PulseRingWeaponBehavior;
    weapon = new PulseRingWeaponBehavior({
      enemies,
      rollCriticalDamage: (damage) => {
        hits.push({ wave: weapon.state.wave ?? -1, damage });
        return damage;
      },
      onEnemyDefeated: () => undefined
    });
    weapon.unlock();
    weapon.setEvolution('echo_shock');
    weapon.fire(player.state);
    expect(weapon.currentEndRadius).toBe(280);
    const initialX = target.x;
    const initialY = target.y;
    for (let index = 0; index < 40; index += 1) weapon.update(0.1, player.state);

    expect(hits).toEqual([
      { wave: 0, damage: 26 },
      { wave: 1, damage: 26 }
    ]);
    expect(target.x).toBe(initialX);
    expect(target.y).toBe(initialY);
  });

  it('Echo Shock keeps its captured origin while the player moves before the return', () => {
    const pool = new EnemyPool(4);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const target = pool.acquire();
    if (!target) throw new Error('No se pudo preparar el objetivo del retorno');
    target.kind = 'boss';
    target.x = player.state.x + 120;
    target.y = player.state.y;
    target.radius = 18;
    target.maxHealth = 1_000;
    target.health = 1_000;
    target.speed = 0;
    target.contactEnabled = false;
    enemies.rebuildGrid();
    const weapon = new PulseRingWeaponBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    weapon.setEvolution('echo_shock');
    weapon.fire(player.state);
    const originX = weapon.state.originX;
    for (let index = 0; index < 12; index += 1) weapon.update(0.1, player.state);
    player.state.x += 100;
    for (let index = 0; index < 20; index += 1) weapon.update(0.1, player.state);
    expect(weapon.state.originX).toBe(originX);
    expect(weapon.state.originX).not.toBe(player.state.x);
    expect(target.health).toBe(1_000 - 26 * 2);
  });

  it('captures the latest movement direction while idle, then freezes it for Compression Wave', () => {
    const pool = new EnemyPool(1);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const weapon = new PulseRingWeaponBehavior({ enemies, rollCriticalDamage: (damage) => damage, onEnemyDefeated: () => undefined });
    weapon.unlock();
    weapon.setEvolution('compression_wave');
    weapon.update(0.1, player.state);
    player.state.x += 80;
    weapon.update(0.1, player.state);
    weapon.fire(player.state);
    expect(weapon.state.directionX).toBeCloseTo(1);
    expect(weapon.state.directionY).toBeCloseTo(0);

    player.state.y += 80;
    weapon.update(0.1, player.state);
    expect(weapon.state.directionX).toBeCloseTo(1);
    expect(weapon.state.directionY).toBeCloseTo(0);
  });

  it('Compression Wave opens three directional fronts without attraction', () => {
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
    for (let index = 0; index < 3; index += 1) weapon.update(0.1, player.state);
    expect(target.x).toBe(initialX);
    expect(target.y).toBe(initialY);
    // Moving after the warning must not rotate the already captured damage
    // front away from the direction the player was shown.
    player.state.x += 120;
    for (let index = 0; index < 16; index += 1) weapon.update(0.1, player.state);
    expect(target.health).toBe(1_000 - 26 * 3);
    // Base push is 10u. Each of the three fronts applies triple push.
    expect(target.y).toBeCloseTo(initialY - 90, 5);
  });

  it('Compression Wave damages every durable target swept by its front, including real edge overlap', () => {
    const pool = new EnemyPool(32);
    const enemies = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const targets = [];
    for (let index = 0; index < 22; index += 1) {
      const target = pool.acquire();
      if (!target) throw new Error('No se pudo preparar la masa de compresion');
      const angle = -0.88 + (index / 21) * 1.76;
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
    const edgeTarget = pool.acquire();
    const outsideTarget = pool.acquire();
    if (!edgeTarget || !outsideTarget) throw new Error('No se pudieron preparar los bordes de compresion');
    for (const [target, degrees] of [[edgeTarget, 58], [outsideTarget, 66]] as const) {
      const angle = -Math.PI / 2 + degrees * Math.PI / 180;
      target.kind = 'chaser';
      target.x = player.state.x + Math.cos(angle) * 150;
      target.y = player.state.y + Math.sin(angle) * 150;
      target.radius = 20;
      target.health = 1_000;
      target.maxHealth = 1_000;
      target.speed = 0;
      target.contactEnabled = false;
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
    expect(edgeTarget.health).toBeLessThan(edgeTarget.maxHealth);
    expect(outsideTarget.health).toBe(outsideTarget.maxHealth);
  });
});
