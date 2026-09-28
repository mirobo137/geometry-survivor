import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import {
  PainterlyBackgroundMotionView,
  PAINTERLY_MOTION_STYLES,
  type PainterlyMotionStyle
} from './PainterlyBackgroundMotionView';

const STILL_STYLE: PainterlyMotionStyle = { tint: 0xffffff, opacity: 1, speed: 1, phase: 0 };

describe('painterly background atmosphere', () => {
  it('lazily reuses two textures across four independently drifting corners', async () => {
    const calls = [0, 0];
    const view = new PainterlyBackgroundMotionView(
      async () => { calls[0] += 1; return Texture.WHITE; },
      async () => { calls[1] += 1; return Texture.WHITE; }
    );

    view.render(false, 1280, 720, PAINTERLY_MOTION_STYLES['deep-space']);
    expect(calls).toEqual([0, 0]);
    view.render(true, 1280, 720, STILL_STYLE);
    await Promise.resolve();

    expect(calls).toEqual([2, 2]);
    expect(view.root.visible).toBe(true);
    const currents = view.root.children as Sprite[];
    expect(currents).toHaveLength(4);
    expect(currents.every(current => current.visible)).toBe(true);
    expect(currents[0].texture).toBe(currents[2].texture);
    expect(currents[1].texture).toBe(currents[3].texture);
    expect(currents[2].scale.x).toBeLessThan(0);
    expect(currents[3].scale.x).toBeLessThan(0);

    view.update(0, false);
    const resting = currents.map(current => ({ x: current.x, y: current.y }));
    view.update(0, true);
    const starts = currents.map(current => ({ x: current.x, y: current.y }));
    view.update(4, true);
    currents.forEach((current, index) => {
      expect(Math.abs(current.x - starts[index].x)).toBeGreaterThan(20);
    });
    expect(currents[0].x - starts[0].x).not.toBeCloseTo(currents[2].x - starts[2].x);
    expect(currents[1].x - starts[1].x).not.toBeCloseTo(currents[3].x - starts[3].x);

    view.update(12, false);
    currents.forEach((current, index) => {
      expect(current.x).toBeCloseTo(resting[index].x);
      expect(current.y).toBeCloseTo(resting[index].y);
    });
    view.root.destroy({ children: true });
  });

  it('keeps each theme tinted and reduced motion/Low static', async () => {
    const view = new PainterlyBackgroundMotionView(
      async () => Texture.WHITE,
      async () => Texture.WHITE,
      true
    );
    const firstStyle = PAINTERLY_MOTION_STYLES['solar-drift'];
    const nextStyle = PAINTERLY_MOTION_STYLES['vesper-bloom'];
    view.render(true, 720, 1280, firstStyle);
    await Promise.resolve();
    const currents = view.root.children as Sprite[];
    expect(currents[0].tint).toBe(firstStyle.tint);
    const resting = currents.map(current => ({ x: current.x, y: current.y }));

    view.update(0, true);
    view.update(4, true);
    currents.forEach((current, index) => {
      expect(current.x).toBeCloseTo(resting[index].x);
      expect(current.y).toBeCloseTo(resting[index].y);
    });

    view.render(true, 720, 1280, nextStyle);
    expect(currents[0].tint).toBe(nextStyle.tint);
    view.update(8, false);
    currents.forEach((current, index) => {
      expect(current.x).toBeCloseTo(resting[index].x);
      expect(current.y).toBeCloseTo(resting[index].y);
    });
    view.root.destroy({ children: true });
  });

  it('does not request the current textures until an animated painting is selected', () => {
    let requests = 0;
    const view = new PainterlyBackgroundMotionView(
      async () => { requests += 1; return Texture.WHITE; },
      async () => { requests += 1; return Texture.WHITE; }
    );
    view.render(false, 1280, 720);
    expect(requests).toBe(0);
    view.root.destroy({ children: true });
  });

  it('keeps all four currents inside the visible portrait corners', async () => {
    const view = new PainterlyBackgroundMotionView(
      async () => Texture.WHITE,
      async () => Texture.WHITE
    );
    view.render(true, 720, 1280, STILL_STYLE);
    await Promise.resolve();
    const currents = view.root.children as Sprite[];
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
