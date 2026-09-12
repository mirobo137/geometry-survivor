import { describe, expect, it } from 'vitest';
import { ARENA_RADIUS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
import { PlayerModel } from '../PlayerModel';
import { EnemyPool } from '../combat/EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { EnemySystem, selectEnemyKind } from './EnemySystem';

describe('EnemySystem', () => {
  it('spawns authored variants and indexes them for nearest queries', () => {
    const pool = new EnemyPool(4);
    const system = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));

    const enemy = system.spawn(0, ARENA_RADIUS);
    expect(enemy?.kind).toBe(selectEnemyKind(0, 0));
    expect(enemy?.health).toBe(ENEMY_DEFINITIONS.chaser.maxHealth);
    expect(enemy ? Math.hypot(enemy.x - 640, enemy.y - 360) : 0).toBeGreaterThan(ARENA_RADIUS);

    system.rebuildGrid();
    expect(system.findNearestEnemyIndex(enemy!.x, enemy!.y, 1)).toBe(0);
  });

  it('moves enemies and enforces contact cooldown without owning player health', () => {
    const pool = new EnemyPool(2);
    const system = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const enemy = pool.acquire();
    if (!enemy) throw new Error('No se pudo preparar el enemigo');
    enemy.kind = 'chaser';
    enemy.x = player.state.x;
    enemy.y = player.state.y;
    enemy.radius = ENEMY_DEFINITIONS.chaser.radius;
    enemy.speed = 0;
    enemy.contactDamage = ENEMY_DEFINITIONS.chaser.contactDamage;

    expect(system.update(1 / 60, player.state)).toBe(enemy.contactDamage);
    expect(system.update(1 / 60, player.state)).toBeNull();
    const cooldownResults = Array.from({ length: 30 }, () => system.update(1 / 60, player.state));
    expect(cooldownResults).toContain(enemy.contactDamage);
  });

  it('keeps the Orbiter drill family under its authored cap', () => {
    const pool = new EnemyPool(8);
    const system = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    for (let index = 0; index < 8; index += 1) system.spawnOrbiterDrill(ARENA_RADIUS);
    expect(pool.states.filter((enemy) => enemy.active && enemy.kind === 'orbiter')).toHaveLength(6);
  });

  it('applies normal hull contact damage while an Orbiter is announcing its route', () => {
    const pool = new EnemyPool(1);
    const system = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const player = new PlayerModel();
    const orbiter = system.spawnOrbiterDrill(ARENA_RADIUS);
    if (!orbiter) throw new Error('No se pudo preparar el Orbiter');
    player.state.x = orbiter.x;
    player.state.y = orbiter.y;

    expect(orbiter.orbiterPhase).toBe('approach');
    expect(system.update(1 / 60, player.state, ARENA_RADIUS)).toBe(orbiter.contactDamage);
  });

  it('splits one parent into two lateral children and stops at depth one', () => {
    const pool = new EnemyPool(8);
    const system = new EnemySystem(pool, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
    const parent = system.spawnSplitterDrill(ARENA_RADIUS);
    if (!parent) throw new Error('No se pudo preparar el Splitter');
    parent.x = 640;
    parent.y = 360;
    const parentDepth = parent.splitterDepth;
    pool.release(parent);

    expect(system.spawnSplitterChildren(640, 360, parentDepth, ARENA_RADIUS)).toBe(2);
    const children = pool.states.filter((enemy) => enemy.active && enemy.kind === 'splitter');
    expect(children).toHaveLength(2);
    expect(children.every((enemy) => enemy.splitterDepth === 1)).toBe(true);
    expect(Math.hypot(children[0].x - children[1].x, children[0].y - children[1].y)).toBeGreaterThan(0);
    expect(system.spawnSplitterChildren(children[0].x, children[0].y, children[0].splitterDepth, ARENA_RADIUS)).toBe(0);
  });
});
