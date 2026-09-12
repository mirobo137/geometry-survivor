import { Graphics } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { AngularSweepState } from '../../simulation/hazards/AngularSweepHazard';
import { AngularSweepView } from './AngularSweepView';

const state = (phase: AngularSweepState['phase']): AngularSweepState => ({
  phase,
  angle: 0.4,
  startAngle: 0.4,
  progress: phase === 'telegraph' ? 0.5 : 0.2,
  travelProgress: phase === 'active' ? 0.2 : 0,
  dangerHalfAngle: 0.22,
  travelRadians: 0.92,
  arenaRadius: 270,
  sequence: 1
});

describe('AngularSweepView', () => {
  it('keeps the committed sector visible and reuses geometry within a sequence', () => {
    const view = new AngularSweepView('high');
    view.render(state('telegraph'), 270);
    expect(view.root.visible).toBe(true);
    const clear = vi.spyOn(Graphics.prototype, 'clear');
    view.render(state('active'), 270);
    expect(clear).not.toHaveBeenCalled();
    view.reset();
    expect(view.root.visible).toBe(false);
    clear.mockRestore();
    view.root.destroy({ children: true });
  });

  it('rebuilds only when the authored sequence changes', () => {
    const view = new AngularSweepView('low');
    view.render(state('active'), 270);
    const clear = vi.spyOn(Graphics.prototype, 'clear');
    view.render({ ...state('active'), sequence: 2 }, 270);
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
    view.root.destroy({ children: true });
  });
});

