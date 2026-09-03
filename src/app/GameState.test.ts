import { describe, expect, it } from 'vitest';
import { GameState } from './GameState';

describe('GameState', () => {
  it('keeps the presentation menu outside the simulation until play starts', () => {
    const state = new GameState('menu');

    expect(state.phase).toBe('menu');
    expect(state.isSimulationRunning).toBe(false);
    expect(state.enterPause()).toBe(false);
    expect(state.startRun()).toBe(true);
    expect(state.phase).toBe('playing');
    expect(state.startRun()).toBe(false);
  });

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

    expect(state.endRun()).toBe(true);
    expect(state.isSimulationRunning).toBe(false);
    expect(state.isTerminal).toBe(true);
    expect(state.resume()).toBe(false);
    expect(state.phase).toBe('game-over');
    expect(state.endRun()).toBe(false);
    expect(state.winRun()).toBe(false);
    expect(state.restart()).toBe(true);
    expect(state.phase).toBe('playing');

    expect(state.winRun()).toBe(true);
    expect(state.phase).toBe('victory');
    expect(state.isTerminal).toBe(true);
    expect(state.restart()).toBe(true);
    expect(state.phase).toBe('playing');
  });

  it('does not restart an active or transitional phase', () => {
    const state = new GameState();

    expect(state.restart()).toBe(false);
    expect(state.enterLevelUp()).toBe(true);
    expect(state.restart()).toBe(false);
    expect(state.leaveLevelUp()).toBe(true);
    expect(state.enterPause()).toBe(true);
    expect(state.restart()).toBe(false);
  });

  it('allows an explicit restart from the manual pause only', () => {
    const state = new GameState();

    expect(state.restartFromPause()).toBe(false);
    expect(state.enterPause()).toBe(true);
    expect(state.restartFromPause()).toBe(true);
    expect(state.phase).toBe('playing');

    expect(state.enterLevelUp()).toBe(true);
    expect(state.restartFromPause()).toBe(false);
  });

  it('allows returning to the menu from manual pause only', () => {
    const state = new GameState();

    expect(state.returnToMenuFromPause()).toBe(false);
    expect(state.enterPause()).toBe(true);
    expect(state.returnToMenuFromPause()).toBe(true);
    expect(state.phase).toBe('menu');
    expect(state.isSimulationRunning).toBe(false);
    expect(state.resume()).toBe(false);
    expect(state.startRun()).toBe(true);
    expect(state.phase).toBe('playing');
  });
});
