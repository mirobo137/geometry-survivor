import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_MAX_RADIUS, ARENA_RADIUS, PLAYER_RADIUS, PLAYER_SPEED } from '../config/constants';
import { PlayerModel } from './PlayerModel';

describe('PlayerModel', () => {
  it('moves at a fixed speed independent of frame chunking', () => {
    const oneStep = new PlayerModel();
    const manySteps = new PlayerModel();
    const input = { x: 1, y: 0 };

    oneStep.update(input, 1 / 6);
    for (let index = 0; index < 10; index += 1) manySteps.update(input, 1 / 60);

    expect(oneStep.state.x).toBeCloseTo(manySteps.state.x);
    expect(oneStep.state.x).toBeCloseTo(ARENA_CENTER.x + PLAYER_SPEED / 6);
  });

  it('keeps the player inside the circular arena', () => {
    const player = new PlayerModel();
    for (let index = 0; index < 120; index += 1) player.update({ x: 1, y: 0 }, 1 / 30);

    const distance = Math.hypot(player.state.x - ARENA_CENTER.x, player.state.y - ARENA_CENTER.y);
    expect(distance).toBeLessThanOrEqual(ARENA_RADIUS - PLAYER_RADIUS + 0.0001);
  });

  it('uses the current arena radius when the arena expands', () => {
    const player = new PlayerModel();

    player.update({ x: 1, y: 0 }, 10, ARENA_MAX_RADIUS);

    const distance = Math.hypot(player.state.x - ARENA_CENTER.x, player.state.y - ARENA_CENTER.y);
    expect(distance).toBeLessThanOrEqual(ARENA_MAX_RADIUS - PLAYER_RADIUS + 0.0001);
    expect(distance).toBeGreaterThan(ARENA_RADIUS - PLAYER_RADIUS);
  });

  it('applies contact damage with a short invulnerability window', () => {
    const player = new PlayerModel();

    expect(player.takeDamage(20)).toBe(true);
    expect(player.state.health).toBe(80);
    expect(player.takeDamage(20)).toBe(false);

    player.update({ x: 0, y: 0 }, 0.5);
    expect(player.takeDamage(20)).toBe(true);
    expect(player.state.health).toBe(60);
  });
});
