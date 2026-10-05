import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';

class FakeImage {
  static instances: FakeImage[] = [];
  decoding = '';
  src = '';
  onload: (() => Promise<void>) | null = null;
  onerror: (() => void) | null = null;
  decode = vi.fn(async () => {});
  constructor() { FakeImage.instances.push(this); }
}

describe('lazy arsenal texture ownership', () => {
  beforeEach(() => {
    vi.resetModules();
    FakeImage.instances = [];
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(Texture, 'from').mockReturnValue(Texture.WHITE);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('has a finite catalogue, fetches only the used recipe once and decodes before Texture.from', async () => {
    const { ARSENAL_ART, getArsenalTexture } = await import('./ArsenalTextures');
    expect(Object.keys(ARSENAL_ART)).toHaveLength(65);
    expect(FakeImage.instances).toHaveLength(0);
    expect(getArsenalTexture('rail_lance')).toBeNull();
    getArsenalTexture('rail_lance');
    expect(FakeImage.instances).toHaveLength(1);
    const image = FakeImage.instances[0];
    expect(image.decoding).toBe('async');
    expect(Texture.from).not.toHaveBeenCalled();
    await image.onload?.();
    expect(image.decode).toHaveBeenCalledOnce();
    expect(Texture.from).toHaveBeenCalledWith(image);
    expect(getArsenalTexture('rail_lance')).toBe(Texture.WHITE);
    expect(FakeImage.instances).toHaveLength(1);
  });

  it('does not retry failed network or decode on subsequent frames', async () => {
    const { getArsenalTexture } = await import('./ArsenalTextures');
    getArsenalTexture('echo_shock');
    FakeImage.instances[0].onerror?.();
    for (let i = 0; i < 120; i++) expect(getArsenalTexture('echo_shock')).toBeNull();
    getArsenalTexture('event_horizon');
    FakeImage.instances[1].decode.mockRejectedValueOnce(new Error('decode'));
    await FakeImage.instances[1].onload?.();
    expect(getArsenalTexture('event_horizon')).toBeNull();
    expect(FakeImage.instances).toHaveLength(2);
    expect(Texture.from).not.toHaveBeenCalled();
  });

  it('late completion only updates the shared cache, not a view that left combat', async () => {
    const { getArsenalTexture } = await import('./ArsenalTextures');
    getArsenalTexture('recharging_shield');
    const image = FakeImage.instances[0];
    await image.onload?.();
    expect(image.onload).toBeNull();
    expect(image.onerror).toBeNull();
    expect(getArsenalTexture('recharging_shield')).toBe(Texture.WHITE);
  });

  it('shares explicit preparation with lazy render and the magnetic pack', async () => {
    const { getArsenalTexture, loadArsenalTexture, MAGNETIC_ART_IDS } = await import('./ArsenalTextures');
    getArsenalTexture('magnetic_core');
    const first = loadArsenalTexture('magnetic_core');
    expect(loadArsenalTexture('magnetic_core')).toBe(first);
    const all = Promise.all(MAGNETIC_ART_IDS.map(loadArsenalTexture));
    expect(FakeImage.instances).toHaveLength(4);
    for (const image of FakeImage.instances) await image.onload?.();
    expect(await first).toBe(Texture.WHITE);
    expect(await all).toEqual([Texture.WHITE, Texture.WHITE, Texture.WHITE, Texture.WHITE]);
    expect(Texture.from).toHaveBeenCalledTimes(4);
  });

  it('prepares only the selected recipe with a finite deadline for a hanging image', async () => {
    const { getWeaponArtIds, prepareArsenalTextures } = await import('./ArsenalTextures');
    expect(getWeaponArtIds('chain', 'thunderhead')).toEqual(['thunderhead', 'magnetic_core', 'thunderhead_burst']);
    await prepareArsenalTextures(['projectile', 'projectile'], 5);
    expect(FakeImage.instances).toHaveLength(1);
  });

  it('decodes only the equipped bullet pack once and Low requests only its head', async () => {
    const { prepareArsenalTextures, getArsenalTexture } = await import('./ArsenalTextures');
    const { getProjectileSkinArtIds } = await import('../../../assets/fx/projectiles/ProjectileRasterAssets');
    expect(getProjectileSkinArtIds('helix', false)).toEqual(['shot_helix']);
    await prepareArsenalTextures(getProjectileSkinArtIds('helix', false), 5);
    expect(FakeImage.instances).toHaveLength(1);
    await FakeImage.instances[0].onload?.();
    const high = prepareArsenalTextures(getProjectileSkinArtIds('helix'));
    expect(FakeImage.instances).toHaveLength(2);
    await FakeImage.instances[1].onload?.();
    await high;
    for (let i = 0; i < 300; i++) getArsenalTexture('shot_helix');
    expect(FakeImage.instances).toHaveLength(2);
    expect(Texture.from).toHaveBeenCalledTimes(2);
  });
});
