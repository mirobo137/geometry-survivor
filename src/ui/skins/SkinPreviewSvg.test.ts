import { describe, expect, it } from 'vitest';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

describe('SkinPreviewSvg', () => {
  it('keeps a bounded, vector-only preview for each skin', () => {
    for (const skin of ['cyan', 'violet', 'amber', 'emerald'] as const) {
      const svg = createPlayerSkinPreviewSvg(skin);
      expect(svg).toContain('viewBox="-52 -52 104 104"');
      expect(svg).toContain('<path');
      expect(svg).not.toMatch(/<image|<script|url\(/i);
      expect(svg).toMatch(/#[0-9a-f]{6}/i);
    }
  });

  it('uses a distinct hull silhouette in the locker preview', () => {
    const cyan = createPlayerSkinPreviewSvg('cyan');
    const violet = createPlayerSkinPreviewSvg('violet');
    const amber = createPlayerSkinPreviewSvg('amber');
    const emerald = createPlayerSkinPreviewSvg('emerald');
    expect(cyan).toContain('M0-28 25-15 25 15 0 28-25 15-25-15z');
    expect(violet).toContain('M0-30 23 0 11 16 0 30-11 16-23 0z');
    expect(amber).toContain('M0-32 16-11 21 8 16 24-16 24-21 8-16-11z');
    expect(emerald).toContain('M0-27 16-8 11 19 0 27-11 19-16-8z');
  });

  it('omits cannon emitters and only animates the equipped preview', () => {
    const card = createPlayerSkinPreviewSvg('cyan');
    const preview = createPlayerSkinPreviewSvg('violet', { animated: true });
    expect(card).not.toContain('M-22-7-39-18');
    expect(card).not.toContain('animateTransform');
    expect(card).toContain('is-static');
    expect(preview).not.toContain('M-22-7-39-18');
    expect(preview).toContain('animateTransform');
    expect(preview).toContain('is-animated');
  });
});
