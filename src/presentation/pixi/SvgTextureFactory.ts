import { Graphics, Rectangle } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';

export interface SvgTextureFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Rasterizes an SVG into an explicit logical frame.
 *
 * Pixi otherwise crops generated textures to each Graphics object's visible
 * bounds. Modular pieces would then receive different texture centers even
 * when their SVG files share a viewBox, breaking alignment and rotation.
 */
export const createSvgTexture = (
  renderer: Renderer,
  svg: string,
  frame: SvgTextureFrame
): Texture => {
  const graphics = new Graphics().svg(svg);
  try {
    return renderer.generateTexture({
      target: graphics,
      frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
      resolution: 1,
      antialias: false,
      defaultAnchor: { x: 0.5, y: 0.5 }
    });
  } finally {
    graphics.destroy();
  }
};
