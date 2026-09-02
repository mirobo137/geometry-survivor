import { describe, expect, it } from 'vitest';
import { ScreenFxView } from './ScreenFxView';

describe('ScreenFxView', () => {
  it('creates a bounded camera impulse and returns to the base transform', () => {
    const view = new ScreenFxView('high');
    view.play('boss-defeat');
    view.update(0.04);
    expect(view.isActive).toBe(true);
    expect(Math.hypot(view.x, view.y)).toBeGreaterThan(0);
    expect(Math.hypot(view.x, view.y)).toBeLessThan(4);

    for (let index = 0; index < 7; index += 1) view.update(0.1);
    expect(view.isActive).toBe(false);
    expect(view.x).toBe(0);
    expect(view.y).toBe(0);
  });

  it('combines overlapping impulses without exceeding the stronger recipe', () => {
    const view = new ScreenFxView('medium');
    view.play('enemy-defeat');
    view.play('player-damage');
    view.update(0.02);
    expect(Math.hypot(view.x, view.y)).toBeLessThan(1.5);
  });
});
