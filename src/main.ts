import { Application } from 'pixi.js';
import './styles.css';
import './ui/home.css';
import { Game } from './app/Game';
import pauseIcon from './assets/svg/ui/pause.svg?raw';
import pauseActionIcons from './assets/svg/ui/pause-icons.svg?raw';
import pausePanelFrame from './assets/svg/ui/pause-panel-frame.svg?raw';
import settingsIcon from './assets/svg/ui/settings.svg?raw';
import { RADIAL_ACT_DIRECTOR } from './simulation/acts/RadialActDirector';
import { type FxQuality, type PlayerSkinId } from './content/visual/VisualTokens';
import { isCannonSkinId, type CannonSkinId } from './content/visual/CannonSkinDefinitions';
import { isBackgroundId, type BackgroundId } from './content/visual/BackgroundDefinitions';
import { LocalPlatform } from './platform/local/LocalPlatform';
import { isPlayerSkinId } from './content/visual/SkinDefinitions';
import { isHazardCadenceMode, type HazardCadenceMode } from './content/hazards/HazardCadenceDefinitions';
import { isCalibrationId, type CalibrationId } from './content/run/CalibrationDefinitions';
import type { ActId } from './content/run/ActDefinitions';
import type { EnemyKind } from './content/enemies/EnemyDefinitions';
import { isWeaponPathId, type UpgradeId, type WeaponPathId } from './content/upgrades/UpgradeDefinitions';
import {
  isWeaponEvolutionId,
  isWeaponEvolutionScenario,
  type WeaponEvolutionId,
  type WeaponEvolutionScenario
} from './content/weapons/WeaponEvolutionDefinitions';
import {
  normalizeOverdriveSeed,
  normalizeOverdriveStage,
  type RunMode
} from './content/run/OverdriveDefinitions';
import type { OverdriveBossPair } from './simulation/acts/OverdriveActDirector';

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

const isOverdriveBossPair = (value: string | null): value is OverdriveBossPair => (
  value === 'core-warden' || value === 'core-fracture' || value === 'warden-fracture'
);

const mountInlineIcon = (host: HTMLElement, svg: string, replaceChildren: boolean): void => {
  if (replaceChildren) host.replaceChildren();
  host.insertAdjacentHTML('afterbegin', svg);
  const icon = host.firstElementChild;
  if (icon instanceof SVGElement) {
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
  }
};

const mountSymbolIcon = (host: HTMLElement, symbol: string): void => {
  host.replaceChildren();
  host.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#ui-pause-action-${symbol}"></use></svg>`);
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
  const baselineElement = document.querySelector<HTMLElement>('#baseline-panel');
  const bootStatus = document.querySelector<HTMLElement>('#boot-status');
  const startScreenElement = document.querySelector<HTMLElement>('#start-screen');
  const hudElement = document.querySelector<HTMLElement>('#game-hud');
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause-toggle');
  const levelUpElement = document.querySelector<HTMLElement>('#level-up');
  const pauseElement = document.querySelector<HTMLElement>('#pause-overlay');
  const gameOverElement = document.querySelector<HTMLElement>('#game-over');
  const overdriveTransitionElement = document.querySelector<HTMLElement>('#overdrive-transition');
  if (!container || !debugElement || !bootStatus || !startScreenElement || !hudElement || !pauseButton || !levelUpElement || !pauseElement || !gameOverElement) {
    throw new Error('Faltan elementos de la interfaz');
  }
  mountInlineIcon(pauseButton, pauseIcon, true);
  const pausePanelFrameElement = pauseElement.querySelector<HTMLElement>('#pause-panel-frame');
  if (pausePanelFrameElement) mountInlineIcon(pausePanelFrameElement, pausePanelFrame, true);
  pauseElement.insertAdjacentHTML('afterbegin', pauseActionIcons);
  pauseElement.querySelectorAll<HTMLElement>('[data-pause-icon]').forEach((iconHost) => {
    const symbol = iconHost.dataset.pauseIcon;
    if (symbol) mountSymbolIcon(iconHost, symbol);
  });
  const settingsToggle = pauseElement.querySelector<HTMLButtonElement>('#pause-settings-toggle');
  if (settingsToggle) mountInlineIcon(settingsToggle, settingsIcon, false);

  const searchParams = new URLSearchParams(window.location.search);
  const requestedWeaponCard = searchParams.get('card');
  const weaponCardId: UpgradeId | undefined = searchParams.get('debug') === '1'
    ? requestedWeaponCard === 'pulse-ring'
      ? 'pulse_ring'
      : requestedWeaponCard === 'magnetic-charge'
        ? 'magnetic_charge'
        : undefined
    : undefined;
  const requestedEvolution = searchParams.get('evolution')?.replaceAll('-', '_');
  const evolutionId: WeaponEvolutionId | undefined = searchParams.get('debug') === '1'
    && isWeaponEvolutionId(requestedEvolution)
    ? requestedEvolution
    : undefined;
  const evolutionScenario: WeaponEvolutionScenario | undefined = evolutionId !== undefined
    && isWeaponEvolutionScenario(searchParams.get('scenario'))
    ? searchParams.get('scenario') as WeaponEvolutionScenario
    : undefined;
  const requestedWeaponPath = searchParams.get('weapon-path')?.replaceAll('-', '_');
  const spike = searchParams.get('spike');
  const orbiterDrill = searchParams.get('orbiter') === '1';
  const chargerDrill = searchParams.get('charger') === '1' && !orbiterDrill;
  const splitterDrill = searchParams.get('splitter') === '1' && !orbiterDrill && !chargerDrill;
  const prismWeaverDrill = searchParams.get('prism') === '1'
    && !orbiterDrill && !chargerDrill && !splitterDrill;
  const pulseRingDrill = searchParams.get('pulse') === '1'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill;
  const angularSweepDrill = searchParams.get('angular') === '1'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill && !pulseRingDrill;
  const wardenDrill = searchParams.get('warden') === '1'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
    && !pulseRingDrill && !angularSweepDrill;
  const pulseRingWeaponDrill = searchParams.get('weapon') === 'pulse-ring'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
    && !pulseRingDrill && !angularSweepDrill && !wardenDrill;
  const magneticChargeWeaponDrill = searchParams.get('weapon') === 'magnetic-charge'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
    && !pulseRingDrill && !angularSweepDrill && !wardenDrill && !pulseRingWeaponDrill;
  const requestedFractureDrill = searchParams.get('fracture-drill');
  const fractureEnemyKind: EnemyKind = requestedFractureDrill === 'thorn'
    ? 'thorn-bastion'
    : requestedFractureDrill === 'zigzag'
      ? 'zigzag-reaver'
      : requestedFractureDrill === 'miner' ? 'rift-miner' : 'fracture-gunner';
  const fractureDrill = searchParams.get('debug') === '1'
    && requestedFractureDrill !== null
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
    && !pulseRingDrill && !angularSweepDrill && !wardenDrill && !pulseRingWeaponDrill
    && !magneticChargeWeaponDrill;
  const stressMode = searchParams.get('stress') === '1'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill && !pulseRingDrill
    && !angularSweepDrill && !wardenDrill && !pulseRingWeaponDrill && !magneticChargeWeaponDrill;
  const bossDebugMode = searchParams.get('boss') === '1';
  const requestedSkin = searchParams.get('skin');
  const playerSkin: PlayerSkinId | undefined = isPlayerSkinId(requestedSkin)
    ? requestedSkin
    : undefined;
  const requestedCannon = searchParams.get('cannon');
  const cannonSkin: CannonSkinId | undefined = isCannonSkinId(requestedCannon) ? requestedCannon : undefined;
  const requestedBackground = searchParams.get('background');
  const background: BackgroundId | undefined = isBackgroundId(requestedBackground) ? requestedBackground : undefined;
  const requestedQuality = searchParams.get('quality');
  const fxQuality: FxQuality = requestedQuality === 'low' || requestedQuality === 'medium' || requestedQuality === 'high'
    ? requestedQuality
    : 'medium';
  const profileMode = searchParams.get('profile') === '1';
  const requestedHazardCadence = searchParams.get('hazards');
  const hazardCadenceMode: HazardCadenceMode = isHazardCadenceMode(requestedHazardCadence)
    ? requestedHazardCadence
    : 'chaos';
  const requestedCalibration = searchParams.get('calibration');
  const calibrationId: CalibrationId | undefined = isCalibrationId(requestedCalibration)
    ? requestedCalibration
    : undefined;
  const requestedAct = searchParams.get('act');
  const actId: ActId = requestedAct === 'angular' ? 'angular' : requestedAct === 'fracture' ? 'fracture' : 'radial';
  const requestedOverdrive = searchParams.get('mode') === 'overdrive';
  const overdriveMode = requestedOverdrive;
  const diagnosticOverdrive = overdriveMode && searchParams.get('debug') === '1';
  const runMode: RunMode = overdriveMode ? 'overdrive' : 'campaign';
  const overdriveStage = normalizeOverdriveStage(Number(searchParams.get('od-stage') ?? 1));
  const overdriveSeed = normalizeOverdriveSeed(Number(searchParams.get('seed') ?? NaN));
  const overdriveBossPair = diagnosticOverdrive && isOverdriveBossPair(searchParams.get('od-pair'))
    ? searchParams.get('od-pair') as OverdriveBossPair
    : undefined;
  const requestedOverdriveBuild = searchParams.get('od-build');
  const overdriveBuild: 'starter' | 'three-evolved' | 'six-evolved' = diagnosticOverdrive
    && (requestedOverdriveBuild === 'three-evolved' || requestedOverdriveBuild === 'six-evolved')
    ? requestedOverdriveBuild
    : 'starter';
  const campaignBuild = searchParams.get('debug') === '1'
    && searchParams.get('campaign') === 'evolved'
    ? 'three-evolved' as const
    : undefined;
  const baselineMode = searchParams.get('baseline') === '1'
    && hazardCadenceMode === 'chaos'
    && calibrationId === undefined
    && actId === 'radial'
    && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
    && !pulseRingDrill && !pulseRingWeaponDrill && !magneticChargeWeaponDrill && !fractureDrill;
  const weaponPath: WeaponPathId | undefined = searchParams.get('debug') === '1'
    && isWeaponPathId(requestedWeaponPath)
    && weaponCardId === undefined
    && evolutionId === undefined
    && evolutionScenario === undefined
    && !stressMode
    ? requestedWeaponPath
    : undefined;
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
      gameOver: gameOverElement,
      overdriveTransition: overdriveTransitionElement ?? undefined,
      baseline: baselineElement ?? undefined
    },
    stressMode,
    orbiterDrill,
    chargerDrill,
    splitterDrill,
    prismWeaverDrill,
    pulseRingDrill,
    pulseRingWeaponDrill,
    magneticChargeWeaponDrill,
    fractureDrill,
    fractureEnemyKind,
    campaignBuild,
    weaponCardId,
    evolutionId,
    evolutionScenario,
    weaponPath,
    angularSweepDrill,
    wardenDrill,
    playerSkin,
    cannonSkin,
    background,
    fxQuality,
    profileMode,
    baselineMode,
    hazardCadenceMode,
    calibrationId,
    actId,
    mode: runMode,
    overdriveStage: overdriveMode ? overdriveStage : undefined,
    overdriveSeed: overdriveMode ? overdriveSeed : undefined,
    overdriveBossPair: overdriveMode ? overdriveBossPair : undefined,
    overdriveBuild: overdriveMode ? overdriveBuild : undefined,
    diagnosticOverdrive,
    allowLockedAct: searchParams.get('debug') === '1' && requestedAct !== null,
    initialElapsedSeconds: bossDebugMode
      ? actId === 'fracture' ? 250 : actId === 'angular' ? 260 : RADIAL_ACT_DIRECTOR.bossStartSeconds
      : undefined,
    buildTarget: __BUILD_TARGET__,
    startOnMenu: (overdriveMode && !diagnosticOverdrive)
      || (!overdriveMode && requestedAct === null && !bossDebugMode && !orbiterDrill && !chargerDrill && !splitterDrill && !prismWeaverDrill
      && !pulseRingDrill && !angularSweepDrill && !wardenDrill && !pulseRingWeaponDrill
      && !magneticChargeWeaponDrill && !fractureDrill && weaponCardId === undefined && evolutionId === undefined
      && weaponPath === undefined && campaignBuild === undefined),
    platform: new LocalPlatform()
  });
  await game.start();
  bootStatus.hidden = true;
  window.addEventListener('beforeunload', () => game.shutdown(), { once: true });
};

void bootstrap().catch(reportBootError);
