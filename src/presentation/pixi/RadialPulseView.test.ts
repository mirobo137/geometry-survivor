import { describe, expect, it } from 'vitest';
import type { RadialPulseState } from '../../simulation/hazards/RadialPulseHazard';
import { RadialPulseView } from './RadialPulseView';

const createState = (phase: RadialPulseState['phase'], progress = 0.5): RadialPulseState => ({
  phase,
  direction: 'outward',
  radius: 120,
  startRadius: 0,
  endRadius: 296,
  progress,
  travelProgress: phase === 'telegraph' ? 0 : progress,
  width: 28,
  sequence: 1
});

describe('RadialPulseView', () => {
  it('keeps the telegraph visible and removes the damaging band in recovery', () => {
    const view = new RadialPulseView('low');
    view.render(createState('telegraph'));
    expect(view.root.visible).toBe(true);
    expect(view.root.children[0].visible).toBe(true);
    expect(view.root.children[1].visible).toBe(false);

    view.render(createState('active'));
    expect(view.root.children[1].visible).toBe(true);

    view.render(createState('recovery'));
    expect(view.root.children[1].visible).toBe(false);
    expect(view.root.children[4].visible).toBe(true);
    view.root.destroy({ children: true });
  });

  it('reuses the bounded display-object set across quality and direction changes', () => {
    const view = new RadialPulseView('high');
    const children = view.root.children.slice();
    for (let index = 0; index < 120; index += 1) {
      view.render({
        ...createState('active', (index % 60) / 60),
        direction: index % 2 === 0 ? 'outward' : 'inward',
        radius: 20 + index
      });
    }
    expect(view.root.children).toEqual(children);
    view.reset();
    expect(view.root.visible).toBe(false);
    view.root.destroy({ children: true });
  });
});
