import { describe, expect, it } from 'vitest';
import { createRunSummary } from './RunSummary';

describe('RunSummary', () => {
  it('captures a bounded immutable snapshot from combat stats', () => {
    expect(createRunSummary('game-over', {
      elapsedSeconds: 12.75,
      kills: 8.9,
      experience: 31.8
    })).toEqual({
      outcome: 'game-over',
      elapsedSeconds: 12.75,
      kills: 8,
      experience: 31,
      score: 8
    });
  });

  it('never reports negative end-of-run values', () => {
    expect(createRunSummary('victory', {
      elapsedSeconds: -2,
      kills: -1,
      experience: -4
    })).toEqual({
      outcome: 'victory',
      elapsedSeconds: 0,
      kills: 0,
      experience: 0,
      score: 0
    });
  });
});
