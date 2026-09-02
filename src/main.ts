import { Application } from 'pixi.js';
import './styles.css';
import { Game } from './app/Game';
import pauseIcon from './assets/svg/ui/pause.svg?raw';
import settingsIcon from './assets/svg/ui/settings.svg?raw';
import { BOSS_DEFINITION } from './content/bosses/BossDefinition';
import { type FxQuality, type PlayerSkinId } from './content/visual/VisualTokens';
import { isCannonSkinId, type CannonSkinId } from './content/visual/CannonSkinDefinitions';
import { LocalPlatform } from './platform/local/LocalPlatform';

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

const mountInlineIcon = (host: HTMLElement, svg: string, replaceChildren: boolean): void => {
  if (replaceChildren) host.replaceChildren();
  host.insertAdjacentHTML('afterbegin', svg);
  const icon = host.firstElementChild;
  if (icon instanceof SVGElement) {
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
  }
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
  const startScreenElement = document.querySelector<HTMLElement>('#start-screen');
  const hudElement = document.querySelector<HTMLElement>('#game-hud');
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause-toggle');
  const levelUpElement = document.querySelector<HTMLElement>('#level-up');
  const pauseElement = document.querySelector<HTMLElement>('#pause-overlay');
  const gameOverElement = document.querySelector<HTMLElement>('#game-over');
  if (!container || !debugElement || !bootStatus || !startScreenElement || !hudElement || !pauseButton || !levelUpElement || !pauseElement || !gameOverElement) {
    throw new Error('Faltan elementos de la interfaz');
  }
  mountInlineIcon(pauseButton, pauseIcon, true);
  const settingsToggle = pauseElement.querySelector<HTMLButtonElement>('#pause-settings-toggle');
  if (settingsToggle) mountInlineIcon(settingsToggle, settingsIcon, false);

  const searchParams = new URLSearchParams(window.location.search);
  const spike = searchParams.get('spike');
  const stressMode = searchParams.get('stress') === '1';
  const bossDebugMode = searchParams.get('boss') === '1';
  const requestedSkin = searchParams.get('skin');
  const playerSkin: PlayerSkinId | undefined = requestedSkin === 'violet' || requestedSkin === 'cyan' || requestedSkin === 'amber' || requestedSkin === 'emerald'
    ? requestedSkin
    : undefined;
  const requestedCannon = searchParams.get('cannon');
  const cannonSkin: CannonSkinId | undefined = isCannonSkinId(requestedCannon) ? requestedCannon : undefined;
  const requestedQuality = searchParams.get('quality');
  const fxQuality: FxQuality = requestedQuality === 'low' || requestedQuality === 'medium' || requestedQuality === 'high'
    ? requestedQuality
    : 'medium';
  const profileMode = searchParams.get('profile') === '1';
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

  const game = new Game({
    app,
    elements: {
      container,
      debug: debugElement,
      startScreen: startScreenElement,
      hud: hudElement,
      pauseButton,
      levelUp: levelUpElement,
      pause: pauseElement,
      gameOver: gameOverElement
    },
    stressMode,
    playerSkin,
    cannonSkin,
    fxQuality,
    profileMode,
    initialElapsedSeconds: bossDebugMode ? BOSS_DEFINITION.startSeconds : undefined,
    buildTarget: __BUILD_TARGET__,
    startOnMenu: !bossDebugMode,
    platform: new LocalPlatform()
  });
  await game.start();
  bootStatus.hidden = true;
  window.addEventListener('beforeunload', () => game.shutdown(), { once: true });
};

void bootstrap().catch(reportBootError);
