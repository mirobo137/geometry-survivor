export type ArenaShape = 'circle' | 'hexagon' | 'square';

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

/**
 * Act II starts inside the familiar hexagon, cycles through authored square,
 * circle and hexagon states every ~40 seconds, then settles on the circle
 * before Orbital Warden arrives.
 * The square shares the hexagon's minimum side clearance (see ArenaBoundary),
 * so the transition asks for a new route rather than silently removing the
 * player's only escape space. Hazard cadence and damage are deliberately not
 * part of this schedule.
 */
export const ACT_II_ARENA_SHAPE_CHANGES: readonly ArenaShapeChangeDefinition[] = [
  { startSeconds: 40, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'hexagon', to: 'square' },
  { startSeconds: 80, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'square', to: 'circle' },
  { startSeconds: 120, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'circle', to: 'hexagon' },
  { startSeconds: 160, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'hexagon', to: 'square' },
  { startSeconds: 200, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'square', to: 'hexagon' },
  // 248.05 + 1.20 + 0.75 = 250: keep ten seconds of stable circle before the boss.
  { startSeconds: 248.05, telegraphSeconds: 1.2, morphSeconds: 0.75, from: 'hexagon', to: 'circle' }
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
