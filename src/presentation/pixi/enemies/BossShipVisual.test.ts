import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { BossShipVisual, type BossShipTextures } from './BossShipVisual';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';

const textures: BossShipTextures = { flat: Texture.EMPTY, parts: [Texture.WHITE, Texture.WHITE, Texture.WHITE, Texture.WHITE] };
const state: EnemyRenderState = { active: true, kind: 'boss', x: 300, y: 200, vx: 0, vy: 0, health: 100, maxHealth: 100, radius: 48 };

describe('BossShipVisual', () => {
  it('animates four cached parts and disperses them without changing state', () => {
    const view = new BossShipVisual(textures, 'high');
    view.render(Object.freeze(state), 1);
    expect(view.root.children).toHaveLength(4);
    expect(view.root.position.x).toBe(300);
    const core = view.root.children[3];
    const scale = core.scale.x;
    view.render(state, 2);
    expect(core.scale.x).not.toBe(scale);
    view.playDefeat(300, 200);
    view.update(0.6);
    view.beginFrame();
    expect(view.root.visible).toBe(true);
    expect(core.position.x).not.toBe(0);
    view.update(0.6);
    expect(view.root.visible).toBe(false);
    view.reset();
    expect(core.position.x).toBe(0);
    expect(core.scale.x).toBe(1);
    view.render(state, 0);
    expect(view.root.visible).toBe(true);
  });

  it('keeps one complete, static sprite in Low and fades on defeat', () => {
    const view = new BossShipVisual(textures, 'low');
    view.render(state, 1);
    expect(view.root.children).toHaveLength(1);
    expect(view.root.children[0].scale.x).toBe(1);
    view.render(state, 2);
    expect(view.root.children[0].scale.x).toBe(1);
    view.playDefeat(300, 200);
    view.update(1.2);
    expect(view.root.visible).toBe(false);
  });
});
