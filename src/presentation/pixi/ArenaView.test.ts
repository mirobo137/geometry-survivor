import { describe, expect, it, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import { getArenaRadiusAtAngle } from '../../simulation/ArenaBoundary';
import { ArenaModel } from '../../simulation/ArenaModel';
import { ArenaView } from './ArenaView';

describe('ArenaView', () => {
  it('reuses stable geometry, freezes couriers on pause and follows the real morph boundary', () => {
    const model = new ArenaModel();
    const view = new ArenaView();
    const clear = vi.spyOn(Graphics.prototype, 'clear');
    for (let i = 0; i < 30; i++) { view.update(1 / 60); view.render(model.state); }
    expect(clear).not.toHaveBeenCalled();
    const courier = view.root.children[9];
    const pausedX = courier.x, pausedY = courier.y;
    view.update(0); view.render(model.state);
    expect(courier.x).toBe(pausedX);
    expect(courier.y).toBe(pausedY);
    model.update(133.8);
    view.render(model.state);
    const dx = courier.x - ARENA_CENTER.x, dy = courier.y - ARENA_CENTER.y;
    expect(Math.hypot(dx, dy)).toBeCloseTo(getArenaRadiusAtAngle(model.state, Math.atan2(dy, dx)) + 2.5, 5);
    clear.mockRestore();
    view.reset();
    expect(courier.visible).toBe(false);
    view.root.destroy({ children: true });
  });

  it('suppresses travelling decoration in reduced motion while preserving the shape warning', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    try {
      const view = new ArenaView();
      const model = new ArenaModel();
      model.update(132.7);
      view.update(0.1); view.render(model.state);
      expect(view.root.children[1].visible).toBe(true);
      expect(view.root.children[8].visible).toBe(false);
      expect(view.root.children[9].visible).toBe(false);
      view.root.destroy({ children: true });
    } finally { vi.unstubAllGlobals(); }
  });
  it('shows a geometric target during the Act I telegraph and hides it when stable', () => {
    const model = new ArenaModel();
    const view = new ArenaView();
    const shapeSignal = view.root.children[1];

    model.update(132);
    view.render(model.state);
    expect(shapeSignal.visible).toBe(true);

    model.update(2.25);
    view.render(model.state);
    expect(shapeSignal.visible).toBe(false);

    view.reset();
    view.root.destroy({ children: true });
  });

  it('keeps the premium layers and shockwave tied to the authored boundary', () => {
    const model = new ArenaModel();
    const view = new ArenaView();
    const arena = view.root.children[0];
    const markers = view.root.children[5];
    const core = view.root.children[6];
    const shockwave = view.root.children[8];

    expect(arena.visible).toBe(true);
    expect(markers.visible).toBe(true);
    expect(core.visible).toBe(true);

    model.update(60.1);
    view.render(model.state);
    expect(shockwave.visible).toBe(true);

    model.update(72);
    view.render(model.state);
    expect(model.state.shape).toBe('hexagon');
    expect(arena.visible).toBe(true);
    for (let index = 0; index < 6; index += 1) view.update(0.1);
    expect(shockwave.visible).toBe(false);

    view.reset();
    view.root.destroy({ children: true });
  });
});
