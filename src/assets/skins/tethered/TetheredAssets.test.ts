import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { CANNON_SKIN_RASTER_ART, LINKED_CANNON_LAYOUT, PLAYER_SHIP_RASTER_ART } from '../SkinRasterAssets';
import { getRewardCosmetic } from '../../../content/retention/RewardCosmeticDefinitions';
import { TETHERED_SHIP_ART } from './TetheredAssets';

const pngAlpha = (png: Buffer, width: number, height: number): Uint8Array => {
  let offset = 8;
  const idat: Buffer[] = [];
  while (offset < png.length) {
    const size = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
    if (type === 'IEND') break;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const rowBytes = width * 4;
  const decoded = new Uint8Array(rowBytes * height);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const source = y * (rowBytes + 1);
    const target = y * rowBytes;
    const filter = raw[source];
    for (let x = 0; x < rowBytes; x += 1) {
      const value = raw[source + 1 + x];
      const left = x >= 4 ? decoded[target + x - 4] : 0;
      const up = y > 0 ? decoded[target + x - rowBytes] : 0;
      const upperLeft = y > 0 && x >= 4 ? decoded[target + x - rowBytes - 4] : 0;
      const predictor = filter === 1 ? left
        : filter === 2 ? up
          : filter === 3 ? Math.floor((left + up) / 2)
            : filter === 4 ? paeth(left, up, upperLeft) : 0;
      decoded[target + x] = (value + predictor) & 0xff;
    }
  }
  const alpha = new Uint8Array(width * height);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = decoded[pixel * 4 + 3];
  return alpha;
};

const assertRgbaAsset = (path: URL, width: number, height = width): number => {
  const png = readFileSync(path);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(png.readUInt32BE(16)).toBe(width);
  expect(png.readUInt32BE(20)).toBe(height);
  expect(png[24]).toBe(8); // Eight bits per channel.
  expect(png[25]).toBe(6); // RGBA colour type.
  expect(png[28]).toBe(0); // Non-interlaced; no runtime decoder surprises.
  const alpha = pngAlpha(png, width, height);
  expect(alpha[0]).toBe(0);
  expect(alpha[width - 1]).toBe(0);
  expect(alpha[(height - 1) * width]).toBe(0);
  expect(alpha[width * height - 1]).toBe(0);
  expect(alpha.includes(0)).toBe(true);
  expect(alpha.includes(255)).toBe(true);
  return png.length;
};

describe('PNG ship and cannon skin contract', () => {
  it('ships ten square RGBA ships with true transparency and bounded file size', () => {
    const ids = Object.keys(PLAYER_SHIP_RASTER_ART) as (keyof typeof PLAYER_SHIP_RASTER_ART)[];
    const catalogIds = ids.filter((id) => !getRewardCosmetic(id));
    expect(catalogIds).toEqual(['cyan', 'violet', 'amber', 'emerald', 'obsidian', 'nova', 'manta', 'spearhead', 'corsair', 'nautilus']);
    let bytes = 0;
    for (const id of catalogIds) {
      const path = id === 'spearhead'
        ? new URL('./tether-ship.png', import.meta.url)
        : new URL(`../ships/${id}.png`, import.meta.url);
      bytes += assertRgbaAsset(path, 256);
      expect(PLAYER_SHIP_RASTER_ART[id]).toMatchObject({ width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 });
    }
    expect(bytes).toBeLessThan(850_000);
    expect(existsSync(new URL('./tether-hull.png', import.meta.url))).toBe(false);
    expect(existsSync(new URL('./tether-engine.png', import.meta.url))).toBe(false);
  });

  it('keeps the weekly Asterion as a distinct transparent event ship, outside the ten-skin base catalog', () => {
    const master = new URL('../ships/asterion/asterion.png', import.meta.url);
    const runtime = new URL('../ships/asterion/asterion.webp', import.meta.url);
    const masterBytes = assertRgbaAsset(master, 224, 256);
    expect(masterBytes).toBeLessThan(80_000);
    expect(readFileSync(runtime).byteLength).toBeLessThan(20_000);
    expect(existsSync(runtime)).toBe(true);
    expect(PLAYER_SHIP_RASTER_ART.asterion).toMatchObject({ width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 });
  });

  it('ships ten square RGBA cannons while sharing one texture per two barrels', () => {
    const ids = (Object.keys(CANNON_SKIN_RASTER_ART) as (keyof typeof CANNON_SKIN_RASTER_ART)[]).filter(id => !getRewardCosmetic(id));
    expect(ids).toEqual(['basic', 'curve', 'smoke', 'rainbow', 'lattice', 'helix', 'bloom', 'spearhead', 'gyre', 'razor']);
    let bytes = 0;
    for (const id of ids) {
      const path = id === 'spearhead'
        ? new URL('./tether-cannon.png', import.meta.url)
        : new URL(`../cannons/${id}.png`, import.meta.url);
      bytes += assertRgbaAsset(path, 128);
      expect(CANNON_SKIN_RASTER_ART[id]).toMatchObject({ width: 30, height: 39, anchorX: 0.5, anchorY: 0.08 });
    }
    expect(bytes).toBeLessThan(190_000);
    expect(CANNON_SKIN_RASTER_ART.spearhead.url).toContain('tether-cannon');
    expect(CANNON_SKIN_RASTER_ART.basic.cableAnchorY).toBe(0.9);
    expect(CANNON_SKIN_RASTER_ART.spearhead.cableAnchorY).toBe(0.84);
    expect(TETHERED_SHIP_ART.cannon.anchorY).toBe(0.08);
    expect(LINKED_CANNON_LAYOUT).toMatchObject({ cablePortX: 11, cablePortY: 7, cableSegments: 8 });
  });

  it('keeps Solstice and the hollow wheel frame truly transparent and bounded', () => {
    expect(assertRgbaAsset(new URL('../ships/solstice/solstice.png', import.meta.url), 224, 256)).toBeLessThan(90_000);
    expect(readFileSync(new URL('../ships/solstice/solstice.webp', import.meta.url)).length).toBeLessThan(20_000);
    const rim = readFileSync(new URL('../../images/ui/retention/wheel-rim.png', import.meta.url));
    expect(assertRgbaAsset(new URL('../../images/ui/retention/wheel-rim.png', import.meta.url), 512)).toBeLessThan(250_000);
    expect(pngAlpha(rim, 512, 512)[256 * 512 + 256]).toBe(0);
    expect(readFileSync(new URL('../../images/ui/retention/wheel-rim.webp', import.meta.url)).length).toBeLessThan(50_000);
    expect(PLAYER_SHIP_RASTER_ART.solstice).toMatchObject({ width: 56, height: 64, anchorX: 0.5, anchorY: 0.5 });
  });
});
