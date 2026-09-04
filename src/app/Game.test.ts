import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSaveData } from '../platform/save/SaveStore';
import type { PlatformAdapter, RewardedAdResult } from '../platform/Platform';
import type { GameElements, GameOptions } from './Game';
import { Game } from './Game';

const mocks = vi.hoisted(() => ({
  gameOverOpen: vi.fn(),
  gameOverClose: vi.fn(),
  revivePending: vi.fn(),
  reviveResult: vi.fn(),
  playerShot: vi.fn()
}));

vi.mock('../presentation/PixiGameView', () => ({
  PixiGameView: class {
    public readonly root = {};
    public closeLevelUpFx = vi.fn();
    public playPlayerRevive = vi.fn();
    public playPlayerShot = mocks.playerShot;
  }
}));

vi.mock('../ui/GameHud', () => ({
  GameHud: class {}
}));

vi.mock('../ui/level-up/LevelUpOverlay', () => ({
  LevelUpOverlay: class {}
}));

vi.mock('../ui/PauseOverlay', () => ({
  PauseOverlay: class {}
}));

vi.mock('../ui/GameOverOverlay', () => ({
  GameOverOverlay: class {
    public open = mocks.gameOverOpen;
    public close = mocks.gameOverClose;
    public setRevivePending = mocks.revivePending;
    public setReviveResult = mocks.reviveResult;
  }
}));

const createElements = (): GameElements => ({
  container: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 1280 })
  } as unknown as HTMLElement,
  debug: {} as HTMLElement,
  hud: {} as HTMLElement,
  levelUp: {} as HTMLElement,
  pause: {} as HTMLElement,
  gameOver: {} as HTMLElement
});

const createPlatform = (): PlatformAdapter => ({
  name: 'test',
  lifecycle: {
    init: vi.fn(async () => undefined),
    onGameStart: vi.fn(),
    onGamePause: vi.fn(),
    onGameResume: vi.fn(),
    onGameOver: vi.fn()
  },
  ads: {
    isRewardedAvailable: vi.fn(async () => true),
    showRewarded: vi.fn(async (): Promise<RewardedAdResult> => 'rewarded')
  },
  audio: {
    configure: vi.fn(),
    unlock: vi.fn(async () => undefined),
    pause: vi.fn(),
    resume: vi.fn(),
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    playCue: vi.fn(),
    shutdown: vi.fn()
  },
  saveStore: {
    load: vi.fn(() => createDefaultSaveData()),
    save: vi.fn(() => true),
    clear: vi.fn()
  }
});

const createOptions = (): GameOptions => ({
  app: {
    renderer: {},
    stage: { addChild: vi.fn() },
    ticker: { add: vi.fn(), remove: vi.fn() }
  } as unknown as GameOptions['app'],
  elements: createElements(),
  stressMode: false,
  buildTarget: 'test',
  platform: createPlatform()
});

describe('Game', () => {
  beforeEach(() => {
    mocks.gameOverOpen.mockReset();
    mocks.gameOverClose.mockReset();
    mocks.revivePending.mockReset();
    mocks.reviveResult.mockReset();
    mocks.playerShot.mockReset();
    vi.stubGlobal('window', {
      location: { search: '' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for terminal presentation before opening the victory summary', async () => {
    vi.useFakeTimers();
    const game = new Game(createOptions());
    const finishRun = (game as unknown as { finishRun: (outcome: 'victory') => void }).finishRun;

    finishRun.call(game, 'victory');

    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2_999);
    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(mocks.gameOverOpen).toHaveBeenCalledTimes(1);
    expect(mocks.gameOverOpen.mock.calls[0][0]).toMatchObject({ outcome: 'victory' });
  });

  it('collapses a burst of simulation shots into one presentation pulse per frame', () => {
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      combat: { renderState: { shot: { sequence: number; directionX: number; directionY: number; muzzleMask: number; leftOriginX: number; leftOriginY: number; rightOriginX: number; rightOriginY: number } } };
      syncShotFeedback: () => void;
    };
    runtime.combat.renderState.shot.sequence = 3;
    runtime.combat.renderState.shot.muzzleMask = 3;
    runtime.syncShotFeedback();
    runtime.syncShotFeedback();
    expect(mocks.playerShot).toHaveBeenCalledTimes(1);
    expect(mocks.playerShot.mock.calls[0][1]).toMatchObject({ muzzleMask: 3 });

    runtime.combat.renderState.shot.sequence = 0;
    runtime.syncShotFeedback();
    runtime.combat.renderState.shot.sequence = 1;
    runtime.syncShotFeedback();
    expect(mocks.playerShot).toHaveBeenCalledTimes(2);
  });

  it('revives a death run with the rewarded health window and keeps its progress', async () => {
    vi.useFakeTimers();
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      finishRun: (outcome: 'game-over') => void;
      requestRevive: (terminalToken: number) => Promise<void>;
      player: { state: { health: number; maxHealth: number } };
      gameState: { phase: string };
    };
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');

    await runtime.requestRevive.call(game, 1);

    expect(runtime.gameState.phase).toBe('playing');
    expect(runtime.player.state.health).toBeCloseTo(35);
    expect(mocks.gameOverClose).toHaveBeenCalledTimes(1);
    expect(mocks.revivePending).toHaveBeenCalledTimes(1);
    expect(mocks.reviveResult).not.toHaveBeenCalled();
  });
});
