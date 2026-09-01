import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSaveData } from '../platform/save/SaveStore';
import type { PlatformAdapter } from '../platform/Platform';
import type { GameElements, GameOptions } from './Game';
import { Game } from './Game';

const mocks = vi.hoisted(() => ({
  gameOverOpen: vi.fn(),
  playerShot: vi.fn()
}));

vi.mock('../presentation/PixiGameView', () => ({
  PixiGameView: class {
    public readonly root = {};
    public closeLevelUpFx = vi.fn();
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
  }
}));

const createElements = (): GameElements => ({
  container: {} as HTMLElement,
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
  ads: { showMidgameAd: vi.fn(async () => undefined) },
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
    mocks.playerShot.mockReset();
    vi.stubGlobal('window', { location: { search: '' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for terminal presentation before opening the victory summary', () => {
    vi.useFakeTimers();
    const game = new Game(createOptions());
    const finishRun = (game as unknown as { finishRun: (outcome: 'victory') => void }).finishRun;

    finishRun.call(game, 'victory');

    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2_999);
    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mocks.gameOverOpen).toHaveBeenCalledTimes(1);
    expect(mocks.gameOverOpen.mock.calls[0][0]).toMatchObject({ outcome: 'victory' });
  });

  it('collapses a burst of simulation shots into one presentation pulse per frame', () => {
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      combat: { stats: { shotsFired: number } };
      syncShotFeedback: () => void;
    };
    runtime.combat.stats.shotsFired = 3;
    runtime.syncShotFeedback();
    runtime.syncShotFeedback();
    expect(mocks.playerShot).toHaveBeenCalledTimes(1);

    runtime.combat.stats.shotsFired = 0;
    runtime.syncShotFeedback();
    runtime.combat.stats.shotsFired = 1;
    runtime.syncShotFeedback();
    expect(mocks.playerShot).toHaveBeenCalledTimes(2);
  });
});
