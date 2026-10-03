import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_DEFINITIONS } from '../../content/visual/CannonSkinDefinitions';
import { CANNON_SKIN_RASTER_ART, PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { createCannonPreviewSvg } from './CannonPreviewSvg';
import { PROJECTILE_ART_URLS, PROJECTILE_SKIN_ART } from '../../assets/fx/projectiles/ProjectileRasterAssets';

describe('CannonPreviewSvg', () => {
  it('uses each production cannon PNG and the original projectile package in its preview', () => {
    for (const definition of CANNON_SKIN_DEFINITIONS) {
      const svg = createCannonPreviewSvg(definition.id);
      expect(svg).toContain('viewBox="-45 -68 90 100"');
      expect(svg).toContain(`href="${CANNON_SKIN_RASTER_ART[definition.id].url}"`);
      expect(svg).not.toContain(`href="${PLAYER_SHIP_RASTER_ART.spearhead.url}"`);
      expect(svg.match(/<image /g)).toHaveLength(6);
      const art = PROJECTILE_SKIN_ART[definition.id];
      expect(svg).toContain(`href="${PROJECTILE_ART_URLS[art.headId]}"`);
      expect(svg).toContain(`href="${PROJECTILE_ART_URLS[art.trailId]}"`);
      expect(svg.match(/class="cannon-preview-fallback"/g)).toHaveLength(4);
      expect(svg).toContain('width="30" height="39"');
      expect(svg).not.toContain('cannon-preview-cables');
      expect(svg.match(/class="cannon-preview-shot"/g)).toHaveLength(2);
      expect(svg).toContain('cannon-preview-muzzle-flash');
      expect(svg).not.toMatch(/<script|filter=|mask=/i);
    }
  });

  it('can render a quiet card thumbnail without animation', () => {
    const svg = createCannonPreviewSvg('rainbow', { animated: false, layout: 'thumbnail' });
    expect(svg).toContain('viewBox="-28 -22 98 44"');
    expect(svg).toContain('transform="rotate(90)"');
    expect(svg.match(/<image /g)).toHaveLength(3);
    expect(svg.match(/class="cannon-preview-projectile"/g)).toHaveLength(1);
    expect(svg).toContain('is-static');
    expect(svg).not.toContain('cannon-preview-shot');
    expect(svg).toContain('#ff668f');
    expect(svg).not.toContain('cannon-preview-muzzle-flash');
  });

  it('keeps two vertical cannons in a reduced-motion modal', () => {
    const svg = createCannonPreviewSvg('basic', { animated: false });
    expect(svg).toContain('viewBox="-45 -68 90 100"');
    expect(svg).not.toContain('transform="rotate(90)"');
    expect(svg.match(/<image /g)).toHaveLength(6);
    expect(svg).not.toContain('cannon-preview-muzzle-flash');
  });

  it('keeps the existing Helix trail separate from the cannon sprite', () => {
    const svg = createCannonPreviewSvg('helix');
    expect(svg).toContain('cannon-preview-trail-helix');
    expect(svg).toContain('stroke="#8de8ff"');
    expect(svg).not.toContain('cannon-preview-trail-curve');
  });

  it('isolates the two real cannon images without a hull or dangling cables', () => {
    const svg = createCannonPreviewSvg('basic');
    expect(svg).not.toContain('cannon-preview-cables');
    for (const ship of Object.values(PLAYER_SHIP_RASTER_ART)) expect(svg).not.toContain(ship.url);
    expect(svg.match(new RegExp(`href="${CANNON_SKIN_RASTER_ART.basic.url}"`, 'g'))).toHaveLength(2);
  });
});
