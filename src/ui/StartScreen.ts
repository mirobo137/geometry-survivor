import type { AudioSettings } from '../audio/AudioService';
import { ownsRewardCosmetic } from '../app/RewardCosmeticOwnership';
import { prepareImage, observeVisibleImages, prepareActPlates } from './ImageReadiness';
import { isControlScheme, normalizeControlScheme } from '../input/ControlScheme';
import heroSceneUrl from '../assets/images/ui/home/orbital-sanctuary.webp?url';
import heroPortraitUrl from '../assets/images/ui/home/orbital-sanctuary-portrait.webp?url';
import { PLAYER_SHIP_RASTER_ART } from '../assets/skins/SkinRasterAssets';
import startMarkFallbackUrl from '../assets/svg/ui/start/mark.svg?url';
import radialEmblemFallbackUrl from '../assets/svg/ui/start/radial.svg?url';
import angularEmblemFallbackUrl from '../assets/svg/ui/start/angular.svg?url';
import fractureEmblemFallbackUrl from '../assets/svg/ui/start/fracture.svg?url';
import overdriveEmblemFallbackUrl from '../assets/svg/ui/start/overdrive.svg?url';
import type { BackgroundSaveData, CampaignActId, CannonSkinSaveData, ControlScheme, LaboratorySaveData, SkinSaveData, WalletSaveData } from '../platform/save/SaveStore';
import { formatNova } from '../content/meta/EconomyDefinitions';
import novaSvg from '../assets/svg/ui/nova.svg?raw';
import { getPlayerSkinDefinition, PLAYER_SKIN_DEFINITIONS } from '../content/visual/SkinDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../content/visual/CannonSkinDefinitions';
import { BACKGROUND_DEFINITIONS } from '../content/visual/BackgroundDefinitions';
import type { FxQuality, PlayerSkinId } from '../content/visual/VisualTokens';
import type { CannonSkinId } from '../content/visual/CannonSkinDefinitions';
import type { BackgroundId } from '../content/visual/BackgroundDefinitions';
import { SkinSelectPanel } from './skins/SkinSelectPanel';
import { CannonSelectPanel } from './skins/CannonSelectPanel';
import { BackgroundSelectPanel } from './skins/BackgroundSelectPanel';
import { CosmeticPreviewDialog } from './skins/CosmeticPreviewDialog';
import { LaboratoryPanel } from './meta/LaboratoryPanel';
import type { RewardedAdResult } from '../platform/Platform';
import type { ActId } from '../content/run/ActDefinitions';
import { isCalibrationId, type CalibrationId } from '../content/run/CalibrationDefinitions';
import { RetentionPanel } from './retention/RetentionPanel';
import { DailyWheelDialog, type DailyWheelDialogOptions } from './retention/DailyWheelDialog';
import type { RewardCosmeticSource } from '../content/retention/RewardCosmeticDefinitions';
import wheelRimUrl from '../assets/images/ui/retention/wheel-rim.webp?no-inline';
import { dailyWheelAvailability } from '../content/retention/DailyWheelDefinitions';
import { getRetentionObjectiveProgress, RETENTION_OBJECTIVES, type RetentionChallengeId, type RetentionObjectiveId, type RetentionSaveData, type RetentionWeeklyEdition, type RetentionClaimResult } from '../content/retention/RetentionDefinitions';
import type { OverdriveVariant } from '../content/run/OverdriveDefinitions';

export interface StartScreenBest {
  readonly timeSeconds: number;
  readonly score: number;
}

export type CosmeticUnlockResult = 'rewarded' | 'dismissed' | 'unavailable' | 'error';

export type CosmeticUnlockTarget =
  | { readonly kind: 'player'; readonly id: PlayerSkinId; readonly name: string; readonly priceNova: number }
  | { readonly kind: 'cannon'; readonly id: CannonSkinId; readonly name: string; readonly priceNova: number }
  | { readonly kind: 'background'; readonly id: BackgroundId; readonly name: string; readonly priceNova: number };

export interface StartScreenOptions {
  readonly settings: AudioSettings;
  readonly quality: FxQuality;
  readonly best: StartScreenBest;
  readonly skins: SkinSaveData;
  readonly cannonSkins: CannonSkinSaveData;
  readonly backgrounds: BackgroundSaveData;
  readonly wallet: WalletSaveData;
  readonly laboratory: LaboratorySaveData;
  readonly unlockedActs: readonly CampaignActId[];
  readonly selectedAct: ActId;
  readonly selectedMode?: 'campaign' | 'overdrive';
  readonly selectedOverdriveVariant?: OverdriveVariant;
  readonly onPlay: (calibrationId?: CalibrationId) => void;
  readonly onActChange: (actId: ActId) => void;
  readonly onSettingsChange: (settings: AudioSettings) => void;
  readonly controlScheme: ControlScheme;
  readonly onControlSchemeChange: (controlScheme: ControlScheme) => void;
  readonly onSkinStateChange: (state: SkinSaveData) => void;
  readonly onCannonSkinStateChange: (state: CannonSkinSaveData) => void;
  readonly onBackgroundStateChange: (state: BackgroundSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
  readonly onLaboratoryChange: (laboratory: LaboratorySaveData, wallet: WalletSaveData) => boolean;
  readonly laboratoryVitalityAdAvailable: boolean;
  readonly onLaboratoryVitalityAd: () => Promise<{ readonly result: RewardedAdResult; readonly laboratory?: LaboratorySaveData }>;
  readonly cosmeticUnlockAvailable: boolean;
  readonly onCosmeticUnlock: (target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>;
  readonly overdriveUnlocked?: boolean;
  readonly onOverdrivePlay?: (variant: OverdriveVariant) => void;
  readonly retention: RetentionSaveData;
  readonly retentionEdition: RetentionWeeklyEdition;
  readonly onStartRetentionChallenge: (id: RetentionChallengeId) => void;
  readonly onRetentionObjectiveSelect: (id: RetentionObjectiveId) => void;
  readonly onRetentionObjectiveClaim: (id: RetentionObjectiveId) => Promise<RetentionClaimResult>;
  readonly readRetention: () => { readonly progress: RetentionSaveData; readonly walletNova: number };
  readonly initialView?: 'retention';
  readonly dailyWheel?: DailyWheelDialogOptions;
  /** Local/Pages preview uses a session-only save and all normal catalogs. */
  readonly rewardCatalogPreview?: boolean;
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

// Matches home's stacked layout, not a device/user-agent classification.
const HOME_PORTRAIT_MEDIA = '(max-width: 599px), (max-width: 831px) and (min-height: 541px)';

/** Presentation-only home screen. It owns no run or progression state. */
export class StartScreen {
  private readonly root: HTMLElement;
  private readonly playButton: HTMLButtonElement;
  private readonly overdriveButton: HTMLButtonElement | null;
  private readonly overdriveAssaultButton: HTMLButtonElement | null;
  private readonly settingsToggle: HTMLButtonElement;
  private readonly levelToggle: HTMLButtonElement;
  private readonly settingsPanel: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly musicInput: HTMLInputElement;
  private readonly sfxInput: HTMLInputElement;
  private readonly mutedInput: HTMLInputElement;
  private readonly controlSchemeInput: HTMLSelectElement;
  private readonly musicValue: HTMLOutputElement;
  private readonly sfxValue: HTMLOutputElement;
  private readonly bestTime: HTMLElement;
  private readonly bestScore: HTMLElement;
  private readonly mainView: HTMLElement;
  private readonly actView: HTMLElement;
  private readonly entryView: HTMLElement;
  private readonly actBack: HTMLButtonElement;
  private readonly entryBack: HTMLButtonElement;
  private readonly radialActButton: HTMLButtonElement;
  private readonly angularActButton: HTMLButtonElement;
  private readonly fractureActButton: HTMLButtonElement;
  private readonly entryButtons: readonly HTMLButtonElement[];
  private readonly actStatus: HTMLElement;
  private readonly skinsToggle: HTMLButtonElement;
  private readonly skinsBack: HTMLButtonElement;
  private readonly skinsPanel: SkinSelectPanel;
  private readonly cannonPanel: CannonSelectPanel;
  private readonly backgroundPanel: BackgroundSelectPanel;
  private readonly cosmeticDialog: CosmeticPreviewDialog;
  private readonly metaPanel: LaboratoryPanel;
  private readonly retentionPanel: RetentionPanel;
  private readonly dailyWheelDialog = new DailyWheelDialog();
  private dailyWheelOptions: DailyWheelDialogOptions | null = null;
  private readonly retentionToggle: HTMLButtonElement;
  private readonly retentionBack: HTMLButtonElement;
  private readonly retentionView: HTMLElement;
  private readonly retentionBody: HTMLElement;
  private readonly skinsView: HTMLElement;
  private readonly metaView: HTMLElement;
  private readonly metaToggle: HTMLButtonElement;
  private readonly metaBack: HTMLButtonElement;
  private readonly novaValues: readonly HTMLElement[];
  private readonly playerSkinsTab: HTMLButtonElement;
  private readonly cannonSkinsTab: HTMLButtonElement;
  private readonly backgroundsTab: HTMLButtonElement;
  private readonly playerSkinsView: HTMLElement;
  private readonly cannonSkinsView: HTMLElement;
  private readonly backgroundsView: HTMLElement;
  private readonly cosmeticRewarded: HTMLElement;
  private readonly cosmeticRewardedName: HTMLElement;
  private readonly cosmeticRewardedMessage: HTMLElement;
  private readonly cosmeticRewardedButton: HTMLButtonElement;
  private actChangeHandler: ((actId: ActId) => void) | null = null;
  private playHandler: ((calibrationId?: CalibrationId) => void) | null = null;
  private settingsHandler: ((settings: AudioSettings) => void) | null = null;
  private controlSchemeHandler: ((controlScheme: ControlScheme) => void) | null = null;
  private skinStateHandler: ((state: SkinSaveData) => void) | null = null;
  private skinState: SkinSaveData = { selected: 'spearhead', unlocked: ['cyan', 'spearhead'] };
  private cannonSkinState: CannonSkinSaveData = { selected: 'spearhead', unlocked: ['basic', 'spearhead'] };
  private backgroundState: BackgroundSaveData = { selected: 'deep-space', unlocked: ['deep-space'] };
  private wallet: WalletSaveData = { nova: 0 };
  private laboratory: LaboratorySaveData = { levels: {}, currentOfferIds: [], deferredOffers: [], history: [], purchasesSinceVitalityAd: 0, vitalityAdRank: 0, offerStep: 0 };
  private unlockedActs: readonly CampaignActId[] = ['radial'];
  private selectedAct: ActId = 'radial';
  private selectedMode: 'campaign' | 'overdrive' = 'campaign';
  private selectedOverdriveVariant: OverdriveVariant = 'normal';
  private laboratoryUnlocked = false;
  private cosmeticUnlockAvailable = false;
  private cosmeticUnlockHandler: ((target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>) | null = null;
  private cosmeticOfferConsumed = false;
  private cosmeticRequestPending = false;
  private cosmeticRequestToken = 0;
  private activeSkinTab: 'player' | 'cannon' | 'background' = 'player';
  private cosmeticTarget: CosmeticUnlockTarget | null = null;
  private overdrivePlayHandler: ((variant: OverdriveVariant) => void) | null = null;
  private overdriveUnlocked = false;
  private homeMarkReady: Promise<boolean> | null = null;

  private readonly onSkinStateChange = (state: SkinSaveData): void => {
    this.skinState = state;
    this.skinStateHandler?.(state);
    this.updateHomeShip();
    this.updateCosmeticOffer();
  };

  private readonly onCannonSkinStateChange = (state: CannonSkinSaveData): void => {
    this.cannonSkinState = state;
    this.cannonSkinStateHandler?.(state);
    this.updateCosmeticOffer();
  };
  private readonly onBackgroundStateChange = (state: BackgroundSaveData): void => {
    this.backgroundState = state;
    this.backgroundStateHandler?.(state);
    this.updateCosmeticOffer();
  };
  private cannonSkinStateHandler: ((state: CannonSkinSaveData) => void) | null = null;
  private backgroundStateHandler: ((state: BackgroundSaveData) => void) | null = null;
  private walletStateHandler: ((wallet: WalletSaveData) => void) | null = null;
  private laboratoryChangeHandler: ((laboratory: LaboratorySaveData, wallet: WalletSaveData) => boolean) | null = null;
  private laboratoryVitalityAdHandler: (() => Promise<{ readonly result: RewardedAdResult; readonly laboratory?: LaboratorySaveData }>) | null = null;
  private laboratoryVitalityAdAvailable = false;

  public constructor(root: HTMLElement) {
    const playButton = root.querySelector<HTMLButtonElement>('#start-play');
    const overdriveButton = root.querySelector<HTMLButtonElement>('#start-overdrive');
    const overdriveAssaultButton = root.querySelector<HTMLButtonElement>('#start-overdrive-assault');
    const settingsToggle = root.querySelector<HTMLButtonElement>('#start-settings-toggle');
    const levelToggle = root.querySelector<HTMLButtonElement>('#start-level');
    const settingsPanel = root.querySelector<HTMLElement>('#start-settings');
    const panel = root.querySelector<HTMLElement>('.start-screen-panel');
    const musicInput = root.querySelector<HTMLInputElement>('#start-music');
    const sfxInput = root.querySelector<HTMLInputElement>('#start-sfx');
    const mutedInput = root.querySelector<HTMLInputElement>('#start-muted');
    const controlSchemeInput = root.querySelector<HTMLSelectElement>('#start-control-scheme');
    const musicValue = root.querySelector<HTMLOutputElement>('#start-music-value');
    const sfxValue = root.querySelector<HTMLOutputElement>('#start-sfx-value');
    const bestTime = root.querySelector<HTMLElement>('#start-best-time');
    const bestScore = root.querySelector<HTMLElement>('#start-best-score');
    const mainView = root.querySelector<HTMLElement>('#start-main-view');
    const actView = root.querySelector<HTMLElement>('#start-act-view');
    const entryView = root.querySelector<HTMLElement>('#start-entry-view');
    const actBack = root.querySelector<HTMLButtonElement>('#start-act-back');
    const entryBack = root.querySelector<HTMLButtonElement>('#start-entry-back');
    const radialActButton = root.querySelector<HTMLButtonElement>('#start-act-radial');
    const angularActButton = root.querySelector<HTMLButtonElement>('#start-act-angular');
    const fractureActButton = root.querySelector<HTMLButtonElement>('#start-act-fracture');
    const entryButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-start-calibration]'));
    const actStatus = root.querySelector<HTMLElement>('#start-act-status');
    const skinsToggle = root.querySelector<HTMLButtonElement>('#start-skins');
    const skinsBack = root.querySelector<HTMLButtonElement>('#start-skins-back');
    const skinsView = root.querySelector<HTMLElement>('#start-skins-view');
    const playerSkinsTab = root.querySelector<HTMLButtonElement>('#start-player-skins-tab');
    const cannonSkinsTab = root.querySelector<HTMLButtonElement>('#start-cannon-skins-tab');
    const backgroundsTab = root.querySelector<HTMLButtonElement>('#start-backgrounds-tab');
    const metaToggle = root.querySelector<HTMLButtonElement>('#start-meta');
    const metaBack = root.querySelector<HTMLButtonElement>('#start-meta-back');
    const metaView = root.querySelector<HTMLElement>('#start-meta-view');
    const retentionToggle = root.querySelector<HTMLButtonElement>('#start-retention');
    const retentionBack = root.querySelector<HTMLButtonElement>('#start-retention-back');
    const retentionView = root.querySelector<HTMLElement>('#start-retention-view');
    const retentionBody = root.querySelector<HTMLElement>('#start-retention-body');
    const playerSkinsView = root.querySelector<HTMLElement>('#start-player-skins-panel');
    const cannonSkinsView = root.querySelector<HTMLElement>('#start-cannon-skins-panel');
    const backgroundsView = root.querySelector<HTMLElement>('#start-backgrounds-panel');
    const cosmeticRewarded = root.querySelector<HTMLElement>('#start-cosmetic-rewarded');
    const cosmeticRewardedName = root.querySelector<HTMLElement>('#start-cosmetic-rewarded-name');
    const cosmeticRewardedMessage = root.querySelector<HTMLElement>('#start-cosmetic-rewarded-message');
    const cosmeticRewardedButton = root.querySelector<HTMLButtonElement>('#start-cosmetic-rewarded-button');
    if (
      !playButton || !settingsToggle || !levelToggle || !settingsPanel || !panel
      || !overdriveButton || !overdriveAssaultButton
      || !musicInput || !sfxInput || !mutedInput || !controlSchemeInput
      || !musicValue || !sfxValue || !bestTime || !bestScore || !mainView
      || !actView || !entryView || !actBack || !entryBack || !radialActButton
      || !angularActButton || !fractureActButton || entryButtons.length !== 3
      || !actStatus || !skinsToggle || !skinsBack || !skinsView
      || !playerSkinsTab || !cannonSkinsTab || !backgroundsTab
      || !metaToggle || !metaBack || !metaView || !retentionToggle || !retentionBack
      || !retentionView || !retentionBody || !playerSkinsView || !cannonSkinsView
      || !backgroundsView
      || !cosmeticRewarded || !cosmeticRewardedName || !cosmeticRewardedMessage
      || !cosmeticRewardedButton
    ) {
      throw new Error('Faltan elementos de la pantalla de inicio');
    }
    this.root = root;
    this.playButton = playButton;
    this.overdriveButton = overdriveButton;
    this.overdriveAssaultButton = overdriveAssaultButton;
    this.settingsToggle = settingsToggle;
    this.levelToggle = levelToggle;
    this.settingsPanel = settingsPanel;
    this.panel = panel;
    this.musicInput = musicInput;
    this.sfxInput = sfxInput;
    this.mutedInput = mutedInput;
    this.controlSchemeInput = controlSchemeInput;
    this.musicValue = musicValue;
    this.sfxValue = sfxValue;
    this.bestTime = bestTime;
    this.bestScore = bestScore;
    this.mainView = mainView;
    this.actView = actView;
    this.entryView = entryView;
    this.actBack = actBack;
    this.entryBack = entryBack;
    this.radialActButton = radialActButton;
    this.angularActButton = angularActButton;
    this.fractureActButton = fractureActButton;
    this.entryButtons = entryButtons;
    this.actStatus = actStatus;
    this.skinsToggle = skinsToggle;
    this.skinsBack = skinsBack;
    this.skinsView = skinsView;
    this.playerSkinsTab = playerSkinsTab;
    this.cannonSkinsTab = cannonSkinsTab;
    this.backgroundsTab = backgroundsTab;
    this.playerSkinsView = playerSkinsView;
    this.cannonSkinsView = cannonSkinsView;
    this.backgroundsView = backgroundsView;
    this.cosmeticRewarded = cosmeticRewarded;
    this.cosmeticRewardedName = cosmeticRewardedName;
    this.cosmeticRewardedMessage = cosmeticRewardedMessage;
    this.cosmeticRewardedButton = cosmeticRewardedButton;
    this.cosmeticDialog = new CosmeticPreviewDialog(root);
    this.skinsPanel = new SkinSelectPanel(playerSkinsView, this.cosmeticDialog);
    this.cannonPanel = new CannonSelectPanel(cannonSkinsView, this.cosmeticDialog);
    this.backgroundPanel = new BackgroundSelectPanel(backgroundsView, this.cosmeticDialog);
    this.metaPanel = new LaboratoryPanel(metaView);
    this.retentionPanel = new RetentionPanel(retentionBody);
    this.retentionToggle = retentionToggle;
    this.retentionBack = retentionBack;
    this.retentionView = retentionView;
    this.retentionBody = retentionBody;
    for (const hostId of ['start-nova-icon', 'start-meta-nova-icon']) {
      const host = root.querySelector<HTMLElement>(`#${hostId}`);
      if (!host) continue;
      host.insertAdjacentHTML('afterbegin', novaSvg);
      const svg = host.querySelector('svg');
      svg?.setAttribute('aria-hidden', 'true');
      svg?.setAttribute('focusable', 'false');
    }
    this.novaValues = Array.from(root.querySelectorAll<HTMLElement>('[data-nova-value]'));
    this.metaToggle = metaToggle;
    this.metaBack = metaBack;
    this.metaView = metaView;
    this.mountScene();
    for (const [button, fallbackUrl] of [
      [radialActButton, radialEmblemFallbackUrl],
      [angularActButton, angularEmblemFallbackUrl],
      [fractureActButton, fractureEmblemFallbackUrl]
    ] as const) {
      const emblem = button?.querySelector<HTMLImageElement>('.act-emblem');
      if (!emblem) continue;
      const restoreEmblem = (): void => { emblem.src = fallbackUrl; };
      emblem.addEventListener('error', restoreEmblem, { once: true });
      if (emblem.complete && emblem.naturalWidth === 0) restoreEmblem();
    }
    const overdriveEmblem = root.querySelector<HTMLImageElement>('#start-overdrive-card .act-emblem');
    if (overdriveEmblem) {
      const restoreEmblem = (): void => { overdriveEmblem.src = overdriveEmblemFallbackUrl; };
      overdriveEmblem.addEventListener('error', restoreEmblem, { once: true });
      if (overdriveEmblem.complete && overdriveEmblem.naturalWidth === 0) restoreEmblem();
    }
    this.playButton.addEventListener('click', () => this.handlePlay());
    this.overdriveButton?.addEventListener('click', () => this.selectOverdriveVariant('normal'));
    this.overdriveAssaultButton?.addEventListener('click', () => this.selectOverdriveVariant('assault'));
    root.querySelector<HTMLButtonElement>('#start-act-play')
      ?.addEventListener('click', () => this.handlePlay());
    this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    this.levelToggle.addEventListener('click', () => this.openActSelector());
    this.actBack.addEventListener('click', () => this.closeActSelector());
    this.entryBack.addEventListener('click', () => this.closeEntrySelector());
    this.radialActButton.addEventListener('click', () => this.selectAct('radial'));
    this.angularActButton.addEventListener('click', () => this.selectAct('angular'));
    this.fractureActButton.addEventListener('click', () => this.selectAct('fracture'));
    for (const button of this.entryButtons) {
      button.addEventListener('click', () => {
        const id = button.dataset.startCalibration;
        if (isCalibrationId(id)) this.selectEntryCalibration(id);
      });
    }
    this.skinsToggle.addEventListener('click', () => this.openSkins());
    this.skinsBack.addEventListener('click', () => this.closeSkins());
    this.playerSkinsTab.addEventListener('click', () => this.selectSkinTab('player'));
    this.cannonSkinsTab.addEventListener('click', () => this.selectSkinTab('cannon'));
    this.backgroundsTab.addEventListener('click', () => this.selectSkinTab('background'));
    this.cosmeticRewardedButton.addEventListener('click', () => { void this.requestCosmeticUnlock(); });
    this.metaToggle.addEventListener('click', () => this.openMeta());
    this.metaBack.addEventListener('click', () => this.closeMeta());
    this.retentionToggle.addEventListener('click', () => this.openRetention());
    this.retentionBack.addEventListener('click', () => this.closeRetention());
    root.querySelector<HTMLButtonElement>('#start-daily-wheel')?.addEventListener('click', event => {
      if (this.dailyWheelOptions) this.dailyWheelDialog.open(this.dailyWheelOptions, event.currentTarget as HTMLElement);
    });
    const wheelIcon = root.querySelector<HTMLElement>('.wheel-entry-icon');
    if (wheelIcon) wheelIcon.style.background = `url("${wheelRimUrl}") center / contain no-repeat`;
    this.musicInput.addEventListener('input', () => this.emitSettings());
    this.sfxInput.addEventListener('input', () => this.emitSettings());
    this.mutedInput.addEventListener('change', () => this.emitSettings());
    this.controlSchemeInput.addEventListener('change', () => this.emitControlScheme());
  }

  public open(options: StartScreenOptions): void {
    this.dailyWheelOptions = options.dailyWheel ?? null;
    this.updateDailyWheelEntry();
    this.updateRetentionEntry(options.retention);
    this.root.dataset.quality = options.quality;
    this.playHandler = options.onPlay;
    this.overdrivePlayHandler = options.onOverdrivePlay ?? null;
    this.overdriveUnlocked = options.overdriveUnlocked === true;
    this.actChangeHandler = options.onActChange;
    this.settingsHandler = options.onSettingsChange;
    this.controlSchemeHandler = options.onControlSchemeChange;
    this.skinStateHandler = options.onSkinStateChange;
    this.cannonSkinStateHandler = options.onCannonSkinStateChange;
    this.backgroundStateHandler = options.onBackgroundStateChange;
    this.walletStateHandler = options.onWalletChange;
    this.laboratoryChangeHandler = options.onLaboratoryChange;
    this.laboratoryVitalityAdHandler = options.onLaboratoryVitalityAd;
    this.laboratoryVitalityAdAvailable = options.laboratoryVitalityAdAvailable;
    this.skinState = options.skins;
    this.updateHomeShip();
    this.cannonSkinState = options.cannonSkins;
    this.backgroundState = options.backgrounds;
    this.wallet = options.wallet;
    this.laboratory = options.laboratory;
    this.unlockedActs = options.unlockedActs;
    this.laboratoryUnlocked = options.unlockedActs.includes('angular');
    this.selectedAct = options.selectedAct;
    this.selectedMode = options.selectedMode ?? 'campaign';
    this.selectedOverdriveVariant = options.selectedOverdriveVariant ?? 'normal';
    if (this.overdriveButton) {
      this.overdriveButton.hidden = this.overdrivePlayHandler === null;
      this.overdriveButton.disabled = options.overdriveUnlocked !== true;
      this.overdriveButton.setAttribute('aria-label', options.overdriveUnlocked === true
        ? 'Seleccionar modo Infinito Overdrive'
        : 'Modo Infinito bloqueado: vence el Acto III');
      this.overdriveButton.title = options.overdriveUnlocked === true
        ? 'Seleccionar Overdrive'
        : 'Derrota al boss del Acto III para desbloquearlo';
    }
    if (this.overdriveAssaultButton) {
      this.overdriveAssaultButton.hidden = this.overdrivePlayHandler === null;
      this.overdriveAssaultButton.disabled = options.overdriveUnlocked !== true;
      this.overdriveAssaultButton.setAttribute('aria-label', options.overdriveUnlocked === true
        ? 'Seleccionar modo Overdrive Asalto'
        : 'Overdrive Asalto bloqueado: vence el Acto III');
      this.overdriveAssaultButton.title = options.overdriveUnlocked === true
        ? 'Oleadas continuas y jefes por bajas'
        : 'Derrota al boss del Acto III para desbloquearlo';
    }
    this.metaToggle.disabled = !this.laboratoryUnlocked;
    this.metaToggle.setAttribute('aria-label', this.laboratoryUnlocked
      ? 'Abrir Laboratorio de mejoras permanentes'
      : 'Laboratorio bloqueado: completa el Acto I para desbloquear el Acto II');
    this.metaToggle.title = this.laboratoryUnlocked
      ? 'Mejoras permanentes que aplican a todos los modos'
      : 'Derrota al boss del Acto I para desbloquear el Laboratorio';
    this.cosmeticUnlockAvailable = options.cosmeticUnlockAvailable;
    this.cosmeticUnlockHandler = options.onCosmeticUnlock;
    this.cosmeticOfferConsumed = false;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.cosmeticTarget = null;
    this.updateNovaValues();
    this.setSettings(options.settings);
    this.setControlScheme(options.controlScheme);
    this.bestTime.textContent = formatTime(options.best.timeSeconds);
    this.bestScore.textContent = String(Math.max(0, Math.floor(options.best.score)));
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.closeMeta();
    this.closeActSelector();
    this.closeEntrySelector();
    this.closeRetention();
    this.retentionPanel.render({
      progress: options.retention,
      edition: options.retentionEdition,
      skinOwned: ownsRewardCosmetic({ skins: options.skins, cannonSkins: options.cannonSkins, backgrounds: options.backgrounds }, options.retentionEdition.reward.id),
      readRewardOwned: id => ownsRewardCosmetic({ skins: this.skinState, cannonSkins: this.cannonSkinState, backgrounds: this.backgroundState }, id),
      walletNova: options.wallet.nova,
      onSelectObjective: options.onRetentionObjectiveSelect,
      readProgress: options.readRetention,
      onClaimObjective: async id => {
        const result = await options.onRetentionObjectiveClaim(id);
        this.wallet = { nova: result.walletNova };
        this.updateNovaValues();
        this.updateRetentionEntry(result.progress);
        return result;
      },
      onStartChallenge: options.onStartRetentionChallenge
    });
    this.updateActSelector();
    this.root.hidden = false;
    const previewNote = this.root.querySelector<HTMLElement>('#reward-preview-note');
    if (previewNote) previewNote.hidden = !options.rewardCatalogPreview;
    if (options.rewardCatalogPreview) {
      this.openSkins();
      this.selectSkinTab('player');
    } else if (options.initialView === 'retention') this.openRetention();
    else this.playButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.dailyWheelDialog.close();
    this.dailyWheelOptions = null;
    this.root.hidden = true;
    this.playHandler = null;
    this.overdrivePlayHandler = null;
    this.overdriveUnlocked = false;
    this.actChangeHandler = null;
    this.settingsHandler = null;
    this.controlSchemeHandler = null;
    this.skinStateHandler = null;
    this.cannonSkinStateHandler = null;
    this.backgroundStateHandler = null;
    this.walletStateHandler = null;
    this.laboratoryChangeHandler = null;
    this.laboratoryVitalityAdHandler = null;
    this.laboratoryVitalityAdAvailable = false;
    this.cosmeticUnlockHandler = null;
    this.cosmeticOfferConsumed = false;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.cosmeticTarget = null;
    this.hideCosmeticOffer();
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.closeMeta();
    this.closeActSelector();
    this.closeEntrySelector();
    this.closeRetention();
    this.retentionPanel.close();
  }

  private updateHomeShip(): void {
    const host = this.root.querySelector<HTMLElement>('#start-mark');
    if (!host || (host.dataset.skin === this.skinState.selected && host.firstElementChild)) return;
    const skin = this.skinState.selected;
    const art = PLAYER_SHIP_RASTER_ART[skin];
    const mark = new Image();
    mark.alt = '';
    mark.className = 'home-mark-image';
    mark.dataset.skin = skin;
    mark.width = art.width;
    mark.height = art.height;
    mark.style.aspectRatio = `${art.width} / ${art.height}`;
    mark.decoding = 'async';
    mark.draggable = false;
    mark.addEventListener('error', () => {
      if (!mark.isConnected) return;
      mark.style.aspectRatio = '1';
      mark.src = startMarkFallbackUrl;
    }, { once: true });
    // One live image, replaced only on equipment changes. A late decode or
    // timeout belongs to the detached old image, never to the newer selection.
    host.replaceChildren(mark);
    host.dataset.skin = skin;
    mark.src = art.url;
    this.homeMarkReady = prepareImage(mark);
    const name = this.root.querySelector<HTMLElement>('#start-equipped-ship');
    if (name) name.textContent = `NAVE EQUIPADA · ${getPlayerSkinDefinition(skin).name}`;
  }

  public syncRewardProfile(profile: { readonly skins: SkinSaveData; readonly cannonSkins: CannonSkinSaveData; readonly backgrounds: BackgroundSaveData; readonly wallet: WalletSaveData }): void {
    this.skinState = profile.skins;
    this.cannonSkinState = profile.cannonSkins;
    this.backgroundState = profile.backgrounds;
    this.wallet = profile.wallet;
    this.updateNovaValues();
    this.updateHomeShip();
    this.updateDailyWheelEntry();
  }

  private updateDailyWheelEntry(): void {
    const label = this.root.querySelector<HTMLElement>('#start-daily-wheel-status');
    if (!label || !this.dailyWheelOptions) return;
    const availability = dailyWheelAvailability(this.dailyWheelOptions.read().progress, Date.now());
    label.textContent = availability.free ? 'GIRO GRATIS DISPONIBLE' : availability.video ? 'GIRO EXTRA CON VIDEO' : 'VUELVE POR TU PRÓXIMO GIRO';
  }

  private updateRetentionEntry(progress: RetentionSaveData): void {
    const button = this.root.querySelector<HTMLButtonElement>('#start-retention');
    const label = this.root.querySelector<HTMLElement>('#start-retention-home-status');
    if (!button || !label) return;
    const claimable = RETENTION_OBJECTIVES.some(objective =>
      getRetentionObjectiveProgress(progress, objective.id).completed
    );
    button.dataset.claimable = String(claimable);
    label.textContent = claimable ? 'PREMIO LISTO · COBRAR' : 'DESAFÍO SEMANAL · OBJETIVOS';
    button.title = claimable
      ? 'Tienes una o más recompensas de objetivos listas para cobrar en la Bitácora'
      : 'Abrir desafíos semanales y objetivos de la Bitácora';
  }

  public async prepareVisibleArt(): Promise<void> {
    // Only the currently selected picture source and equipped ship; never
    // eagerly load the acts, locker or the other portrait/landscape variant.
    await Promise.all([
      this.homeMarkReady,
      ...[...this.root.querySelectorAll<HTMLImageElement>(
        '.home-scene-image, .home-exterior-image'
      )].map(image => prepareImage(image))
    ]);
  }

  private mountScene(): void {
    const host = this.root.querySelector<HTMLElement>('#start-scene');
    if (!host || host.firstElementChild) return;
    // Both static plates share URLs/cache. Picture chooses the appropriate
    // composition before setting src: portrait never first downloads landscape.
    // Only the craft, lights and bounded desktop clouds may move, not the plates.
    for (const [target, imageClass] of [
      [host, 'home-scene-image'],
      [this.root.querySelector<HTMLElement>('#home-exterior'), 'home-exterior-image']
    ] as const) {
      if (!target) continue;
      const picture = document.createElement('picture');
      picture.className = 'home-scene-picture';
      const portrait = document.createElement('source');
      portrait.media = HOME_PORTRAIT_MEDIA;
      portrait.srcset = heroPortraitUrl;
      const scene = document.createElement('img');
      scene.alt = '';
      scene.className = imageClass;
      scene.width = 1200;
      scene.height = 800;
      scene.decoding = 'async';
      scene.addEventListener('error', () => { scene.hidden = true; });
      // Resize may recover from a missing variant; don't leave the next one hidden.
      scene.addEventListener('load', () => { scene.hidden = false; });
      picture.append(portrait, scene);
      target.append(picture);
      scene.src = heroSceneUrl;
    }
    for (let index = 0; index < 4; index += 1) {
      const light = document.createElement('span');
      light.className = 'home-ambient-light';
      host.append(light);
    }
  }

  private toggleSettings(): void {
    if (!this.skinsPanelIsClosed()) this.closeSkins();
    if (!this.metaView.hidden) this.closeMeta();
    if (!this.retentionView.hidden) this.closeRetention();
    this.setSettingsExpanded(this.settingsPanel.hidden);
  }

  private openActSelector(): void {
    if (!this.skinsPanelIsClosed()) this.closeSkins();
    if (!this.metaView.hidden) this.closeMeta();
    if (!this.retentionView.hidden) this.closeRetention();
    this.setSettingsExpanded(false);
    this.closeEntrySelector();
    this.mainView.hidden = true;
    this.actView.hidden = false;
    observeVisibleImages(this.actView);
    prepareActPlates(this.actView);
    this.actView.querySelector<HTMLElement>('.console-body')?.scrollTo(0, 0);
    this.root.classList.add('is-act-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.add('is-act-open');
    this.updateActSelector();
    this.radialActButton.focus({ preventScroll: true });
  }

  private closeActSelector(): void {
    this.actView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-act-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-act-open');
  }

  private closeEntrySelector(): void {
    this.entryView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-entry-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-entry-open');
  }

  private openRetention(): void {
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.closeMeta();
    this.closeActSelector();
    this.closeEntrySelector();
    this.mainView.hidden = true;
    this.retentionView.hidden = false;
    this.retentionBody.scrollTo(0, 0);
    this.root.classList.add('is-retention-mode');
    this.retentionToggle.setAttribute('aria-expanded', 'true');
    this.retentionPanel.setVisible(true);
    this.retentionBack.focus({ preventScroll: true });
  }

  private closeRetention(): void {
    if (this.retentionView.hidden) return;
    this.retentionPanel.setVisible(false);
    this.retentionView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-retention-mode');
    this.retentionToggle.setAttribute('aria-expanded', 'false');
  }

  private handlePlay(): void {
    this.playHandler?.();
  }

  private selectEntryCalibration(id: CalibrationId): void {
    this.playHandler?.(id);
  }

  private selectAct(actId: ActId): void {
    if (!this.unlockedActs.includes(actId)) return;
    this.selectedMode = 'campaign';
    this.selectedAct = actId;
    this.actChangeHandler?.(actId);
    this.updateActSelector();
  }

  private selectOverdriveVariant(variant: OverdriveVariant): void {
    if (!this.overdriveUnlocked || !this.overdrivePlayHandler) return;
    this.overdrivePlayHandler(variant);
    this.selectedMode = 'overdrive';
    this.selectedOverdriveVariant = variant;
    this.updateActSelector();
  }

  private updateActSelector(): void {
    const angularUnlocked = this.unlockedActs.includes('angular');
    const fractureUnlocked = this.unlockedActs.includes('fracture');
    this.radialActButton.classList.toggle('is-selected', this.selectedAct === 'radial');
    this.angularActButton.classList.toggle('is-selected', this.selectedAct === 'angular');
    this.radialActButton.setAttribute('aria-pressed', String(this.selectedAct === 'radial'));
    this.angularActButton.setAttribute('aria-pressed', String(this.selectedAct === 'angular'));
    this.fractureActButton.classList.toggle('is-selected', this.selectedAct === 'fracture');
    this.fractureActButton.setAttribute('aria-pressed', String(this.selectedAct === 'fracture'));
    this.angularActButton.disabled = !angularUnlocked;
    this.angularActButton.setAttribute('aria-label', angularUnlocked ? 'Seleccionar Acto II Angular' : 'Acto II Angular bloqueado');
    this.fractureActButton.disabled = !fractureUnlocked;
    this.fractureActButton.setAttribute('aria-label', fractureUnlocked ? 'Seleccionar Acto III Fracture' : 'Acto III Fracture bloqueado');
    const overdriveAvailable = this.overdrivePlayHandler !== null && this.overdriveUnlocked;
    const overdriveCard = this.root.querySelector<HTMLElement>('#start-overdrive-card');
    if (overdriveCard) overdriveCard.hidden = this.overdrivePlayHandler === null;
    for (const button of [this.overdriveButton, this.overdriveAssaultButton]) {
      if (!button) continue;
      button.hidden = this.overdrivePlayHandler === null;
      button.disabled = !overdriveAvailable;
    }
    const actName = this.selectedAct === 'angular'
      ? 'Acto II · Angular'
      : this.selectedAct === 'fracture' ? 'Acto III · Fracture' : 'Acto I · Radial';
    const lockMessage = !angularUnlocked
      ? ' · Angular se desbloquea al vencer Acto I'
      : !fractureUnlocked ? ' · Fracture se desbloquea al vencer Acto II' : '';
    this.actStatus.textContent = `${actName}${lockMessage}`;
    const overdriveSelected = this.selectedMode === 'overdrive';
    const playRoute = this.root.querySelector<HTMLElement>('#start-play-route');
    const overdriveName = this.selectedOverdriveVariant === 'assault'
      ? 'Infinito · Overdrive Asalto' : 'Infinito · Overdrive';
    if (playRoute) playRoute.textContent = overdriveSelected ? overdriveName : actName;
    if (overdriveSelected) {
      for (const button of [this.radialActButton, this.angularActButton, this.fractureActButton]) {
        button.classList.remove('is-selected');
        button.setAttribute('aria-pressed', 'false');
      }
      this.actStatus.textContent = overdriveName;
    }
    this.overdriveButton?.classList.toggle('is-selected', overdriveSelected && this.selectedOverdriveVariant === 'normal');
    this.overdriveAssaultButton?.classList.toggle('is-selected', overdriveSelected && this.selectedOverdriveVariant === 'assault');
    this.overdriveButton?.setAttribute('aria-pressed', String(overdriveSelected && this.selectedOverdriveVariant === 'normal'));
    this.overdriveAssaultButton?.setAttribute('aria-pressed', String(overdriveSelected && this.selectedOverdriveVariant === 'assault'));
    const start = this.root.querySelector<HTMLButtonElement>('#start-act-play');
    if (start) {
      start.textContent = overdriveSelected
        ? this.selectedOverdriveVariant === 'assault' ? 'INICIAR ASALTO' : 'INICIAR INFINITO'
        : `INICIAR ${actName}`;
      start.disabled = overdriveSelected && !this.overdriveUnlocked;
    }
  }

  private openSkins(): void {
    if (!this.metaView.hidden) this.closeMeta();
    this.setSettingsExpanded(false);
    this.mainView.hidden = true;
    this.skinsView.hidden = false;
    this.root.classList.add('is-skins-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.add('is-skins-open');
    this.selectSkinTab('player');
    this.skinsBack.focus({ preventScroll: true });
  }

  private closeSkins(): void {
    this.cosmeticDialog.close();
    this.skinsPanel.close();
    this.cannonPanel.close();
    this.backgroundPanel.close();
    this.applySkinTab('player');
    this.skinsView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-skins-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-skins-open');
    this.panel.scrollTop = 0;
    this.cosmeticTarget = null;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.hideCosmeticOffer();
  }

  private openMeta(): void {
    if (!this.laboratoryUnlocked || !this.laboratoryChangeHandler || !this.laboratoryVitalityAdHandler) return;
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.mainView.hidden = true;
    this.metaView.hidden = false;
    this.metaView.querySelector<HTMLElement>('.console-body')?.scrollTo(0, 0);
    this.root.classList.add('is-meta-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.add('is-meta-open');
    this.metaPanel.open({
      wallet: this.wallet,
      laboratory: this.laboratory,
      vitalityAdAvailable: this.laboratoryVitalityAdAvailable,
      onPurchase: (laboratory, wallet) => this.onLaboratoryChange(laboratory, wallet),
      onVitalityAd: () => this.onLaboratoryVitalityAd()
    });
    this.metaBack.focus({ preventScroll: true });
  }

  private closeMeta(): void {
    this.metaPanel.close();
    this.metaView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-meta-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-meta-open');
    this.panel.scrollTop = 0;
  }

  private selectSkinTab(tab: 'player' | 'cannon' | 'background'): void {
    this.cosmeticDialog.close();
    this.activeSkinTab = tab;
    this.applySkinTab(tab);
    if (tab === 'cannon') {
      this.cannonPanel.open({
        state: this.cannonSkinState,
        wallet: this.wallet,
        onStateChange: this.onCannonSkinStateChange,
        onWalletChange: (wallet) => this.onWalletChange(wallet),
        onRewardNavigate: source => this.navigateToRewardSource(source)
      });
      this.skinsPanel.close();
      this.backgroundPanel.close();
    } else if (tab === 'background') {
      this.backgroundPanel.open({
        state: this.backgroundState,
        wallet: this.wallet,
        onStateChange: this.onBackgroundStateChange,
        onWalletChange: (wallet) => this.onWalletChange(wallet),
        onRewardNavigate: source => this.navigateToRewardSource(source)
      });
      this.skinsPanel.close();
      this.cannonPanel.close();
    } else {
      this.cannonPanel.close();
      this.backgroundPanel.close();
      this.skinsPanel.open({
        state: this.skinState,
        wallet: this.wallet,
        onStateChange: this.onSkinStateChange,
        onWalletChange: (wallet) => this.onWalletChange(wallet),
        onRewardNavigate: source => this.navigateToRewardSource(source)
      });
    }
    this.updateCosmeticOffer();
  }

  private applySkinTab(tab: 'player' | 'cannon' | 'background'): void {
    const body = this.skinsView.querySelector<HTMLElement>('.console-body');
    if (body) body.scrollTop = 0;
    const offerDetails = this.cosmeticRewarded.querySelector('details');
    if (offerDetails) offerDetails.open = false;
    const cannon = tab === 'cannon';
    const background = tab === 'background';
    this.playerSkinsTab.classList.toggle('is-active', !cannon && !background);
    this.cannonSkinsTab.classList.toggle('is-active', cannon);
    this.backgroundsTab.classList.toggle('is-active', background);
    this.playerSkinsTab.setAttribute('aria-selected', String(!cannon && !background));
    this.cannonSkinsTab.setAttribute('aria-selected', String(cannon));
    this.backgroundsTab.setAttribute('aria-selected', String(background));
    this.playerSkinsTab.tabIndex = !cannon && !background ? 0 : -1;
    this.cannonSkinsTab.tabIndex = cannon ? 0 : -1;
    this.backgroundsTab.tabIndex = background ? 0 : -1;
    this.cannonSkinsView.hidden = !cannon;
    this.playerSkinsView.hidden = cannon || background;
    this.backgroundsView.hidden = !background;
  }

  private navigateToRewardSource(source: RewardCosmeticSource): void {
    if (source === 'weekly-logbook') {
      this.openRetention();
      return;
    }
    this.closeSkins();
    if (!this.dailyWheelOptions) return;
    const opener = this.root.querySelector<HTMLElement>('#start-daily-wheel') ?? this.skinsToggle;
    this.dailyWheelDialog.open(this.dailyWheelOptions, opener);
  }

  private skinsPanelIsClosed(): boolean {
    const view = this.root.querySelector<HTMLElement>('#start-skins-view');
    return view?.hidden ?? true;
  }

  private onWalletChange(wallet: WalletSaveData): void {
    this.wallet = wallet;
    const formatted = formatNova(wallet.nova);
    for (const value of this.novaValues) value.textContent = formatted;
    this.walletStateHandler?.(wallet);
    this.updateCosmeticOffer();
  }

  private onLaboratoryChange(laboratory: LaboratorySaveData, wallet: WalletSaveData): boolean {
    if (this.laboratoryChangeHandler?.(laboratory, wallet) !== true) return false;
    this.laboratory = laboratory;
    this.wallet = wallet;
    const formatted = formatNova(wallet.nova);
    for (const value of this.novaValues) value.textContent = formatted;
    return true;
  }

  private async onLaboratoryVitalityAd(): Promise<{ readonly result: RewardedAdResult; readonly laboratory?: LaboratorySaveData }> {
    const response = await this.laboratoryVitalityAdHandler?.();
    if (response?.laboratory) this.laboratory = response.laboratory;
    return response ?? { result: 'unavailable' };
  }

  private updateCosmeticOffer(): void {
    if (
      this.skinsView.hidden
      || !this.cosmeticUnlockAvailable || this.cosmeticOfferConsumed || this.cosmeticRequestPending
    ) {
      if (!this.cosmeticRequestPending) this.hideCosmeticOffer();
      return;
    }
    const target = this.findCosmeticTarget();
    this.cosmeticTarget = target;
    if (!target) {
      this.hideCosmeticOffer();
      return;
    }
    this.cosmeticRewarded.dataset.state = 'ready';
    this.cosmeticRewarded.hidden = false;
    this.cosmeticRewardedName.textContent = target.name;
    this.cosmeticRewardedMessage.textContent = `Mira un anuncio para desbloquear y equipar este cosmético, o cómpralo por ${formatNova(target.priceNova)} NOVA.`;
    this.cosmeticRewardedButton.hidden = false;
    this.cosmeticRewardedButton.disabled = false;
    this.cosmeticRewardedButton.textContent = 'Ver anuncio · desbloquear';
  }

  private findCosmeticTarget(): CosmeticUnlockTarget | null {
    if (this.activeSkinTab === 'player') {
      const definition = PLAYER_SKIN_DEFINITIONS.find((candidate) => candidate.acquisition === 'nova'
        && !this.skinState.unlocked.includes(candidate.id) && candidate.priceNova > 0);
      return definition ? { kind: 'player', id: definition.id, name: definition.name, priceNova: definition.priceNova } : null;
    }
    if (this.activeSkinTab === 'cannon') {
      const definition = CANNON_SKIN_DEFINITIONS.find((candidate) => !this.cannonSkinState.unlocked.includes(candidate.id) && candidate.priceNova > 0);
      return definition ? { kind: 'cannon', id: definition.id, name: definition.name, priceNova: definition.priceNova } : null;
    }
    const definition = BACKGROUND_DEFINITIONS.find((candidate) => !this.backgroundState.unlocked.includes(candidate.id) && candidate.priceNova > 0);
    return definition ? { kind: 'background', id: definition.id, name: definition.name, priceNova: definition.priceNova } : null;
  }

  private async requestCosmeticUnlock(): Promise<void> {
    const target = this.cosmeticTarget;
    const handler = this.cosmeticUnlockHandler;
    if (!target || !handler || this.cosmeticRequestPending) return;
    const requestToken = ++this.cosmeticRequestToken;
    this.cosmeticRequestPending = true;
    this.cosmeticRewarded.dataset.state = 'pending';
    this.cosmeticRewardedMessage.textContent = 'Cargando recompensa...';
    this.cosmeticRewardedButton.disabled = true;
    this.cosmeticRewardedButton.textContent = 'Anuncio en curso';
    const result = await handler(target);
    if (requestToken !== this.cosmeticRequestToken) return;
    this.cosmeticRequestPending = false;
    if (result === 'rewarded') {
      this.cosmeticOfferConsumed = true;
      this.applyCosmeticUnlock(target);
      this.cosmeticRewarded.dataset.state = 'success';
      this.cosmeticRewarded.hidden = false;
      this.cosmeticRewardedMessage.textContent = `${target.name} desbloqueado y equipado.`;
      this.cosmeticRewardedButton.hidden = true;
      this.cosmeticTarget = null;
      return;
    }
    this.cosmeticRewarded.dataset.state = result;
    if (result === 'unavailable') this.cosmeticUnlockAvailable = false;
    this.cosmeticRewardedMessage.textContent = result === 'dismissed'
      ? 'Anuncio cancelado. Puedes intentarlo otra vez o comprar con NOVA.'
      : result === 'unavailable'
        ? 'Anuncio no disponible. Compra el cosmético con NOVA.'
        : 'No se pudo completar el anuncio. Puedes reintentarlo o comprar con NOVA.';
    this.cosmeticRewardedButton.hidden = result === 'unavailable';
    this.cosmeticRewardedButton.disabled = result === 'unavailable';
    this.cosmeticRewardedButton.textContent = 'Reintentar · desbloquear';
  }

  private applyCosmeticUnlock(target: CosmeticUnlockTarget): void {
    if (target.kind === 'player') {
      this.skinState = {
        selected: target.id,
        unlocked: Array.from(new Set<PlayerSkinId>([...this.skinState.unlocked, target.id]))
      };
      this.onSkinStateChange(this.skinState);
    } else if (target.kind === 'cannon') {
      this.cannonSkinState = {
        selected: target.id,
        unlocked: Array.from(new Set<CannonSkinId>([...this.cannonSkinState.unlocked, target.id]))
      };
      this.onCannonSkinStateChange(this.cannonSkinState);
    } else {
      this.backgroundState = {
        selected: target.id,
        unlocked: Array.from(new Set<BackgroundId>([...this.backgroundState.unlocked, target.id]))
      };
      this.onBackgroundStateChange(this.backgroundState);
    }
    this.selectSkinTab(this.activeSkinTab);
  }

  private hideCosmeticOffer(): void {
    this.cosmeticRewarded.hidden = true;
    this.cosmeticRewarded.dataset.state = 'hidden';
    this.cosmeticRewardedName.textContent = '';
    this.cosmeticRewardedMessage.textContent = '';
    this.cosmeticRewardedButton.hidden = true;
    this.cosmeticRewardedButton.disabled = true;
  }

  private updateNovaValues(): void {
    const formatted = formatNova(this.wallet.nova);
    for (const value of this.novaValues) value.textContent = formatted;
  }

  private setSettingsExpanded(expanded: boolean): void {
    this.settingsPanel.hidden = !expanded;
    this.settingsToggle.setAttribute('aria-expanded', String(expanded));
  }

  private setSettings(settings: AudioSettings): void {
    this.musicInput.value = String(Math.round(settings.musicVolume * 100));
    this.sfxInput.value = String(Math.round(settings.sfxVolume * 100));
    this.mutedInput.checked = settings.muted;
    this.updateVolumeLabels();
  }

  private setControlScheme(controlScheme: ControlScheme): void {
    this.controlSchemeInput.value = normalizeControlScheme(controlScheme);
  }

  private emitSettings(): void {
    this.updateVolumeLabels();
    this.settingsHandler?.({
      musicVolume: this.readVolume(this.musicInput),
      sfxVolume: this.readVolume(this.sfxInput),
      muted: this.mutedInput.checked
    });
  }

  private emitControlScheme(): void {
    const value = this.controlSchemeInput.value;
    if (isControlScheme(value)) {
      this.controlSchemeHandler?.(value);
    }
  }

  private updateVolumeLabels(): void {
    this.musicValue.value = `${Math.round(this.readVolume(this.musicInput) * 100)}%`;
    this.sfxValue.value = `${Math.round(this.readVolume(this.sfxInput) * 100)}%`;
  }

  private readVolume(input: HTMLInputElement): number {
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value / 100)) : 1;
  }
}
