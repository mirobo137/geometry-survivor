import { describe, expect, it } from 'vitest';
import { formatExperience } from './GameHud';

describe('GameHud', () => {
  it('keeps fractional simulation XP out of the compact HUD indicator', () => {
    expect(formatExperience(12.7999999999)).toBe('12');
    expect(formatExperience(0.99)).toBe('0');
    expect(formatExperience(-4)).toBe('0');
  });
});
