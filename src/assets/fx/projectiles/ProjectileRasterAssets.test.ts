import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECTILE_ART_URLS, PROJECTILE_HEAD_SIZE, PROJECTILE_SKIN_ART, getProjectileSkinArtIds } from './ProjectileRasterAssets';
import { CANNON_SKIN_DEFINITIONS } from '../../../content/visual/CannonSkinDefinitions';

describe('generated bullet material contract', () => {
  it('covers every cannon with unique bounded RGBA head and trail, not a renamed SVG', () => {
    const directory = new URL('./', import.meta.url);
    expect(readdirSync(directory).filter(name => name.endsWith('.png'))).toHaveLength(16);
    expect(new Set(Object.values(PROJECTILE_ART_URLS)).size).toBe(16);
    let total = 0;
    for (const { id } of CANNON_SKIN_DEFINITIONS) {
      const art = PROJECTILE_SKIN_ART[id];
      expect(getProjectileSkinArtIds(id)).toEqual([art.headId, art.trailId]);
      expect(getProjectileSkinArtIds(id, false)).toEqual([art.headId]);
      for (const part of ['head', 'trail'] as const) {
        const png = readFileSync(new URL(`${id}-${part}.png`, directory));
        expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
        expect(png.readUInt32BE(16)).toBe(part === 'head' ? 96 : 128);
        expect(png.readUInt32BE(20)).toBe(part === 'head' ? 48 : 32);
        expect(png[24]).toBe(8);
        expect(png[25]).toBe(6);
        expect(png[28]).toBe(0);
        expect(png.length).toBeLessThan(12_000);
        total += png.length;
      }
    }
    expect(total).toBeLessThan(120_000);
    expect(PROJECTILE_HEAD_SIZE).toEqual({ width: 36, height: 18 });
  });
});
