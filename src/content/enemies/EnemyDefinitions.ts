export type EnemyKind = 'chaser' | 'fast' | 'tank' | 'elite' | 'orbiter' | 'charger' | 'boss';

export type OrbiterPhase = 'inactive' | 'approach' | 'telegraph' | 'commit' | 'recovery';
export type OrbiterDirection = -1 | 1;
export type ChargerPhase = 'inactive' | 'approach' | 'telegraph' | 'charge' | 'recovery';

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
