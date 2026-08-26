const FIRST_LEVEL_EXPERIENCE = 8;
const EXPERIENCE_STEP = 4;

export interface LevelProgressionState {
  readonly level: number;
  readonly totalExperience: number;
  readonly nextLevelExperience: number;
  readonly pendingLevelUps: number;
}

const experienceToReachNextLevel = (level: number): number => FIRST_LEVEL_EXPERIENCE + (level - 1) * EXPERIENCE_STEP;

export class LevelProgression {
  public state: LevelProgressionState = {
    level: 1,
    totalExperience: 0,
    nextLevelExperience: FIRST_LEVEL_EXPERIENCE,
    pendingLevelUps: 0
  };

  private lastExperience = 0;

  public sync(totalExperience: number): void {
    const safeExperience = Math.max(0, Math.floor(totalExperience));
    if (safeExperience < this.lastExperience) return;

    this.lastExperience = safeExperience;
    let nextLevelExperience = this.state.nextLevelExperience;
    let level = this.state.level;
    let pendingLevelUps = this.state.pendingLevelUps;
    while (safeExperience >= nextLevelExperience) {
      level += 1;
      pendingLevelUps += 1;
      nextLevelExperience += experienceToReachNextLevel(level);
    }

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
}
