import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { StaticRasterBackgroundView } from './StaticRasterBackgroundView';

describe('raster background base motion', () => {
  it('adds clearly measurable but restrained pan and breathing to the existing image sprite', async () => {
    const view = new StaticRasterBackgroundView(async () => Texture.WHITE);
    view.render(true, 1280, 720);
    await Promise.resolve();

    const image = view.root.children[0] as Sprite;
    const base = { x: image.x, y: image.y, scaleX: image.scale.x, scaleY: image.scale.y };
    expect(image.width).toBeCloseTo(1280 * 1.025);
    expect(image.height).toBeCloseTo(1280 * 1.025);

    view.update(0, true);
    const start = { x: image.x, y: image.y, scaleX: image.scale.x };
    view.update(4, true);
    expect(Math.abs(image.x - start.x)).toBeGreaterThan(6);
    expect(Math.abs(image.x - start.x)).toBeLessThanOrEqual(12);
    expect(Math.abs(image.y - start.y)).toBeGreaterThan(2.5);
    expect(Math.abs(image.y - start.y)).toBeLessThanOrEqual(10);
    expect(image.scale.x).toBeGreaterThan(start.scaleX);
    expect(image.scale.x).toBeGreaterThan(base.scaleX * 1.001);
    expect(image.scale.x).toBeLessThanOrEqual(base.scaleX * 1.015);
    expect(image.scale.y).toBeLessThanOrEqual(base.scaleY * 1.015);

    view.update(4, false);
    expect(image.x).toBeCloseTo(base.x);
    expect(image.y).toBeCloseTo(base.y);
    expect(image.scale.x).toBeCloseTo(base.scaleX);
    expect(image.scale.y).toBeCloseTo(base.scaleY);
    view.root.destroy({ children: true });
  });

  it('keeps the image still under reduced motion and resets its transform on resize', async () => {
    const view = new StaticRasterBackgroundView(async () => Texture.WHITE, true);
    view.render(true, 1280, 720);
    await Promise.resolve();
    const image = view.root.children[0] as Sprite;

    view.update(0, true);
    const initial = { x: image.x, y: image.y, scaleX: image.scale.x, scaleY: image.scale.y };
    view.update(24, true);
    expect(image.x).toBeCloseTo(initial.x);
    expect(image.y).toBeCloseTo(initial.y);
    expect(image.scale.x).toBeCloseTo(initial.scaleX);
    expect(image.scale.y).toBeCloseTo(initial.scaleY);

    view.render(true, 720, 1280);
    expect(image.x).toBe(360);
    expect(image.y).toBe(640);
    expect(image.width).toBeCloseTo(1280 * 1.025);
    expect(image.height).toBeCloseTo(1280 * 1.025);
    view.root.destroy({ children: true });
  });
});
