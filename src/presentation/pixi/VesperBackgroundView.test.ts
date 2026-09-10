import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { VesperBackgroundView } from './VesperBackgroundView';

describe('Vesper Bloom background', () => {
  it('loads only when selected, fits portrait and reuses the shared texture', async () => {
    let calls = 0;
    const view = new VesperBackgroundView(async () => { calls += 1; return Texture.WHITE; });
    view.render(false, 1280, 720);
    expect(calls).toBe(0);
    view.render(true, 390, 844);
    await Promise.resolve();
    expect(calls).toBe(1);
    expect(view.root.visible).toBe(true);
    expect(view.root.width).toBe(844);
    expect(view.root.height).toBe(844);
    view.render(false, 1280, 720);
    view.render(true, 1280, 720);
    expect(calls).toBe(1);
    view.root.destroy();
  });

  it('keeps the fallback hidden after a failed load and ignores a late texture after destroy', async () => {
    const failed = new VesperBackgroundView(async () => undefined);
    failed.render(true, 1280, 720);
    await Promise.resolve();
    expect(failed.root.visible).toBe(false);
    failed.root.destroy();

    const disposed = new VesperBackgroundView(async () => Texture.WHITE);
    disposed.render(true, 1280, 720);
    disposed.root.destroy();
    await Promise.resolve();
    expect(disposed.root.destroyed).toBe(true);
  });
});
