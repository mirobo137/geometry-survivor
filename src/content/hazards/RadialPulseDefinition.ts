/** Authored Act I contract for the radial pulse. Values remain provisional
 * until the final EX-02c damage/health pass. */
export interface RadialPulseDefinition {
  readonly firstTriggerSeconds: number;
  readonly intervalSeconds: number;
  /** Do not start a delayed pulse after this Act I window. */
  readonly lastTriggerSeconds: number;
  readonly telegraphSeconds: number;
  readonly attackSeconds: number;
  readonly recoverySeconds: number;
  readonly damage: number;
  readonly width: number;
  /** Radius kept harmless around the center so the player has a real refuge. */
  readonly innerSafeRadius: number;
  /** Extra room reserved beyond the moving band for the outer refuge. */
  readonly outerSafeMargin: number;
}

export const RADIAL_PULSE_DEFINITION = {
  firstTriggerSeconds: 92,
  intervalSeconds: 52,
  lastTriggerSeconds: 250,
  telegraphSeconds: 1.1,
  attackSeconds: 1.6,
  recoverySeconds: 0.6,
  damage: 16,
  width: 28,
  innerSafeRadius: 72,
  outerSafeMargin: 8
} satisfies RadialPulseDefinition;
