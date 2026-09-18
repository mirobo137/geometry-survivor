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
  doubleNovaPending: vi.fn(),
  doubleNovaResult: vi.fn(),
  gameOverUpdateNova: vi.fn(),
  playerShot: vi.fn()
}));

vi.mock('../presentation/PixiGameView', () => ({
  PixiGameView: class {
    public readonly root = {};
    public closeLevelUpFx = vi.fn();
    public resetPresentation = vi.fn();
    public playPlayerRevive = vi.fn();
    public playPlayerShot = mocks.playerShot;
    public playPlayerDamage = vi.fn();
    public playPlayerGuard = vi.fn();
    public playPlayerDefeat = vi.fn();
    public playEnemyDefeat = vi.fn();
    public playBossDefeat = vi.fn();
  }
}));

vi.mock('../ui/GameHud', () => ({
  GameHud: class {}
}));

vi.mock('../ui/level-up/LevelUpOverlay', () => ({
  LevelUpOverlay: class {}
}));

vi.mock('../ui/PauseOverlay', () => ({
  PauseOverlay: class {
    public close = vi.fn();
    public open = vi.fn();
  }
}));

vi.mock('../ui/JoystickView', () => ({
  JoystickView: class { public render = vi.fn(); public destroy = vi.fn(); }
}));

vi.mock('../ui/GameOverOverlay', () => ({
  GameOverOverlay: class {
    public open = mocks.gameOverOpen;
    public close = mocks.gameOverClose;
    public setRevivePending = mocks.revivePending;
    public setReviveResult = mocks.reviveResult;
    public setDoubleNovaPending = mocks.doubleNovaPending;
    public setDoubleNovaResult = mocks.doubleNovaResult;
    public updateNova = mocks.gameOverUpdateNova;
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

interface PlatformOverrides {
  readonly ads?: PlatformAdapter['ads'];
  readonly saveStore?: PlatformAdapter['saveStore'];
  readonly baselineMode?: boolean;
}

const createPlatform = (overrides: PlatformOverrides = {}): PlatformAdapter => ({
  name: 'test',
  lifecycle: {
    init: vi.fn(async () => undefined),
    onGameStart: vi.fn(),
    onGamePause: vi.fn(),
    onGameResume: vi.fn(),
    onGameOver: vi.fn()
  },
  ads: overrides.ads ?? {
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
  saveStore: overrides.saveStore ?? {
    load: vi.fn(() => createDefaultSaveData()),
    save: vi.fn(() => true),
    clear: vi.fn()
  }
});

const createOptions = (overrides: PlatformOverrides = {}): GameOptions => ({
  app: {
    renderer: {},
    stage: { addChild: vi.fn() },
    ticker: { add: vi.fn(), remove: vi.fn() }
  } as unknown as GameOptions['app'],
  elements: createElements(),
  stressMode: false,
  buildTarget: 'test',
  baselineMode: overrides.baselineMode,
  platform: createPlatform(overrides)
});

describe('Game', () => {
  beforeEach(() => {
    mocks.gameOverOpen.mockReset();
    mocks.gameOverClose.mockReset();
    mocks.revivePending.mockReset();
    mocks.reviveResult.mockReset();
    mocks.doubleNovaPending.mockReset();
    mocks.doubleNovaResult.mockReset();
    mocks.gameOverUpdateNova.mockReset();
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

  it('connects the developer Overdrive route to the composed director', () => {
    const game = new Game({
      ...createOptions(),
      mode: 'overdrive',
      overdriveStage: 4,
      overdriveSeed: 0x1234
    });
    const runtime = game as unknown as {
      actDirector: {
        definition: { id: string };
        bossDefinition: { id: string };
        stageState: { stage: number; lap: number };
      };
    };

    expect(runtime.actDirector.definition.id).toBe('angular');
    expect(runtime.actDirector.bossDefinition.id).toBe('core-sentinel');
    expect(runtime.actDirector.stageState).toMatchObject({ stage: 4, lap: 2 });
  });

  it('does not settle diagnostic Overdrive rewards or records', () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const game = new Game({
      ...createOptions({
        saveStore: { load: () => saved, save, clear: vi.fn() }
      }),
      mode: 'overdrive',
      overdriveStage: 4
    });
    const runtime = game as unknown as {
      finishRun: (outcome: 'game-over') => void;
      settleTerminalRun: (token: number) => boolean;
      requestDoubleNova: (token: number) => Promise<void>;
      terminalTotalNova: number;
    };

    runtime.finishRun.call(game, 'game-over');
    expect(runtime.settleTerminalRun.call(game, 1)).toBe(true);
    expect(saved.wallet.nova).toBe(0);
    expect(save).not.toHaveBeenCalled();
    expect(runtime.terminalTotalNova).toBe(0);
    void runtime.requestDoubleNova.call(game, 1);
    expect(save).not.toHaveBeenCalled();
  });

  it('pauses an Overdrive transition and resumes its remaining handoff time', () => {
    vi.useFakeTimers();
    const game = new Game({ ...createOptions(), mode: 'overdrive', overdriveStage: 4 });
    const runtime = game as unknown as {
      beginOverdriveStageTransition: () => void;
      pauseForLifecycle: () => void;
      resumeFromLifecycle: () => void;
      gameState: { phase: string; isPausedFromTransition: boolean };
    };

    runtime.beginOverdriveStageTransition.call(game);
    vi.advanceTimersByTime(1_000);
    runtime.pauseForLifecycle.call(game);
    expect(runtime.gameState.phase).toBe('paused');
    expect(runtime.gameState.isPausedFromTransition).toBe(true);
    vi.advanceTimersByTime(5_000);
    expect(runtime.gameState.phase).toBe('paused');

    runtime.resumeFromLifecycle.call(game);
    expect(runtime.gameState.phase).toBe('overdrive-transition');
    vi.advanceTimersByTime(1_999);
    expect(runtime.gameState.phase).toBe('overdrive-transition');
    vi.advanceTimersByTime(1);
    expect(runtime.gameState.phase).toBe('playing');
  });

  it('resolves lethal damage before a same-tick boss defeat', () => {
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      combat: {
        update: () => void;
        events: Array<{ type: 'bossDefeated' } | { type: 'playerDamaged'; amount: number; source: 'boss' }>;
      };
      updateSimulation: () => void;
      gameState: { phase: string };
    };
    runtime.combat.update = () => {
      runtime.combat.events.push(
        { type: 'bossDefeated' },
        { type: 'playerDamaged', amount: 999_999, source: 'boss' }
      );
    };

    runtime.updateSimulation.call(game);

    expect(runtime.gameState.phase).toBe('game-over');
  });

  it('rebuilds the initial Overdrive stage and debug build after restart', () => {
    const game = new Game({
      ...createOptions(),
      mode: 'overdrive',
      overdriveStage: 4,
      overdriveBuild: 'three-evolved'
    });
    const runtime = game as unknown as {
      actDirector: { setStage: (stage: number) => void; stageState: { stage: number } };
      resetRunState: () => void;
      upgradeApplier: { snapshot: () => readonly string[] };
    };

    runtime.actDirector.setStage(7);
    runtime.resetRunState.call(game);

    expect(runtime.actDirector.stageState.stage).toBe(4);
    expect(runtime.upgradeApplier.snapshot()).toContain('orbit_blade');
    expect(runtime.upgradeApplier.snapshot()).toContain('rail_lance');
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

  it('clears input and restores audio/lifecycle when a run is revived', async () => {
    const platform = createPlatform();
    const game = new Game({ ...createOptions(), platform });
    const runtime = game as unknown as {
      finishRun: (outcome: 'game-over') => void;
      requestRevive: (terminalToken: number) => Promise<void>;
      input: { keys: Set<string>; getMovement: () => { x: number; y: number } };
      player: { state: { health: number } };
    };
    runtime.input.keys.add('ArrowRight');
    expect(runtime.input.getMovement().x).toBe(1);
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');
    expect(runtime.input.getMovement()).toEqual({ x: 0, y: 0 });

    await runtime.requestRevive.call(game, 1);

    expect(platform.audio.resume).toHaveBeenCalledTimes(1);
    expect(platform.audio.startMusic).toHaveBeenCalledTimes(1);
    expect(platform.lifecycle.onGameStart).toHaveBeenCalledTimes(1);
  });

  it('defers NOVA until the run is definitive and settles a revived run once', async () => {
    vi.useFakeTimers();
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const game = new Game(createOptions({
      saveStore: {
        load: () => saved,
        save,
        clear: vi.fn()
      }
    }));
    const runtime = game as unknown as {
      finishRun: (outcome: 'game-over') => void;
      requestRevive: (terminalToken: number) => Promise<void>;
      openGameOverSummary: (...args: unknown[]) => Promise<void>;
      combat: { stats: { elapsedSeconds: number; kills: number } };
      player: { state: { health: number } };
      gameState: { phase: string };
      pendingTerminalRun: { summary: unknown; best: unknown; novaReward: number; token: number } | null;
    };

    runtime.combat.stats.elapsedSeconds = 60;
    runtime.combat.stats.kills = 10;
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');
    expect(save).not.toHaveBeenCalled();

    await runtime.requestRevive.call(game, 1);
    expect(runtime.gameState.phase).toBe('playing');
    expect(save).not.toHaveBeenCalled();
    await runtime.openGameOverSummary.call(
      game,
      { outcome: 'game-over', elapsedSeconds: 60, kills: 10, experience: 0, score: 10 },
      { timeSeconds: 60, score: 10 },
      12,
      12,
      1
    );
    expect(mocks.gameOverOpen).not.toHaveBeenCalled();

    runtime.combat.stats.elapsedSeconds = 120;
    runtime.combat.stats.kills = 20;
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');
    const pending = runtime.pendingTerminalRun;
    expect(pending?.token).toBe(3);
    if (!pending) throw new Error('Expected a pending terminal run');

    await runtime.openGameOverSummary.call(game, pending.summary, pending.best, pending.novaReward, pending.novaReward, pending.token);
    expect(saved.wallet.nova).toBe(24);
    expect(save).toHaveBeenCalledTimes(1);

    await runtime.openGameOverSummary.call(game, pending.summary, pending.best, pending.novaReward, pending.novaReward, pending.token);
    expect(saved.wallet.nova).toBe(24);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('settles victory immediately and ignores a repeated terminal transition', () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const game = new Game(createOptions({
      saveStore: {
        load: () => saved,
        save,
        clear: vi.fn()
      }
    }));
    const runtime = game as unknown as {
      finishRun: (outcome: 'victory') => void;
      combat: { stats: { elapsedSeconds: number; kills: number } };
      gameState: { phase: string };
    };
    runtime.combat.stats.elapsedSeconds = 90;
    runtime.combat.stats.kills = 30;

    runtime.finishRun.call(game, 'victory');
    runtime.finishRun.call(game, 'victory');

    expect(runtime.gameState.phase).toBe('victory');
    expect(save).toHaveBeenCalledTimes(1);
    expect(saved.wallet.nova).toBe(33);
  });

  it('unlocks Angular and continues with a clean build while calibration selection is disabled', async () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const game = new Game(createOptions({
      saveStore: {
        load: () => saved,
        save,
        clear: vi.fn()
      }
    }));
    const runtime = game as unknown as {
      finishRun: (outcome: 'victory') => void;
      openGameOverSummary: (...args: unknown[]) => Promise<void>;
      pendingTerminalRun: { summary: unknown; best: unknown; novaReward: number; token: number } | null;
      terminalTotalNova: number;
      gameState: { phase: string };
      upgradeApplier: { apply: (upgradeId: 'twin_emitters') => boolean; snapshot: () => readonly string[] };
      combat: { actId: string; hasTwinEmitters: boolean };
      actId: string;
    };

    expect(runtime.upgradeApplier.apply('twin_emitters')).toBe(true);
    runtime.finishRun.call(game, 'victory');
    const pending = runtime.pendingTerminalRun;
    if (!pending) throw new Error('Expected a settled victory');
    await runtime.openGameOverSummary.call(game, pending.summary, pending.best, pending.novaReward, runtime.terminalTotalNova, pending.token);

    expect(runtime.gameState.phase).toBe('act-intermission');
    const intermission = mocks.gameOverOpen.mock.calls.at(-1)?.[6];
    expect(intermission).toMatchObject({
      actName: 'Acto I · Radial',
      restartLabel: 'Repetir Acto I'
    });
    expect(intermission.templates).toBeUndefined();
    expect(intermission.continueLabel).toBe('Continuar al Acto II');
    expect(saved.unlockedActs).toEqual(['radial', 'angular']);
    intermission.onContinue();
    expect(runtime.gameState.phase).toBe('playing');
    expect(runtime.actId).toBe('angular');
    expect(runtime.combat.actId).toBe('angular');
    expect(runtime.combat.hasTwinEmitters).toBe(false);
    expect(runtime.upgradeApplier.snapshot()).toEqual([]);
  });

  it('offers direct continuation from Act III to public Overdrive', async () => {
    let saved = {
      ...createDefaultSaveData(),
      unlockedActs: ['radial', 'angular', 'fracture'] as const,
      overdrive: { ...createDefaultSaveData().overdrive, unlocked: true }
    };
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const assign = vi.fn();
    vi.stubGlobal('window', {
      location: { href: 'http://localhost:5173/', search: '', assign },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    const game = new Game({
      ...createOptions({
        saveStore: {
          load: () => saved,
          save,
          clear: vi.fn()
        }
      }),
      actId: 'fracture',
      allowLockedAct: true
    });
    const runtime = game as unknown as {
      finishRun: (outcome: 'victory') => void;
      openGameOverSummary: (...args: unknown[]) => Promise<void>;
      pendingTerminalRun: { summary: unknown; best: unknown; novaReward: number; token: number } | null;
    };

    runtime.finishRun.call(game, 'victory');
    const pending = runtime.pendingTerminalRun;
    if (!pending) throw new Error('Expected a settled Act III victory');
    await runtime.openGameOverSummary.call(game, pending.summary, pending.best, pending.novaReward, 0, pending.token);

    const intermission = mocks.gameOverOpen.mock.calls.at(-1)?.[6];
    expect(intermission).toMatchObject({
      actName: 'Acto III · Fracture',
      continueLabel: 'Continuar al Overdrive'
    });
    intermission.onContinue();
    expect(assign).toHaveBeenCalledWith(expect.stringContaining('?mode=overdrive&autostart=1'));
  });

  it('rejects a stale revive callback after a victory', async () => {
    const showRewarded = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
    const game = new Game(createOptions({
      ads: {
        isRewardedAvailable: vi.fn(async () => true),
        showRewarded
      }
    }));
    const runtime = game as unknown as {
      finishRun: (outcome: 'victory') => void;
      requestRevive: (terminalToken: number) => Promise<void>;
    };

    runtime.finishRun.call(game, 'victory');
    await runtime.requestRevive.call(game, 1);

    expect(showRewarded).not.toHaveBeenCalled();
  });

  it('offers double NOVA only after final settlement and never revives victory', async () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const showRewarded = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
    const game = new Game(createOptions({
      ads: {
        isRewardedAvailable: vi.fn(async () => true),
        showRewarded
      },
      saveStore: {
        load: () => saved,
        save,
        clear: vi.fn()
      }
    }));
    const runtime = game as unknown as {
      finishRun: (outcome: 'victory') => void;
      requestDoubleNova: (terminalToken: number) => Promise<void>;
      requestRevive: (terminalToken: number) => Promise<void>;
      combat: { stats: { elapsedSeconds: number; kills: number } };
    };
    runtime.combat.stats.elapsedSeconds = 90;
    runtime.combat.stats.kills = 30;
    runtime.finishRun.call(game, 'victory');

    await runtime.requestDoubleNova.call(game, 1);
    await runtime.requestRevive.call(game, 1);

    expect(saved.wallet.nova).toBe(66);
    expect(save).toHaveBeenCalledTimes(2);
    expect(showRewarded).toHaveBeenCalledTimes(1);
  });

  it('reloads a settled wallet without granting the terminal reward again', () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const saveStore = {
      load: () => saved,
      save,
      clear: vi.fn()
    };
    const firstGame = new Game(createOptions({ saveStore }));
    const firstRuntime = firstGame as unknown as {
      finishRun: (outcome: 'victory') => void;
      combat: { stats: { elapsedSeconds: number; kills: number } };
    };
    firstRuntime.combat.stats.elapsedSeconds = 90;
    firstRuntime.combat.stats.kills = 30;
    firstRuntime.finishRun.call(firstGame, 'victory');

    const secondGame = new Game(createOptions({ saveStore }));

    expect(saved.wallet.nova).toBe(33);
    expect(save).toHaveBeenCalledTimes(1);
    expect(secondGame).toBeInstanceOf(Game);
  });

  it('starts a fresh baseline record after an explicit terminal restart', () => {
    vi.useFakeTimers();
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const platform = createPlatform({
      ads: {
        isRewardedAvailable: vi.fn(async () => false),
        showRewarded: vi.fn(async (): Promise<RewardedAdResult> => 'unavailable')
      },
      saveStore: {
        load: () => saved,
        save,
        clear: vi.fn()
      }
    });
    const game = new Game({ ...createOptions({ baselineMode: true }), platform });
    const runtime = game as unknown as {
      activateRun: (unlockAudio: boolean) => void;
      finishRun: (outcome: 'victory') => void;
      restartRun: () => void;
      baseline: { isActive: boolean; records: readonly unknown[] };
      combat: { stats: { elapsedSeconds: number; kills: number } };
    };

    runtime.activateRun(false);
    expect(runtime.baseline.isActive).toBe(true);
    runtime.combat.stats.elapsedSeconds = 90;
    runtime.combat.stats.kills = 30;
    runtime.finishRun.call(game, 'victory');
    expect(runtime.baseline.records).toHaveLength(1);

    runtime.restartRun.call(game);
    expect(runtime.baseline.records).toHaveLength(1);
    expect(runtime.baseline.isActive).toBe(true);

    runtime.combat.stats.elapsedSeconds = 120;
    runtime.combat.stats.kills = 20;
    runtime.finishRun.call(game, 'victory');
    expect(runtime.baseline.records).toHaveLength(2);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('applies a direct-entry calibration once at run start', () => {
    const game = new Game({ ...createOptions(), calibrationId: 'orbit' });
    const runtime = game as unknown as {
      activateRun: (unlockAudio: boolean) => void;
      upgradeApplier: { getStacks: (upgradeId: 'orbit_blade' | 'orbit_reach' | 'reinforced_core') => number };
    };

    runtime.activateRun(false);

    expect(runtime.upgradeApplier.getStacks('orbit_blade')).toBe(1);
    expect(runtime.upgradeApplier.getStacks('orbit_reach')).toBe(1);
    expect(runtime.upgradeApplier.getStacks('reinforced_core')).toBe(1);
  });
});
