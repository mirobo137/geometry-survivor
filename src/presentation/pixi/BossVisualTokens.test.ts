import { describe, expect, it } from 'vitest';

import { BOSS_VISUAL_COLORS } from './BossVisualTokens';

describe('BossVisualTokens', () => {
  it('keeps every Pixi color inside the 24-bit RGB range', () => {
    for (const color of Object.values(BOSS_VISUAL_COLORS)) {
      expect(Number.isInteger(color)).toBe(true);
      expect(color).toBeGreaterThanOrEqual(0x000000);
      expect(color).toBeLessThanOrEqual(0xffffff);
    }
  });
});
