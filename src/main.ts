import { Application } from 'pixi.js';
import './styles.css';
import { FIXED_STEP_SECONDS } from './config/constants';
import { DebugPanel } from './debug/DebugPanel';
import { InputManager } from './input/InputManager';
import { LocalPlatform } from './platform/local/LocalPlatform';
import { PixiGameView } from './presentation/PixiGameView';
import { ViewportTransform } from './presentation/viewport/ViewportTransform';
import { ArenaModel } from './simulation/ArenaModel';
import { CombatSimulation } from './simulation/combat/CombatSimulation';
import { PlayerModel } from './simulation/PlayerModel';
import { GameHud } from './ui/GameHud';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error || 'Error desconocido');
};

const reportBootError = (error: unknown): void => {
  const bootStatus = document.querySelector<HTMLElement>('#boot-status');
  if (bootStatus) {
    bootStatus.hidden = false;
    bootStatus.dataset.state = 'error';
    bootStatus.textContent = `No se pudo iniciar el juego. ${getErrorMessage(error)}`;
  }
  console.error('Geometry Survivor could not start:', error);
};

const createPixiApplication = async (container: HTMLElement): Promise<Application> => {
  const app = new Application();
  await app.init({
    width: Math.max(1, container.clientWidth),
    height: Math.max(1, container.clientHeight),
    background: '#080b17',
    antialias: false,
    autoDensity: true,
    resolution: 1,
    preference: 'webgl',
    preferWebGLVersion: 1,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'low-power'
  });
  return app;
};

const bootstrap = async (): Promise<void> => {
  const container = document.querySelector<HTMLElement>('#game-container');
  const debugElement = document.querySelector<HTMLElement>('#debug-panel');
  const bootStatus = document.querySelector<HTMLElement>('#boot-status');
  const hudElement = document.querySelector<HTMLElement>('#game-hud');
  if (!container || !debugElement || !bootStatus || !hudElement) throw new Error('Faltan elementos de la interfaz');

  const spike = new URLSearchParams(window.location.search).get('spike');
  if (spike === 'audio') {
    const { runAudioSpike } = await import('./spikes/AudioSpike');
    bootStatus.hidden = true;
    hudElement.hidden = true;
    const cleanupAudioSpike = runAudioSpike(container);
    window.addEventListener('beforeunload', cleanupAudioSpike, { once: true });
    return;
  }

  const app = await createPixiApplication(container);
  container.appendChild(app.canvas);

  if (spike === 'rendering') {
    const { runRenderingSpike } = await import('./spikes/RenderingSpike');
    bootStatus.hidden = true;
    hudElement.hidden = true;
    const cleanupRenderingSpike = runRenderingSpike(app, container);
    window.addEventListener('beforeunload', () => {
      cleanupRenderingSpike();
      app.destroy(true, { children: true });
    }, { once: true });
    return;
  }

  const viewport = new ViewportTransform();
  const arena = new ArenaModel();
  const player = new PlayerModel();
  const combat = new CombatSimulation();
  const view = new PixiGameView(app.renderer);
  const debug = new DebugPanel(debugElement);
  const hud = new GameHud(hudElement);
  const platform = new LocalPlatform();

  app.stage.addChild(view.root);

  const resizeNow = (): void => {
    const state = viewport.resize(container.clientWidth, container.clientHeight, window.devicePixelRatio);
    app.renderer.resolution = state.dpr;
    app.renderer.resize(state.cssWidth, state.cssHeight);
    view.resize(state);
  };

  let resizeQueued = false;
  const queueResize = (): void => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      resizeNow();
    });
  };

  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(queueResize);
  resizeObserver?.observe(container);
  window.addEventListener('resize', queueResize, { passive: true });
  window.addEventListener('orientationchange', queueResize, { passive: true });
  resizeNow();

  const input = new InputManager(container, viewport, () => player.state);
  input.attach();
  hudElement.hidden = false;
  await platform.init();
  platform.onGameStart();

  let accumulator = 0;
  let frames = 0;
  let fpsTime = performance.now();
  let fps = 0;

  app.ticker.add((ticker) => {
    accumulator += Math.min(ticker.deltaMS / 1000, 0.1);
    while (accumulator >= FIXED_STEP_SECONDS) {
      arena.update(FIXED_STEP_SECONDS);
      player.update(input.getMovement(), FIXED_STEP_SECONDS, arena.state.radius);
      combat.update(FIXED_STEP_SECONDS, player.state, arena.state.radius);
      for (const event of combat.events) {
        if (event.type === 'playerDamaged') player.takeDamage(event.amount);
      }
      accumulator -= FIXED_STEP_SECONDS;
    }

    view.renderArena(arena.state.radius);
    view.renderCombat(combat);
    view.renderPlayer(player.state);
    hud.update({
      elapsedSeconds: combat.stats.elapsedSeconds,
      health: player.state.health,
      maxHealth: player.state.maxHealth,
      xp: combat.stats.experience,
      kills: combat.stats.kills
    });
    frames += 1;
    const now = performance.now();
    if (now - fpsTime >= 500) {
      fps = (frames * 1000) / (now - fpsTime);
      frames = 0;
      fpsTime = now;
    }
    const state = viewport.state;
    debug.update({
      target: __BUILD_TARGET__,
      orientation: state.orientation,
      logical: `${state.logicalWidth}×${state.logicalHeight}`,
      viewport: `${state.cssWidth}×${state.cssHeight}`,
      scale: state.scale,
      dpr: state.dpr,
      fps,
      arena: arena.state.radius,
      player: `${player.state.x.toFixed(1)}, ${player.state.y.toFixed(1)}`
    });
  });

  bootStatus.hidden = true;

  window.addEventListener('beforeunload', () => {
    input.detach();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', queueResize);
    window.removeEventListener('orientationchange', queueResize);
    platform.onGamePause();
  });
};

void bootstrap().catch(reportBootError);
