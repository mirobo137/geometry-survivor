import { describe, expect, it } from 'vitest';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';
import { ProjectileTrailView } from './ProjectileTrailView';

const projectile = (active: boolean, x: number): ProjectileRenderState => ({
  active,
  x,
  y: 240,
  vx: 460,
  vy: 0,
  radius: 7,
  ageSeconds: 0.12,
  lifetimeSeconds: 2.38,
  muzzle: 0
});

describe('ProjectileTrailView', () => {
  it('warms a trail only after a slot is active for two frames', () => {
    const view = new ProjectileTrailView(1, 'medium');
    view.render([projectile(true, 320)]);
    expect(view.activeSegmentCount).toBe(0);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(1);
    view.render([projectile(false, 327)]);
    expect(view.activeSegmentCount).toBe(0);
  });

  it('keeps low quality free of projectile trails', () => {
    const view = new ProjectileTrailView(1, 'low');
    view.render([projectile(true, 320)]);
    view.render([projectile(true, 327)]);
    expect(view.activeSegmentCount).toBe(0);
    expect(view.root.visible).toBe(false);
  });
});
