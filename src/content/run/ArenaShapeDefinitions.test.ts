import { describe, expect, it } from 'vitest';
import {
  ACT_I_ARENA_SHAPE_CHANGES,
  ACT_II_ARENA_SHAPE_CHANGES,
  getActIArenaLaserPressure
} from './ArenaShapeDefinitions';

describe('ArenaShapeDefinitions', () => {
  it('keeps the Act I shape hook authored, ordered and reversible', () => {
    expect(ACT_I_ARENA_SHAPE_CHANGES.map((change) => change.startSeconds)).toEqual([132, 210, 288]);
    expect(ACT_I_ARENA_SHAPE_CHANGES.map((change) => [change.from, change.to])).toEqual([
      ['circle', 'hexagon'],
      ['hexagon', 'circle'],
      ['circle', 'hexagon']
    ]);
    for (const change of ACT_I_ARENA_SHAPE_CHANGES) {
      expect(change.telegraphSeconds).toBeGreaterThanOrEqual(1.4);
      expect(change.morphSeconds).toBeGreaterThan(0);
    }
  });

  it('raises laser frequency and sweep pressure at each hexagon intervention', () => {
    const circle = getActIArenaLaserPressure('circle', 0);
    const firstHexagon = getActIArenaLaserPressure('hexagon', 1);
    const repeatedHexagon = getActIArenaLaserPressure('hexagon', 3);

    expect(circle.sweepEveryStrikes).toBe(3);
    expect(firstHexagon.intervalSeconds).toBeLessThan(circle.intervalSeconds);
    expect(repeatedHexagon.intervalSeconds).toBeLessThan(firstHexagon.intervalSeconds);
    expect(repeatedHexagon.sweepEveryStrikes).toBeLessThan(firstHexagon.sweepEveryStrikes);
    expect(repeatedHexagon.sweepAngleRadians).toBeGreaterThan(firstHexagon.sweepAngleRadians);
    expect(repeatedHexagon.sweepAttackSeconds).toBeLessThan(firstHexagon.sweepAttackSeconds);
  });

  it('keeps Act II geometry authored, recurring and settled ten seconds before its boss window', () => {
    expect(ACT_II_ARENA_SHAPE_CHANGES.map((change) => change.startSeconds)).toEqual([40, 80, 120, 160, 200, 248.05]);
    expect(ACT_II_ARENA_SHAPE_CHANGES.map((change) => [change.from, change.to])).toEqual([
      ['hexagon', 'square'],
      ['square', 'circle'],
      ['circle', 'hexagon'],
      ['hexagon', 'square'],
      ['square', 'hexagon'],
      ['hexagon', 'circle']
    ]);
    for (const change of ACT_II_ARENA_SHAPE_CHANGES) {
      expect(change.telegraphSeconds).toBeGreaterThanOrEqual(1.2);
      expect(change.morphSeconds).toBeGreaterThan(0);
    }
    const lastChange = ACT_II_ARENA_SHAPE_CHANGES.at(-1);
    expect(lastChange).toBeDefined();
    expect(lastChange!.startSeconds + lastChange!.telegraphSeconds + lastChange!.morphSeconds).toBeCloseTo(250);
    expect(260 - (lastChange!.startSeconds + lastChange!.telegraphSeconds + lastChange!.morphSeconds)).toBeCloseTo(10);
  });
});
