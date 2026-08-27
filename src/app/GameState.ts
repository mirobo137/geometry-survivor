export type GamePhase = 'playing' | 'level-up' | 'paused' | 'game-over' | 'victory';

export class GameState {
  public phase: GamePhase = 'playing';

  public get isSimulationRunning(): boolean {
    return this.phase === 'playing';
  }

  public enterLevelUp(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'level-up';
    return true;
  }

  public leaveLevelUp(): boolean {
    if (this.phase !== 'level-up') return false;
    this.phase = 'playing';
    return true;
  }

  public enterPause(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'paused';
    return true;
  }

  public resume(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = 'playing';
    return true;
  }

  public endRun(): void {
    this.phase = 'game-over';
  }

  public winRun(): void {
    this.phase = 'victory';
  }
}
