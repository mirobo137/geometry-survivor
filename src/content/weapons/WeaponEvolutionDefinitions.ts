/** Authored evolution routes. Each route changes the weapon's play pattern. */
export type ProjectileEvolution = 'rail_lance' | 'pulse_volley';
export type OrbitEvolution = 'solar_crown' | 'graviton_halo';
export type ChainEvolution = 'closed_circuit' | 'thunderhead';
/** Rail Lance trades a modest cadence reduction for a heavier direct hit. */
export const RAIL_LANCE_TUNING = {
  damageMultiplier: 1.5,
  cooldownMultiplier: 1.1,
  radiusMultiplier: 1.45,
  maxTargets: 5,
  damageFalloffPerPiercedTarget: 0.1,
  minimumPierceDamageMultiplier: 0.7
} as const;
/** Bounded target growth shared by both chain branches after evolution. */
export const CHAIN_EVOLUTION_TUNING = {
  maxTargets: 10,
  closedCircuitBonusTargets: 2,
  closedCircuitDamageMultiplier: 1.25,
  coverageBonusTargets: 1,
  thunderheadMarks: 2,
  circuitTickDamageMultiplier: 0.2,
  thunderheadDamageMultiplier: 1.25,
  thunderheadExplosionDamageMultiplier: 1.25
} as const;
export type BoomerangEvolution = 'twin_comet' | 'singularity_return';
/** Singularity forks before its base reach; longer-lived shards seek distinct targets, not AoE. */
export const SINGULARITY_RETURN_TUNING = {
  rangeMultiplier: 0.9,
  fragmentCount: 6,
  fragmentFanHalfAngle: 0.55,
  fragmentRadiusMultiplier: 0.7,
  fragmentSpeed: 520,
  turnRadiansPerSecond: 8,
  fragmentLifetimeSeconds: 2,
  targetSearchRadius: 460,
  carrierDamageMultiplier: 1.25,
  fragmentDamageMultiplier: 1.25,
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
