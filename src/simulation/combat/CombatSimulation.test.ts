import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS, ENEMY_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import { ENEMY_DEFINITIONS } from '../../content/enemies/EnemyDefinitions';
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
