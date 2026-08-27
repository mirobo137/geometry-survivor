import { describe, expect, it } from 'vitest';
import { GameState } from './GameState';

describe('GameState', () => {
  it('allows only the intended level-up and pause transitions', () => {
    const state = new GameState();

    expect(state.isSimulationRunning).toBe(true);
    expect(state.enterLevelUp()).toBe(true);
    expect(state.phase).toBe('level-up');
    expect(state.enterPause()).toBe(false);
    expect(state.leaveLevelUp()).toBe(true);
    expect(state.enterPause()).toBe(true);
    expect(state.resume()).toBe(true);
    expect(state.phase).toBe('playing');
  });

  it('does not resume a finished run as if it were active', () => {
    const state = new GameState();

    state.endRun();
    expect(state.isSimulationRunning).toBe(false);
    expect(state.resume()).toBe(false);
    expect(state.phase).toBe('game-over');

    state.winRun();
    expect(state.phase).toBe('victory');
  });
});
