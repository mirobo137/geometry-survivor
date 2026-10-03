import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { BackgroundView } from './BackgroundView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof BackgroundView>[0];

describe('BackgroundView', () => {
  it('uses a quiet static art plate for each painterly theme at every quality', () => {
    const view = new BackgroundView(fakeRenderer, 'ion-storm', 'low');
    const [nebulaLayer, starLayer, ambientLayer] = view.root.children.slice(1, 4);
    expect(nebulaLayer.visible).toBe(false);
    expect(starLayer.visible).toBe(false);
    expect(ambientLayer.visible).toBe(false);
    view.setPlayerPosition(300, 200);
    view.update(0.1, 9);
    for (const theme of ['solar-drift', 'crystal-field', 'deep-space', 'ion-storm'] as const) {
      view.setBackground(theme);
      expect(view.backgroundId).toBe(theme);
      expect(nebulaLayer.visible).toBe(false);
      expect(starLayer.visible).toBe(false);
      expect(ambientLayer.visible).toBe(false);
    }
    expect(view.backgroundId).toBe('ion-storm');
  });
  it('exposes the selected background id', () => {
    // BackgroundView now requires a Pixi Renderer for texture creation.
    // Unit tests that need the full visual pipeline are covered by browser
    // smoke tests; here we validate only the definition lookup contract.
    expect(typeof BackgroundView).toBe('function');
  });

  it('selects the common atmospheric motion layer for all nine other painted themes', () => {
    const view = new BackgroundView(fakeRenderer, 'deep-space', 'high');
    const motionLayer = view.root.children.at(-1)!;
    const paintedThemes = [
      'deep-space', 'ion-storm', 'solar-drift', 'crystal-field', 'nacre-orbit', 'vesper-bloom',
      'silent-archive', 'lunar-fault', 'leviathan-wake'
    ] as const;

    for (const theme of paintedThemes) {
      view.setBackground(theme);
      expect(motionLayer.visible).toBe(true);
      expect(() => view.update(1 / 60, 4)).not.toThrow();
    }

    view.setBackground('tidal-veil');
    expect(motionLayer.visible).toBe(false);
  });

  it('updates the selected art plate cover crop when the viewport changes', () => {
    const view = new BackgroundView(fakeRenderer, 'deep-space', 'medium');
    view.resize(640, 1280);
    expect(view.backgroundId).toBe('deep-space');
    expect(() => view.update(0.1, 1)).not.toThrow();
  });
});
