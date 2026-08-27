export type GamePhase = 'playing' | 'level-up' | 'paused' | 'game-over' | 'victory';

export class GameState {
  public phase: GamePhase = 'playing';

  public get isSimulationRunning(): boolean {
    return this.phase === 'playing';
  }

  public get isTerminal(): boolean {
    return this.phase === 'game-over' || this.phase === 'victory';
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

  public endRun(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'game-over';
    return true;
  }

  public winRun(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'victory';
    return true;
  }

  public restart(): boolean {
    if (!this.isTerminal) return false;
    this.phase = 'playing';
    return true;
  }
}
