import { describe, expect, it } from 'vitest';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';
import { getProjectileCurveOffset, getProjectileCurveVelocity } from './ProjectileMotionVisual';

const projectile = (ageSeconds: number, muzzle: 0 | 1 = 0): ProjectileRenderState => ({
  active: true,
  x: 320,
  y: 240,
  vx: 460,
  vy: 0,
  radius: 7,
  ageSeconds,
  lifetimeSeconds: 2.5 - ageSeconds,
  muzzle
});

describe('ProjectileMotionVisual', () => {
  it('keeps the curve visual-only and returns to the logical line at the ends', () => {
    expect(getProjectileCurveOffset(projectile(0), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(1.25), 'curve')).toBeCloseTo(10);
    expect(getProjectileCurveOffset(projectile(2.5), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(1.25), 'straight')).toBe(0);
  });

  it('mirrors the arc between alternating muzzle emitters', () => {
    expect(getProjectileCurveOffset(projectile(1.25, 1), 'curve')).toBeCloseTo(-10);
    expect(getProjectileCurveVelocity(projectile(0), 'curve')).toBeGreaterThan(0);
    expect(getProjectileCurveVelocity(projectile(1.25), 'curve')).toBeCloseTo(0);
  });
});
