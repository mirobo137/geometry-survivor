/**
 * Cadence-only experiments for hazard pressure.
 *
 * The authored profile is the production contract. Chaos is an explicit,
 * reversible development profile: it changes only the time between casts;
 * damage, telegraph, attack, recovery, geometry and enemy strength remain
 * authored. It must never be selected implicitly by a normal run.
 */
export type HazardCadenceMode = 'authored' | 'chaos';

export interface HazardCadenceProfile {
  readonly laserIntervalMultiplier: number;
  readonly radialPulseIntervalMultiplier: number;
}

export const HAZARD_CADENCE_PROFILES: Readonly<Record<HazardCadenceMode, HazardCadenceProfile>> = {
  authored: {
    laserIntervalMultiplier: 1,
    radialPulseIntervalMultiplier: 1
  },
  chaos: {
    laserIntervalMultiplier: 1 / 3,
    radialPulseIntervalMultiplier: 1 / 3
  }
} as const;

export const isHazardCadenceMode = (value: string | null | undefined): value is HazardCadenceMode => (
  value === 'authored' || value === 'chaos'
);

export const getHazardCadenceProfile = (
  mode: HazardCadenceMode = 'authored'
): HazardCadenceProfile => HAZARD_CADENCE_PROFILES[mode];
