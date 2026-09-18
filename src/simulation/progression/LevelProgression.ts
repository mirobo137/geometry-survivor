const FIRST_LEVEL_EXPERIENCE = 8;
const MAX_TRACKED_EXPERIENCE = Number.MAX_SAFE_INTEGER;

export interface LevelProgressionState {
  readonly level: number;
  readonly totalExperience: number;
  readonly nextLevelExperience: number;
  readonly pendingLevelUps: number;
}

/** Cumulative XP needed to advance from `level` to the next level. */
const nextThresholdForLevel = (level: number): number => (
  2 * level * level + 6 * level
);

const normalizeExperience = (experience: number): number => {
  if (experience === Number.POSITIVE_INFINITY) return MAX_TRACKED_EXPERIENCE;
  if (!Number.isFinite(experience)) return 0;
  return Math.min(MAX_TRACKED_EXPERIENCE, Math.max(0, Math.floor(experience)));
};

const levelForExperience = (experience: number): number => {
  if (experience < FIRST_LEVEL_EXPERIENCE) return 1;
  // Solve 2k² + 6k <= XP, where k is the number of level-ups from level 1.
  let levelUps = Math.floor((-6 + Math.sqrt(36 + 8 * experience)) / 4);
  while (nextThresholdForLevel(levelUps + 1) <= experience) levelUps += 1;
  while (levelUps > 0 && nextThresholdForLevel(levelUps) > experience) levelUps -= 1;
  return levelUps + 1;
};

export class LevelProgression {
  public state: LevelProgressionState = {
    level: 1,
    totalExperience: 0,
    nextLevelExperience: FIRST_LEVEL_EXPERIENCE,
    pendingLevelUps: 0
  };

  private lastExperience = 0;

  public sync(totalExperience: number): void {
    const safeExperience = normalizeExperience(totalExperience);
    if (safeExperience < this.lastExperience) return;

    this.lastExperience = safeExperience;
    const level = Math.max(this.state.level, levelForExperience(safeExperience));
    const additionalLevelUps = level - this.state.level;
    const pendingLevelUps = this.state.pendingLevelUps + additionalLevelUps;
    const nextLevelExperience = Math.min(MAX_TRACKED_EXPERIENCE, nextThresholdForLevel(level));

    this.state = {
      level,
      totalExperience: safeExperience,
      nextLevelExperience,
      pendingLevelUps
    };
  }

  public consumeLevelUp(): boolean {
    if (this.state.pendingLevelUps <= 0) return false;
    this.state = { ...this.state, pendingLevelUps: this.state.pendingLevelUps - 1 };
    return true;
  }

  public reset(): void {
    this.state = {
      level: 1,
      totalExperience: 0,
      nextLevelExperience: FIRST_LEVEL_EXPERIENCE,
      pendingLevelUps: 0
    };
    this.lastExperience = 0;
  }
}
