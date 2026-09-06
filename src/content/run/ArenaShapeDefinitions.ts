export type ArenaShape = 'circle' | 'hexagon';

export interface ArenaShapeChangeDefinition {
  readonly startSeconds: number;
  readonly telegraphSeconds: number;
  readonly morphSeconds: number;
  readonly from: ArenaShape;
  readonly to: ArenaShape;
}

export interface ArenaLaserPressure {
  /** Interval between strikes while this arena identity is active. */
  readonly intervalSeconds: number;
  /** Every Nth strike gets a visible clock-hand sweep. */
  readonly sweepEveryStrikes: number;
  /** Sweep amount in the line's half-turn domain. */
  readonly sweepAngleRadians: number;
  /** Active detonation duration while the line traverses its sweep. */
  readonly sweepAttackSeconds: number;
}

/**
 * Act I's first identity hook: the circular arena previews and morphs into a
 * hexagon once before the boss, returns to its base shape, then repeats during
 * the boss. The authored schedule is deterministic rather than random.
 */
export const ACT_I_ARENA_SHAPE_CHANGES: readonly ArenaShapeChangeDefinition[] = [
  { startSeconds: 132, telegraphSeconds: 1.4, morphSeconds: 0.85, from: 'circle', to: 'hexagon' },
  { startSeconds: 210, telegraphSeconds: 1.4, morphSeconds: 0.85, from: 'hexagon', to: 'circle' },
  { startSeconds: 288, telegraphSeconds: 1.6, morphSeconds: 1.05, from: 'circle', to: 'hexagon' }
] as const;

const CIRCLE_LASER_PRESSURE: ArenaLaserPressure = {
  intervalSeconds: 18,
  sweepEveryStrikes: 3,
  sweepAngleRadians: 0.34,
  sweepAttackSeconds: 0.9
};

const FIRST_HEXAGON_LASER_PRESSURE: ArenaLaserPressure = {
  intervalSeconds: 14,
  sweepEveryStrikes: 2,
  sweepAngleRadians: 0.48,
  sweepAttackSeconds: 0.84
};

const REPEAT_HEXAGON_LASER_PRESSURE: ArenaLaserPressure = {
  intervalSeconds: 10.5,
  sweepEveryStrikes: 1,
  sweepAngleRadians: 0.68,
  sweepAttackSeconds: 0.78
};

/**
 * Returns the authored Act I laser pressure for the current arena identity.
 * Shape interventions deliberately become more frequent and more mobile;
 * future acts can add profiles without teaching LaserHazard new rules.
 */
export const getActIArenaLaserPressure = (
  shape: ArenaShape,
  shapeIndex: number
): ArenaLaserPressure => {
  if (shape !== 'hexagon') return CIRCLE_LASER_PRESSURE;
  return shapeIndex >= 3 ? REPEAT_HEXAGON_LASER_PRESSURE : FIRST_HEXAGON_LASER_PRESSURE;
};
