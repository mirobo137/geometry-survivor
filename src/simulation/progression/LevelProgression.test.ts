import { describe, expect, it } from 'vitest';
import { LevelProgression } from './LevelProgression';

describe('LevelProgression', () => {
  it('keeps level one below the first threshold and queues one level-up at 8 XP', () => {
    const progression = new LevelProgression();

    progression.sync(7);
    expect(progression.state).toEqual({
      level: 1,
      totalExperience: 7,
      nextLevelExperience: 8,
      pendingLevelUps: 0
    });

    progression.sync(8);
    expect(progression.state).toEqual({
      level: 2,
      totalExperience: 8,
      nextLevelExperience: 20,
      pendingLevelUps: 1
    });
  });

  it('queues multiple level-ups and consumes them one at a time', () => {
    const progression = new LevelProgression();

    progression.sync(50);
    expect(progression.state.level).toBe(4);
    expect(progression.state.pendingLevelUps).toBe(3);
    expect(progression.consumeLevelUp()).toBe(true);
    expect(progression.state.pendingLevelUps).toBe(2);
    expect(progression.consumeLevelUp()).toBe(true);
    expect(progression.consumeLevelUp()).toBe(true);
    expect(progression.consumeLevelUp()).toBe(false);
  });

  it('ignores a counter that goes backwards', () => {
    const progression = new LevelProgression();

    progression.sync(12);
    progression.sync(4);
    expect(progression.state.totalExperience).toBe(12);
    expect(progression.state.level).toBe(2);
  });

  it('clears pending level-ups for an in-place restart', () => {
    const progression = new LevelProgression();
    progression.sync(50);

    progression.reset();

    expect(progression.state).toEqual({
      level: 1,
      totalExperience: 0,
      nextLevelExperience: 8,
      pendingLevelUps: 0
    });
  });
});
