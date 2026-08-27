import { Graphics } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';

export const createTexture = (renderer: Renderer, draw: (graphics: Graphics) => void): Texture => {
  const graphics = new Graphics();
  draw(graphics);
  const texture = renderer.generateTexture({
    target: graphics,
    resolution: 1,
    antialias: false,
    defaultAnchor: { x: 0.5, y: 0.5 }
  });
  graphics.destroy();
  return texture;
};
