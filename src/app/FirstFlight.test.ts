import { describe, expect, it } from 'vitest';
import { createDefaultSaveData, migrateSaveData } from '../platform/save/SaveStore';
import { firstFlightStep, needsFirstFlight } from './FirstFlight';

describe('first flight', () => {
  it('offers a first flight for a fresh profile, including after changing settings', () => {
    const save = createDefaultSaveData();
    expect(needsFirstFlight(save)).toBe(true);
    expect(needsFirstFlight(migrateSaveData({ ...save, settings: { ...save.settings, muted: true } }))).toBe(true);
  });
  it('never repeats once started or skipped, including after reloading the save', () => {
    expect(needsFirstFlight(migrateSaveData({ ...createDefaultSaveData(), tutorialSeen: true }))).toBe(false);
  });
  it('recognizes existing players even though older builds never set tutorialSeen', () => {
    const save = createDefaultSaveData();
    for (const played of [
      { ...save, best: { timeSeconds: 1, score: 0 } },
      { ...save, retention: { ...save.retention, runsCompleted: 1 } },
      { ...save, unlockedActs: ['radial', 'angular'] as const },
      { ...save, retention: { ...save.retention, weeklyClaimIds: ['claimed'] } }
    ]) expect(needsFirstFlight(played)).toBe(false);
  });
  it('waits for movement, then teaches XP and explains the first upgrade when offered', () => {
    expect(firstFlightStep(20, false, false)).toBe('move');
    expect(firstFlightStep(2, true, false)).toBe('move');
    expect(firstFlightStep(4, true, false)).toBe('xp');
    expect(firstFlightStep(2, false, true)).toBe('card');
  });
});
