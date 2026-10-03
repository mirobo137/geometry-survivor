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
  it.each(['gyre', 'razor'] as const)('keeps %s motion bounded, mirrored and tangent-aligned without mutating simulation', kind => {
    const original = projectile(.173);
    const saved = { ...original };
    const delta = .000001;
    const numerical = (getProjectileCurveOffset(projectile(.173 + delta), kind)
      - getProjectileCurveOffset(projectile(.173 - delta), kind)) / (2 * delta);
    expect(getProjectileCurveVelocity(original, kind)).toBeCloseTo(numerical, 3);
    expect(getProjectileCurveOffset(projectile(.173, 1), kind)).toBeCloseTo(-getProjectileCurveOffset(original, kind));
    for (let i = 0; i <= 100; i++) expect(Math.abs(getProjectileCurveOffset(projectile(i / 100), kind))).toBeLessThanOrEqual(10);
    expect(getProjectileCurveOffset(projectile(0), kind)).toBeCloseTo(0);
    expect(getProjectileCurveVelocity(projectile(0), kind)).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(1), kind)).toBeCloseTo(0);
    expect(getProjectileCurveVelocity(projectile(1), kind)).toBeCloseTo(0);
    expect(original).toEqual(saved);
  });
  it('keeps the curve visual-only and returns to the logical line at the ends', () => {
    expect(getProjectileCurveOffset(projectile(0), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(0.16), 'curve')).toBeCloseTo(14);
    expect(getProjectileCurveOffset(projectile(0.32), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(2.5), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(1.25), 'straight')).toBe(0);
  });

  it('mirrors the arc between alternating muzzle emitters', () => {
    expect(getProjectileCurveOffset(projectile(0.16, 1), 'curve')).toBeCloseTo(-14);
    expect(getProjectileCurveVelocity(projectile(0), 'curve')).toBeCloseTo(0);
    expect(getProjectileCurveVelocity(projectile(0.08), 'curve')).toBeGreaterThan(0);
    expect(getProjectileCurveVelocity(projectile(0.24), 'curve')).toBeLessThan(0);
    expect(getProjectileCurveVelocity(projectile(1.25), 'curve')).toBeCloseTo(0);
  });

  it('matches the tangent to the position derivative and ignores maximum TTL on short flights', () => {
    const age = 0.1;
    const delta = 0.00001;
    const derivative = (getProjectileCurveOffset(projectile(age + delta), 'curve') - getProjectileCurveOffset(projectile(age - delta), 'curve')) / (2 * delta);
    expect(getProjectileCurveVelocity(projectile(age), 'curve')).toBeCloseTo(derivative, 3);
    expect(getProjectileCurveOffset(projectile(age), 'curve')).toBeGreaterThan(9);
  });

  it('gives Helix Lance a distinct two-lobed S curve with a matching tangent', () => {
    expect(getProjectileCurveOffset(projectile(0), 'helix')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(0.46), 'helix')).toBeCloseTo(0);
    expect(getProjectileCurveOffset(projectile(0.12), 'helix')).toBeGreaterThan(0);
    expect(getProjectileCurveOffset(projectile(0.34), 'helix')).toBeLessThan(0);
    expect(getProjectileCurveOffset(projectile(0.16), 'helix')).not.toBeCloseTo(
      getProjectileCurveOffset(projectile(0.16), 'curve')
    );

    const age = 0.2;
    const delta = 0.00001;
    const derivative = (getProjectileCurveOffset(projectile(age + delta), 'helix')
      - getProjectileCurveOffset(projectile(age - delta), 'helix')) / (2 * delta);
    expect(getProjectileCurveVelocity(projectile(age), 'helix')).toBeCloseTo(derivative, 3);
    expect(getProjectileCurveVelocity(projectile(1), 'helix')).toBeCloseTo(0);
  });
});
