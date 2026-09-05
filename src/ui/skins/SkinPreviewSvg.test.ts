import { describe, expect, it } from 'vitest';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';
import { PLAYER_HULL_SVG, tintPlayerSvgMarkup } from '../../assets/svg/characters/player/PlayerHullSvg';

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
    const silhouettes = new Set<string>();
    for (const skin of ['cyan', 'violet', 'amber', 'emerald'] as const) {
      const preview = createPlayerSkinPreviewSvg(skin);
      for (const source of Object.values(PLAYER_HULL_SVG[skin])) {
        for (const [, path] of source.matchAll(/\sd="([^"]+)"/g)) expect(preview).toContain(`d="${path}"`);
      }
      silhouettes.add(PLAYER_HULL_SVG[skin].body.match(/\sd="([^"]+)"/)![1]);
    }
    expect(silhouettes.size).toBe(4);
  });

  it('mirrors multiplicative Sprite tint without retaining duplicate IDs', () => {
    const markup = tintPlayerSvgMarkup('<svg><path id="test" fill="#808080" stroke="#ffffff"/></svg>', 0x804020);
    expect(markup).toBe('<path fill="#402010" stroke="#804020"/>');
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
