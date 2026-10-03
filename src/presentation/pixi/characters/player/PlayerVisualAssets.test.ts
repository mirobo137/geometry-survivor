import { describe, expect, it, vi } from 'vitest';
import { Texture, type Renderer } from 'pixi.js';
import { createSvgTexture } from '../../SvgTextureFactory';
import { createPlayerTextures } from './PlayerVisualAssets';

vi.mock('../../SvgTextureFactory', () => ({ createSvgTexture: vi.fn(() => Texture.WHITE) }));

describe('selective player fallback textures', () => {
  it('creates only shared pieces at startup, then memoizes the requested skin', () => {
    vi.mocked(createSvgTexture).mockClear();
    const textures = createPlayerTextures({} as Renderer);
    expect(createSvgTexture).toHaveBeenCalledTimes(2);
    expect(textures.body.cyan).toBe(Texture.WHITE);
    expect(textures.body.cyan).toBe(Texture.WHITE);
    expect(createSvgTexture).toHaveBeenCalledTimes(3);
    expect(textures.body.spearhead).toBe(textures.body.cyan);
    expect(createSvgTexture).toHaveBeenCalledTimes(3);
    expect(textures.weapons.spearhead).toBe(textures.weapons.basic);
    expect(createSvgTexture).toHaveBeenCalledTimes(5);
    expect(Object.keys(textures.weapons)).toHaveLength(8);
  });
});
