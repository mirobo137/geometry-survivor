import { describe, expect, it, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import { ChargerTelegraphView } from './ChargerTelegraphView';
import { OrbiterTelegraphView } from './OrbiterTelegraphView';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';

const base: EnemyRenderState = {
  active: true, kind: 'charger', x: 100, y: 100, vx: 0, vy: 0,
  radius: 19, health: 38, maxHealth: 38,
  chargerPhase: 'telegraph', chargerProgress: 0.7, chargerSequence: 1,
  chargerAimX: 700, chargerAimY: 100
};

describe('Angular movement warnings', () => {
  it('keeps Charger warning local and bounded, handles two enemies and resets', () => {
    const view = new ChargerTelegraphView('low');
    const second = { ...base, x: 300, chargerAimX: 300, chargerAimY: 700 };
    view.render([base, second]);
    expect(view.root.children.filter(c => c.visible)).toHaveLength(2);
    expect(view.root.children[0].getLocalBounds().maxX).toBeLessThan(110);
    expect(view.root.children[1].rotation).toBeCloseTo(Math.PI / 2);
    view.reset();
    expect(view.root.children.every(c => !c.visible)).toBe(true);
    view.root.destroy({ children: true });
  });

  it('reuses stable Orbiter geometry and replaces it for another pooled route', () => {
    const view = new OrbiterTelegraphView('high');
    const state = { ...base, kind: 'orbiter' as const,
      orbiterPhase: 'telegraph' as const, orbiterSequence: 1,
      orbiterBandRadius: 160, orbiterStartAngle: 6.1,
      orbiterDirection: -1 as const, orbiterProgress: 0.6 };
    view.render([state]);
    const clear = vi.spyOn(Graphics.prototype, 'clear');
    view.render([state]);
    expect(clear).not.toHaveBeenCalled();
    view.render([{ ...state, orbiterStartAngle: 0.5 }]);
    expect(clear).toHaveBeenCalledTimes(8);
    clear.mockRestore();
    view.render([]);
    expect(view.root.children.every(c => !c.visible)).toBe(true);
    view.root.destroy({ children: true });
  });
});
