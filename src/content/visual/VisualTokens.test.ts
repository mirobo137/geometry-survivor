import { describe, expect, it } from 'vitest';
import { FX_QUALITY, PLAYER_SKINS } from './VisualTokens';

describe('VisualTokens', () => {
  it('keeps skins presentation-only and complete', () => {
    expect(Object.keys(PLAYER_SKINS)).toEqual(['cyan', 'violet']);
    for (const skin of Object.values(PLAYER_SKINS)) {
      expect(Object.values(skin).every((color) => Number.isInteger(color))).toBe(true);
    }
  });

  it('keeps quality budgets ordered and bounded', () => {
    expect(FX_QUALITY.low.particleCount).toBeLessThan(FX_QUALITY.medium.particleCount);
    expect(FX_QUALITY.medium.particleCount).toBeLessThan(FX_QUALITY.high.particleCount);
    expect(FX_QUALITY.high.poolCapacity).toBeLessThanOrEqual(240);
    expect(FX_QUALITY.low.ringAlpha).toBeLessThan(FX_QUALITY.high.ringAlpha);
  });
});
