import { Application } from 'pixi.js';
import './styles.css';
import { Game } from './app/Game';
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
  const levelUpElement = document.querySelector<HTMLElement>('#level-up');
  const pauseElement = document.querySelector<HTMLElement>('#pause-overlay');
  if (!container || !debugElement || !bootStatus || !hudElement || !levelUpElement || !pauseElement) {
    throw new Error('Faltan elementos de la interfaz');
  }

  const searchParams = new URLSearchParams(window.location.search);
  const spike = searchParams.get('spike');
  const stressMode = searchParams.get('stress') === '1';
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
      hud: hudElement,
      levelUp: levelUpElement,
      pause: pauseElement
    },
    stressMode,
    buildTarget: __BUILD_TARGET__,
    platform: new LocalPlatform()
  });
  await game.start();
  bootStatus.hidden = true;
  window.addEventListener('beforeunload', () => game.shutdown(), { once: true });
};

void bootstrap().catch(reportBootError);
