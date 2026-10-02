import { describe, expect, it } from 'vitest';
import { PLAYER_SKIN_DEFINITIONS } from '../../content/visual/SkinDefinitions';
import { CANNON_SKIN_RASTER_ART, PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

describe('SkinPreviewSvg', () => {
  it('shows the equipped ship PNG and two instances of the same base cannon PNG', () => {
    const card = createPlayerSkinPreviewSvg('spearhead');
    const selected = createPlayerSkinPreviewSvg('spearhead', { animated: true });
    const images = [...card.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]);
    expect(images).toHaveLength(3);
    expect(images[0]).toBe(PLAYER_SHIP_RASTER_ART.spearhead.url);
    expect(images[1]).toBe(CANNON_SKIN_RASTER_ART.spearhead.url);
    expect(images[1]).toBe(images[2]);
    expect(card).toContain('is-static');
    expect(selected).toContain('is-animated');
    expect(selected).not.toMatch(/tether-engine|tether-hull|<script/);
  });

  it('replaces all seven existing ship appearances while retaining their IDs', () => {
    expect(PLAYER_SKIN_DEFINITIONS.map(skin => skin.id)).toContain('spearhead');
    expect(PLAYER_SKIN_DEFINITIONS).toHaveLength(8);
    for (const definition of PLAYER_SKIN_DEFINITIONS) {
      const card = createPlayerSkinPreviewSvg(definition.id);
      const preview = createPlayerSkinPreviewSvg(definition.id, { animated: true });
      const images = [...card.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]);
      expect(images).toHaveLength(3);
      expect(images[0]).toBe(PLAYER_SHIP_RASTER_ART[definition.id].url);
      expect(images[1]).toBe(CANNON_SKIN_RASTER_ART.spearhead.url);
      expect(images[1]).toBe(images[2]);
      expect(card).toContain('is-static');
      expect(preview).toContain('is-animated');
      expect(card).not.toMatch(/<script|tether-engine|tether-hull/i);
    }
  });

  it('keeps static cards still and leaves motion to the inspected modal preview', () => {
    const card = createPlayerSkinPreviewSvg('cyan');
    const preview = createPlayerSkinPreviewSvg('violet', { animated: true });
    expect(card).not.toContain('animateTransform');
    expect(card).toContain('is-static');
    expect(preview).toContain('is-animated');
  });
});
