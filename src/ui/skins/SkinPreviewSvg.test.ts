import { describe, expect, it } from 'vitest';
import { PLAYER_SKIN_DEFINITIONS } from '../../content/visual/SkinDefinitions';
import { PLAYER_SHIP_RASTER_ART } from '../../assets/skins/SkinRasterAssets';
import { createPlayerSkinPreviewSvg } from './SkinPreviewSvg';

describe('SkinPreviewSvg', () => {
  it('shows only the equipped ship PNG using its combat aspect ratio', () => {
    const card = createPlayerSkinPreviewSvg('spearhead');
    const selected = createPlayerSkinPreviewSvg('spearhead', { animated: true });
    const images = [...card.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]);
    expect(images).toHaveLength(1);
    expect(images[0]).toBe(PLAYER_SHIP_RASTER_ART.spearhead.url);
    expect(card).toContain('--ship-preview-aspect: 56 / 64');
    expect(card).not.toMatch(/tethered-preview-gun|<svg|<path/);
    expect(card).toContain('is-static');
    expect(selected).toContain('is-animated');
    expect(selected).not.toMatch(/tether-engine|tether-hull|<script/);
  });

  it('covers ten complete raster ships while retaining existing IDs', () => {
    expect(PLAYER_SKIN_DEFINITIONS.map(skin => skin.id)).toContain('spearhead');
    expect(PLAYER_SKIN_DEFINITIONS.filter(skin => skin.acquisition === 'default' || skin.acquisition === 'nova')).toHaveLength(10);
    expect(PLAYER_SKIN_DEFINITIONS.filter(skin => skin.acquisition === 'event' || skin.acquisition === 'daily-wheel')).toHaveLength(10);
    for (const definition of PLAYER_SKIN_DEFINITIONS) {
      const card = createPlayerSkinPreviewSvg(definition.id);
      const preview = createPlayerSkinPreviewSvg(definition.id, { animated: true });
      const images = [...card.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]);
      expect(images).toHaveLength(1);
      expect(images[0]).toBe(PLAYER_SHIP_RASTER_ART[definition.id].url);
      expect(card).not.toMatch(/tethered-preview-gun|<svg|<path/);
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
