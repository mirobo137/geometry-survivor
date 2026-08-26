import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
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
    expect(combat.enemies.activeCount).toBeLessThanOrEqual(combat.enemies.capacity);
    expect(combat.projectiles.activeCount).toBeLessThanOrEqual(combat.projectiles.capacity);
    expect(combat.xp.activeCount).toBeGreaterThan(0);
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
