import { describe, expect, it } from 'vitest';
import { getSpawnIntervalSeconds } from './DifficultyDefinitions';

describe('DifficultyDefinitions', () => {
  it('keeps the opening phase readable', () => {
    expect(getSpawnIntervalSeconds(0)).toBe(0.85);
    expect(getSpawnIntervalSeconds(59.9)).toBe(0.85);
  });

  it('steps down pressure at authored milestones', () => {
    expect(getSpawnIntervalSeconds(60)).toBe(0.7);
    expect(getSpawnIntervalSeconds(120)).toBe(0.56);
    expect(getSpawnIntervalSeconds(180)).toBe(0.44);
  });

  it('never increases the spawn interval in later phases', () => {
    const intervals = [0, 60, 120, 180, 240, 300].map(getSpawnIntervalSeconds);
    for (let index = 1; index < intervals.length; index += 1) {
      expect(intervals[index]).toBeLessThanOrEqual(intervals[index - 1]);
    }
  });
});
