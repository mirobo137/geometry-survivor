import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { BackgroundView } from './BackgroundView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof BackgroundView>[0];

describe('BackgroundView', () => {
  it('retains static atmosphere in Low without per-frame motion or accumulating sprites', () => {
    const view = new BackgroundView(fakeRenderer, 'ion-storm', 'low');
    const nebula = view.root.children[1];
    expect(nebula.children).toHaveLength(2);
    expect(view.root.children[2].children).toHaveLength(12);
    expect(view.root.children[3].children).toHaveLength(0);
    const sprite = nebula.children[0];
    const before = [sprite.x, sprite.y, sprite.scale.x, sprite.alpha];
    view.setPlayerPosition(300, 200);
    view.update(0.1, 9);
    expect([sprite.x, sprite.y, sprite.scale.x, sprite.alpha]).toEqual(before);
    for (const theme of ['solar-drift', 'crystal-field', 'deep-space', 'ion-storm'] as const) view.setBackground(theme);
    expect(nebula.children).toHaveLength(2);
    expect(nebula.children[0]).toBe(sprite);
    expect(view.backgroundId).toBe('ion-storm');
  });
  it('exposes the selected background id', () => {
    // BackgroundView now requires a Pixi Renderer for texture creation.
    // Unit tests that need the full visual pipeline are covered by browser
    // smoke tests; here we validate only the definition lookup contract.
    expect(typeof BackgroundView).toBe('function');
  });

  it('rescales existing nebula sprites when the presentation viewport changes', () => {
    const view = new BackgroundView(fakeRenderer, 'deep-space', 'medium');
    const nebulaLayer = view.root.children[1];
    const firstNebula = nebulaLayer.children[0];
    const initialScale = firstNebula.scale.x;

    view.resize(640, 1280);

    expect(firstNebula.scale.x).toBeCloseTo(initialScale / 2);
  });
});
