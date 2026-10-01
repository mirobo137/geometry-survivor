/** Authored evolution routes. Each route changes the weapon's play pattern. */
export type ProjectileEvolution = 'rail_lance' | 'pulse_volley';
export type OrbitEvolution = 'solar_crown' | 'graviton_halo';
export type ChainEvolution = 'closed_circuit' | 'thunderhead';
/** Bounded target growth shared by both chain branches after evolution. */
export const CHAIN_EVOLUTION_TUNING = {
  maxTargets: 10,
  closedCircuitBonusTargets: 2,
  coverageBonusTargets: 1,
  thunderheadMarks: 2,
  circuitTickDamageMultiplier: 0.15
} as const;
export type BoomerangEvolution = 'twin_comet' | 'singularity_return';
/** Singularity's carrier forks at full range; shards are single-hit seekers, not AoE. */
export const SINGULARITY_RETURN_TUNING = {
  rangeMultiplier: 1.48,
  fragmentCount: 6,
  fragmentFanHalfAngle: 0.55,
  fragmentRadiusMultiplier: 0.7,
  fragmentSpeed: 520,
  turnRadiansPerSecond: 8,
  fragmentLifetimeSeconds: 1.35,
  targetSearchRadius: 320,
  carrierDamageMultiplier: 0.65,
  fragmentDamageMultiplier: 0.85,
  splitFxRadius: 42,
  splitFxSeconds: 0.32
} as const;
export type PulseRingEvolution = 'echo_shock' | 'compression_wave';
export type MagneticChargeEvolution = 'event_horizon' | 'polar_collapse';

export type WeaponEvolutionId =
  | ProjectileEvolution
  | OrbitEvolution
  | ChainEvolution
  | BoomerangEvolution
  | PulseRingEvolution
  | MagneticChargeEvolution;

/** Developer-only lab layouts for isolating one evolution at a time. */
export type WeaponEvolutionScenario = 'single' | 'mass';

export const isWeaponEvolutionScenario = (value: unknown): value is WeaponEvolutionScenario => (
  value === 'single' || value === 'mass'
);

export const WEAPON_EVOLUTION_IDS: readonly WeaponEvolutionId[] = [
  'rail_lance',
  'pulse_volley',
  'solar_crown',
  'graviton_halo',
  'closed_circuit',
  'thunderhead',
  'twin_comet',
  'singularity_return',
  'echo_shock',
  'compression_wave',
  'event_horizon',
  'polar_collapse'
];

export const isWeaponEvolutionId = (value: unknown): value is WeaponEvolutionId => (
  typeof value === 'string' && WEAPON_EVOLUTION_IDS.includes(value as WeaponEvolutionId)
);
