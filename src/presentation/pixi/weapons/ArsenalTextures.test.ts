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

  it('has all twenty-one new assets, fetches only the used recipe once and decodes before Texture.from', async () => {
    const { ARSENAL_ART, getArsenalTexture } = await import('./ArsenalTextures');
    expect(Object.keys(ARSENAL_ART)).toHaveLength(25);
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
});
