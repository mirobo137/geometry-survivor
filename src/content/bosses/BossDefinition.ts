export type BossId = 'core-sentinel' | 'orbital-warden';
export type BossPattern = 'sweep' | 'ring' | 'charge' | 'curve' | 'replicas';

export interface BossDefinition {
  readonly id: BossId;
  readonly startSeconds: number;
  readonly spawnDistance: number;
  readonly movementRadius: number;
  readonly movementAngularSpeed: number;
  readonly introSeconds: number;
  readonly sweepTelegraphSeconds: number;
  readonly sweepActiveSeconds: number;
  readonly ringTelegraphSeconds: number;
  readonly ringActiveSeconds: number;
  readonly recoverySeconds: number;
  readonly damage: number;
  readonly sweepWidth: number;
  readonly ringWidth: number;
  readonly ringStartRadius: number;
  readonly ringEndPadding: number;
  readonly safeGapHalfAngle: number;
  /** Optional active-phase rotation; zero preserves Core Sentinel behaviour. */
  readonly sweepAngularSpeed: number;
  /** Optional safe-corridor rotation during a ring attack. */
  readonly ringAngularSpeed: number;
  /** Authored pattern order; Core Sentinel keeps the original two-pattern loop. */
  readonly patternOrder: readonly BossPattern[];
  readonly chargeTelegraphSeconds: number;
  readonly chargeActiveSeconds: number;
  readonly chargeWidth: number;
  readonly curveTelegraphSeconds: number;
  readonly curveActiveSeconds: number;
  readonly curveWidth: number;
  readonly curveRadiusInset: number;
  readonly curveTravelRadians: number;
  readonly curveAngularSpeed: number;
  readonly replicasTelegraphSeconds: number;
  readonly replicasActiveSeconds: number;
  readonly replicaCount: number;
  readonly replicaSpreadRadians: number;
}

export const BOSS_DEFINITION = {
  id: 'core-sentinel',
  startSeconds: 260,
  spawnDistance: 180,
  movementRadius: 180,
  movementAngularSpeed: 0.32,
  introSeconds: 1.2,
  sweepTelegraphSeconds: 1,
  sweepActiveSeconds: 0.24,
  ringTelegraphSeconds: 0.9,
  ringActiveSeconds: 0.95,
  recoverySeconds: 1.25,
  damage: 24,
  sweepWidth: 34,
  ringWidth: 24,
  ringStartRadius: 72,
  ringEndPadding: 28,
  safeGapHalfAngle: 0.52,
  sweepAngularSpeed: 0,
  ringAngularSpeed: 0,
  patternOrder: ['sweep', 'ring'],
  chargeTelegraphSeconds: 0.85,
  chargeActiveSeconds: 0.7,
  chargeWidth: 26,
  curveTelegraphSeconds: 0.85,
  curveActiveSeconds: 1.05,
  curveWidth: 28,
  curveRadiusInset: 82,
  curveTravelRadians: 1.6,
  curveAngularSpeed: 1.55,
  replicasTelegraphSeconds: 0.8,
  replicasActiveSeconds: 0.5,
  replicaCount: 2,
  replicaSpreadRadians: 0.72
} satisfies BossDefinition;

/**
 * EX-07d boss consumer. It reuses the tested boss lifecycle and ship
 * assembly, but gives Orbital Warden its own Angular family order: rotating
 * rail, fixed charge, bounded curve, destructible replicas and drifting safe
 * ring. Final damage/health tuning remains deferred to EX-02c.
 */
export const ORBITAL_WARDEN_DEFINITION = {
  ...BOSS_DEFINITION,
  id: 'orbital-warden',
  startSeconds: 0,
  movementRadius: 168,
  movementAngularSpeed: 0.46,
  introSeconds: 1.1,
  sweepTelegraphSeconds: 0.95,
  sweepActiveSeconds: 1.2,
  ringTelegraphSeconds: 0.9,
  ringActiveSeconds: 1.45,
  recoverySeconds: 0.9,
  sweepWidth: 30,
  ringWidth: 26,
  safeGapHalfAngle: 0.62,
  sweepAngularSpeed: 0.78,
  ringAngularSpeed: 0.34,
  patternOrder: ['sweep', 'charge', 'curve', 'replicas', 'ring'],
  chargeTelegraphSeconds: 0.92,
  chargeActiveSeconds: 0.72,
  chargeWidth: 30,
  curveTelegraphSeconds: 0.86,
  curveActiveSeconds: 1.12,
  curveWidth: 30,
  curveRadiusInset: 84,
  curveTravelRadians: 1.72,
  curveAngularSpeed: 1.54,
  replicasTelegraphSeconds: 0.78,
  replicasActiveSeconds: 0.55,
  replicaCount: 2,
  replicaSpreadRadians: 0.76
} satisfies BossDefinition;
