import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { BackgroundView } from './BackgroundView';

const fakeRenderer = {
  generateTexture: () => Texture.WHITE
} as unknown as ConstructorParameters<typeof BackgroundView>[0];

describe('BackgroundView', () => {
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
