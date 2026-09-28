import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { TidalVeilBackgroundView } from './TidalVeilBackgroundView';

describe('Tidal Veil background currents', () => {
  it('loads shared corner textures only when selected and animates all four corners independently', async () => {
    const calls = [0, 0, 0];
    const view = new TidalVeilBackgroundView(
      async () => { calls[0] += 1; return Texture.WHITE; },
      async () => { calls[1] += 1; return Texture.WHITE; },
      async () => { calls[2] += 1; return Texture.WHITE; }
    );

    view.render(false, 1280, 720);
    expect(calls).toEqual([0, 0, 0]);
    view.render(true, 1280, 720);
    await Promise.resolve();

    // Four sprites reuse two transparent textures; the loader is shared/cached.
    expect(calls).toEqual([1, 2, 2]);
    expect(view.root.visible).toBe(true);
    const [plate, topLeft, bottomRight, topRight, bottomLeft] = view.root.children as [
      Sprite, Sprite, Sprite, Sprite, Sprite
    ];
    const currents = [topLeft, bottomRight, topRight, bottomLeft];
    expect(currents.every(current => current.visible)).toBe(true);
    expect(topRight.scale.x).toBeLessThan(0);
    expect(bottomLeft.scale.x).toBeLessThan(0);
    expect(topLeft.texture).toBe(topRight.texture);
    expect(bottomRight.texture).toBe(bottomLeft.texture);

    view.update(0, false);
    const platePosition = { x: plate.x, y: plate.y };
    const plateScale = { x: plate.scale.x, y: plate.scale.y };
    const resting = currents.map(current => ({ x: current.x, y: current.y }));
    view.update(0, true);
    const plateStart = { x: plate.x, y: plate.y, scaleX: plate.scale.x };
    const starts = currents.map(current => ({ x: current.x, y: current.y }));
    // The drift should be plainly measurable within a short gameplay window,
    // not only after waiting through a minute-long cycle.
    view.update(4, true);
    expect(Math.abs(plate.x - plateStart.x)).toBeGreaterThan(6);
    expect(Math.abs(plate.x - plateStart.x)).toBeLessThanOrEqual(12);
    expect(Math.abs(plate.y - plateStart.y)).toBeGreaterThan(2.5);
    expect(plate.scale.x).toBeGreaterThan(plateStart.scaleX);
    expect(plate.scale.x).toBeLessThanOrEqual(plateScale.x * 1.015);
    currents.forEach((current, index) => {
      expect(Math.abs(current.x - starts[index].x)).toBeGreaterThan(20);
    });
    expect(currents[0].x - starts[0].x).not.toBeCloseTo(currents[2].x - starts[2].x);
    expect(currents[1].x - starts[1].x).not.toBeCloseTo(currents[3].x - starts[3].x);

    view.update(12, false);
    expect(plate.x).toBeCloseTo(platePosition.x);
    expect(plate.y).toBeCloseTo(platePosition.y);
    expect(plate.scale.x).toBeCloseTo(plateScale.x);
    expect(plate.scale.y).toBeCloseTo(plateScale.y);
    currents.forEach((current, index) => {
      expect(current.x).toBeCloseTo(resting[index].x);
      expect(current.y).toBeCloseTo(resting[index].y);
    });
    view.root.destroy({ children: true });
  });

  it('keeps asynchronous layers hidden when the background is no longer selected', async () => {
    let resolveBase: ((texture: Texture) => void) | undefined;
    const base = new Promise<Texture>(resolve => { resolveBase = resolve; });
    const view = new TidalVeilBackgroundView(
      () => base,
      async () => Texture.WHITE,
      async () => Texture.WHITE
    );
    view.render(true, 720, 1280);
    view.render(false, 720, 1280);
    resolveBase?.(Texture.WHITE);
    await Promise.resolve();
    await Promise.resolve();
    expect(view.root.visible).toBe(false);
    const currents = view.root.children.slice(1) as Sprite[];
    expect(currents).toHaveLength(4);
    expect(currents.every(current => !current.visible)).toBe(true);
    view.root.destroy({ children: true });
  });

  it('places vapor at all four visible portrait corners', async () => {
    const view = new TidalVeilBackgroundView(
      async () => Texture.WHITE,
      async () => Texture.WHITE,
      async () => Texture.WHITE
    );
    view.render(true, 720, 1280);
    await Promise.resolve();
    const currents = view.root.children.slice(1) as Sprite[];
    for (const [index, current] of currents.entries()) {
      expect(current.x + current.width / 2).toBeGreaterThan(100);
      expect(current.x - current.width / 2).toBeLessThan(620);
      if (index === 0 || index === 2) {
        expect(current.y - current.height / 2).toBeLessThan(0);
        expect(current.y + current.height / 2).toBeGreaterThan(300);
      } else {
        expect(current.y + current.height / 2).toBeGreaterThan(1280);
        expect(current.y - current.height / 2).toBeLessThan(1000);
      }
    }
    view.update(0, true);
    const startingX = currents.map(current => current.x);
    view.update(4, true);
    currents.forEach((current, index) => {
      expect(Math.abs(current.x - startingX[index])).toBeGreaterThan(20);
    });
    view.root.destroy({ children: true });
  });
});
