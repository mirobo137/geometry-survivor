import type { Application, Ticker } from 'pixi.js';
import { FIXED_STEP_SECONDS } from '../config/constants';
import { DebugPanel } from '../debug/DebugPanel';
import { InputManager } from '../input/InputManager';
import type { PlatformAdapter } from '../platform/Platform';
import { PixiGameView } from '../presentation/PixiGameView';
import { ViewportTransform } from '../presentation/viewport/ViewportTransform';
import { ArenaModel } from '../simulation/ArenaModel';
import { CombatSimulation } from '../simulation/combat/CombatSimulation';
import { PlayerModel } from '../simulation/PlayerModel';
import { LevelProgression } from '../simulation/progression/LevelProgression';
import { UpgradeApplier } from '../simulation/progression/UpgradeApplier';
import { GameHud } from '../ui/GameHud';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { PauseOverlay } from '../ui/PauseOverlay';
import { GameState } from './GameState';

export interface GameElements {
  readonly container: HTMLElement;
  readonly debug: HTMLElement;
  readonly hud: HTMLElement;
  readonly levelUp: HTMLElement;
  readonly pause: HTMLElement;
}

export interface GameOptions {
  readonly app: Application;
  readonly elements: GameElements;
  readonly stressMode: boolean;
  readonly buildTarget: string;
  readonly platform: PlatformAdapter;
}

/** Coordinates the run lifecycle and loop without implementing domain systems. */
export class Game {
  private readonly app: Application;
  private readonly container: HTMLElement;
  private readonly hudElement: HTMLElement;
  private readonly buildTarget: string;
  private readonly stressMode: boolean;
  private readonly platform: PlatformAdapter;
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
  private readonly input: InputManager;
  private readonly upgradeApplier: UpgradeApplier;
  private readonly resizeObserver: ResizeObserver | null;
  private resizeQueued = false;
  private accumulator = 0;
  private frames = 0;
  private fpsTime = performance.now();
  private fps = 0;
  private lifecyclePaused = false;
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

  private readonly onTick = (ticker: Ticker): void => {
    this.accumulator += Math.min(ticker.deltaMS / 1000, 0.1);
    while (this.accumulator >= FIXED_STEP_SECONDS) {
      if (this.gameState.isSimulationRunning) this.updateSimulation();
      this.accumulator -= FIXED_STEP_SECONDS;
    }

    this.renderFrame();
  };

  public constructor(options: GameOptions) {
    this.app = options.app;
    this.container = options.elements.container;
    this.hudElement = options.elements.hud;
    this.buildTarget = options.buildTarget;
    this.stressMode = options.stressMode;
    this.platform = options.platform;
    this.combat = new CombatSimulation({ stress: this.stressMode });
    this.view = new PixiGameView(this.app.renderer);
    this.debug = new DebugPanel(options.elements.debug, this.stressMode);
    this.hud = new GameHud(options.elements.hud);
    this.levelUp = new LevelUpOverlay(options.elements.levelUp);
    this.pause = new PauseOverlay(options.elements.pause);
    this.input = new InputManager(this.container, this.viewport, () => this.player.state);
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
    this.resizeNow();
    this.input.attach();
    this.hudElement.hidden = false;
    await this.platform.init();
    this.platform.onGameStart();
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
    this.platform.onGamePause();
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
      if (event.type === 'playerDamaged') this.player.takeDamage(event.amount);
    }
    if (this.stressMode) return;
    this.progression.sync(this.combat.stats.experience);
    if (this.progression.state.pendingLevelUps > 0) this.openLevelUp();
  }

  private renderFrame(): void {
    this.view.renderArena(this.arena.state.radius, this.arena.state.resonance);
    this.view.renderLaser(this.combat.renderState.laser, this.arena.state.radius);
    this.view.renderCombat(this.combat.renderState);
    this.view.renderPlayer(this.player.state);
    this.hud.update({
      elapsedSeconds: this.combat.stats.elapsedSeconds,
      health: this.player.state.health,
      maxHealth: this.player.state.maxHealth,
      xp: this.combat.stats.experience,
      kills: this.combat.stats.kills,
      level: this.progression.state.level
    });

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
      player: `${this.player.state.x.toFixed(1)}, ${this.player.state.y.toFixed(1)}`
    });
  }

  private openLevelUp(): void {
    if (this.gameState.enterLevelUp()) this.platform.onGamePause();
    const choices = this.upgradeApplier.getChoices(this.progression.state.level);
    this.levelUp.open(this.progression.state.level, choices, (upgradeId) => {
      this.input.reset();
      this.upgradeApplier.apply(upgradeId);
      this.progression.consumeLevelUp();
      if (this.progression.state.pendingLevelUps > 0) {
        this.openLevelUp();
      } else {
        this.gameState.leaveLevelUp();
        if (!this.lifecyclePaused) this.platform.onGameResume();
      }
    });
  }

  private pauseForLifecycle(): void {
    if (this.lifecyclePaused || !this.gameState.enterPause()) return;
    this.lifecyclePaused = true;
    this.input.reset();
    this.platform.onGamePause();
    this.pause.open('La partida se detuvo al salir de la ventana.', () => {
      this.input.reset();
      this.lifecyclePaused = false;
      this.gameState.resume();
      this.pause.close();
      this.platform.onGameResume();
    });
  }
}
