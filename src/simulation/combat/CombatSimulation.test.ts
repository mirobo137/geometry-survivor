import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS, ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
import { BOSS_DEFINITION } from '../../content/bosses/BossDefinition';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { PlayerModel } from '../PlayerModel';
import { CombatSimulation, selectEnemyKind } from './CombatSimulation';

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

  it('spawns one projectile from an alternating muzzle and exposes its shot origin', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    const enemy = combat.enemies.acquire();
    if (!enemy) throw new Error('No se pudo preparar el enemigo de origen');
    enemy.kind = 'tank';
    enemy.x = player.state.x + 180;
    enemy.y = player.state.y;
    enemy.radius = ENEMY_DEFINITIONS.tank.radius;
    enemy.speed = 0;
    enemy.maxHealth = 10_000;
    enemy.health = 10_000;
    enemy.contactDamage = 0;

    runSeconds(combat, player, 0.55);
    const firstShot = combat.renderState.shot;
    expect(firstShot.sequence).toBe(1);
    expect(firstShot.muzzleMask).toBe(1);
    expect(Math.hypot(firstShot.leftOriginX - player.state.x, firstShot.leftOriginY - player.state.y)).toBeGreaterThan(20);
    expect(combat.projectiles.states.some((projectile) => projectile.active && projectile.muzzle === 0)).toBe(true);

    runSeconds(combat, player, 0.55);
    expect(combat.renderState.shot.sequence).toBe(2);
    expect(combat.renderState.shot.muzzleMask).toBe(2);
  });

  it('uses both muzzle origins after the authored twin-emitter upgrade', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    const enemy = combat.enemies.acquire();
    if (!enemy) throw new Error('No se pudo preparar el enemigo doble');
    enemy.kind = 'tank';
    enemy.x = player.state.x + 180;
    enemy.y = player.state.y;
    enemy.radius = ENEMY_DEFINITIONS.tank.radius;
    enemy.speed = 0;
    enemy.maxHealth = 10_000;
    enemy.health = 10_000;
    enemy.contactDamage = 0;

    expect(combat.enableTwinEmitters()).toBe(true);
    runSeconds(combat, player, 0.55);

    expect(combat.hasTwinEmitters).toBe(true);
    expect(combat.renderState.shot.muzzleMask).toBe(3);
    expect(combat.stats.shotsFired).toBe(2);
    expect(combat.projectiles.states.filter((projectile) => projectile.active).map((projectile) => projectile.muzzle)).toEqual([0, 1]);
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

  it('introduces the elite variant only after the second minute', () => {
    expect(selectEnemyKind(119.99, 7)).not.toBe('elite');
    expect(selectEnemyKind(120, 7)).toBe('elite');
    expect(ENEMY_DEFINITIONS.elite.maxHealth).toBeGreaterThan(ENEMY_DEFINITIONS.tank.maxHealth);
    expect(ENEMY_DEFINITIONS.elite.experience).toBeGreaterThan(ENEMY_DEFINITIONS.tank.experience);
  });

  it('introduces one boss at the authored late-run threshold', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();

    runSeconds(combat, player, BOSS_DEFINITION.startSeconds);

    expect(combat.boss.state.active).toBe(true);
    expect(combat.boss.state.maxHealth).toBe(ENEMY_DEFINITIONS.boss.maxHealth);
    expect(combat.enemies.states.filter((enemy) => enemy.active && enemy.kind === 'boss')).toHaveLength(1);
  });

  it('can start at the authored boss threshold for a deterministic development scenario', () => {
    const combat = new CombatSimulation({ initialElapsedSeconds: BOSS_DEFINITION.startSeconds });
    const player = new PlayerModel();

    expect(combat.stats.elapsedSeconds).toBe(BOSS_DEFINITION.startSeconds);

    combat.update(1 / 60, player.state, ARENA_RADIUS);

    expect(combat.boss.state.active).toBe(true);
    expect(combat.boss.state.phase).toBe('intro');
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

  it('emits a terminal boss event when existing weapons defeat the boss kind', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    const boss = combat.enemies.acquire();
    if (!boss) throw new Error('No se pudo preparar el boss de prueba');
    boss.kind = 'boss';
    boss.x = player.state.x + 54;
    boss.y = player.state.y;
    boss.radius = ENEMY_DEFINITIONS.boss.radius;
    boss.speed = 0;
    boss.maxHealth = ENEMY_DEFINITIONS.boss.maxHealth;
    boss.health = 1;
    boss.contactDamage = 0;

    let defeated = false;
    for (let index = 0; index < 120 && !defeated; index += 1) {
      combat.update(1 / 60, player.state, ARENA_RADIUS);
      defeated = combat.events.some((event) => event.type === 'bossDefeated');
    }

    expect(defeated).toBe(true);
    expect(combat.boss.state.phase).toBe('defeated');
    expect(combat.stats.kills).toBe(1);
    expect(combat.stats.experience).toBe(ENEMY_DEFINITIONS.boss.experience);
  });

  it('resets stats, pools and weapon state without reallocating systems', () => {
    const combat = new CombatSimulation();
    const player = new PlayerModel();
    combat.addOrbitBlade();
    combat.unlockChainLightning();
    runSeconds(combat, player, 2);
    const enemies = combat.enemies;
    const projectiles = combat.projectiles;

    combat.reset();

    expect(combat.enemies).toBe(enemies);
    expect(combat.projectiles).toBe(projectiles);
    expect(combat.stats).toEqual({
      elapsedSeconds: 0,
      kills: 0,
      experience: 0,
      shotsFired: 0,
      damageTaken: 0
    });
    expect(combat.enemies.activeCount).toBe(0);
    expect(combat.projectiles.activeCount).toBe(0);
    expect(combat.activeOrbitBlades).toBe(0);
    expect(combat.hasChainLightning).toBe(false);
    expect(combat.laser.state.phase).toBe('idle');
    expect(combat.boss.state.phase).toBe('inactive');
    expect(combat.boss.state.active).toBe(false);
  });
});
