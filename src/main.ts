import { Application } from 'pixi.js';
import './styles.css';
import { FIXED_STEP_SECONDS } from './config/constants';
import { DebugPanel } from './debug/DebugPanel';
import { InputManager } from './input/InputManager';
import { LocalPlatform } from './platform/local/LocalPlatform';
import { PixiGameView } from './presentation/PixiGameView';
import { ViewportTransform } from './presentation/viewport/ViewportTransform';
import { PlayerModel } from './simulation/PlayerModel';

const container = document.querySelector<HTMLElement>('#game-container');
const debugElement = document.querySelector<HTMLElement>('#debug-panel');
if (!container || !debugElement) throw new Error('Game shell elements are missing');

const app = new Application();
const viewport = new ViewportTransform();
const player = new PlayerModel();
const view = new PixiGameView();
const debug = new DebugPanel(debugElement);
const platform = new LocalPlatform();

await app.init({
  resizeTo: container,
  background: '#080b17',
  antialias: false,
  autoDensity: true,
  resolution: 1
});

container.appendChild(app.canvas);
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

const resizeObserver = new ResizeObserver(queueResize);
resizeObserver.observe(container);
window.addEventListener('orientationchange', queueResize, { passive: true });
resizeNow();

const input = new InputManager(container, viewport, () => player.state);
input.attach();
await platform.init();
platform.onGameStart();

let accumulator = 0;
let frames = 0;
let fpsTime = performance.now();
let fps = 0;

app.ticker.add((ticker) => {
  accumulator += Math.min(ticker.deltaMS / 1000, 0.1);
  while (accumulator >= FIXED_STEP_SECONDS) {
    player.update(input.getMovement(), FIXED_STEP_SECONDS);
    accumulator -= FIXED_STEP_SECONDS;
  }

  view.renderPlayer(player.state);
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
    player: `${player.state.x.toFixed(1)}, ${player.state.y.toFixed(1)}`
  });
});

window.addEventListener('beforeunload', () => {
  input.detach();
  resizeObserver.disconnect();
  platform.onGamePause();
});
