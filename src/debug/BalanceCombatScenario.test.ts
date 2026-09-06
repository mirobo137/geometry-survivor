import { describe, expect, it } from 'vitest';
import {
  BALANCE_DURATION_SECONDS,
  BALANCE_SCENARIO_SEED,
  formatBalanceMatrix,
  runBalanceMatrix
} from './BalanceCombatScenario';

describe('BalanceCombatScenario', () => {
  it('runs the EX-02a matrix deterministically with fixed scenarios', () => {
    const first = runBalanceMatrix();
    const second = runBalanceMatrix();

    expect(first).toEqual(second);
    expect(first).toHaveLength(18);
    expect(new Set(first.map((measurement) => measurement.seed))).toEqual(new Set([BALANCE_SCENARIO_SEED]));
    expect(new Set(first.map((measurement) => measurement.durationSeconds))).toEqual(new Set([BALANCE_DURATION_SECONDS]));
    expect(first.every((measurement) => measurement.kill.hits >= measurement.kill.kills)).toBe(true);
    expect(first.every((measurement) => measurement.sustained.damagePerSecond >= 0)).toBe(true);
  });

  it('keeps the comparison cards and layouts explicit', () => {
    const measurements = runBalanceMatrix();

    expect(measurements.filter((measurement) => measurement.weapon === 'projectile').every((measurement) => measurement.cardIds.length === 0)).toBe(true);
    expect(measurements.filter((measurement) => measurement.weapon === 'orbit').every((measurement) => measurement.cardIds.join() === 'orbit_blade')).toBe(true);
    expect(measurements.filter((measurement) => measurement.weapon === 'chain').every((measurement) => measurement.cardIds.join() === 'chain_lightning')).toBe(true);
    expect(new Set(measurements.map((measurement) => measurement.layout))).toEqual(new Set(['single', 'dispersed', 'dense']));
    expect(new Set(measurements.map((measurement) => measurement.metaLevel))).toEqual(new Set([0, 5]));
  });

  it('applies both permanent branches to every authored weapon event', () => {
    const measurements = runBalanceMatrix();
    const get = (weapon: 'projectile' | 'orbit' | 'chain', layout: 'single' | 'dense', metaLevel: 0 | 5) => (
      measurements.find((measurement) => (
        measurement.weapon === weapon
        && measurement.layout === layout
        && measurement.metaLevel === metaLevel
      ))!
    );

    expect(get('projectile', 'single', 5).configuredDamage).toBeGreaterThan(get('projectile', 'single', 0).configuredDamage);
    expect(get('projectile', 'single', 5).minimumCooldownSeconds).toBeLessThan(get('projectile', 'single', 0).minimumCooldownSeconds);
    expect(get('orbit', 'single', 5).configuredDamage).toBeGreaterThan(get('orbit', 'single', 0).configuredDamage);
    expect(get('orbit', 'single', 5).minimumCooldownSeconds).toBeLessThan(get('orbit', 'single', 0).minimumCooldownSeconds);
    expect(get('chain', 'dense', 5).configuredDamage).toBeGreaterThan(get('chain', 'dense', 0).configuredDamage);
    expect(get('chain', 'dense', 5).minimumCooldownSeconds).toBeLessThan(get('chain', 'dense', 0).minimumCooldownSeconds);
    expect(get('projectile', 'single', 5).configuredDamage / get('projectile', 'single', 0).configuredDamage).toBeCloseTo(1.25);
    expect(get('orbit', 'single', 5).configuredDamage / get('orbit', 'single', 0).configuredDamage).toBeCloseTo(1.25);
    expect(get('chain', 'dense', 5).configuredDamage / get('chain', 'dense', 0).configuredDamage).toBeCloseTo(1.25);
  });

  it('formats a copy-friendly report for the balance notes', () => {
    const report = formatBalanceMatrix(runBalanceMatrix());

    expect(report).toContain('EX-02 balance matrix');
    expect(report).toContain('projectile / single / meta 0');
    expect(report).toContain('chain / dense / meta 5');
    expect(report).toContain('sustained damage');
  });
});
