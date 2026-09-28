import { describe, expect, it } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import type { BossRenderState } from '../../../simulation/combat/CombatRenderState';
import { SpawnPortalView } from './SpawnPortalView';

const boss = (bossId: BossRenderState['bossId'], progress: number): BossRenderState => ({
  active: true, phase: 'intro', bossId, progress, x: 640, y: 280, radius: 50
}) as BossRenderState;

describe('SpawnPortalView', () => {
  it('caps ordinary portals without hiding enemies and recycles them after expiry', () => {
    const view = new SpawnPortalView({} as Renderer, 'low', Texture.WHITE, false);
    for (let index = 0; index < 6; index += 1) {
      expect(view.playEnemy(100 + index * 20, 200, 20, 'chaser', 0)).toBe(true);
    }
    expect(view.playEnemy(300, 200, 20, 'chaser', 0)).toBe(false);
    view.render(0.2, { ...boss('core-sentinel', 0), active: false });
    expect(view.activeCount).toBe(6);
    view.render(0.49, { ...boss('core-sentinel', 0), active: false });
    expect(view.activeCount).toBe(0);
    expect(view.playEnemy(300, 200, 20, 'chaser', 0.49)).toBe(true);
    view.reset();
    expect(view.activeCount).toBe(0);
  });

  it('shows two independent large portals only during their bosses’ intro', () => {
    const view = new SpawnPortalView({} as Renderer, 'medium', Texture.WHITE, false);
    const primary = boss('core-sentinel', 0.5);
    const secondary = boss('orbital-warden', 0.2);
    view.render(1, primary, [primary, secondary]);
    expect(view.activeCount).toBe(2);
    const sprites = view.root.children.slice(-2) as Sprite[];
    expect(sprites[0].x).toBe(640);
    expect(sprites[0].scale.x).toBeGreaterThan(1);
    expect(sprites[0].tint).not.toBe(sprites[1].tint);
    view.render(2, { ...primary, phase: 'sweep-telegraph' },
      [{ ...primary, phase: 'sweep-telegraph' }, { ...secondary, phase: 'recovery' }]);
    expect(view.activeCount).toBe(0);
  });

  it('spends the limited ordinary budget on births near the visible portrait viewport', () => {
    const view = new SpawnPortalView({} as Renderer, 'low', Texture.WHITE, false);
    view.setVisibleWorldBounds(280, -280, 1000, 1000);
    expect(view.playEnemy(1200, 200, 20, 'chaser', 0)).toBe(false);
    expect(view.playEnemy(1020, 200, 20, 'chaser', 0)).toBe(true);
    expect(view.activeCount).toBe(1);
  });
});
