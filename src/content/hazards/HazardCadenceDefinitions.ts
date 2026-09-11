/**
 * Cadence-only experiments for hazard pressure.
 *
 * Chaos is now the principal Act I profile selected by normal runs. The
 * authored profile remains as a calm historical control for comparison; both
 * profiles change only the time between casts. Damage, telegraph, attack,
 * recovery, geometry and enemy strength remain authored in either profile.
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
  mode: HazardCadenceMode = 'chaos'
): HazardCadenceProfile => HAZARD_CADENCE_PROFILES[mode];
