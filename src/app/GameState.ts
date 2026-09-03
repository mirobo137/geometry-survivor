export type GamePhase = 'menu' | 'playing' | 'level-up' | 'paused' | 'game-over' | 'victory';

export class GameState {
  public phase: GamePhase;

  public constructor(initialPhase: 'menu' | 'playing' = 'playing') {
    this.phase = initialPhase;
  }

  public get isSimulationRunning(): boolean {
    return this.phase === 'playing';
  }

  public get isTerminal(): boolean {
    return this.phase === 'game-over' || this.phase === 'victory';
  }

  public startRun(): boolean {
    if (this.phase !== 'menu') return false;
    this.phase = 'playing';
    return true;
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

  /**
   * Manual pause can be abandoned explicitly from the pause menu. Keeping
   * this transition separate from `restart()` prevents a lifecycle pause or
   * a level-up from being reset accidentally by a shared button.
   */
  public restartFromPause(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = 'playing';
    return true;
  }

  /** Abandons the current run and returns to the start menu from manual pause. */
  public returnToMenuFromPause(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = 'menu';
    return true;
  }
}
