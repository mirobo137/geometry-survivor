export interface DifficultyPhase {
  readonly startSeconds: number;
  readonly spawnIntervalSeconds: number;
}

export const DIFFICULTY_PHASES: readonly DifficultyPhase[] = [
  { startSeconds: 0, spawnIntervalSeconds: 0.85 },
  { startSeconds: 60, spawnIntervalSeconds: 0.7 },
  { startSeconds: 120, spawnIntervalSeconds: 0.56 },
  { startSeconds: 180, spawnIntervalSeconds: 0.44 },
  { startSeconds: 240, spawnIntervalSeconds: 0.34 },
  { startSeconds: 300, spawnIntervalSeconds: 0.28 }
];

/** Authored pressure curve for the first real Angular act consumer. */
export const ACT_II_DIFFICULTY_PHASES: readonly DifficultyPhase[] = [
  { startSeconds: 0, spawnIntervalSeconds: 0.9 },
  { startSeconds: 55, spawnIntervalSeconds: 0.74 },
  { startSeconds: 110, spawnIntervalSeconds: 0.6 },
  { startSeconds: 165, spawnIntervalSeconds: 0.48 },
  { startSeconds: 220, spawnIntervalSeconds: 0.38 }
];

export const getSpawnIntervalSeconds = (elapsedSeconds: number): number => {
  const elapsed = Math.max(0, elapsedSeconds);
  for (let index = DIFFICULTY_PHASES.length - 1; index >= 0; index -= 1) {
    const phase = DIFFICULTY_PHASES[index];
    if (elapsed >= phase.startSeconds) return phase.spawnIntervalSeconds;
  }
  return DIFFICULTY_PHASES[0].spawnIntervalSeconds;
};
