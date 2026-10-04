import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

const mockImages = (failure: 'none' | 'decode' | 'shape' | 'network' = 'none'): void => {
  class TestImage {
    public decoding = '';
    public onload: (() => Promise<void>) | null = null;
    public onerror: (() => void) | null = null;
    public naturalWidth = 96;
    public naturalHeight = 96;
    public set src(url: string) {
      this.naturalWidth = /core-sentinel|orbital-warden|fracture-engine/.test(url) ? 168 : 96;
      this.naturalHeight = failure === 'shape' ? 1 : this.naturalWidth;
      queueMicrotask(() => { if (failure === 'network') this.onerror?.(); else void this.onload?.(); });
    }
    public async decode(): Promise<void> { if (failure === 'decode') throw new Error('decode failed'); }
  }
  vi.stubGlobal('Image', TestImage);
};

describe('enemy PNG texture loading', () => {
  it('decodes once and keeps high-detail pixels in 64/112 logical combat frames', async () => {
    mockImages();
    const from = vi.spyOn(Texture, 'from').mockReturnValue(Texture.EMPTY);
    const { loadEnemyRasterTextures } = await import('./EnemyRasterTextures');
    const [first, second] = await Promise.all([loadEnemyRasterTextures(), loadEnemyRasterTextures()]);
    expect(Object.keys(first)).toHaveLength(16);
    expect(second).toEqual(first);
    expect(from).toHaveBeenCalledTimes(16);
    for (const [options] of from.mock.calls) {
      const source = options as { resource: { naturalWidth: number }; resolution: number };
      expect(source.resource.naturalWidth / source.resolution).toBe(source.resource.naturalWidth === 168 ? 112 : 64);
      expect(source.resolution).toBe(1.5);
    }
  });

  it.each(['decode', 'shape', 'network'] as const)('preserves the SVG fallback on %s failure', async failure => {
    mockImages(failure);
    const from = vi.spyOn(Texture, 'from').mockReturnValue(Texture.EMPTY);
    const { loadEnemyRasterTextures } = await import('./EnemyRasterTextures');
    expect(await loadEnemyRasterTextures()).toEqual({});
    expect(from).not.toHaveBeenCalled();
  });

  it('does not create a browser resource during a headless simulation test', async () => {
    vi.stubGlobal('Image', undefined);
    const from = vi.spyOn(Texture, 'from').mockReturnValue(Texture.EMPTY);
    const { loadEnemyRasterTextures } = await import('./EnemyRasterTextures');
    expect(await loadEnemyRasterTextures()).toEqual({});
    expect(from).not.toHaveBeenCalled();
  });

  it('ships 16 PNG masters and bounded transparent WebP runtime derivatives', async () => {
    const { ENEMY_RASTER_COMMON_IDS, ENEMY_RASTER_BOSS_IDS } = await import('./EnemyRasterTextures');
    let bytes = 0;
    for (const id of [...ENEMY_RASTER_COMMON_IDS, ...ENEMY_RASTER_BOSS_IDS]) {
      const boss = (ENEMY_RASTER_BOSS_IDS as readonly string[]).includes(id);
      const png = readFileSync(new URL(`../../../assets/images/enemies/${id}.png`, import.meta.url));
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(boss ? 224 : 128);
      expect(png.readUInt32BE(20)).toBe(boss ? 224 : 128);
      expect(png[25]).toBe(6); // PNG master is true RGBA.
      const webp = readFileSync(new URL(`../../../assets/images/enemies/${id}.webp`, import.meta.url));
      expect(webp.toString('ascii', 0, 4)).toBe('RIFF');
      expect(webp.toString('ascii', 8, 12)).toBe('WEBP');
      expect(webp.toString('ascii', 12, 16)).toBe('VP8X');
      expect(webp[20] & 0x10).toBe(0x10); // Alpha, not a painted background.
      expect(webp.readUIntLE(24, 3) + 1).toBe(boss ? 168 : 96);
      expect(webp.readUIntLE(27, 3) + 1).toBe(boss ? 168 : 96);
      bytes += webp.length;
    }
    expect(bytes).toBeLessThan(100_000);
  });
});
