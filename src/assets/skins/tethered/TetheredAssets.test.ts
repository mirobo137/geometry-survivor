import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TETHERED_SHIP_ART } from './TetheredAssets';

describe('Tethered prototype asset contract', () => {
  it('ships small genuine RGBA PNG sources, not SVG in bitmap wrappers', () => {
    let bytes = 0;
    for (const [part, size] of [['ship', 256], ['cannon', 128]] as const) {
      const png = readFileSync(new URL(`./tether-${part}.png`, import.meta.url));
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
      expect(png[25]).toBe(6); // RGBA colour type.
      bytes += png.length;
    }
    expect(bytes).toBeLessThan(100_000);
    expect(existsSync(new URL('./tether-hull.png', import.meta.url))).toBe(false);
    expect(existsSync(new URL('./tether-engine.png', import.meta.url))).toBe(false);
    expect(TETHERED_SHIP_ART.cannon.anchorY).toBe(0.08);
    expect(TETHERED_SHIP_ART.cableSegments).toBeLessThanOrEqual(8);
  });
});
