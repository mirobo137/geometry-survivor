export interface LaserDefinition {
  readonly firstTriggerSeconds: number;
  readonly intervalSeconds: number;
  readonly telegraphSeconds: number;
  readonly attackSeconds: number;
  readonly recoverySeconds: number;
  readonly damage: number;
  readonly width: number;
}

export const LASER_DEFINITION = {
  firstTriggerSeconds: 45,
  intervalSeconds: 18,
  telegraphSeconds: 0.8,
  attackSeconds: 0.18,
  recoverySeconds: 0.5,
  damage: 18,
  width: 22
} satisfies LaserDefinition;
