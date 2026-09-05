import { describe, expect, it } from 'vitest';
import { FX_QUALITY, PLAYER_SKINS, PLAYER_SKIN_MOTION } from './VisualTokens';

describe('VisualTokens', () => {
  it('keeps skins presentation-only and complete', () => {
    expect(Object.keys(PLAYER_SKINS)).toEqual(['cyan', 'violet', 'amber', 'emerald', 'obsidian']);
    for (const skin of Object.values(PLAYER_SKINS)) {
      expect(Object.values(skin).every((color) => Number.isInteger(color))).toBe(true);
    }
    expect(Object.keys(PLAYER_SKIN_MOTION)).toEqual(Object.keys(PLAYER_SKINS));
  });

  it('keeps quality budgets ordered and bounded', () => {
    expect(FX_QUALITY.low.particleCount).toBeLessThan(FX_QUALITY.medium.particleCount);
    expect(FX_QUALITY.medium.particleCount).toBeLessThan(FX_QUALITY.high.particleCount);
    expect(FX_QUALITY.high.poolCapacity).toBeLessThanOrEqual(240);
    expect(FX_QUALITY.low.ringAlpha).toBeLessThan(FX_QUALITY.high.ringAlpha);
    expect(FX_QUALITY.low.projectileTrailAlpha).toBe(0);
    expect(FX_QUALITY.low.projectileGlowLimit).toBe(0);
    expect(FX_QUALITY.medium.projectileTrailAlpha).toBeLessThan(FX_QUALITY.high.projectileTrailAlpha);
    expect(FX_QUALITY.medium.projectileTrailLimit).toBeLessThan(FX_QUALITY.high.projectileTrailLimit);
    expect(FX_QUALITY.medium.projectileGlowLimit).toBeLessThan(FX_QUALITY.high.projectileGlowLimit);
    expect(FX_QUALITY.high.projectileGlowLimit).toBeLessThanOrEqual(120);
  });
});
