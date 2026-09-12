/** Authored sector hazard for the first Angular boss consumer. */
export interface AngularSweepDefinition {
  readonly firstTriggerSeconds: number;
  readonly intervalSeconds: number;
  readonly lastTriggerSeconds: number;
  readonly telegraphSeconds: number;
  readonly attackSeconds: number;
  readonly recoverySeconds: number;
  readonly damage: number;
  /** Width of the dangerous sector at its centre line, in radians. */
  readonly dangerHalfAngle: number;
  /** Angular travel during the active phase, in radians. */
  readonly travelRadians: number;
  readonly sectorCount: number;
  readonly startAngleStep: number;
}

/**
 * A single rotating blade: its telegraph commits a sector and its active
 * phase sweeps only a bounded arc, leaving a large route around the arena.
 * Numbers are authored for the EX-07d drill and remain provisional until the
 * deferred EX-02c balance pass.
 */
export const ANGULAR_SWEEP_DEFINITION = {
  firstTriggerSeconds: 82,
  intervalSeconds: 14,
  lastTriggerSeconds: 220,
  telegraphSeconds: 0.9,
  attackSeconds: 1.65,
  recoverySeconds: 0.6,
  damage: 22,
  dangerHalfAngle: 0.22,
  travelRadians: 0.92,
  sectorCount: 8,
  startAngleStep: Math.PI / 4
} satisfies AngularSweepDefinition;

/** Fast isolated preview; this is not an Act II campaign cadence. */
export const ANGULAR_SWEEP_DRILL_DEFINITION = {
  ...ANGULAR_SWEEP_DEFINITION,
  firstTriggerSeconds: 0,
  intervalSeconds: 5.6,
  lastTriggerSeconds: 30,
  telegraphSeconds: 0.85,
  attackSeconds: 1.55,
  recoverySeconds: 0.55
} satisfies AngularSweepDefinition;

