import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_DEFINITIONS } from '../../content/visual/CannonSkinDefinitions';
import { createCannonPreviewSvg } from './CannonPreviewSvg';

describe('CannonPreviewSvg', () => {
  it('keeps every package vector-only and gives the large preview a firing loop', () => {
    for (const definition of CANNON_SKIN_DEFINITIONS) {
      const svg = createCannonPreviewSvg(definition.id);
      expect(svg).toContain('viewBox="-62 -58 286 116"');
      expect(svg).toContain('cannon-preview-shot');
      expect(svg).toContain('repeatCount="indefinite"');
      expect(svg).not.toMatch(/<image|<script|url\(|filter=|mask=/i);
    }
  });

  it('can render a quiet card thumbnail without animation', () => {
    const svg = createCannonPreviewSvg('rainbow', { animated: false });
    expect(svg).toContain('is-static');
    expect(svg).not.toContain('repeatCount="indefinite"');
    expect(svg).toContain('#ff668f');
    expect(svg).not.toContain('cannon-preview-muzzle-flash');
  });

  it('inlines the same barrel masters used in-game', () => {
    const svg = createCannonPreviewSvg('basic');
    expect(svg).toContain('M-12-7 -24-14 -28-8 -16 3 -12 2z');
    expect(svg).toContain('cannon-preview-barrel-left');
    expect(svg).toContain('cannon-preview-muzzle-flash');
    expect(svg).toContain('cx="-27"');
  });
});
