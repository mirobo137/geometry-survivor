import { BufferImageSource, Rectangle, Texture } from 'pixi.js';

/** One 128x32 white energy ribbon, sliced into four connected age bands.
 * CPU baking happens once per view; no canvas, filters or per-frame uploads.
 */
export const createProjectileTrailTextures = (): Texture[] => {
  const width = 128;
  const height = 32;
  const pixels = new Uint8Array(width * height * 4);
  for (let x = 0; x < width; x += 1) {
    const progress = (x + 0.5) / width;
    const radius = 0.46 * Math.pow(progress, 0.7);
    for (let y = 0; y < height; y += 1) {
      const lateral = Math.abs((y + 0.5) / height - 0.5) / radius;
      const alpha = Math.pow(progress, 1.35) * Math.pow(Math.max(0, 1 - lateral * lateral), 1.5);
      const offset = (y * width + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  const source = new BufferImageSource({ resource: pixels, width, height, format: 'rgba8unorm', alphaMode: 'no-premultiply-alpha', scaleMode: 'linear' });
  return Array.from({ length: 4 }, (_, index) => new Texture({ source, frame: new Rectangle(index * 32, 0, 32, height) }));
};
