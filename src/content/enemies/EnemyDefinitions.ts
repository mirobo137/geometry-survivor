export type EnemyKind = 'chaser' | 'fast' | 'tank' | 'elite' | 'orbiter' | 'charger' | 'splitter' | 'prism-weaver' | 'warden-replica' | 'boss';

export type OrbiterPhase = 'inactive' | 'approach' | 'telegraph' | 'commit' | 'recovery';
export type OrbiterDirection = -1 | 1;
export type ChargerPhase = 'inactive' | 'approach' | 'telegraph' | 'charge' | 'recovery';
export type PrismWeaverPhase = 'inactive' | 'approach' | 'telegraph' | 'active' | 'recovery';

export interface OrbiterDefinition {
  readonly sectorCount: 8;
  readonly reservedArcRadians: number;
  readonly minimumFreeArcRadians: number;
  readonly bandInset: number;
  readonly maximumBandRadius: number;
  readonly approachSpeed: number;
  readonly telegraphSeconds: number;
  readonly commitSeconds: number;
  readonly recoverySeconds: number;
  readonly commitAngularSpeed: number;
  readonly activeCap: number;
  readonly commitCap: number;
}

export interface ChargerDefinition {
  readonly approachInset: number;
  readonly approachSpeed: number;
  readonly telegraphSeconds: number;
  readonly chargeSeconds: number;
  readonly recoverySeconds: number;
  readonly exitDistance: number;
  readonly activeCap: number;
  readonly chargeCap: number;
}

export interface SplitterDefinition {
  readonly splitCount: 2;
  readonly maxDepth: 1;
  readonly activeCap: number;
  readonly splitOffset: number;
  readonly childRadiusScale: number;
  readonly childSpeedScale: number;
  readonly childHealthScale: number;
  readonly childContactDamageScale: number;
}

export interface PrismWeaverDefinition {
  readonly spokeCount: 3;
  readonly anchorCount: 6;
  readonly innerRadius: number;
  readonly maximumRadius: number;
  readonly approachSpeed: number;
  readonly telegraphSeconds: number;
  readonly activeSeconds: number;
  readonly recoverySeconds: number;
  readonly travelRadians: number;
  readonly dangerHalfAngle: number;
  readonly attackDamage: number;
  readonly activeCap: number;
}

export interface EnemyDefinition {
  readonly kind: EnemyKind;
  readonly radius: number;
  readonly speed: number;
  readonly maxHealth: number;
  readonly contactDamage: number;
  readonly experience: number;
  readonly spawnCost: number;
  readonly color: number;
}

export const ENEMY_DEFINITIONS: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  chaser: {
    kind: 'chaser',
    radius: 18,
    speed: 72,
    maxHealth: 24,
    contactDamage: 8,
    experience: 1,
    spawnCost: 1,
    color: 0xff936b
  },
  fast: {
    kind: 'fast',
    radius: 14,
    speed: 126,
    maxHealth: 12,
    contactDamage: 6,
    experience: 2,
    spawnCost: 1,
    color: 0xffd166
  },
  tank: {
    kind: 'tank',
    radius: 28,
    speed: 42,
    maxHealth: 72,
    contactDamage: 16,
    experience: 5,
    spawnCost: 3,
    color: 0xc58cff
  },
  elite: {
    kind: 'elite',
    radius: 24,
    speed: 84,
    maxHealth: 132,
    contactDamage: 20,
    experience: 8,
    spawnCost: 5,
    color: 0xff5fd2
  },
  orbiter: {
    kind: 'orbiter',
    radius: 17,
    speed: 94,
    maxHealth: 32,
    contactDamage: 9,
    experience: 3,
    spawnCost: 2,
    color: 0x65e6ff
  },
  charger: {
    kind: 'charger', radius: 19, speed: 108, maxHealth: 38, contactDamage: 11,
    experience: 3, spawnCost: 2, color: 0xffb45b
  },
  splitter: {
    kind: 'splitter', radius: 21, speed: 62, maxHealth: 46, contactDamage: 12,
    experience: 4, spawnCost: 3, color: 0xd27cff
  },
  'prism-weaver': {
    kind: 'prism-weaver', radius: 20, speed: 44, maxHealth: 52, contactDamage: 8,
    experience: 5, spawnCost: 3, color: 0x76e5d2
  },
  'warden-replica': {
    kind: 'warden-replica', radius: 15, speed: 86, maxHealth: 30, contactDamage: 8,
    experience: 2, spawnCost: 1, color: 0x78e4ff
  },
  boss: {
    kind: 'boss',
    radius: 48,
    speed: 0,
    maxHealth: 520,
    contactDamage: 0,
    experience: 40,
    spawnCost: 0,
    color: 0xff6cf2
  }
};

/**
 * First authored Angular family. Values are deliberately isolated from the
 * final damage/health pass (EX-02c) and shared by the pure behavior tests.
 */
export const ORBITER_DEFINITION: OrbiterDefinition = {
  sectorCount: 8,
  reservedArcRadians: Math.PI / 2,
  minimumFreeArcRadians: Math.PI / 2,
  bandInset: 76,
  maximumBandRadius: 176,
  approachSpeed: 94,
  telegraphSeconds: 0.7,
  commitSeconds: 0.95,
  recoverySeconds: 0.6,
  commitAngularSpeed: 1.65,
  activeCap: 6,
  commitCap: 1
};

/** Second Angular family: fixes one straight crossing, never homes after warning. */
export const CHARGER_DEFINITION: ChargerDefinition = {
  approachInset: 30, approachSpeed: 108, telegraphSeconds: 0.72,
  chargeSeconds: 0.86, recoverySeconds: 0.52, exitDistance: 76,
  activeCap: 5, chargeCap: 1
};

/** Third Angular family: one controlled fracture, never an unbounded swarm. */
export const SPLITTER_DEFINITION: SplitterDefinition = {
  splitCount: 2,
  maxDepth: 1,
  activeCap: 8,
  splitOffset: 20,
  childRadiusScale: 0.72,
  childSpeedScale: 1.2,
  childHealthScale: 0.52,
  childContactDamageScale: 0.7
};

/**
 * Fourth Angular family: a slow support ship that rotates three dangerous
 * spokes as a single authored prism. These are provisional Act II values;
 * EX-02c owns the final health/damage calibration pass.
 */
export const PRISM_WEAVER_DEFINITION: PrismWeaverDefinition = {
  spokeCount: 3,
  anchorCount: 6,
  innerRadius: 28,
  maximumRadius: 226,
  approachSpeed: 44,
  telegraphSeconds: 0.82,
  activeSeconds: 1.25,
  recoverySeconds: 0.62,
  travelRadians: Math.PI / 3.1,
  dangerHalfAngle: 0.11,
  attackDamage: 16,
  activeCap: 3
};
