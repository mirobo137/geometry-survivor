export interface ProjectileWeaponDefinition {
  readonly damage: number;
  readonly speed: number;
  readonly radius: number;
  readonly lifetimeSeconds: number;
  readonly cooldownSeconds: number;
}

export interface OrbitWeaponDefinition {
  readonly damage: number;
  readonly radius: number;
  readonly maxBlades: number;
  readonly orbitRadius: number;
  readonly rotationSpeed: number;
  readonly hitCooldownSeconds: number;
}

export interface ChainLightningWeaponDefinition {
  readonly damage: number;
  readonly cooldownSeconds: number;
  readonly maxTargets: number;
  readonly jumpRadius: number;
  readonly segmentLifetimeSeconds: number;
}

export const WEAPON_DEFINITIONS = {
  projectile: {
    damage: 14,
    speed: 460,
    radius: 7,
    lifetimeSeconds: 2.5,
    cooldownSeconds: 0.55
  } satisfies ProjectileWeaponDefinition,
  orbit: {
    damage: 18,
    radius: 10,
    maxBlades: 6,
    orbitRadius: 58,
    rotationSpeed: 2.7,
    hitCooldownSeconds: 0.5
  } satisfies OrbitWeaponDefinition,
  chainLightning: {
    damage: 10,
    cooldownSeconds: 1.2,
    maxTargets: 3,
    jumpRadius: 180,
    segmentLifetimeSeconds: 0.14
  } satisfies ChainLightningWeaponDefinition
} as const;
