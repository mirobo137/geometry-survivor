/** Authored Act II hazard base. Damage and cadence remain provisional until EX-02c. */
export interface PulseRingDefinition {
  readonly firstTriggerSeconds: number;
  readonly intervalSeconds: number;
  readonly lastTriggerSeconds: number;
  readonly telegraphSeconds: number;
  readonly attackSeconds: number;
  readonly recoverySeconds: number;
  readonly damage: number;
  readonly width: number;
  /** Harmless radial pocket retained at the center. */
  readonly innerSafeRadius: number;
  /** Extra room reserved at the outside edge for the player body and band. */
  readonly outerSafeMargin: number;
  /** Number of authored angular sectors used to place the rotating opening. */
  readonly sectorCount: number;
  /** Half-width of the opening. It is an answer, not a painted safe floor. */
  readonly safeGapHalfAngle: number;
  /** Angular travel of the opening while the damaging band is active. */
  readonly safeGapRotationRadians: number;
  /** Bounded radial displacement while the player is caught by the band. */
  readonly pushSpeed: number;
}

export const PULSE_RING_DEFINITION = {
  firstTriggerSeconds: 38,
  intervalSeconds: 34,
  lastTriggerSeconds: 220,
  telegraphSeconds: 0.95,
  attackSeconds: 1.8,
  recoverySeconds: 0.55,
  damage: 16,
  width: 30,
  innerSafeRadius: 78,
  outerSafeMargin: 12,
  sectorCount: 8,
  safeGapHalfAngle: 0.31,
  safeGapRotationRadians: 0.72,
  pushSpeed: 38
} satisfies PulseRingDefinition;

/** Immediate development scenario. It is not a campaign balance profile. */
export const PULSE_RING_DRILL_DEFINITION = {
  ...PULSE_RING_DEFINITION,
  firstTriggerSeconds: 0,
  intervalSeconds: 3,
  lastTriggerSeconds: 30,
  telegraphSeconds: 0.8,
  attackSeconds: 1.6,
  recoverySeconds: 0.45
} satisfies PulseRingDefinition;
