import { describe, expect, it } from 'vitest';
import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_INTERMEDIATE_RADIUS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS,
  ARENA_SECOND_EXPANSION_START_SECONDS
} from '../config/constants';
import { getArenaRadiusAtAngle } from './ArenaBoundary';
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

  it('telegraphs and morphs the Act I arena deterministically', () => {
    const arena = new ArenaModel();

    arena.update(131.99);
    expect(arena.state.shapePhase).toBe('stable');
    expect(arena.state.shape).toBe('circle');

    arena.update(0.01);
    expect(arena.state.shapePhase).toBe('telegraph');
    expect(arena.state.shapeTo).toBe('hexagon');
    expect(arena.state.shapeTelegraphProgress).toBe(0);

    arena.update(1.4);
    expect(arena.state.shapePhase).toBe('morph');
    expect(arena.state.morphProgress).toBe(0);

    const circleRadius = getArenaRadiusAtAngle({
      radius: arena.state.radius,
      shapeFrom: 'circle',
      shapeTo: 'circle',
      morphProgress: 0
    }, Math.PI / 6);
    const hexagonRadius = getArenaRadiusAtAngle({
      radius: arena.state.radius,
      shapeFrom: 'hexagon',
      shapeTo: 'hexagon',
      morphProgress: 0
    }, Math.PI / 6);
    expect(hexagonRadius).toBeLessThan(circleRadius);

    arena.update(0.85);
    expect(arena.state.shapePhase).toBe('stable');
    expect(arena.state.shape).toBe('hexagon');
    expect(arena.state.shapeIndex).toBe(1);
  });

  it('returns to the circular boundary before repeating during the boss window', () => {
    const arena = new ArenaModel();

    arena.update(212.25);

    expect(arena.state.shapePhase).toBe('stable');
    expect(arena.state.shape).toBe('circle');
    expect(arena.state.shapeIndex).toBe(2);

    arena.update(75.75);

    expect(arena.state.shapePhase).toBe('telegraph');
    expect(arena.state.shape).toBe('hexagon');
    expect(arena.state.shapeIndex).toBe(3);
  });

  it('returns to the opening arena for an in-place restart', () => {
    const arena = new ArenaModel();
    arena.update(ARENA_SECOND_EXPANSION_START_SECONDS + 1);

    arena.reset();

    expect(arena.state).toEqual({
      elapsedSeconds: 0,
      radius: ARENA_RADIUS,
      expansionProgress: 0,
      expansionIndex: 0,
      resonance: 0,
      shape: 'circle',
      shapeFrom: 'circle',
      shapeTo: 'circle',
      morphProgress: 0,
      shapeTelegraphProgress: 0,
      shapePhase: 'stable',
      shapeIndex: 0
    });
  });
});
