import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_DEFINITIONS } from '../../content/visual/CannonSkinDefinitions';
import { CANNON_SKIN_RASTER_ART, PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { createCannonPreviewSvg } from './CannonPreviewSvg';

describe('CannonPreviewSvg', () => {
  it('uses each production cannon PNG and the original projectile package in its preview', () => {
    for (const definition of CANNON_SKIN_DEFINITIONS) {
      const svg = createCannonPreviewSvg(definition.id);
      expect(svg).toContain('viewBox="-45 -53 90 97"');
      expect(svg).toContain(`href="${CANNON_SKIN_RASTER_ART[definition.id].url}"`);
      expect(svg).toContain(`href="${PLAYER_SHIP_RASTER_ART.spearhead.url}"`);
      expect(svg.match(/class="cannon-preview-shot"/g)).toHaveLength(2);
      expect(svg).toContain('cannon-preview-muzzle-flash');
      expect(svg).not.toMatch(/<script|filter=|mask=/i);
    }
  });

  it('can render a quiet card thumbnail without animation', () => {
    const svg = createCannonPreviewSvg('rainbow', { animated: false });
    expect(svg).toContain('is-static');
    expect(svg).not.toContain('cannon-preview-shot');
    expect(svg).toContain('#ff668f');
    expect(svg).not.toContain('cannon-preview-muzzle-flash');
  });

  it('keeps the existing Helix trail separate from the cannon sprite', () => {
    const svg = createCannonPreviewSvg('helix');
    expect(svg).toContain('cannon-preview-trail-helix');
    expect(svg).toContain('stroke="#8de8ff"');
    expect(svg).not.toContain('cannon-preview-trail-curve');
  });

  it('orders cables, the Ivory Spear hull, and the real linked cannon images', () => {
    const svg = createCannonPreviewSvg('basic');
    expect(svg.indexOf('cannon-preview-cables')).toBeLessThan(svg.indexOf(`href="${PLAYER_SHIP_RASTER_ART.spearhead.url}"`));
    expect(svg.indexOf(`href="${PLAYER_SHIP_RASTER_ART.spearhead.url}"`)).toBeLessThan(svg.indexOf(`href="${CANNON_SKIN_RASTER_ART.basic.url}"`));
    expect(svg.match(new RegExp(`href="${CANNON_SKIN_RASTER_ART.basic.url}"`, 'g'))).toHaveLength(2);
  });
});
