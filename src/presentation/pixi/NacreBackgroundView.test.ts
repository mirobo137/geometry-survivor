import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { NacreBackgroundView } from './NacreBackgroundView';

describe('Nacre background', () => {
  it('loads lazily, reuses its texture on resize and honours selection after async completion', async () => {
    let calls = 0;
    const view = new NacreBackgroundView(async () => { calls++; return Texture.WHITE; });
    view.render(false, 1280, 720);
    expect(calls).toBe(0);
    view.render(true, 1280, 720);
    view.render(false, 720, 1280);
    await Promise.resolve();
    expect(view.root.visible).toBe(false);
    view.render(true, 720, 1280);
    expect(calls).toBe(1);
    expect(view.root.visible).toBe(true);
    expect(view.root.width).toBe(1280);
    expect(view.root.height).toBe(1280);
    expect(view.root.x).toBe(360);
    expect(view.root.texture).toBe(Texture.WHITE);
    view.root.destroy();
  });

  it('retains fallback on failure and ignores loading after destruction', async () => {
    const failed = new NacreBackgroundView(async () => undefined);
    failed.render(true, 720, 1280);
    await Promise.resolve();
    expect(failed.root.visible).toBe(false);
    failed.root.destroy();
    const disposed = new NacreBackgroundView(async () => Texture.WHITE);
    disposed.render(true, 1280, 720);
    disposed.root.destroy();
    await Promise.resolve();
    expect(disposed.root.destroyed).toBe(true);
  });
});
