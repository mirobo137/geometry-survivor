import { describe, expect, it } from 'vitest';
import { DamageNumberView } from './DamageNumberView';

describe('DamageNumberView', () => {
  it('groups rapid damage from one enemy slot inside its fixed pool', () => {
    const view = new DamageNumberView('medium');
    view.playHit(4, 320, 240, 18, 14, 'chaser');
    view.playHit(4, 320, 240, 18, 10, 'chaser');
    expect(view.activeCount).toBe(1);
    const label = view.root.children[0] as unknown as { text: string; y: number };
    expect(label.text).toBe('24');
    const startY = label.y;
    view.update(0.1);
    expect(label.y).toBeLessThan(startY);
    for (let index = 0; index < 5; index += 1) view.update(0.1);
    expect(view.activeCount).toBe(0);
  });

  it('keeps low quality free of floating text', () => {
    const view = new DamageNumberView('low');
    view.playHit(0, 0, 0, 18, 14, 'chaser');
    expect(view.activeCount).toBe(0);
  });
});
