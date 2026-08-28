import type { Application, Ticker } from 'pixi.js';
import { FIXED_STEP_SECONDS } from '../config/constants';
import { DebugPanel } from '../debug/DebugPanel';
import { InputManager } from '../input/InputManager';
import type { PlatformAdapter, PlatformLifecycle } from '../platform/Platform';
import { mergeBestRun, type SaveStore } from '../platform/save/SaveStore';
import { PixiGameView } from '../presentation/PixiGameView';
import { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import { ArenaModel } from '../simulation/ArenaModel';
import { CombatSimulation } from '../simulation/combat/CombatSimulation';
import { PlayerModel } from '../simulation/PlayerModel';
import { LevelProgression } from '../simulation/progression/LevelProgression';
import { UpgradeApplier } from '../simulation/progression/UpgradeApplier';
import { GameHud } from '../ui/GameHud';
import { GameOverOverlay } from '../ui/GameOverOverlay';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { PauseOverlay } from '../ui/PauseOverlay';
import type { AudioService, AudioSettings } from '../audio/AudioService';
import { GameState } from './GameState';
import { createRunSummary, type RunOutcome } from './RunSummary';

export interface GameElements {
  readonly container: HTMLElement;
  readonly debug: HTMLElement;
  readonly hud: HTMLElement;
  readonly levelUp: HTMLElement;
  readonly pause: HTMLElement;
  readonly gameOver: HTMLElement;
  readonly pauseButton?: HTMLButtonElement;
}

export interface GameOptions {
  readonly app: Application;
  readonly elements: GameElements;
  readonly stressMode: boolean;
  readonly initialElapsedSeconds?: number;
  readonly buildTarget: string;
  readonly platform: PlatformAdapter;
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
  private readonly lifecycle: PlatformLifecycle;
  private readonly saveStore: SaveStore;
  private readonly audio: AudioService;
  private readonly viewport = new ViewportTransform();
  private readonly arena = new ArenaModel();
  private readonly player = new PlayerModel();
  private readonly combat: CombatSimulation;
  private readonly progression = new LevelProgression();
  private readonly gameState = new GameState();
  private readonly view: PixiGameView;
  private readonly debug: DebugPanel;
  private readonly hud: GameHud;
  private readonly levelUp: LevelUpOverlay;
  private readonly pause: PauseOverlay;
  private readonly gameOver: GameOverOverlay;
  private readonly input: InputManager;
  private readonly upgradeApplier: UpgradeApplier;
  private readonly resizeObserver: ResizeObserver | null;
  private resizeQueued = false;
  private accumulator = 0;
  private frames = 0;
  private presentationTime = 0;
  private fpsTime = performance.now();
  private fps = 0;
  private lifecyclePaused = false;
  private contextLost = false;
  private started = false;
  private stopped = false;

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

  private readonly onPauseButton = (): void => {
    // A pause tap is also a valid user gesture for mobile Web Audio unlock.
    void this.audio.unlock();
    this.pauseForLifecycle('Partida pausada manualmente.');
  };

  private readonly onPauseSettingsChange = (settings: AudioSettings): void => {
    this.audio.configure(settings);
    const saved = this.saveStore.load();
    this.saveStore.save({
      ...saved,
      settings: {
        ...saved.settings,
        ...settings
      }
    });
  };

  private readonly onPauseRestart = (): void => {
    if (this.contextLost) return;
    if (!this.gameState.restartFromPause()) return;
    this.resetRunState();
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
    this.accumulator += Math.min(ticker.deltaMS / 1000, 0.1);
    while (this.accumulator >= FIXED_STEP_SECONDS) {
      if (this.gameState.isSimulationRunning) this.updateSimulation();
      this.accumulator -= FIXED_STEP_SECONDS;
    }

    if (this.gameState.isSimulationRunning) this.presentationTime += Math.min(ticker.deltaMS / 1000, 0.1);
    this.renderFrame();
  };

  public constructor(options: GameOptions) {
    this.app = options.app;
    this.container = options.elements.container;
    this.hudElement = options.elements.hud;
    this.pauseButton = options.elements.pauseButton ?? null;
    this.buildTarget = options.buildTarget;
    this.stressMode = options.stressMode;
    this.initialElapsedSeconds = Number.isFinite(options.initialElapsedSeconds)
      ? Math.max(0, options.initialElapsedSeconds ?? 0)
      : 0;
    this.lifecycle = options.platform.lifecycle;
    this.saveStore = options.platform.saveStore;
    this.audio = options.platform.audio;
    this.audio.configure(this.saveStore.load().settings);
    this.combat = new CombatSimulation({
      stress: this.stressMode,
      initialElapsedSeconds: this.initialElapsedSeconds
    });
    this.view = new PixiGameView(this.app.renderer);
    this.debug = new DebugPanel(options.elements.debug, this.stressMode || this.initialElapsedSeconds > 0);
    this.hud = new GameHud(options.elements.hud);
    this.levelUp = new LevelUpOverlay(options.elements.levelUp);
    this.pause = new PauseOverlay(options.elements.pause);
    this.gameOver = new GameOverOverlay(options.elements.gameOver);
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
    this.input.attach();
    this.hudElement.hidden = false;
    await this.lifecycle.init();
    this.lifecycle.onGameStart();
    this.app.ticker.add(this.onTick);
  }

  public shutdown(): void {
    if (!this.started || this.stopped) return;
    this.stopped = true;
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
    this.audio.shutdown();
    this.lifecycle.onGamePause();
  }

  private resizeNow(): void {
    const state = this.viewport.resize(this.container.clientWidth, this.container.clientHeight, window.devicePixelRatio);
    this.app.renderer.resolution = state.dpr;
    this.app.renderer.resize(state.cssWidth, state.cssHeight);
    this.view.resize(state);
  }

  private updateSimulation(): void {
    this.arena.update(FIXED_STEP_SECONDS);
    this.player.update(this.input.getMovement(), FIXED_STEP_SECONDS, this.arena.state.radius);
    this.combat.update(FIXED_STEP_SECONDS, this.player.state, this.arena.state.radius);
    for (const event of this.combat.events) {
      if (event.type === 'enemyDefeated') {
        this.audio.playCue('enemy-defeated');
      }
      if (event.type === 'playerDamaged') {
        this.audio.playCue('damage');
        if (this.player.takeDamage(event.amount) && !this.player.isAlive) {
          this.finishRun('game-over');
          return;
        }
      }
      if (event.type === 'bossDefeated') {
        this.audio.playCue('boss-defeated');
        this.finishRun('victory');
        return;
      }
    }
    if (this.stressMode) return;
    this.progression.sync(this.combat.stats.experience);
    if (this.progression.state.pendingLevelUps > 0) this.openLevelUp();
  }

  private renderFrame(): void {
    this.view.renderArena(this.arena.state.radius, this.arena.state.resonance);
    this.view.renderLaser(this.combat.renderState.laser, this.arena.state.radius);
    this.view.renderBoss(this.combat.renderState.boss, this.arena.state.radius);
    this.view.renderCombat(this.combat.renderState, this.presentationTime);
    this.view.renderPlayer(this.player.state);
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
    this.debug.update({
      target: this.buildTarget,
      orientation: state.orientation,
      logical: `${state.logicalWidth}×${state.logicalHeight}`,
      viewport: `${state.cssWidth}×${state.cssHeight}`,
      scale: state.scale,
      dpr: state.dpr,
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
    const choices = this.upgradeApplier.getChoices(this.progression.state.level);
    this.levelUp.open(this.progression.state.level, choices, (upgradeId) => {
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
    }, (upgrade) => this.upgradeApplier.getPreview(upgrade));
  }

  private pauseForLifecycle(message = 'La partida se detuvo al salir de la ventana.'): void {
    if (this.lifecyclePaused || !this.gameState.enterPause()) return;
    this.lifecyclePaused = true;
    this.input.reset();
    this.audio.pause();
    this.lifecycle.onGamePause();
    this.openPause(message);
  }

  private openPause(message: string): void {
    this.pause.open(message, this.resumeFromLifecycle, {
      settings: this.saveStore.load().settings,
      onSettingsChange: this.onPauseSettingsChange,
      onRestart: this.onPauseRestart
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
    this.saveStore.save({ ...saved, best });
    this.gameOver.open(summary, best, () => {
      this.restartRun();
    });
  }

  private restartRun(): void {
    if (!this.gameState.restart()) return;
    this.resetRunState();
  }

  private resetRunState(): void {
    this.input.reset();
    this.arena.reset();
    this.arena.update(this.initialElapsedSeconds);
    this.player.reset();
    this.combat.reset();
    this.progression.reset();
    this.upgradeApplier.reset();
    this.lifecyclePaused = false;
    this.accumulator = 0;
    this.frames = 0;
    this.fps = 0;
    this.presentationTime = 0;
    this.fpsTime = performance.now();
    this.pause.close();
    this.gameOver.close();
    this.audio.resume();
    this.audio.startMusic();
    this.lifecycle.onGameStart();
  }
}
