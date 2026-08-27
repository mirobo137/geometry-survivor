export interface BossDefinition {
  readonly startSeconds: number;
  readonly spawnDistance: number;
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
}

export const BOSS_DEFINITION = {
  startSeconds: 260,
  spawnDistance: 180,
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
  safeGapHalfAngle: 0.52
} satisfies BossDefinition;
