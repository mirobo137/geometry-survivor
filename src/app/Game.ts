import type { Application, Ticker } from 'pixi.js';
import { FIXED_STEP_SECONDS } from '../config/constants';
import { DebugPanel } from '../debug/DebugPanel';
import { FrameProfiler } from '../debug/FrameProfiler';
import { InputManager } from '../input/InputManager';
import type { PlatformAdapter, PlatformLifecycle, RewardedAdResult } from '../platform/Platform';
import { RewardedAdController } from '../platform/RewardedAdController';
import { RewardedOfferLedger } from '../platform/RewardedOfferLedger';
import { MAX_NOVA, mergeBestRun, type BackgroundSaveData, type CannonSkinSaveData, type MetaUpgradeSaveData, type SaveStore, type SkinSaveData, type WalletSaveData } from '../platform/save/SaveStore';
import { PixiGameView } from '../presentation/PixiGameView';
import type { LevelUpCardAnchor } from '../presentation/pixi/ui/level-up/LevelUpFxView';
import { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import { ArenaModel } from '../simulation/ArenaModel';
import { CombatSimulation } from '../simulation/combat/CombatSimulation';
import { PlayerModel } from '../simulation/PlayerModel';
import type { UpgradeDefinition } from '../content/upgrades/UpgradeDefinitions';
import type { FxQuality, PlayerSkinId } from '../content/visual/VisualTokens';
import { isPlayerSkinId } from '../content/visual/SkinDefinitions';
import { isCannonSkinId, type CannonSkinId } from '../content/visual/CannonSkinDefinitions';
import { isBackgroundId, type BackgroundId } from '../content/visual/BackgroundDefinitions';
import { LevelProgression } from '../simulation/progression/LevelProgression';
import { UpgradeApplier } from '../simulation/progression/UpgradeApplier';
import { GameHud } from '../ui/GameHud';
import { GameOverOverlay } from '../ui/GameOverOverlay';
import { LevelUpOverlay } from '../ui/level-up/LevelUpOverlay';
import type { LevelUpCardInteraction } from '../ui/level-up/LevelUpCardInteraction';
import { PauseOverlay } from '../ui/PauseOverlay';
import { StartScreen, type CosmeticUnlockTarget } from '../ui/StartScreen';
import type { AudioService, AudioSettings } from '../audio/AudioService';
import { GameState } from './GameState';
import { createRunSummary, type RunOutcome } from './RunSummary';
import { calculateRunNova } from '../content/meta/EconomyDefinitions';
import { getPermanentCombatBonuses } from '../content/meta/PermanentUpgradeDefinitions';

/** Gives terminal presentation time to resolve before the summary takes focus. */
const TERMINAL_SUMMARY_DELAY_MS = 3_000;
const HIT_STOP_SECONDS = {
  enemyDefeat: 0.008,
  playerDamage: 0.012,
  playerGuard: 0.05,
  terminal: 0.024
} as const;

export interface GameElements {
  readonly container: HTMLElement;
  readonly debug: HTMLElement;
  readonly hud: HTMLElement;
  readonly levelUp: HTMLElement;
  readonly pause: HTMLElement;
  readonly gameOver: HTMLElement;
  readonly startScreen?: HTMLElement;
  readonly pauseButton?: HTMLButtonElement;
}

export interface GameOptions {
  readonly app: Application;
  readonly elements: GameElements;
  readonly stressMode: boolean;
  readonly initialElapsedSeconds?: number;
  readonly buildTarget: string;
  readonly platform: PlatformAdapter;
  readonly startOnMenu?: boolean;
  readonly playerSkin?: PlayerSkinId;
  readonly cannonSkin?: CannonSkinId;
  readonly background?: BackgroundId;
  readonly fxQuality?: FxQuality;
  readonly profileMode?: boolean;
}

/** Coordinates the run lifecycle and loop without implementing domain systems. */
export class Game {
  private readonly app: Application;
  private readonly container: HTMLElement;
  private readonly hudElement: HTMLElement;
  private readonly pauseButton: HTMLButtonElement | null;
  private readonly buildTarget: string;
  private readonly stressMode: boolean;
  private readonly initialElapsedSeconds: number;
  private readonly startOnMenu: boolean;
  private readonly playerSkin: PlayerSkinId;
  private readonly cannonSkin: CannonSkinId;
  private readonly background: BackgroundId;
  private readonly fxQuality: FxQuality;
  private readonly lifecycle: PlatformLifecycle;
  private readonly rewardedAds: RewardedAdController;
  private readonly rewardedOffers = new RewardedOfferLedger();
  private readonly saveStore: SaveStore;
  private readonly audio: AudioService;
  private readonly viewport = new ViewportTransform();
  private readonly arena = new ArenaModel();
  private readonly player = new PlayerModel();
  private readonly combat: CombatSimulation;
  private readonly progression = new LevelProgression();
  private readonly gameState: GameState;
  private readonly view: PixiGameView;
  private readonly debug: DebugPanel;
  private readonly profiler: FrameProfiler;
  private readonly hud: GameHud;
  private readonly levelUp: LevelUpOverlay;
  private readonly pause: PauseOverlay;
  private readonly gameOver: GameOverOverlay;
  private readonly startScreen: StartScreen | null;
  private readonly input: InputManager;
  private readonly upgradeApplier: UpgradeApplier;
  private readonly resizeObserver: ResizeObserver | null;
  private resizeQueued = false;
  private accumulator = 0;
  private frames = 0;
  private presentationTime = 0;
  private presentedShotsFired = 0;
  private fpsTime = performance.now();
  private fps = 0;
  private lifecyclePaused = false;
  private contextLost = false;
  private started = false;
  private stopped = false;
  private terminalSummaryTimer: ReturnType<typeof setTimeout> | null = null;
  private terminalRunToken = 0;
  private terminalNovaReward = 0;
  private terminalTotalNova = 0;
  private levelUpRequestToken = 0;
  private startScreenRequestToken = 0;
  private hitStopSeconds = 0;

  private readonly queueResize = (): void => {
    if (this.resizeQueued || this.stopped) return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      if (!this.stopped) this.resizeNow();
    });
  };

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') this.pauseForLifecycle();
  };

  private readonly onWindowBlur = (): void => this.pauseForLifecycle();

  private readonly onLevelUpInteraction = (interaction: LevelUpCardInteraction): void => {
    this.view.handleLevelUpInteraction(interaction.kind, interaction.index);
  };

  private readonly onStartPlay = (): void => {
    if (this.stopped || !this.gameState.startRun()) return;
    this.startScreenRequestToken += 1;
    this.rewardedOffers.reset();
    const saved = this.saveStore.load();
    this.combat.setPermanentBonuses(getPermanentCombatBonuses(saved.metaUpgrades.levels));
    this.startScreen?.close();
    this.activateRun(true);
  };

  private readonly onPauseButton = (): void => {
    // A pause tap is also a valid user gesture for mobile Web Audio unlock.
    void this.audio.unlock();
    this.pauseForLifecycle('Partida pausada manualmente.');
  };

  private readonly onPauseSettingsChange = (settings: AudioSettings): void => {
    this.persistAudioSettings(settings);
  };

  private readonly onStartSettingsChange = (settings: AudioSettings): void => {
    this.persistAudioSettings(settings);
  };

  private readonly onStartSkinStateChange = (skins: SkinSaveData): void => {
    const saved = this.saveStore.load();
    if (!skins.unlocked.includes(skins.selected)) return;
    this.saveStore.save({ ...saved, skins });
    this.view.setPlayerSkin(skins.selected);
  };

  private readonly onStartCannonSkinStateChange = (cannonSkins: CannonSkinSaveData): void => {
    const saved = this.saveStore.load();
    if (!cannonSkins.unlocked.includes(cannonSkins.selected)) return;
    this.saveStore.save({ ...saved, cannonSkins });
    this.view.setCannonSkin(cannonSkins.selected);
  };

  private readonly onStartBackgroundStateChange = (backgrounds: BackgroundSaveData): void => {
    const saved = this.saveStore.load();
    if (!backgrounds.unlocked.includes(backgrounds.selected)) return;
    this.saveStore.save({ ...saved, backgrounds });
    this.view.setBackground(backgrounds.selected);
  };

  private readonly onStartWalletChange = (wallet: WalletSaveData): void => {
    const saved = this.saveStore.load();
    this.saveStore.save({ ...saved, wallet });
  };

  private readonly onStartMetaUpgradesChange = (metaUpgrades: MetaUpgradeSaveData): void => {
    const saved = this.saveStore.load();
    this.saveStore.save({ ...saved, metaUpgrades });
    this.combat.setPermanentBonuses(getPermanentCombatBonuses(metaUpgrades.levels));
  };

  private readonly onStartCosmeticUnlock = (target: CosmeticUnlockTarget): Promise<RewardedAdResult> => (
    this.requestCosmeticUnlock(target)
  );

  private readonly onPauseRestart = (): void => {
    if (this.contextLost) return;
    if (!this.gameState.restartFromPause()) return;
    this.resetRunState();
  };

  private readonly onPauseReturnToMenu = (): void => {
    if (this.contextLost || !this.startScreen) return;
    if (!this.gameState.returnToMenuFromPause()) return;
    this.returnToMenuState();
  };

  private readonly onWebglContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.stopped || this.lifecyclePaused || !this.gameState.isSimulationRunning) return;
    this.contextLost = true;
    this.pauseForLifecycle('El renderizador se está recuperando. La partida se pausó; espera y pulsa Continuar.');
  };

  private readonly onWebglContextRestored = (): void => {
    if (!this.contextLost) return;
    this.contextLost = false;
    if (this.lifecyclePaused) {
      this.openPause('El renderizador se recuperó. Pulsa Continuar para regresar.');
    }
  };

  private readonly resumeFromLifecycle = (): void => {
    if (this.contextLost) return;
    this.input.reset();
    this.lifecyclePaused = false;
    this.gameState.resume();
    this.pause.close();
    this.audio.resume();
    this.lifecycle.onGameResume();
  };

  private readonly onTick = (ticker: Ticker): void => {
    this.profiler.record(ticker.deltaMS);
    const frameDeltaSeconds = Math.min(ticker.deltaMS / 1000, 0.1);
    this.accumulator += frameDeltaSeconds;
    while (this.accumulator >= FIXED_STEP_SECONDS) {
      if (this.gameState.isSimulationRunning) {
        if (this.hitStopSeconds > 0) {
          this.hitStopSeconds = Math.max(0, this.hitStopSeconds - FIXED_STEP_SECONDS);
        } else {
          this.updateSimulation();
        }
      } else {
        this.hitStopSeconds = 0;
      }
      this.accumulator -= FIXED_STEP_SECONDS;
    }

    if (this.gameState.isSimulationRunning) this.presentationTime += frameDeltaSeconds;
    this.renderFrame(frameDeltaSeconds);
  };

  public constructor(options: GameOptions) {
    this.app = options.app;
    this.container = options.elements.container;
    this.hudElement = options.elements.hud;
    this.pauseButton = options.elements.pauseButton ?? null;
    this.buildTarget = options.buildTarget;
    this.stressMode = options.stressMode;
    this.startOnMenu = options.startOnMenu === true && options.elements.startScreen !== undefined;
    this.saveStore = options.platform.saveStore;
    const saved = this.saveStore.load();
    this.playerSkin = options.playerSkin ?? saved.skins.selected;
    this.cannonSkin = options.cannonSkin ?? saved.cannonSkins.selected;
    this.background = options.background ?? saved.backgrounds.selected;
    this.fxQuality = options.fxQuality ?? 'medium';
    this.profiler = new FrameProfiler(options.profileMode === true);
    this.gameState = new GameState(this.startOnMenu ? 'menu' : 'playing');
    this.initialElapsedSeconds = Number.isFinite(options.initialElapsedSeconds)
      ? Math.max(0, options.initialElapsedSeconds ?? 0)
      : 0;
    this.lifecycle = options.platform.lifecycle;
    this.rewardedAds = new RewardedAdController(options.platform.ads);
    this.audio = options.platform.audio;
    this.audio.configure(saved.settings);
    this.combat = new CombatSimulation({
      stress: this.stressMode,
      initialElapsedSeconds: this.initialElapsedSeconds,
      permanentBonuses: getPermanentCombatBonuses(saved.metaUpgrades.levels)
    });
    this.view = new PixiGameView(this.app.renderer, this.playerSkin, this.fxQuality, this.cannonSkin, this.background);
    this.debug = new DebugPanel(options.elements.debug, this.stressMode || this.initialElapsedSeconds > 0 || this.profiler.enabled);
    this.hud = new GameHud(options.elements.hud);
    this.levelUp = new LevelUpOverlay(options.elements.levelUp);
    this.pause = new PauseOverlay(options.elements.pause);
    this.gameOver = new GameOverOverlay(options.elements.gameOver);
    this.startScreen = options.elements.startScreen ? new StartScreen(options.elements.startScreen) : null;
    this.input = new InputManager(this.container, this.viewport, () => this.player.state, () => {
      void this.audio.unlock();
    });
    this.upgradeApplier = new UpgradeApplier(this.player, this.combat);
    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.queueResize);
  }

  public async start(): Promise<void> {
    if (this.started || this.stopped) return;
    this.started = true;
    this.app.stage.addChild(this.view.root);
    this.resizeObserver?.observe(this.container);
    window.addEventListener('resize', this.queueResize, { passive: true });
    window.addEventListener('orientationchange', this.queueResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('blur', this.onWindowBlur);
    this.app.canvas.addEventListener('webglcontextlost', this.onWebglContextLost);
    this.app.canvas.addEventListener('webglcontextrestored', this.onWebglContextRestored);
    this.pauseButton?.addEventListener('click', this.onPauseButton);
    if (this.pauseButton) this.pauseButton.hidden = false;
    this.arena.update(this.initialElapsedSeconds);
    this.resizeNow();
    await this.lifecycle.init();
    if (this.startOnMenu) {
      await this.openStartScreen();
      this.hudElement.hidden = true;
      if (this.pauseButton) this.pauseButton.hidden = true;
    } else {
      this.activateRun(false);
    }
    this.app.ticker.add(this.onTick);
  }

  public shutdown(): void {
    if (!this.started || this.stopped) return;
    this.stopped = true;
    this.clearTerminalSummaryTimer();
    this.app.ticker.remove(this.onTick);
    this.input.detach();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.queueResize);
    window.removeEventListener('orientationchange', this.queueResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.onWindowBlur);
    this.app.canvas.removeEventListener('webglcontextlost', this.onWebglContextLost);
    this.app.canvas.removeEventListener('webglcontextrestored', this.onWebglContextRestored);
    this.pauseButton?.removeEventListener('click', this.onPauseButton);
    this.startScreen?.close();
    this.view.closeLevelUpFx();
    this.audio.shutdown();
    this.lifecycle.onGamePause();
  }

  private resizeNow(): void {
    const state = this.viewport.resize(this.container.clientWidth, this.container.clientHeight, window.devicePixelRatio);
    this.app.renderer.resolution = state.dpr;
    this.app.renderer.resize(state.cssWidth, state.cssHeight);
    this.view.resize(state);
    if (this.gameState.phase === 'level-up') this.syncLevelUpFx();
  }

  private updateSimulation(): void {
    this.arena.update(FIXED_STEP_SECONDS);
    this.player.update(this.input.getMovement(), FIXED_STEP_SECONDS, this.arena.state.radius);
    this.combat.update(FIXED_STEP_SECONDS, this.player.state, this.arena.state.radius);
    for (const event of this.combat.events) {
      if (event.type === 'enemyDefeated') {
        this.player.applyVampirism();
        this.audio.playCue('enemy-defeated');
        this.view.playEnemyDefeat(event.x, event.y, event.kind);
        if (event.kind === 'tank' || event.kind === 'elite') {
          this.triggerHitStop(HIT_STOP_SECONDS.enemyDefeat);
        }
      }
      if (event.type === 'playerDamaged') {
        const resolution = this.player.resolveDamage(event.amount);
        if (resolution.outcome === 'shielded') {
          this.view.playPlayerGuard(this.presentationTime);
          this.triggerHitStop(HIT_STOP_SECONDS.playerGuard);
        } else if (resolution.outcome === 'damaged') {
          this.audio.playCue('damage');
          this.view.playPlayerDamage(this.player.state.x, this.player.state.y, event.amount, this.presentationTime);
          this.triggerHitStop(this.player.isAlive ? HIT_STOP_SECONDS.playerDamage : HIT_STOP_SECONDS.terminal);
          if (!this.player.isAlive) {
            this.audio.playCue('player-defeated');
            this.view.playPlayerDefeat(this.player.state.x, this.player.state.y);
            this.finishRun('game-over');
            return;
          }
        }
      }
      if (event.type === 'bossDefeated') {
        this.audio.playCue('boss-defeated');
        this.view.playBossDefeat(this.combat.renderState.boss.x, this.combat.renderState.boss.y, 48);
        this.triggerHitStop(HIT_STOP_SECONDS.terminal);
        this.finishRun('victory');
        return;
      }
    }
    if (this.stressMode) return;
    this.progression.sync(this.combat.stats.experience);
    if (this.progression.state.pendingLevelUps > 0) this.openLevelUp();
  }

  private renderFrame(deltaSeconds = 0): void {
    const presentationDelta = this.gameState.phase === 'paused'
      || this.gameState.phase === 'level-up'
      || this.gameState.phase === 'menu'
      ? 0
      : deltaSeconds;
    this.view.updatePresentationFx(presentationDelta, this.presentationTime);
    this.view.renderArena(this.arena.state.radius, this.arena.state.resonance);
    this.view.renderLaser(this.combat.renderState.laser, this.arena.state.radius);
    this.view.renderBoss(this.combat.renderState.boss, this.arena.state.radius);
    this.view.renderCombat(this.combat.renderState, this.presentationTime);
    this.syncShotFeedback();
    this.view.renderPlayer(this.player.state, this.presentationTime, this.player.shieldChargeProgress);
    this.view.renderImpactFx(this.gameState.isSimulationRunning ? deltaSeconds : 0);
    this.view.updateTerminalFx(deltaSeconds);
    this.view.renderLevelUpFx(deltaSeconds);
    this.hud.update({
      elapsedSeconds: this.combat.stats.elapsedSeconds,
      health: this.player.state.health,
      maxHealth: this.player.state.maxHealth,
      xp: this.combat.stats.experience,
      kills: this.combat.stats.kills,
      level: this.progression.state.level
    });
    if (this.pauseButton) {
      this.pauseButton.hidden = !this.gameState.isSimulationRunning || this.lifecyclePaused;
    }

    this.frames += 1;
    const now = performance.now();
    if (now - this.fpsTime >= 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsTime);
      this.frames = 0;
      this.fpsTime = now;
    }
    const state = this.viewport.state;
    const profile = this.profiler.snapshot(now);
    this.debug.update({
      target: this.buildTarget,
      orientation: state.orientation,
      logical: `${state.logicalWidth}×${state.logicalHeight}`,
      viewport: `${state.cssWidth}×${state.cssHeight}`,
      scale: state.scale,
      dpr: state.dpr,
      quality: this.fxQuality,
      profile: profile.enabled ? 'on' : 'off',
      frameP95: profile.enabled ? `${profile.p95Ms.toFixed(2)} ms` : 'n/a',
      frameMax: profile.enabled ? `${profile.maxMs.toFixed(2)} ms` : 'n/a',
      longFrames: profile.enabled ? profile.longFrames : 'n/a',
      heap: profile.heapUsedMb === null ? 'n/a' : `${profile.heapUsedMb.toFixed(1)} MB`,
      fps: this.fps,
      mode: this.combat.isStressMode ? 'stress' : 'normal',
      enemies: `${this.combat.enemies.activeCount}/${this.combat.enemies.capacity}`,
      projectiles: `${this.combat.projectiles.activeCount}/${this.combat.projectiles.capacity}`,
      orbit: `${this.combat.activeOrbitBlades}/${this.combat.orbitBlades.length}`,
      chain: this.combat.hasChainLightning ? 'ready' : 'locked',
      paused: this.lifecyclePaused ? 'lifecycle' : this.gameState.phase,
      level: this.progression.state.level,
      arena: `${this.arena.state.radius.toFixed(1)} | expansión ${this.arena.state.expansionIndex}`,
      resonance: this.arena.state.resonance,
      boss: this.combat.renderState.boss.active
        ? `${this.combat.renderState.boss.phase} | ${Math.ceil(this.combat.renderState.boss.health)}/${this.combat.renderState.boss.maxHealth}`
        : 'inactive',
      player: `${this.player.state.x.toFixed(1)}, ${this.player.state.y.toFixed(1)}`
    });
  }

  private openLevelUp(): void {
    if (this.gameState.enterLevelUp()) {
      this.lifecycle.onGamePause();
      this.audio.playCue('level-up');
    }
    const level = this.progression.state.level;
    const choices = this.upgradeApplier.getChoices(level);
    const requestToken = ++this.levelUpRequestToken;
    void this.prepareLevelUp(level, choices, requestToken);
  }

  private async prepareLevelUp(
    level: number,
    choices: readonly UpgradeDefinition[],
    requestToken: number
  ): Promise<void> {
    const rerollAvailable = choices.length === 3
      && this.rewardedOffers.canOffer('reroll')
      && await this.rewardedAds.isAvailable('reroll');
    if (this.stopped || requestToken !== this.levelUpRequestToken || this.gameState.phase !== 'level-up') return;
    this.showLevelUp(level, choices, rerollAvailable);
  }

  private showLevelUp(level: number, choices: readonly UpgradeDefinition[], rerollAvailable: boolean): void {
    this.levelUp.open(level, choices, (upgradeId) => {
      this.view.closeLevelUpFx();
      this.input.reset();
      this.upgradeApplier.apply(upgradeId);
      this.progression.consumeLevelUp();
      if (this.progression.state.pendingLevelUps > 0) {
        this.openLevelUp();
      } else {
        this.gameState.leaveLevelUp();
        if (!this.lifecyclePaused) {
          this.lifecycle.onGameResume();
        }
      }
    }, (upgrade) => this.upgradeApplier.getPreview(upgrade), this.onLevelUpInteraction, {
      rerollAvailable,
      onReroll: () => { void this.requestReroll(level, choices); }
    });
    this.syncLevelUpFx();
  }

  private async requestReroll(level: number, currentChoices: readonly UpgradeDefinition[]): Promise<void> {
    if (this.gameState.phase !== 'level-up') return;
    const requestToken = this.levelUpRequestToken;
    const offerToken = this.rewardedOffers.begin('reroll');
    if (offerToken === null) return;
    this.levelUp.setRerollPending();
    const result = await this.rewardedAds.request('reroll');
    this.rewardedOffers.settle('reroll', offerToken, result);
    if (this.stopped || requestToken !== this.levelUpRequestToken || this.gameState.phase !== 'level-up') return;
    if (result !== 'rewarded') {
      this.levelUp.setRerollResult(result);
      return;
    }
    const rerolledChoices = this.upgradeApplier.getRerollChoices(level, currentChoices);
    if (rerolledChoices.length < 3) {
      this.levelUp.setRerollResult('error');
      return;
    }
    this.showLevelUp(level, rerolledChoices, false);
  }

  private syncLevelUpFx(): void {
    if (this.gameState.phase !== 'level-up') {
      this.view.closeLevelUpFx();
      return;
    }
    const scale = this.viewport.state.scale;
    const anchors: LevelUpCardAnchor[] = this.levelUp.getCardLayouts().map((layout) => {
      const logical = this.viewport.cssToLogical(layout.x, layout.y);
      return {
        index: layout.index,
        x: logical.x,
        y: logical.y,
        width: layout.width / scale,
        height: layout.height / scale,
        tone: layout.tone
      };
    });
    this.view.openLevelUpFx(anchors);
  }

  private pauseForLifecycle(message = 'La partida se detuvo al salir de la ventana.'): void {
    if (this.lifecyclePaused || !this.gameState.enterPause()) return;
    this.lifecyclePaused = true;
    this.hitStopSeconds = 0;
    this.input.reset();
    this.audio.pause();
    this.lifecycle.onGamePause();
    this.openPause(message);
  }

  private activateRun(unlockAudio: boolean): void {
    this.input.attach();
    this.hudElement.hidden = false;
    if (unlockAudio) void this.audio.unlock();
    this.audio.startMusic();
    this.lifecycle.onGameStart();
  }

  private persistAudioSettings(settings: AudioSettings): void {
    this.audio.configure(settings);
    const saved = this.saveStore.load();
    this.saveStore.save({
      ...saved,
      settings: {
        ...saved.settings,
        ...settings
      }
    });
  }

  private openPause(message: string): void {
    this.pause.open(message, this.resumeFromLifecycle, {
      settings: this.saveStore.load().settings,
      onSettingsChange: this.onPauseSettingsChange,
      onRestart: this.onPauseRestart,
      onReturnToMenu: this.startScreen ? this.onPauseReturnToMenu : undefined
    });
  }

  private async openStartScreen(): Promise<void> {
    if (!this.startScreen) return;
    const requestToken = ++this.startScreenRequestToken;
    const cosmeticUnlockAvailable = this.rewardedOffers.canOffer('cosmetic-unlock')
      && await this.rewardedAds.isAvailable('cosmetic-unlock');
    if (this.stopped || requestToken !== this.startScreenRequestToken || this.gameState.phase !== 'menu') return;
    const saved = this.saveStore.load();
    this.startScreen.open({
      settings: saved.settings,
      best: saved.best,
      skins: saved.skins,
      cannonSkins: saved.cannonSkins,
      backgrounds: saved.backgrounds,
      wallet: saved.wallet,
      metaUpgrades: saved.metaUpgrades,
      onPlay: this.onStartPlay,
      onSettingsChange: this.onStartSettingsChange,
      onSkinStateChange: this.onStartSkinStateChange,
      onCannonSkinStateChange: this.onStartCannonSkinStateChange,
      onBackgroundStateChange: this.onStartBackgroundStateChange,
      onWalletChange: this.onStartWalletChange,
      onMetaUpgradesChange: this.onStartMetaUpgradesChange,
      cosmeticUnlockAvailable,
      onCosmeticUnlock: this.onStartCosmeticUnlock
    });
  }

  private finishRun(outcome: RunOutcome): void {
    const transitioned = outcome === 'victory' ? this.gameState.winRun() : this.gameState.endRun();
    if (!transitioned) return;
    this.input.reset();
    this.audio.stopMusic();
    this.lifecycle.onGameOver();
    const summary = createRunSummary(outcome, this.combat.stats);
    const saved = this.saveStore.load();
    const best = mergeBestRun(saved.best, { timeSeconds: summary.elapsedSeconds, score: summary.score });
    const novaReward = calculateRunNova(summary);
    const wallet = { nova: Math.min(MAX_NOVA, saved.wallet.nova + novaReward) };
    this.saveStore.save({ ...saved, best, wallet });
    this.terminalRunToken += 1;
    const terminalToken = this.terminalRunToken;
    this.terminalNovaReward = novaReward;
    this.terminalTotalNova = wallet.nova;
    this.clearTerminalSummaryTimer();
    this.terminalSummaryTimer = setTimeout(() => {
      this.terminalSummaryTimer = null;
      if (this.stopped || !this.gameState.isTerminal) return;
      void this.openGameOverSummary(summary, best, novaReward, wallet.nova, terminalToken);
    }, TERMINAL_SUMMARY_DELAY_MS);
  }

  private async openGameOverSummary(
    summary: ReturnType<typeof createRunSummary>,
    best: ReturnType<typeof mergeBestRun>,
    novaReward: number,
    totalNova: number,
    terminalToken: number
  ): Promise<void> {
    const canDoubleNova = novaReward > 0 && totalNova < MAX_NOVA
      && this.rewardedOffers.canOffer('double-nova')
      && await this.rewardedAds.isAvailable('double-nova');
    const canRevive = summary.outcome === 'game-over'
      && this.rewardedOffers.canOffer('revive')
      && await this.rewardedAds.isAvailable('revive');
    if (this.stopped || terminalToken !== this.terminalRunToken || !this.gameState.isTerminal) return;
    this.gameOver.open(summary, best, novaReward, totalNova, () => {
      this.restartRun();
    }, {
      doubleNovaAvailable: canDoubleNova,
      onDoubleNova: canDoubleNova ? () => { void this.requestDoubleNova(terminalToken); } : undefined,
      reviveAvailable: canRevive,
      onRevive: canRevive ? () => { void this.requestRevive(terminalToken); } : undefined
    });
  }

  private async requestRevive(terminalToken: number): Promise<void> {
    if (terminalToken !== this.terminalRunToken || !this.gameState.isTerminal) return;
    const offerToken = this.rewardedOffers.begin('revive');
    if (offerToken === null) return;
    this.gameOver.setRevivePending();
    const result = await this.rewardedAds.request('revive');
    this.rewardedOffers.settle('revive', offerToken, result);
    if (this.stopped || terminalToken !== this.terminalRunToken || !this.gameState.isTerminal) return;
    if (result !== 'rewarded') {
      this.gameOver.setReviveResult(result);
      return;
    }
    if (!this.gameState.reviveRun() || !this.player.revive(0.35, 2)) {
      this.gameOver.setReviveResult('error');
      return;
    }
    // A revived run is no longer terminal. Invalidate callbacks owned by the
    // old summary while preserving the once-per-run ledger entries.
    this.terminalRunToken += 1;
    this.gameOver.close();
    this.view.playPlayerRevive();
    // Game over only resets input state; listeners remain attached for an
    // in-place revive, so attaching again would duplicate pointer handlers.
    this.lifecyclePaused = false;
    this.audio.resume();
    this.audio.startMusic();
    this.lifecycle.onGameStart();
  }

  private async requestDoubleNova(terminalToken: number): Promise<void> {
    if (terminalToken !== this.terminalRunToken || !this.gameState.isTerminal) return;
    const offerToken = this.rewardedOffers.begin('double-nova');
    if (offerToken === null) return;
    this.gameOver.setDoubleNovaPending();
    const result = await this.rewardedAds.request('double-nova');
    this.rewardedOffers.settle('double-nova', offerToken, result);
    if (this.stopped || terminalToken !== this.terminalRunToken || !this.gameState.isTerminal) return;
    if (result === 'rewarded') {
      const saved = this.saveStore.load();
      const extraNova = Math.min(MAX_NOVA - saved.wallet.nova, this.terminalNovaReward);
      if (extraNova > 0) {
        const wallet = { nova: saved.wallet.nova + extraNova };
        this.saveStore.save({ ...saved, wallet });
        this.terminalTotalNova = wallet.nova;
        this.gameOver.updateNova(this.terminalNovaReward + extraNova, this.terminalTotalNova);
      }
    }
    this.gameOver.setDoubleNovaResult(result);
  }

  private async requestCosmeticUnlock(target: CosmeticUnlockTarget): Promise<RewardedAdResult> {
    if (this.gameState.phase !== 'menu') return 'unavailable';
    const saved = this.saveStore.load();
    const alreadyUnlocked = target.kind === 'player'
      ? !isPlayerSkinId(target.id) || saved.skins.unlocked.includes(target.id)
      : target.kind === 'cannon'
        ? !isCannonSkinId(target.id) || saved.cannonSkins.unlocked.includes(target.id)
        : !isBackgroundId(target.id) || saved.backgrounds.unlocked.includes(target.id);
    if (alreadyUnlocked) return 'unavailable';
    const offerToken = this.rewardedOffers.begin('cosmetic-unlock');
    if (offerToken === null) return 'unavailable';
    const result = await this.rewardedAds.request('cosmetic-unlock');
    this.rewardedOffers.settle('cosmetic-unlock', offerToken, result);
    if (result !== 'rewarded') return result;

    const current = this.saveStore.load();
    if (target.kind === 'player' && isPlayerSkinId(target.id)) {
      const unlocked = Array.from(new Set<PlayerSkinId>([...current.skins.unlocked, target.id]));
      this.saveStore.save({ ...current, skins: { selected: target.id, unlocked } });
      this.view.setPlayerSkin(target.id);
    } else if (target.kind === 'cannon' && isCannonSkinId(target.id)) {
      const unlocked = Array.from(new Set<CannonSkinId>([...current.cannonSkins.unlocked, target.id]));
      this.saveStore.save({ ...current, cannonSkins: { selected: target.id, unlocked } });
      this.view.setCannonSkin(target.id);
    } else if (target.kind === 'background' && isBackgroundId(target.id)) {
      const unlocked = Array.from(new Set<BackgroundId>([...current.backgrounds.unlocked, target.id]));
      this.saveStore.save({ ...current, backgrounds: { selected: target.id, unlocked } });
      this.view.setBackground(target.id);
    }
    return result;
  }

  private restartRun(): void {
    if (!this.gameState.restart()) return;
    this.terminalRunToken += 1;
    this.rewardedOffers.reset();
    this.resetRunState();
  }

  private resetRunState(): void {
    this.clearRunPresentation();
    this.audio.resume();
    this.audio.startMusic();
    this.lifecycle.onGameStart();
  }

  private returnToMenuState(): void {
    this.clearRunPresentation();
    this.input.detach();
    this.audio.stopMusic();
    this.lifecycle.onGamePause();
    this.hudElement.hidden = true;
    if (this.pauseButton) this.pauseButton.hidden = true;
    void this.openStartScreen();
  }

  private clearRunPresentation(): void {
    this.clearTerminalSummaryTimer();
    this.levelUpRequestToken += 1;
    this.hitStopSeconds = 0;
    this.input.reset();
    this.arena.reset();
    this.arena.update(this.initialElapsedSeconds);
    this.player.reset();
    this.combat.reset();
    this.progression.reset();
    this.upgradeApplier.reset();
    this.view.resetPresentation();
    this.lifecyclePaused = false;
    this.accumulator = 0;
    this.frames = 0;
    this.fps = 0;
    this.presentationTime = 0;
    this.presentedShotsFired = 0;
    this.fpsTime = performance.now();
    this.pause.close();
    this.gameOver.close();
    this.startScreen?.close();
    this.view.closeLevelUpFx();
  }

  private clearTerminalSummaryTimer(): void {
    if (this.terminalSummaryTimer === null) return;
    clearTimeout(this.terminalSummaryTimer);
    this.terminalSummaryTimer = null;
  }

  private triggerHitStop(seconds: number): void {
    this.hitStopSeconds = Math.max(this.hitStopSeconds, Math.max(0, seconds));
  }

  private syncShotFeedback(): void {
    const shot = this.combat.renderState.shot;
    if (shot.sequence < this.presentedShotsFired) {
      this.presentedShotsFired = shot.sequence;
      return;
    }
    if (shot.sequence === this.presentedShotsFired) return;
    // Collapse several fixed-step shots into one presentation pulse per frame.
    // This prevents stress mode from flooding the audio bus or the player view.
    this.view.playPlayerShot(this.presentationTime, shot);
    this.audio.playCue('player-shot');
    this.presentedShotsFired = shot.sequence;
  }
}
