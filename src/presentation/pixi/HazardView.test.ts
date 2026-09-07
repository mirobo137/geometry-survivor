import { Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';
import { HazardView } from './HazardView';

const state = (phase: LaserHazardState['phase'], progress = 0.5): LaserHazardState =>
  ({ phase, progress, angle: 0.8, width: 22, sweeping: true, sweepProgress: progress });

describe('HazardView', () => {
  it('removes the solid damaging silhouette immediately during harmless recovery', () => {
    const view = new HazardView();
    const axis = view.root.children[0];
    view.renderLaser(state('active'), 300);
    expect(axis.children[2].visible).toBe(true);
    view.renderLaser(state('recovery'), 300);
    expect(axis.children[2].visible).toBe(false);
    expect(axis.children[3].visible).toBe(false);
    expect(axis.children[4].visible).toBe(true);
    const earlier = axis.children[4].alpha;
    view.renderLaser(state('recovery', 0.9), 300);
    expect(axis.children[4].alpha).toBeLessThan(earlier);
    view.reset();
    expect(view.root.visible).toBe(false);
    view.root.destroy({ children: true });
  });

  it('reuses geometry across frames, rotation wrap, pause and restart', () => {
    const view = new HazardView('high');
    const graphics: Graphics[] = [];
    const visit = (root: typeof view.root): void => {
      if (root instanceof Graphics) graphics.push(root);
      for (const child of root.children) visit(child);
    };
    visit(view.root);
    const paths = graphics.map(g => g.context.instructions.slice());
    for (let i = 0; i < 300; i += 1) {
      view.renderLaser({ ...state('active', (i % 100) / 100), angle: i / 20 }, 300);
    }
    for (let i = 0; i < graphics.length; i += 1) {
      expect(graphics[i].context.instructions).toEqual(paths[i]);
    }
    const input = state('telegraph');
    view.renderLaser(input, 300);
    const transform = view.root.children[0].rotation;
    view.renderLaser(input, 300);
    expect(view.root.children[0].rotation).toBe(transform);
    view.reset();
    view.renderLaser(input, 300);
    expect(view.root.visible).toBe(true);
    view.root.destroy({ children: true });
  });

  it('preserves the active width and emitters in Low and does not expose sweep during warning', () => {
    for (const quality of ['low', 'high'] as const) {
      const view = new HazardView(quality);
      const axis = view.root.children[0];
      view.renderLaser(state('active'), 300);
      expect(axis.children[2].scale.y).toBe(22);
      expect(axis.rotation).toBe(0.8);
      expect(axis.children.at(-1)?.x).toBe(300);
      expect(axis.children.at(-2)?.x).toBe(-300);
      view.renderLaser(state('telegraph'), 300);
      expect(axis.children[2].visible).toBe(false);
      expect(axis.children[0].visible).toBe(true);
      view.root.destroy({ children: true });
    }
  });
});
