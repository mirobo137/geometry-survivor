import { afterEach, describe, expect, it, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import { DamageBloomView } from './DamageBloomView';

describe('DamageBloomView', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('reuses the same three graphics for discharge and hits, including priority under saturation', () => {
    const view = new DamageBloomView('enemy', 1);
    const root = view.root.children[0];
    const layers = root.children as Graphics[];
    view.play(10, 20, 24);
    const hitContexts = layers.map(layer => layer.context);
    view.play(30, 40, 24, true);
    expect(root.x).toBe(30);
    const dischargeContexts = layers.map(layer => layer.context);
    expect(dischargeContexts.every((context, index) => context !== hitContexts[index])).toBe(true);
    expect(layers.every(layer => layer.blendMode === 'add')).toBe(true);
    for (const context of dischargeContexts) {
      vi.spyOn(context, 'clear').mockImplementation(() => { throw Error('Rebuilt discharge geometry'); });
    }
    view.play(80, 90, 24, true);
    expect(root.x).toBe(30); // Saturated deaths are not recycled or extended.
    view.update(0.1);
    expect(layers[1].alpha).toBeGreaterThan(0);
    const glowScale = layers[0].scale.x;
    view.update(0);
    expect(layers[0].scale.x).toBe(glowScale);
    for (let i = 0; i < 4; i++) view.update(0.1);
    expect(view.activeCount).toBe(0);
    view.play(10, 20, 24);
    expect(layers.map(layer => layer.context)).toEqual(hitContexts);
    expect(layers.every(layer => layer.blendMode === 'normal')).toBe(true);
    view.clear();
    view.play(10, 20, 24, true);
    expect(layers.map(layer => layer.context)).toEqual(dischargeContexts);
    expect(root.children).toEqual(layers);
    view.root.destroy({ children: true });
    expect([...hitContexts, ...dischargeContexts].every(context => context.destroyed)).toBe(true);
  });

  it('keeps reduced-motion discharge static and suppresses its expanding rays', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const view = new DamageBloomView('enemy', 1);
    view.play(10, 20, 24, true);
    const layers = view.root.children[0].children;
    const scales = layers.map(layer => layer.scale.x);
    view.update(0.1);
    expect(layers.map(layer => layer.scale.x)).toEqual(scales);
    expect(layers[1].alpha).toBe(0);
    view.root.destroy({ children: true });
  });
  for (const kind of ['enemy', 'player'] as const) {
    it(`${kind}: saturates without allocating, freezes on pause and reuses geometry`, () => {
      const view = new DamageBloomView(kind, 2);
      const roots = [...view.root.children];
      view.play(30, 40, 24);
      view.play(50, 60, 24);
      view.play(70, 80, 24);
      expect(view.activeCount).toBe(2);
      expect(roots[0].x).toBe(30);
      const slot = roots[0];
      const alpha = slot.children[0].alpha;
      view.update(0);
      expect(slot.children[0].alpha).toBe(alpha);
      for (const child of slot.children) {
        const g = child as import('pixi.js').Graphics;
        vi.spyOn(g.context, 'clear').mockImplementation(() => { throw new Error('Rebuilt geometry'); });
      }
      for (let i = 0; i < 4; i += 1) view.update(.1);
      expect(view.activeCount).toBe(0);
      view.play(10, 20, 22);
      expect(view.root.children).toEqual(roots);
      expect(view.activeCount).toBe(1);
      view.clear();
      expect(view.activeCount).toBe(0);
    });
  }
});
