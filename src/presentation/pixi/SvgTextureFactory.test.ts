import { afterEach, describe, expect, it, vi } from 'vitest';
import { Graphics, Texture } from 'pixi.js';
import type { GenerateTextureOptions, Renderer } from 'pixi.js';
import { createSvgTexture } from './SvgTextureFactory';

afterEach(() => vi.restoreAllMocks());

describe('createSvgTexture', () => {
  it('preserves the declared logical frame instead of trimming visible bounds', () => {
    const parseSvg = vi.spyOn(Graphics.prototype, 'svg').mockImplementation(function (this: Graphics) {
      return this;
    });
    let captured: GenerateTextureOptions | null = null;
    const renderer = {
      generateTexture: (options: GenerateTextureOptions) => {
        captured = options;
        return Texture.EMPTY;
      }
    } as unknown as Renderer;

    const texture = createSvgTexture(
      renderer,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64"><circle cx="0" cy="-24" r="2"/></svg>',
      { x: -32, y: -32, width: 64, height: 64 }
    );

    expect(texture).toBe(Texture.EMPTY);
    expect(captured).not.toBeNull();
    expect(captured!.frame).toMatchObject({ x: -32, y: -32, width: 64, height: 64 });
    expect(captured!.defaultAnchor).toEqual({ x: 0.5, y: 0.5 });
    expect(parseSvg).toHaveBeenCalledOnce();
  });
});
