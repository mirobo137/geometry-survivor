import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { MantaWingView } from './MantaWingView';

describe('Manta fins', () => {
  it('shares one texture, hinges symmetrically and reuses pieces for death/revive', async () => {
    const view = new MantaWingView(async () => Texture.WHITE);
    expect(view.render(true, 0, 0, 0)).toBe(false);
    await Promise.resolve();
    expect(view.render(true, 0.7, 1, 0)).toBe(true);
    const [left, right] = view.root.children as Sprite[];
    expect(left.texture).toBe(right.texture);
    expect(left.scale.x).toBe(-right.scale.x);
    expect(left.rotation).toBe(-right.rotation);
    const initial = left.position.x;
    view.render(true, 0.7, 1, 0.8);
    expect(left.position.x).toBeLessThan(initial);
    view.render(true, 0.7, 1, 0);
    expect(left.position.x).toBe(initial);
    expect(view.root.children).toHaveLength(2);
    view.render(false, 1, 0, 0);
    expect(view.root.visible).toBe(false);
  });

  it('keeps fallback active on missing texture and ignores completion after destruction', async () => {
    const failed = new MantaWingView(async () => undefined);
    await Promise.resolve();
    expect(failed.render(true, 1, 0, 0)).toBe(false);
    const disposed = new MantaWingView(async () => Texture.WHITE);
    disposed.root.destroy({ children: true });
    await Promise.resolve();
    expect(disposed.root.destroyed).toBe(true);
  });
});
