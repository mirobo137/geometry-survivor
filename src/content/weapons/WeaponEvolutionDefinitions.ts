/** Authored evolution routes. Each route changes the weapon's play pattern. */
export type ProjectileEvolution = 'rail_lance' | 'pulse_volley';
export type OrbitEvolution = 'solar_crown' | 'graviton_halo';
export type ChainEvolution = 'closed_circuit' | 'thunderhead';
export type BoomerangEvolution = 'twin_comet' | 'singularity_return';
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
