import { describe, expect, it } from 'vitest';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

describe('SkinPreviewSvg', () => {
  it('keeps a bounded, vector-only preview for each skin', () => {
    for (const skin of ['cyan', 'violet'] as const) {
      const svg = createPlayerSkinPreviewSvg(skin);
      expect(svg).toContain('viewBox="-50 -50 100 100"');
      expect(svg).toContain('<path');
      expect(svg).not.toMatch(/<image|<script|url\(/i);
      expect(svg).toMatch(/#[0-9a-f]{6}/i);
    }
  });
});
