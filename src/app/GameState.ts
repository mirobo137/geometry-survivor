export type GamePhase = 'menu' | 'playing' | 'run-intro' | 'level-up' | 'paused' | 'game-over' | 'victory' | 'act-intermission' | 'overdrive-transition';

export class GameState {
  public phase: GamePhase;
  private pausedPhase: 'playing' | 'run-intro' | 'overdrive-transition' | null = null;

  public constructor(initialPhase: 'menu' | 'playing' = 'playing') {
    this.phase = initialPhase;
  }

  public get isSimulationRunning(): boolean {
    return this.phase === 'playing';
  }

  public get isTerminal(): boolean {
    return this.phase === 'game-over' || this.phase === 'victory' || this.phase === 'act-intermission';
  }

  public get isTransitioning(): boolean {
    return this.phase === 'overdrive-transition';
  }

  public get isRunIntro(): boolean {
    return this.phase === 'run-intro';
  }

  public startRun(): boolean {
    if (this.phase !== 'menu') return false;
    this.phase = 'playing';
    return true;
  }

  /** Holds a fresh run while its presentation announces the route. */
  public enterRunIntro(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'run-intro';
    return true;
  }

  public completeRunIntro(): boolean {
    if (this.phase !== 'run-intro') return false;
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
    if (this.phase !== 'playing' && this.phase !== 'run-intro' && this.phase !== 'overdrive-transition') return false;
    this.pausedPhase = this.phase;
    this.phase = 'paused';
    return true;
  }

  public resume(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = this.pausedPhase ?? 'playing';
    this.pausedPhase = null;
    return true;
  }

  public get isPausedFromTransition(): boolean {
    return this.phase === 'paused' && this.pausedPhase === 'overdrive-transition';
  }

  public get isPausedFromRunIntro(): boolean {
    return this.phase === 'paused' && this.pausedPhase === 'run-intro';
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

  /**
   * A boss victory becomes a paused handoff between acts. It deliberately
   * carries no build, reward, or campaign rules; those remain in the
   * coordinator/content that owns them.
   */
  public enterActIntermission(): boolean {
    if (this.phase !== 'victory') return false;
    this.phase = 'act-intermission';
    return true;
  }

  /** Starts the next act from an intermission without treating it as a new run. */
  public continueToNextAct(): boolean {
    if (this.phase !== 'act-intermission') return false;
    this.phase = 'playing';
    return true;
  }

  /** Freezes simulation while the coordinator rebinds an Overdrive stage. */
  public enterOverdriveTransition(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'overdrive-transition';
    return true;
  }

  /** Resumes the preserved run after the transition presentation completes. */
  public completeOverdriveTransition(): boolean {
    if (this.phase !== 'overdrive-transition') return false;
    this.phase = 'playing';
    this.pausedPhase = null;
    return true;
  }

  /** Returns a death terminal run to gameplay; victories cannot be revived. */
  public reviveRun(): boolean {
    if (this.phase !== 'game-over') return false;
    this.phase = 'playing';
    return true;
  }

  public restart(): boolean {
    if (!this.isTerminal) return false;
    this.phase = 'playing';
    this.pausedPhase = null;
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
    this.pausedPhase = null;
    return true;
  }

  /** Converts an explicit Overdrive withdrawal into the normal terminal path. */
  public withdrawFromPause(): boolean {
    if (this.phase !== 'paused' || this.pausedPhase !== 'playing') return false;
    this.phase = 'playing';
    this.pausedPhase = null;
    return true;
  }

  /** Abandons the current run and returns to the start menu from manual pause. */
  public returnToMenuFromPause(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = 'menu';
    this.pausedPhase = null;
    return true;
  }

  /** Leaves a completed act safely when there is no playable next act yet. */
  public returnToMenuFromIntermission(): boolean {
    if (this.phase !== 'act-intermission') return false;
    this.phase = 'menu';
    this.pausedPhase = null;
    return true;
  }
}
