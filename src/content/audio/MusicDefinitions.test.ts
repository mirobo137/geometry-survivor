import { describe, expect, it } from 'vitest';
import { MUSIC_PATTERN } from './MusicDefinitions';

describe('MUSIC_PATTERN', () => {
  it('contains a finite, loopable phrase', () => {
    expect(MUSIC_PATTERN).toHaveLength(8);
    for (const step of MUSIC_PATTERN) {
      expect(step.lead).toBeGreaterThan(0);
      expect(step.bass).toBeGreaterThan(0);
      expect(step.harmony.length).toBeGreaterThan(0);
      expect(step.harmony.every((frequency) => Number.isFinite(frequency) && frequency > 0)).toBe(true);
    }
  });
});
