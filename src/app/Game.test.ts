import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARENA_CENTER } from '../config/constants';
import { BOSS_DEFINITION } from '../content/bosses/BossDefinition';
import { ENEMY_DEFINITIONS } from '../content/enemies/EnemyDefinitions';
import { createDefaultSaveData } from '../platform/save/SaveStore';
import { getRetentionWeeklyEdition, RETENTION_WEEK_ANCHOR_UTC, RETENTION_WEEK_MS } from '../content/retention/RetentionDefinitions';
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
  playerShot: vi.fn(),
  transitionOpenRoute: vi.fn(() => 2.6),
  transitionOpenStage: vi.fn(),
  transitionClose: vi.fn(),
  transitionPaused: vi.fn(),
  defeatScenePlay: vi.fn(),
  victoryScenePlay: vi.fn(),
  victorySceneClose: vi.fn(),
  defeatSceneUpdate: vi.fn(),
  defeatSceneClose: vi.fn(),
  defeatSceneDestroy: vi.fn()
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

vi.mock('../ui/DefeatSceneOverlay', () => ({
  DefeatSceneOverlay: class {
    public play = mocks.defeatScenePlay;
    public update = mocks.defeatSceneUpdate;
    public close = mocks.defeatSceneClose;
    public destroy = mocks.defeatSceneDestroy;
  }
}));

vi.mock('../ui/VictorySceneOverlay', () => ({
  VictorySceneOverlay: class {
    public play = mocks.victoryScenePlay;
    public update = vi.fn();
    public close = mocks.victorySceneClose;
    public destroy = vi.fn();
  }
}));

vi.mock('../ui/RunTransitionOverlay', () => ({
  RunTransitionOverlay: class {
    public openRoute = mocks.transitionOpenRoute;
    public openOverdriveStage = mocks.transitionOpenStage;
    public close = mocks.transitionClose;
    public setPaused = mocks.transitionPaused;
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
  it.each([
    ['playing', 0.1], ['paused', 0], ['level-up', 0], ['menu', 0], ['run-intro', 0],
    ['victory', 0.1], ['game-over', 0.1], ['act-intermission', 0.1], ['overdrive-transition', 0.1]
  ] as const)('updates deaths during %s with delta %s without advancing paused effects', (phase, expectedDelta) => {
    const game = new Game(createOptions());
    const impact = vi.fn(), terminal = vi.fn();
    const runtime = game as unknown as {
      view: unknown; hud: unknown;
      gameState: { phase: string };
      renderFrame: (delta: number) => void;
    };
    runtime.view = new Proxy({ renderImpactFx: impact, updateTerminalFx: terminal, activeFxCount: 0 }, {
      get: (target, key) => key in target ? target[key as keyof typeof target] : vi.fn()
    });
    runtime.hud = { update: vi.fn() };
    runtime.gameState.phase = phase;
    runtime.renderFrame(0.1);
    expect(impact).toHaveBeenCalledWith(expectedDelta);
    expect(terminal).toHaveBeenCalledWith(expectedDelta);
  });
  beforeEach(() => {
    mocks.gameOverOpen.mockReset();
    mocks.gameOverClose.mockReset();
    mocks.revivePending.mockReset();
    mocks.reviveResult.mockReset();
    mocks.doubleNovaPending.mockReset();
    mocks.doubleNovaResult.mockReset();
    mocks.gameOverUpdateNova.mockReset();
    mocks.playerShot.mockReset();
    mocks.transitionOpenRoute.mockReset();
    mocks.transitionOpenRoute.mockReturnValue(2.6);
    mocks.transitionOpenStage.mockReset();
    mocks.transitionClose.mockReset();
    mocks.transitionPaused.mockReset();
    mocks.defeatScenePlay.mockReset();
    mocks.victoryScenePlay.mockReset();
    mocks.victorySceneClose.mockReset();
    mocks.defeatSceneUpdate.mockReset();
    mocks.defeatSceneClose.mockReset();
    mocks.defeatSceneDestroy.mockReset();
    vi.stubGlobal('window', {
      location: { search: '' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('pauses ambient menu music on blur and resumes only its audio on focus', () => {
    vi.stubGlobal('document', { visibilityState: 'visible' });
    const platform = createPlatform();
    const game = new Game({ ...createOptions(), platform, startOnMenu: true });
    const runtime = game as unknown as {
      onWindowBlur: () => void; onWindowFocus: () => void; gameState: { phase: string };
    };
    // This DOM-free fixture has no StartScreen; select its menu phase explicitly.
    runtime.gameState.phase = 'menu';
    runtime.onWindowBlur();
    runtime.onWindowBlur();
    expect(platform.audio.pause).toHaveBeenCalledOnce();
    expect(runtime.gameState.phase).toBe('menu');
    runtime.onWindowFocus();
    expect(platform.audio.resume).toHaveBeenCalledOnce();
    expect(runtime.gameState.phase).toBe('menu');
    expect(platform.lifecycle.onGameResume).not.toHaveBeenCalled();
  });

  it('focus does not resume a paused run or hidden menu audio', () => {
    vi.stubGlobal('document', { visibilityState: 'visible' });
    const platform = createPlatform();
    const game = new Game({ ...createOptions(), platform });
    const runtime = game as unknown as {
      onWindowBlur: () => void; onWindowFocus: () => void; gameState: { phase: string };
    };
    runtime.onWindowBlur();
    runtime.onWindowFocus();
    expect(runtime.gameState.phase).toBe('paused');
    expect(platform.audio.resume).not.toHaveBeenCalled();
    const menuPlatform = createPlatform();
    const menu = new Game({ ...createOptions(), platform: menuPlatform, startOnMenu: true }) as unknown as typeof runtime;
    menu.gameState.phase = 'menu';
    menu.onWindowBlur();
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    menu.onWindowFocus();
    expect(menu.gameState.phase).toBe('menu');
    expect(menuPlatform.audio.resume).not.toHaveBeenCalled();
  });

  it('announces a continued campaign act without advancing combat behind the card', () => {
    const saved = { ...createDefaultSaveData(), unlockedActs: ['radial', 'angular'] as const };
    const options = createOptions({
      saveStore: { load: () => saved, save: vi.fn(() => true), clear: vi.fn() }
    });
    const game = new Game({
      ...options,
      elements: { ...options.elements, runTransition: {} as HTMLElement }
    });
    const runtime = game as unknown as {
      gameState: { phase: string; winRun: () => boolean; enterActIntermission: () => boolean };
      onActIntermissionContinue: () => void;
      completeRunIntro: () => void;
    };

    expect(runtime.gameState.winRun()).toBe(true);
    expect(runtime.gameState.enterActIntermission()).toBe(true);
    runtime.onActIntermissionContinue();
    expect(runtime.gameState.phase).toBe('run-intro');
    expect(mocks.transitionOpenRoute).toHaveBeenCalledWith('angular', 'basic');
    runtime.completeRunIntro();
    expect(runtime.gameState.phase).toBe('playing');
    expect(mocks.transitionClose).toHaveBeenCalled();
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

  it('connects Assault to its continuous director without constructing Normal stage state', () => {
    const game = new Game({
      ...createOptions(),
      mode: 'overdrive',
      overdriveVariant: 'assault',
      overdriveSeed: 0x1234
    });
    const runtime = game as unknown as {
      overdriveVariant: string;
      actDirector: { definition: { id: string }; bossDefinition: { id: string }; enemyHealthMultiplier: number; stageState?: unknown };
      combat: { overdriveAssaultProgress: { killsPerBoss: number; healthMultiplier: number } | null };
    };

    expect(runtime.overdriveVariant).toBe('assault');
    expect(runtime.actDirector.definition.id).toBe('radial');
    expect(runtime.actDirector.bossDefinition.id).toBe('core-sentinel');
    expect(runtime.actDirector.enemyHealthMultiplier).toBe(0.25);
    expect(runtime.actDirector).not.toHaveProperty('stageState');
    expect(runtime.combat.overdriveAssaultProgress).toMatchObject({ killsPerBoss: 100, healthMultiplier: 0.25 });
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
  it('records normal objectives without paying NOVA and keeps completed prizes pending after terminal settlement', () => {
    let saved = createDefaultSaveData();
    const save = vi.fn((next: typeof saved) => { saved = next; return true; });
    const game = new Game(createOptions({ saveStore: { load: () => saved, save, clear: vi.fn() } }));
    const runtime = game as unknown as {
      retentionProgressEligibleThisRun: boolean;
      combat: { stats: { kills: number; elapsedSeconds: number } };
      finishRun: (outcome: 'victory') => void;
      settleTerminalRun: (token: number) => boolean;
      pendingTerminalRun: { novaReward: number; retentionPresentation: { message: string; bonusNova: number } };
    };
    runtime.retentionProgressEligibleThisRun = true;
    runtime.combat.stats.kills = 100;
    runtime.combat.stats.elapsedSeconds = 300;
    runtime.finishRun('victory');
    expect(saved.wallet.nova).toBe(runtime.pendingTerminalRun.novaReward);
    expect(saved.retention.objectiveCycles['first-flight']).toEqual({ claimed: 0, value: 1 });
    expect(saved.retention.completedObjectiveIds).toEqual([]);
    expect(runtime.pendingTerminalRun.retentionPresentation.bonusNova).toBe(0);
    expect(runtime.pendingTerminalRun.retentionPresentation.message).toContain('cobrar');
    runtime.settleTerminalRun(1);
    expect(saved.wallet.nova).toBe(runtime.pendingTerminalRun.novaReward);
    expect(saved.retention.runsCompleted).toBe(1);
  });

  it('records Bitacora progress for public Overdrive autostart after Act III', () => {
    let saved = {
      ...createDefaultSaveData(),
      overdrive: { ...createDefaultSaveData().overdrive, unlocked: true }
    };
    const save = vi.fn((next: typeof saved) => { saved = next; return true; });
    const game = new Game({
      ...createOptions({ saveStore: { load: () => saved, save, clear: vi.fn() } }),
      mode: 'overdrive',
      diagnosticOverdrive: false,
      startWithBasicIntro: true
    });
    const runtime = game as unknown as {
      retentionProgressEligibleThisRun: boolean;
      combat: { stats: { kills: number; elapsedSeconds: number } };
      finishRun: (outcome: 'game-over') => void;
      settleTerminalRun: (token: number) => boolean;
    };

    expect(runtime.retentionProgressEligibleThisRun).toBe(true);
    runtime.combat.stats.kills = 12;
    runtime.combat.stats.elapsedSeconds = 90;
    runtime.finishRun('game-over');
    expect(runtime.settleTerminalRun(1)).toBe(true);
    expect(saved.retention.runsCompleted).toBe(1);

    const diagnostic = new Game({ ...createOptions(), mode: 'overdrive', startWithBasicIntro: true });
    expect((diagnostic as unknown as { retentionProgressEligibleThisRun: boolean })
      .retentionProgressEligibleThisRun).toBe(false);
  });

  it('pauses an Overdrive transition and resumes its remaining handoff time', () => {
    vi.useFakeTimers();
    const options = createOptions();
    const game = new Game({
      ...options,
      elements: { ...options.elements, runTransition: {} as HTMLElement },
      mode: 'overdrive',
      overdriveStage: 4
    });
    const runtime = game as unknown as {
      beginOverdriveStageTransition: () => void;
      pauseForLifecycle: () => void;
      resumeFromLifecycle: () => void;
      gameState: { phase: string; isPausedFromTransition: boolean };
      view: { resetPresentation: ReturnType<typeof vi.fn> };
    };

    runtime.beginOverdriveStageTransition.call(game);
    expect(runtime.view.resetPresentation).toHaveBeenLastCalledWith(true);
    expect(mocks.transitionOpenStage).toHaveBeenCalledOnce();
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
    expect(runtime.view.resetPresentation).toHaveBeenLastCalledWith();
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

  it('fails a no-hit boss challenge on a shielded impact before same-tick victory', () => {
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      activeRetentionChallenge: 'core-duel';
      retentionNoHitFailure: boolean;
      player: { resolveDamage: () => { outcome: 'shielded'; incomingAmount: number; appliedAmount: number } };
      combat: {
        update: () => void;
        events: Array<
          | { type: 'playerDamaged'; amount: number; source: 'boss' }
          | { type: 'retentionChallengeVictory' }
        >;
      };
      updateSimulation: () => void;
      gameState: { phase: string };
    };
    runtime.activeRetentionChallenge = 'core-duel';
    runtime.player.resolveDamage = () => ({ outcome: 'shielded', incomingAmount: 1, appliedAmount: 0 });
    runtime.combat.update = () => {
      runtime.combat.events.push(
        { type: 'playerDamaged', amount: 1, source: 'boss' },
        { type: 'retentionChallengeVictory' }
      );
    };

    runtime.updateSimulation.call(game);

    expect(runtime.retentionNoHitFailure).toBe(true);
    expect(runtime.gameState.phase).toBe('game-over');
    expect((game as unknown as { view: { playPlayerDefeat: ReturnType<typeof vi.fn> } })
      .view.playPlayerDefeat).toHaveBeenCalledOnce();
    expect(mocks.defeatScenePlay).toHaveBeenCalledWith(true, true);
  });

  it.each(['core-duel', 'warden-duel', 'fracture-duel'] as const)(
    'starts %s without Calibration or twin emitters and restores its setup on retry', (challengeId) => {
      const game = new Game(createOptions());
      const runtime = game as unknown as {
        stopped: boolean;
        startScreen: { close: () => void } | null;
        gameState: { phase: string; startRun: () => boolean };
        activateRun: () => void;
        beginRunIntro: (kind: string) => void;
        calibrationId: string | null;
        beginRetentionChallenge: (id: typeof challengeId, practiceOnly: boolean) => void;
        resetRunState: () => void;
        combat: {
          readonly currentProjectileRank: number;
          readonly hasTwinEmitters: boolean;
          setProjectileRank: (rank: 2) => boolean;
        };
        player: { state: { x: number; y: number; radius: number } };
      };
      runtime.stopped = false;
      runtime.startScreen = { close: vi.fn() };
      runtime.gameState.phase = 'menu';
      runtime.gameState.startRun = vi.fn(() => true);
      runtime.activateRun = vi.fn();
      runtime.beginRunIntro = vi.fn();

      runtime.beginRetentionChallenge.call(game, challengeId, true);

      const initialSpawn = { x: runtime.player.state.x, y: runtime.player.state.y };
      expect(runtime.calibrationId).toBeNull();
      expect(runtime.combat.currentProjectileRank).toBe(1);
      expect(runtime.combat.hasTwinEmitters).toBe(false);

      if (challengeId === 'core-duel') {
        const bossY = ARENA_CENTER.y - BOSS_DEFINITION.spawnDistance;
        const bossRadius = ENEMY_DEFINITIONS.boss.radius;
        const distanceToBoss = Math.hypot(runtime.player.state.x - ARENA_CENTER.x, runtime.player.state.y - bossY);
        expect(runtime.player.state.y).toBeGreaterThan(ARENA_CENTER.y);
        expect(distanceToBoss).toBeGreaterThan(runtime.player.state.radius + bossRadius);
      }

      // Mimic a run upgrade, then ensure retry clears it and reapplies the start point.
      expect(runtime.combat.setProjectileRank(2)).toBe(true);
      runtime.player.state.x = ARENA_CENTER.x;
      runtime.player.state.y = ARENA_CENTER.y;
      runtime.resetRunState.call(game);
      expect(runtime.player.state).toMatchObject(initialSpawn);
      expect(runtime.combat.currentProjectileRank).toBe(1);
      expect(runtime.combat.hasTwinEmitters).toBe(false);
      if (challengeId === 'core-duel') expect(runtime.player.state.y).toBeGreaterThan(ARENA_CENTER.y);
    });

  it('awards weekly NOVA after Asterion is owned, once per edition', () => {
    const defaults = createDefaultSaveData();
    let persisted: ReturnType<typeof createDefaultSaveData> = {
      ...defaults,
      skins: { ...defaults.skins, unlocked: [...defaults.skins.unlocked, 'asterion'] }
    };
    const saveStore = {
      load: vi.fn(() => persisted),
      save: vi.fn(() => true),
      saveDurably: vi.fn((next: ReturnType<typeof createDefaultSaveData>) => {
        persisted = next;
        return true;
      }),
      clear: vi.fn()
    };
    const game = new Game(createOptions({ saveStore }));
    const runtime = game as unknown as {
      activeRetentionChallenge: 'core-duel';
      activeRetentionChallengePractice: false;
      activeRetentionEdition: ReturnType<typeof getRetentionWeeklyEdition>;
      settleRetentionChallenge: (pending: {
        summary: { outcome: 'victory' };
        settled: boolean;
        retentionPresentation?: { message: string; bonusNova: number };
      }, saved: ReturnType<typeof createDefaultSaveData>) => boolean;
    };
    const settleFor = (edition: ReturnType<typeof getRetentionWeeklyEdition>) => {
      runtime.activeRetentionEdition = edition;
      const pending: {
        summary: { outcome: 'victory' };
        settled: boolean;
        retentionPresentation?: { message: string; bonusNova: number };
      } = { summary: { outcome: 'victory' }, settled: false };
      runtime.settleRetentionChallenge.call(game, pending, persisted);
      return pending.retentionPresentation;
    };
    runtime.activeRetentionChallenge = 'core-duel';
    runtime.activeRetentionChallengePractice = false;

    const firstEdition = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC);
    expect(settleFor(firstEdition)).toMatchObject({ bonusNova: 250 });
    expect(persisted.retention.weeklyClaimIds).toContain(firstEdition.editionId);
    expect(settleFor(firstEdition)?.bonusNova).toBe(0);

    const nextEdition = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC + RETENTION_WEEK_MS * 15);
    expect(settleFor(nextEdition)).toMatchObject({ bonusNova: 250 });
    expect(persisted.retention.weeklyClaimIds).toContain(nextEdition.editionId);
  });

  it('settles the fifteen weekly cosmetics across all families without auto-equipping or paying twice', () => {
    let persisted = createDefaultSaveData();
    const saveStore = { load: () => persisted, save: () => true,
      saveDurably: (next: typeof persisted) => { persisted = next; return true; }, clear: () => {} };
    const game = new Game(createOptions({ saveStore }));
    const runtime = game as unknown as {
      activeRetentionChallenge: ReturnType<typeof getRetentionWeeklyEdition>['challenge']['id'];
      activeRetentionChallengePractice: boolean;
      activeRetentionEdition: ReturnType<typeof getRetentionWeeklyEdition>;
      settleRetentionChallenge: (pending: { summary: { outcome: 'victory' }; settled: boolean }, saved: typeof persisted) => boolean;
    };
    runtime.activeRetentionChallengePractice = false;
    for (let week = 0; week < 15; week++) {
      const edition = getRetentionWeeklyEdition(RETENTION_WEEK_ANCHOR_UTC + week*RETENTION_WEEK_MS);
      runtime.activeRetentionEdition = edition;
      runtime.activeRetentionChallenge = edition.challenge.id;
      const pending = { summary: { outcome: 'victory' as const }, settled: false };
      expect(runtime.settleRetentionChallenge.call(game, pending, persisted)).toBe(true);
      const family = edition.reward.family === 'ship' ? persisted.skins : edition.reward.family === 'cannon' ? persisted.cannonSkins : persisted.backgrounds;
      expect(family.unlocked).toContain(edition.reward.id);
      expect(family.selected).not.toBe(edition.reward.id);
      expect(persisted.retention.weeklyClaimIds).toContain(edition.editionId);
      const snapshot = JSON.stringify(persisted);
      runtime.settleRetentionChallenge.call(game, { summary: { outcome: 'victory' }, settled: false }, persisted);
      expect(JSON.stringify(persisted)).toBe(snapshot);
    }
    expect(persisted.wallet.nova).toBe(0);
  });

  it('forwards the defeated Tank identity to presentation without changing its position', () => {
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      combat: { update: () => void; events: Array<{
        type: 'enemyDefeated'; x: number; y: number; kind: 'tank'; experience: number;
        enemyIndex: number; generation: number;
      }> };
      view: { playEnemyDefeat: ReturnType<typeof vi.fn> };
      updateSimulation: () => void;
    };
    runtime.combat.update = () => {
      runtime.combat.events.push({ type: 'enemyDefeated', x: 320, y: 260, kind: 'tank',
        experience: 10, enemyIndex: 3, generation: 7 });
    };
    runtime.updateSimulation();
    expect(runtime.view.playEnemyDefeat).toHaveBeenCalledWith(320, 260, 'tank', 3, 7);
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
    const platform = createPlatform();
    const game = new Game({ ...createOptions(), platform });
    const finishRun = (game as unknown as { finishRun: (outcome: 'victory') => void }).finishRun;

    finishRun.call(game, 'victory');

    expect(mocks.victoryScenePlay).toHaveBeenCalledWith(false);
    expect(mocks.defeatScenePlay).not.toHaveBeenCalled();
    expect(platform.audio.stopMusic).not.toHaveBeenCalled();
    expect(platform.audio.startMusic).not.toHaveBeenCalled();
    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2_999);
    expect(mocks.gameOverOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(mocks.gameOverOpen).toHaveBeenCalledTimes(1);
    expect(mocks.gameOverOpen.mock.calls[0][0]).toMatchObject({ outcome: 'victory' });
    expect(mocks.victorySceneClose).toHaveBeenCalled();
    expect(platform.audio.startMusic).toHaveBeenCalledWith('menu');
    expect(platform.audio.resume).toHaveBeenCalledOnce();
  });

  it('celebrates a weekly victory once without playing the defeat scene', () => {
    vi.useFakeTimers();
    const game = new Game(createOptions());
    const runtime = game as unknown as {
      activeRetentionChallenge: 'core-duel';
      activeRetentionChallengePractice: boolean;
      finishRun: (outcome: 'victory') => void;
    };
    runtime.activeRetentionChallenge = 'core-duel';
    runtime.activeRetentionChallengePractice = true;
    runtime.finishRun('victory');
    runtime.finishRun('victory');
    expect(mocks.victoryScenePlay).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.defeatScenePlay).not.toHaveBeenCalled();
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

  it('offers one Overdrive double-NOVA after the run ends even if its revive was already used', async () => {
    vi.useFakeTimers();
    let saved = {
      ...createDefaultSaveData(),
      overdrive: { ...createDefaultSaveData().overdrive, unlocked: true }
    };
    const save = vi.fn((next: typeof saved) => {
      saved = next;
      return true;
    });
    const showRewarded = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
    const game = new Game({
      ...createOptions({
        ads: {
          isRewardedAvailable: vi.fn(async () => true),
          showRewarded
        },
        saveStore: { load: () => saved, save, clear: vi.fn() }
      }),
      mode: 'overdrive',
      diagnosticOverdrive: false
    });
    const runtime = game as unknown as {
      finishRun: (outcome: 'game-over') => void;
      requestRevive: (terminalToken: number) => Promise<void>;
      requestDoubleNova: (terminalToken: number) => Promise<void>;
      openGameOverSummary: (...args: unknown[]) => Promise<void>;
      combat: { stats: { elapsedSeconds: number; kills: number } };
      player: { state: { health: number } };
      pendingTerminalRun: { summary: unknown; best: unknown; novaReward: number; token: number } | null;
    };

    runtime.combat.stats.elapsedSeconds = 90;
    runtime.combat.stats.kills = 30;
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');
    await runtime.requestRevive.call(game, 1);
    expect(showRewarded).toHaveBeenCalledTimes(1);

    runtime.combat.stats.elapsedSeconds = 180;
    runtime.combat.stats.kills = 55;
    runtime.player.state.health = 0;
    runtime.finishRun.call(game, 'game-over');
    const pending = runtime.pendingTerminalRun;
    if (!pending) throw new Error('Expected final Overdrive settlement');
    await runtime.openGameOverSummary.call(
      game, pending.summary, pending.best, pending.novaReward, pending.novaReward, pending.token
    );

    const rewardedOptions = mocks.gameOverOpen.mock.calls.at(-1)?.[5];
    expect(rewardedOptions).toMatchObject({ doubleNovaAvailable: true, reviveAvailable: false });
    await runtime.requestDoubleNova.call(game, pending.token);
    await runtime.requestDoubleNova.call(game, pending.token);
    expect(saved.wallet.nova).toBe(pending.novaReward * 2);
    expect(showRewarded).toHaveBeenCalledTimes(2);
  });

  it('settles an Overdrive withdrawal without revive or double-NOVA offers', async () => {
    vi.useFakeTimers();
    const saved = {
      ...createDefaultSaveData(),
      overdrive: { ...createDefaultSaveData().overdrive, unlocked: true }
    };
    const showRewarded = vi.fn(async (): Promise<RewardedAdResult> => 'rewarded');
    const game = new Game({
      ...createOptions({
        ads: { isRewardedAvailable: vi.fn(async () => true), showRewarded },
        saveStore: { load: () => saved, save: vi.fn(() => true), clear: vi.fn() }
      }),
      mode: 'overdrive',
      diagnosticOverdrive: false
    });
    const confirm = vi.fn(() => true);
    vi.stubGlobal('window', { confirm, location: { search: '' }, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const runtime = game as unknown as {
      gameState: { enterPause: () => boolean };
      onPauseWithdraw: () => void;
      openGameOverSummary: (...args: unknown[]) => Promise<void>;
      pendingTerminalRun: { summary: unknown; best: unknown; novaReward: number; token: number } | null;
    };

    expect(runtime.gameState.enterPause()).toBe(true);
    runtime.onPauseWithdraw();
    const pending = runtime.pendingTerminalRun;
    if (!pending) throw new Error('Expected a withdrawal settlement');
    await runtime.openGameOverSummary.call(
      game, pending.summary, pending.best, pending.novaReward, pending.novaReward, pending.token
    );

    expect(confirm).toHaveBeenCalledOnce();
    expect(mocks.gameOverOpen.mock.calls.at(-1)?.[5]).toMatchObject({
      reviveAvailable: false,
      doubleNovaAvailable: false
    });
    expect(showRewarded).not.toHaveBeenCalled();
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
