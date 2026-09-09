import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BLOOM_TRAIL_ASSET } from './BloomAssets';

describe('Bloomwake asset contract', () => {
  it('publishes a bounded transparent RGBA trail texture', () => {
    const png = readFileSync(new URL('./bloom-trail.png', import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(BLOOM_TRAIL_ASSET.width);
    expect(png.readUInt32BE(20)).toBe(BLOOM_TRAIL_ASSET.height);
    expect(png[25]).toBe(6);
    expect(png.length).toBeLessThan(64 * 1024);
    expect(BLOOM_TRAIL_ASSET.maxInstances).toBeLessThanOrEqual(32);
  });
});
