import { describe, expect, it } from 'vitest';
import { BufferImageSource, Rectangle, Sprite, Texture } from 'pixi.js';
import { createDefeatFragments, ENEMY_DEFEAT_SECONDS, poseDefeatFragments } from './SingleImageDefeat';

describe('single image defeat partition', () => {
  it('supports a body inside an atlas and scales motion by logical size, not pixels', () => {
    const source = new BufferImageSource({ resource: new Uint8Array(256 * 256 * 4), width: 256, height: 256, resolution: 2 });
    const body = new Texture({ source, frame: new Rectangle(16, 8, 64, 64) });
    const textures = createDefeatFragments(body);
    const sprites = textures.map(texture => { const sprite = new Sprite(texture); sprite.anchor.set(0.5); return sprite; });
    poseDefeatFragments(sprites, body, 0);
    expect(ENEMY_DEFEAT_SECONDS).toBe(0.42);
    expect(textures.reduce((area, texture) => area + texture.width * texture.height, 0)).toBe(4096);
    for (const sprite of sprites) {
      expect(sprite.texture.source).toBe(source);
      expect(sprite.x).toBeCloseTo(sprite.texture.frame.x - 16 + sprite.texture.width / 2 - 32);
      expect(sprite.y).toBeCloseTo(sprite.texture.frame.y - 8 + sprite.texture.height / 2 - 32);
    }
    expect(textures.every(texture => texture.frame.left >= 16 && texture.frame.right <= 80)).toBe(true);
    textures.forEach(texture => texture.destroy(false));
    expect(source.destroyed).toBe(false);
    body.destroy(true);
  });
});
