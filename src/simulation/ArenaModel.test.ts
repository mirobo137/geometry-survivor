import { describe, expect, it } from 'vitest';
import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS
} from '../config/constants';
import { ArenaModel } from './ArenaModel';

describe('ArenaModel', () => {
  it('keeps the opening arena stable while the player learns the space', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_EXPANSION_START_SECONDS - 1);

    expect(arena.state.radius).toBe(ARENA_RADIUS);
    expect(arena.state.expansionProgress).toBe(0);
  });

  it('expands within the configured window and reaches the maximum radius', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_EXPANSION_START_SECONDS + ARENA_EXPANSION_DURATION_SECONDS / 2);
    expect(arena.state.radius).toBeGreaterThan(ARENA_RADIUS);
    expect(arena.state.radius).toBeLessThan(ARENA_MAX_RADIUS);

    arena.update(ARENA_EXPANSION_DURATION_SECONDS);
    expect(arena.state.radius).toBe(ARENA_MAX_RADIUS);
    expect(arena.state.expansionProgress).toBe(1);
  });

  it('never overshoots when the game is updated after the expansion', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_EXPANSION_START_SECONDS + ARENA_EXPANSION_DURATION_SECONDS + 120);

    expect(arena.state.radius).toBe(ARENA_MAX_RADIUS);
    expect(arena.state.expansionProgress).toBe(1);
  });
});
