import { describe, expect, it } from 'vitest';
import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_INTERMEDIATE_RADIUS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS,
  ARENA_SECOND_EXPANSION_START_SECONDS
} from '../config/constants';
import { ArenaModel } from './ArenaModel';

describe('ArenaModel', () => {
  it('keeps the opening arena stable while the player learns the space', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_EXPANSION_START_SECONDS - 1);

    expect(arena.state.radius).toBe(ARENA_RADIUS);
    expect(arena.state.expansionProgress).toBe(0);
  });

  it('reaches an intermediate plateau during the first expansion', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_EXPANSION_START_SECONDS + ARENA_EXPANSION_DURATION_SECONDS / 2);
    expect(arena.state.radius).toBeGreaterThan(ARENA_RADIUS);
    expect(arena.state.radius).toBeLessThan(ARENA_INTERMEDIATE_RADIUS);
    expect(arena.state.expansionProgress).toBeLessThan(0.5);

    arena.update(ARENA_EXPANSION_DURATION_SECONDS);
    expect(arena.state.radius).toBe(ARENA_INTERMEDIATE_RADIUS);
    expect(arena.state.expansionProgress).toBe(0.5);
    expect(arena.state.expansionIndex).toBe(1);
  });

  it('performs a second expansion and emits a resonance pulse', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_SECOND_EXPANSION_START_SECONDS);
    expect(arena.state.radius).toBe(ARENA_INTERMEDIATE_RADIUS);
    expect(arena.state.expansionProgress).toBe(0.5);
    expect(arena.state.resonance).toBe(0);

    arena.update(ARENA_EXPANSION_DURATION_SECONDS / 2);
    expect(arena.state.radius).toBeGreaterThan(ARENA_INTERMEDIATE_RADIUS);
    expect(arena.state.radius).toBeLessThan(ARENA_MAX_RADIUS);
    expect(arena.state.expansionProgress).toBeGreaterThan(0.5);
    expect(arena.state.resonance).toBeGreaterThan(0);

    arena.update(ARENA_EXPANSION_DURATION_SECONDS);
    expect(arena.state.radius).toBe(ARENA_MAX_RADIUS);
    expect(arena.state.expansionProgress).toBe(1);
    expect(arena.state.expansionIndex).toBe(2);
  });

  it('never overshoots when the game is updated after the expansion', () => {
    const arena = new ArenaModel();

    arena.update(ARENA_SECOND_EXPANSION_START_SECONDS + ARENA_EXPANSION_DURATION_SECONDS + 120);

    expect(arena.state.radius).toBe(ARENA_MAX_RADIUS);
    expect(arena.state.expansionProgress).toBe(1);
  });
});
