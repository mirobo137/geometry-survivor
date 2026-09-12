import { describe, expect, it } from 'vitest';
import { ARENA_CENTER, ARENA_RADIUS, PLAYER_RADIUS } from '../config/constants';
import { clampPointToArena, getArenaRadiusAtAngle } from './ArenaBoundary';

const HEXAGON_BOUNDARY = {
  radius: ARENA_RADIUS,
  shapeFrom: 'hexagon' as const,
  shapeTo: 'hexagon' as const,
  morphProgress: 0
};

const SQUARE_BOUNDARY = {
  radius: ARENA_RADIUS,
  shapeFrom: 'square' as const,
  shapeTo: 'square' as const,
  morphProgress: 0
};

describe('ArenaBoundary', () => {
  it('keeps circle geometry unchanged and exposes hexagon side depth', () => {
    expect(getArenaRadiusAtAngle(ARENA_RADIUS, 0)).toBe(ARENA_RADIUS);
    expect(getArenaRadiusAtAngle(HEXAGON_BOUNDARY, 0)).toBeCloseTo(ARENA_RADIUS);
    expect(getArenaRadiusAtAngle(HEXAGON_BOUNDARY, Math.PI / 6)).toBeLessThan(ARENA_RADIUS);
  });

  it('clamps the player against the active polygon without changing the center', () => {
    const clamped = clampPointToArena(
      ARENA_CENTER.x + ARENA_RADIUS,
      ARENA_CENTER.y + ARENA_RADIUS,
      PLAYER_RADIUS,
      HEXAGON_BOUNDARY
    );
    const angle = Math.atan2(clamped.y - ARENA_CENTER.y, clamped.x - ARENA_CENTER.x);
    const distance = Math.hypot(clamped.x - ARENA_CENTER.x, clamped.y - ARENA_CENTER.y);
    expect(distance).toBeLessThanOrEqual(
      getArenaRadiusAtAngle(HEXAGON_BOUNDARY, angle) - PLAYER_RADIUS + 0.0001
    );
    expect(clampPointToArena(ARENA_CENTER.x, ARENA_CENTER.y, PLAYER_RADIUS, HEXAGON_BOUNDARY)).toEqual(ARENA_CENTER);
  });

  it('interpolates the boundary during a shape transition', () => {
    const transition = {
      radius: ARENA_RADIUS,
      shapeFrom: 'circle' as const,
      shapeTo: 'hexagon' as const,
      morphProgress: 0.5
    };
    const circle = getArenaRadiusAtAngle(ARENA_RADIUS, Math.PI / 6);
    const hexagon = getArenaRadiusAtAngle(HEXAGON_BOUNDARY, Math.PI / 6);
    expect(getArenaRadiusAtAngle(transition, Math.PI / 6)).toBeCloseTo((circle + hexagon) / 2);
  });

  it('uses an axis-aligned square with the hexagon minimum clearance', () => {
    expect(getArenaRadiusAtAngle(SQUARE_BOUNDARY, 0)).toBeCloseTo(
      getArenaRadiusAtAngle(HEXAGON_BOUNDARY, Math.PI / 6)
    );
    expect(getArenaRadiusAtAngle(SQUARE_BOUNDARY, Math.PI / 4)).toBeGreaterThan(ARENA_RADIUS);

    const clamped = clampPointToArena(
      ARENA_CENTER.x + ARENA_RADIUS * 2,
      ARENA_CENTER.y,
      PLAYER_RADIUS,
      SQUARE_BOUNDARY
    );
    expect(clamped.x - ARENA_CENTER.x).toBeCloseTo(
      getArenaRadiusAtAngle(SQUARE_BOUNDARY, 0) - PLAYER_RADIUS
    );
  });
});
