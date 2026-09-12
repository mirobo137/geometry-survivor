import { describe, expect, it, vi } from 'vitest';
import { Graphics } from 'pixi.js';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';
import { PrismWeaverTelegraphView } from './PrismWeaverTelegraphView';

const state = (x: number, y: number): EnemyRenderState => ({
  active: true,
  kind: 'prism-weaver',
  x,
  y,
  vx: 0,
  vy: 0,
  radius: 20,
  health: 52,
  maxHealth: 52,
  prismWeaverPhase: 'active',
  prismWeaverProgress: 0.4,
  prismWeaverAngle: 0.7,
  prismWeaverRadius: 226,
  prismWeaverSequence: 1
});

describe('PrismWeaverTelegraphView', () => {
  it('anchors the active cast to the enemy body instead of the arena center', () => {
    const view = new PrismWeaverTelegraphView('high');
    view.render([state(412, 188)]);

    const slot = view.root.children[0];
    expect(slot.position.x).toBe(412);
    expect(slot.position.y).toBe(188);

    view.render([state(704, 536)]);
    expect(slot.position.x).toBe(704);
    expect(slot.position.y).toBe(536);
    view.root.destroy({ children: true });
  });

  it('hides and resets pooled slots without retaining the previous emitter position', () => {
    const view = new PrismWeaverTelegraphView('low');
    view.render([state(704, 536)]);
    view.reset();
    const slot = view.root.children[0];
    expect(slot.visible).toBe(false);
    expect(slot.position.x).toBe(0);
    expect(slot.position.y).toBe(0);
    view.root.destroy({ children: true });
  });

  it('animates the charge collar and traveling pulses without rebuilding the cast', () => {
    const view = new PrismWeaverTelegraphView('high');
    const active = state(835, 473);
    view.render([active], 0);
    const slot = view.root.children[0];
    const traveler = slot.children[9];
    const initialDistance = Math.hypot(traveler.position.x, traveler.position.y);
    const clear = vi.spyOn(Graphics.prototype, 'clear');

    view.render([active], 0.6);

    expect(Math.hypot(traveler.position.x, traveler.position.y)).not.toBe(initialDistance);
    expect(slot.children[7].rotation).not.toBe(0);
    expect(clear).not.toHaveBeenCalled();
    clear.mockRestore();
    view.root.destroy({ children: true });
  });
});
