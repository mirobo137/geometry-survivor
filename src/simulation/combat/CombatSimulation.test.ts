import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS, ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { PlayerModel } from '../PlayerModel';
import { CombatSimulation } from './CombatSimulation';

const runSeconds = (combat: CombatSimulation, player: PlayerModel, seconds: number): void => {
  const steps = Math.ceil(seconds * 60);
  for (let index = 0; index < steps; index += 1) {
    combat.update(1 / 60, player.state, ARENA_RADIUS);
  }
};

describe('CombatSimulation', () => {
  it('spawns enemies, auto-fires projectiles and resolves defeats without Pixi', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();

    runSeconds(combat, player, 12);

    expect(combat.stats.shotsFired).toBeGreaterThan(0);
    expect(combat.stats.kills).toBeGreaterThan(0);
    expect(combat.stats.experience).toBe(combat.stats.kills * ENEMY_DEFINITIONS.chaser.experience);
    expect(combat.enemies.activeCount).toBeLessThanOrEqual(combat.enemies.capacity);
    expect(combat.projectiles.activeCount).toBeLessThanOrEqual(combat.projectiles.capacity);
  });

  it('awards experience in the defeat event without creating a pickup', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    let defeatEvent: Extract<(typeof combat.events)[number], { type: 'enemyDefeated' }> | undefined;

    for (let index = 0; index < 12 * 60 && !defeatEvent; index += 1) {
      combat.update(1 / 60, player.state, ARENA_RADIUS);
      defeatEvent = combat.events.find((event) => event.type === 'enemyDefeated') as typeof defeatEvent;
    }

    expect(defeatEvent).toBeDefined();
    expect(defeatEvent?.experience).toBe(ENEMY_DEFINITIONS[defeatEvent!.kind].experience);
    expect(combat.stats.experience).toBeGreaterThan(0);
  });

  it('seeds the reproducible stress preset with both pools at capacity', () => {
    const combat = new CombatSimulation({ stress: true });
    const player = new PlayerModel();

    combat.update(1 / 60, player.state, ARENA_RADIUS);

    expect(combat.enemies.activeCount).toBe(ENEMY_POOL_CAPACITY);
    expect(combat.projectiles.activeCount).toBe(PROJECTILE_POOL_CAPACITY);
    expect(combat.enemies.states.some((enemy) => enemy.active && enemy.kind === 'fast')).toBe(true);
    expect(combat.enemies.states.some((enemy) => enemy.active && enemy.kind === 'tank')).toBe(true);
  });

  it('moves and damages with an orbit blade after it is unlocked', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    const enemy = combat.enemies.acquire();
    if (!enemy) throw new Error('No se pudo preparar el enemigo de prueba');
    enemy.kind = 'chaser';
    enemy.x = player.state.x + WEAPON_DEFINITIONS.orbit.orbitRadius;
    enemy.y = player.state.y;
    enemy.radius = ENEMY_DEFINITIONS.chaser.radius;
    enemy.speed = 0;
    enemy.maxHealth = 24;
    enemy.health = 10;
    enemy.contactDamage = 0;

    expect(combat.addOrbitBlade()).toBe(true);
    combat.update(1 / 60, player.state, ARENA_RADIUS);

    expect(combat.activeOrbitBlades).toBe(1);
    expect(combat.orbitBlades[0].active).toBe(true);
    expect(combat.stats.kills).toBe(1);
  });

  it('chains lightning through nearby enemies on its cooldown', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    for (let index = 0; index < 3; index += 1) {
      const enemy = combat.enemies.acquire();
      if (!enemy) throw new Error('No se pudo preparar el enemigo de cadena');
      enemy.kind = 'tank';
      enemy.x = player.state.x + 120 + index * 45;
      enemy.y = player.state.y;
      enemy.radius = ENEMY_DEFINITIONS.tank.radius;
      enemy.speed = 0;
      enemy.maxHealth = 100;
      enemy.health = 100;
      enemy.contactDamage = 0;
    }
    combat.unlockChainLightning();

    for (let index = 0; index < 74; index += 1) {
      combat.update(1 / 60, player.state, ARENA_RADIUS);
    }

    expect(combat.hasChainLightning).toBe(true);
    expect(combat.chainSegments.some((segment) => segment.active)).toBe(true);
  });

  it('introduces Fast and Tank through the deterministic timeline', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();

    runSeconds(combat, player, 105);

    expect(combat.enemies.states.some((enemy) => enemy.active && enemy.kind === 'fast')).toBe(true);
    expect(combat.enemies.states.some((enemy) => enemy.active && enemy.kind === 'tank')).toBe(true);
  });

  it('keeps newly spawned enemies outside the playable arena edge', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();

    runSeconds(combat, player, 1);

    expect(combat.enemies.states.some((enemy) => (
      enemy.active
      && Math.hypot(enemy.x - ARENA_CENTER.x, enemy.y - ARENA_CENTER.y) > ARENA_RADIUS
    ))).toBe(true);
  });
});
