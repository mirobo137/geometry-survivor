import { describe, expect, it } from 'vitest';
import {
  getHazardCadenceProfile,
  HAZARD_CADENCE_PROFILES,
  isHazardCadenceMode
} from './HazardCadenceDefinitions';

describe('hazard cadence profiles', () => {
  it('keeps the authored cadence unchanged by default', () => {
    expect(getHazardCadenceProfile()).toEqual(HAZARD_CADENCE_PROFILES.authored);
    expect(HAZARD_CADENCE_PROFILES.authored).toEqual({
      laserIntervalMultiplier: 1,
      radialPulseIntervalMultiplier: 1
    });
  });

  it('exposes chaos as an explicit three-times cadence experiment', () => {
    expect(HAZARD_CADENCE_PROFILES.chaos).toEqual({
      laserIntervalMultiplier: 1 / 3,
      radialPulseIntervalMultiplier: 1 / 3
    });
  });

  it('accepts only the supported URL modes', () => {
    expect(isHazardCadenceMode('authored')).toBe(true);
    expect(isHazardCadenceMode('chaos')).toBe(true);
    expect(isHazardCadenceMode('triple')).toBe(false);
    expect(isHazardCadenceMode(null)).toBe(false);
  });
});
