import { expect, it } from 'vitest';
import { createProjectileTrailTextures } from './ProjectileTrailTexture';

it('bakes a pointed transparent tail with continuous age bands on a shared source', () => {
  const textures = createProjectileTrailTextures();
  const source = textures[0].source;
  const pixels = source.resource as Uint8Array;
  const alpha = (x: number, y: number) => pixels[(y * 128 + x) * 4 + 3];
  expect(textures.every(texture => texture.source === source)).toBe(true);
  expect(textures.map(texture => texture.frame.x)).toEqual([0, 32, 64, 96]);
  expect(alpha(0, 16)).toBeLessThan(2);
  expect(alpha(127, 16)).toBeGreaterThan(240);
  expect(alpha(64, 0)).toBe(0);
  expect(alpha(31, 16)).toBeLessThanOrEqual(alpha(32, 16));
  for (const texture of textures) texture.destroy(false);
  source.destroy();
});
