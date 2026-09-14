/** Shared logical muzzle slot used by simulation and presentation. */
export type ProjectileMuzzle = 0 | 1;

/**
 * Coordinates are expressed in the player's 64x64 SVG frame. The negative Y
 * axis is the authored forward direction; simulation rotates this offset into
 * the shot direction before spawning a projectile.
 */
export const PROJECTILE_MUZZLE_OFFSETS = [
  { x: -27, y: -11 },
  { x: 27, y: -11 }
] as const satisfies readonly [{ x: number; y: number }, { x: number; y: number }];

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

export interface BoomerangWeaponDefinition {
  readonly damage: number;
  readonly speed: number;
  readonly returnSpeed: number;
  readonly radius: number;
  readonly outboundDistance: number;
  readonly lifetimeSeconds: number;
  readonly cooldownSeconds: number;
  readonly maxActive: number;
}

export interface PulseRingWeaponDefinition {
  readonly damage: number;
  readonly cooldownSeconds: number;
  readonly telegraphSeconds: number;
  readonly attackSeconds: number;
  readonly recoverySeconds: number;
  readonly startRadius: number;
  readonly endRadius: number;
  readonly width: number;
  /** One visible but modest displacement applied once when the wave crosses. */
  readonly pushDistance: number;
}

export interface MagneticChargeWeaponDefinition {
  readonly damage: number;
  readonly cooldownSeconds: number;
  readonly travelSeconds: number;
  readonly attractSeconds: number;
  readonly detonateSeconds: number;
  readonly recoverySeconds: number;
  readonly pullRadius: number;
  readonly pullStrength: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly hitCooldownSeconds: number;
  readonly minLaunchDistance: number;
  readonly maxLaunchDistance: number;
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
  } satisfies ChainLightningWeaponDefinition,
  vectorBoomerang: {
    damage: 13,
    speed: 360,
    returnSpeed: 430,
    radius: 11,
    outboundDistance: 250,
    lifetimeSeconds: 2.2,
    cooldownSeconds: 1.25,
    maxActive: 3
  } satisfies BoomerangWeaponDefinition,
  pulseRing: {
    damage: 26,
    cooldownSeconds: 3.8,
    telegraphSeconds: 0.65,
    attackSeconds: 0.75,
    recoverySeconds: 0.35,
    startRadius: 30,
    endRadius: 200,
    width: 28,
    pushDistance: 10
  } satisfies PulseRingWeaponDefinition,
  magneticCharge: {
    damage: 18,
    cooldownSeconds: 5.2,
    travelSeconds: 0.42,
    attractSeconds: 1,
    detonateSeconds: 1.3,
    recoverySeconds: 0.36,
    pullRadius: 180,
    pullStrength: 135,
    innerRadius: 62,
    outerRadius: 148,
    hitCooldownSeconds: 0.32,
    minLaunchDistance: 190,
    maxLaunchDistance: 255
  } satisfies MagneticChargeWeaponDefinition
} as const;

/** Faster cadence used only by the isolated weapon drill. */
export const PULSE_RING_WEAPON_DRILL_COOLDOWN_SECONDS = 1.6;
