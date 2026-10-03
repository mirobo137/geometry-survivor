import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';
import { CastArt } from './CastArt';
import { getArsenalTexture } from './ArsenalTextures';
vi.mock('./ArsenalTextures', () => ({ getArsenalTexture: vi.fn() }));

describe('stable attack material', () => {
  it('keeps an entire attack on fallback when its PNG arrives late', () => {
    const art = new CastArt();
    vi.mocked(getArsenalTexture).mockReturnValue(null);
    art.begin('pulse', true, 0, 1);
    expect(art.get('pulse', 'echo_shock')).toBeNull();
    vi.mocked(getArsenalTexture).mockReturnValue(Texture.WHITE);
    art.begin('pulse', true, 0.8, 1);
    expect(art.get('pulse', 'echo_shock')).toBeNull();
    art.begin('pulse', true, 0, 2);
    expect(art.get('pulse', 'echo_shock')).toBe(Texture.WHITE);
  });

  it('recognizes reused slots by age reset or inactive state without accumulating attack history', () => {
    const art = new CastArt();
    vi.mocked(getArsenalTexture).mockReturnValue(null);
    art.begin('projectile-0', true, 0.8);
    art.get('projectile-0', 'projectile');
    vi.mocked(getArsenalTexture).mockReturnValue(Texture.WHITE);
    art.begin('projectile-0', true, 0);
    expect(art.get('projectile-0', 'projectile')).toBe(Texture.WHITE);
    art.begin('projectile-0', false, 0);
    vi.mocked(getArsenalTexture).mockReturnValue(null);
    art.begin('projectile-0', true, 0);
    expect(art.get('projectile-0', 'projectile')).toBeNull();
  });
});
