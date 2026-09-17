import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OVERDRIVE_SEED,
  createOverdriveStageState,
  getFirstLapActId,
  getOverdriveHealthMultiplier,
  getOverdriveLap,
  getOverdrivePressureMultiplier,
  getOverdriveStageInLap,
  normalizeOverdriveSeed,
  normalizeOverdriveStage,
  OVERDRIVE_HEALTH_MULTIPLIER_CAP,
  OVERDRIVE_MAX_PRESSURE_MULTIPLIER
} from './OverdriveDefinitions';

describe('OverdriveDefinitions', () => {
  it('normalizes stage numbers and keeps the xorshift seed non-zero', () => {
    expect(normalizeOverdriveStage(0)).toBe(1);
    expect(normalizeOverdriveStage(4.9)).toBe(4);
    expect(normalizeOverdriveStage(Number.NaN)).toBe(1);
    expect(normalizeOverdriveSeed(0)).toBe(DEFAULT_OVERDRIVE_SEED);
    expect(normalizeOverdriveSeed('42')).toBe(DEFAULT_OVERDRIVE_SEED);
    expect(normalizeOverdriveSeed(0x1234)).toBe(0x1234);
  });

  it('maps stages to laps and the three authored positions', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(getOverdriveLap))
      .toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4]);
    expect([1, 2, 3, 4, 5, 6].map(getOverdriveStageInLap))
      .toEqual([1, 2, 3, 1, 2, 3]);
    expect([1, 2, 3, 4].map(getFirstLapActId))
      .toEqual(['radial', 'angular', 'fracture', null]);
  });

  it('uses the approved health formula and finite cap', () => {
    expect([1, 2, 3, 4, 10, 12].map(getOverdriveHealthMultiplier))
      .toEqual([1, 3, 6, 9, 27, 33]);
    expect(getOverdriveHealthMultiplier(1_000_000_000)).toBe(OVERDRIVE_HEALTH_MULTIPLIER_CAP);
  });

  it('uses the approved pressure curve and cap', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(getOverdrivePressureMultiplier))
      .toEqual([1, 1.15, 1.3, 1.4, 1.5, 1.6, 1.7]);
    expect(getOverdrivePressureMultiplier(20)).toBe(OVERDRIVE_MAX_PRESSURE_MULTIPLIER);
  });

  it('creates a stable stage descriptor without renderer dependencies', () => {
    expect(createOverdriveStageState(4.9, 0)).toEqual({
      mode: 'overdrive',
      stage: 4,
      lap: 2,
      stageInLap: 1,
      seed: DEFAULT_OVERDRIVE_SEED,
      healthMultiplier: 9,
      pressureMultiplier: 1.15
    });
  });
});
