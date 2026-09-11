import { describe, expect, it, vi } from 'vitest';
import { DamageBloomView } from './DamageBloomView';

describe('DamageBloomView', () => {
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
