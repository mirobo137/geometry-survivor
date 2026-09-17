import type { ActId } from './ActDefinitions';

/** Run modes are deliberately separate from the authored campaign acts. */
export type RunMode = 'campaign' | 'overdrive';

export const OVERDRIVE_STAGES_PER_LAP = 3 as const;
export const OVERDRIVE_HEALTH_MULTIPLIER_CAP = 1_000_000_000 as const;
export const OVERDRIVE_MAX_PRESSURE_MULTIPLIER = 1.75 as const;
export const OVERDRIVE_MIN_SPAWN_INTERVAL_SECONDS = 0.2 as const;
/** Repeatable post-evolution power cards add five percentage points. */
export const OVERDRIVE_POWER_INCREMENT = 0.05 as const;
/** Technical safety cap for the independent repeatable power multiplier. */
export const OVERDRIVE_POWER_MULTIPLIER_CAP = 1_000 as const;
export const OVERDRIVE_POWER_MAX_STACKS = Math.floor(
  (OVERDRIVE_POWER_MULTIPLIER_CAP - 1) / OVERDRIVE_POWER_INCREMENT
);
/**
 * Campaign keeps its authored repeatables untouched. Overdrive gives the two
 * uncapped starter passives a finite authored runway so reserve cards have a
 * deterministic handoff instead of starving behind infinite filler.
 */
export const OVERDRIVE_AUTHORED_STACK_CAPS = {
  swift_step: 6,
  reinforced_core: 9
} as const;
export const DEFAULT_OVERDRIVE_SEED = 0x6d2b79f5 as const;

export type OverdriveStageInLap = 1 | 2 | 3;

/**
 * The bounded state needed to enter and resume a stage. Runtime systems may
 * extend this locally, but these fields are the stable cross-layer contract.
 */
export interface OverdriveStageState {
  readonly mode: 'overdrive';
  readonly stage: number;
  readonly lap: number;
  readonly stageInLap: OverdriveStageInLap;
  readonly seed: number;
  readonly healthMultiplier: number;
  readonly pressureMultiplier: number;
}

export const normalizeOverdriveStage = (value: number): number => (
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
);

/** Xorshift cannot make progress from zero, so reserve a non-zero fallback. */
export const normalizeOverdriveSeed = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_OVERDRIVE_SEED;
  const normalized = value >>> 0;
  return normalized === 0 ? DEFAULT_OVERDRIVE_SEED : normalized;
};

export const getOverdriveLap = (stage: number): number => (
  Math.floor((normalizeOverdriveStage(stage) - 1) / OVERDRIVE_STAGES_PER_LAP) + 1
);

export const getOverdriveStageInLap = (stage: number): OverdriveStageInLap => (
  ((normalizeOverdriveStage(stage) - 1) % OVERDRIVE_STAGES_PER_LAP + 1) as OverdriveStageInLap
);

/**
 * Stage one is authored at base HP; later stages use the approved linear
 * multiplier and are clamped only to protect finite-number arithmetic.
 */
export const getOverdriveHealthMultiplier = (stage: number): number => (
  Math.min(
    OVERDRIVE_HEALTH_MULTIPLIER_CAP,
    normalizeOverdriveStage(stage) === 1
      ? 1
      : 3 * (normalizeOverdriveStage(stage) - 1)
  )
);

export const getOverdrivePressureMultiplier = (lap: number): number => {
  const normalizedLap = Number.isFinite(lap) ? Math.max(1, Math.floor(lap)) : 1;
  if (normalizedLap === 1) return 1;
  if (normalizedLap === 2) return 1.15;
  if (normalizedLap === 3) return 1.3;
  return Math.min(
    OVERDRIVE_MAX_PRESSURE_MULTIPLIER,
    Math.round((1.4 + 0.1 * (normalizedLap - 4)) * 100) / 100
  );
};

export const createOverdriveStageState = (
  stage: number,
  seed: unknown
): OverdriveStageState => {
  const normalizedStage = normalizeOverdriveStage(stage);
  const lap = getOverdriveLap(normalizedStage);
  return {
    mode: 'overdrive',
    stage: normalizedStage,
    lap,
    stageInLap: getOverdriveStageInLap(normalizedStage),
    seed: normalizeOverdriveSeed(seed),
    healthMultiplier: getOverdriveHealthMultiplier(normalizedStage),
    pressureMultiplier: getOverdrivePressureMultiplier(lap)
  };
};

/** The first lap intentionally follows the three authored campaign acts. */
export const getFirstLapActId = (stage: number): ActId | null => {
  const normalizedStage = normalizeOverdriveStage(stage);
  if (normalizedStage > OVERDRIVE_STAGES_PER_LAP) return null;
  const acts: readonly ActId[] = ['radial', 'angular', 'fracture'];
  return acts[normalizedStage - 1] ?? null;
};
