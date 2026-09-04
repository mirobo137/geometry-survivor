import type { AudioSettings } from '../audio/AudioService';
import heroSceneSvg from '../assets/svg/ui/start/hero-scene.svg?raw';
import startMarkSvg from '../assets/svg/ui/start/mark.svg?raw';
import type { BackgroundSaveData, CannonSkinSaveData, MetaUpgradeSaveData, SkinSaveData, WalletSaveData } from '../platform/save/SaveStore';
import { formatNova } from '../content/meta/EconomyDefinitions';
import novaSvg from '../assets/svg/ui/nova.svg?raw';
import { PLAYER_SKIN_DEFINITIONS } from '../content/visual/SkinDefinitions';
import { CANNON_SKIN_DEFINITIONS } from '../content/visual/CannonSkinDefinitions';
import { BACKGROUND_DEFINITIONS } from '../content/visual/BackgroundDefinitions';
import type { PlayerSkinId } from '../content/visual/VisualTokens';
import type { CannonSkinId } from '../content/visual/CannonSkinDefinitions';
import type { BackgroundId } from '../content/visual/BackgroundDefinitions';
import { SkinSelectPanel } from './skins/SkinSelectPanel';
import { CannonSelectPanel } from './skins/CannonSelectPanel';
import { BackgroundSelectPanel } from './skins/BackgroundSelectPanel';
import { MetaProgressionPanel } from './meta/MetaProgressionPanel';

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
  readonly best: StartScreenBest;
  readonly skins: SkinSaveData;
  readonly cannonSkins: CannonSkinSaveData;
  readonly backgrounds: BackgroundSaveData;
  readonly wallet: WalletSaveData;
  readonly metaUpgrades: MetaUpgradeSaveData;
  readonly onPlay: () => void;
  readonly onSettingsChange: (settings: AudioSettings) => void;
  readonly onSkinStateChange: (state: SkinSaveData) => void;
  readonly onCannonSkinStateChange: (state: CannonSkinSaveData) => void;
  readonly onBackgroundStateChange: (state: BackgroundSaveData) => void;
  readonly onWalletChange: (wallet: WalletSaveData) => void;
  readonly onMetaUpgradesChange: (upgrades: MetaUpgradeSaveData) => void;
  readonly cosmeticUnlockAvailable: boolean;
  readonly onCosmeticUnlock: (target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>;
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

/** Presentation-only home screen. It owns no run or progression state. */
export class StartScreen {
  private readonly root: HTMLElement;
  private readonly playButton: HTMLButtonElement;
  private readonly settingsToggle: HTMLButtonElement;
  private readonly settingsPanel: HTMLElement;
  private readonly musicInput: HTMLInputElement;
  private readonly sfxInput: HTMLInputElement;
  private readonly mutedInput: HTMLInputElement;
  private readonly musicValue: HTMLOutputElement;
  private readonly sfxValue: HTMLOutputElement;
  private readonly bestTime: HTMLElement;
  private readonly bestScore: HTMLElement;
  private readonly mainView: HTMLElement;
  private readonly skinsToggle: HTMLButtonElement;
  private readonly skinsBack: HTMLButtonElement;
  private readonly skinsPanel: SkinSelectPanel;
  private readonly cannonPanel: CannonSelectPanel;
  private readonly backgroundPanel: BackgroundSelectPanel;
  private readonly metaPanel: MetaProgressionPanel;
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
  private playHandler: (() => void) | null = null;
  private settingsHandler: ((settings: AudioSettings) => void) | null = null;
  private skinStateHandler: ((state: SkinSaveData) => void) | null = null;
  private skinState: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private cannonSkinState: CannonSkinSaveData = { selected: 'basic', unlocked: ['basic'] };
  private backgroundState: BackgroundSaveData = { selected: 'deep-space', unlocked: ['deep-space'] };
  private wallet: WalletSaveData = { nova: 0 };
  private metaUpgrades: MetaUpgradeSaveData = { levels: {} };
  private cosmeticUnlockAvailable = false;
  private cosmeticUnlockHandler: ((target: CosmeticUnlockTarget) => Promise<CosmeticUnlockResult>) | null = null;
  private cosmeticOfferConsumed = false;
  private cosmeticRequestPending = false;
  private cosmeticRequestToken = 0;
  private activeSkinTab: 'player' | 'cannon' | 'background' = 'player';
  private cosmeticTarget: CosmeticUnlockTarget | null = null;

  private readonly onSkinStateChange = (state: SkinSaveData): void => {
    this.skinState = state;
    this.skinStateHandler?.(state);
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
  private metaUpgradesHandler: ((upgrades: MetaUpgradeSaveData) => void) | null = null;

  public constructor(root: HTMLElement) {
    const playButton = root.querySelector<HTMLButtonElement>('#start-play');
    const settingsToggle = root.querySelector<HTMLButtonElement>('#start-settings-toggle');
    const settingsPanel = root.querySelector<HTMLElement>('#start-settings');
    const musicInput = root.querySelector<HTMLInputElement>('#start-music');
    const sfxInput = root.querySelector<HTMLInputElement>('#start-sfx');
    const mutedInput = root.querySelector<HTMLInputElement>('#start-muted');
    const musicValue = root.querySelector<HTMLOutputElement>('#start-music-value');
    const sfxValue = root.querySelector<HTMLOutputElement>('#start-sfx-value');
    const bestTime = root.querySelector<HTMLElement>('#start-best-time');
    const bestScore = root.querySelector<HTMLElement>('#start-best-score');
    const mainView = root.querySelector<HTMLElement>('#start-main-view');
    const skinsToggle = root.querySelector<HTMLButtonElement>('#start-skins');
    const skinsBack = root.querySelector<HTMLButtonElement>('#start-skins-back');
    const skinsView = root.querySelector<HTMLElement>('#start-skins-view');
    const playerSkinsTab = root.querySelector<HTMLButtonElement>('#start-player-skins-tab');
    const cannonSkinsTab = root.querySelector<HTMLButtonElement>('#start-cannon-skins-tab');
    const backgroundsTab = root.querySelector<HTMLButtonElement>('#start-backgrounds-tab');
    const metaToggle = root.querySelector<HTMLButtonElement>('#start-meta');
    const metaBack = root.querySelector<HTMLButtonElement>('#start-meta-back');
    const metaView = root.querySelector<HTMLElement>('#start-meta-view');
    const playerSkinsView = root.querySelector<HTMLElement>('#start-player-skins-panel');
    const cannonSkinsView = root.querySelector<HTMLElement>('#start-cannon-skins-panel');
    const backgroundsView = root.querySelector<HTMLElement>('#start-backgrounds-panel');
    const cosmeticRewarded = root.querySelector<HTMLElement>('#start-cosmetic-rewarded');
    const cosmeticRewardedName = root.querySelector<HTMLElement>('#start-cosmetic-rewarded-name');
    const cosmeticRewardedMessage = root.querySelector<HTMLElement>('#start-cosmetic-rewarded-message');
    const cosmeticRewardedButton = root.querySelector<HTMLButtonElement>('#start-cosmetic-rewarded-button');
    if (!playButton || !settingsToggle || !settingsPanel || !musicInput || !sfxInput || !mutedInput || !musicValue || !sfxValue || !bestTime || !bestScore || !mainView || !skinsToggle || !skinsBack || !skinsView || !playerSkinsTab || !cannonSkinsTab || !backgroundsTab || !metaToggle || !metaBack || !metaView || !playerSkinsView || !cannonSkinsView || !backgroundsView || !cosmeticRewarded || !cosmeticRewardedName || !cosmeticRewardedMessage || !cosmeticRewardedButton) {
      throw new Error('Faltan elementos de la pantalla de inicio');
    }
    this.root = root;
    this.playButton = playButton;
    this.settingsToggle = settingsToggle;
    this.settingsPanel = settingsPanel;
    this.musicInput = musicInput;
    this.sfxInput = sfxInput;
    this.mutedInput = mutedInput;
    this.musicValue = musicValue;
    this.sfxValue = sfxValue;
    this.bestTime = bestTime;
    this.bestScore = bestScore;
    this.mainView = mainView;
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
    this.skinsPanel = new SkinSelectPanel(playerSkinsView);
    this.cannonPanel = new CannonSelectPanel(cannonSkinsView);
    this.backgroundPanel = new BackgroundSelectPanel(backgroundsView);
    this.metaPanel = new MetaProgressionPanel(metaView);
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
    this.mountMark();
    this.playButton.addEventListener('click', () => this.playHandler?.());
    this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    this.skinsToggle.addEventListener('click', () => this.openSkins());
    this.skinsBack.addEventListener('click', () => this.closeSkins());
    this.playerSkinsTab.addEventListener('click', () => this.selectSkinTab('player'));
    this.cannonSkinsTab.addEventListener('click', () => this.selectSkinTab('cannon'));
    this.backgroundsTab.addEventListener('click', () => this.selectSkinTab('background'));
    this.cosmeticRewardedButton.addEventListener('click', () => { void this.requestCosmeticUnlock(); });
    this.metaToggle.addEventListener('click', () => this.openMeta());
    this.metaBack.addEventListener('click', () => this.closeMeta());
    this.musicInput.addEventListener('input', () => this.emitSettings());
    this.sfxInput.addEventListener('input', () => this.emitSettings());
    this.mutedInput.addEventListener('change', () => this.emitSettings());
  }

  public open(options: StartScreenOptions): void {
    this.playHandler = options.onPlay;
    this.settingsHandler = options.onSettingsChange;
    this.skinStateHandler = options.onSkinStateChange;
    this.cannonSkinStateHandler = options.onCannonSkinStateChange;
    this.backgroundStateHandler = options.onBackgroundStateChange;
    this.walletStateHandler = options.onWalletChange;
    this.metaUpgradesHandler = options.onMetaUpgradesChange;
    this.skinState = options.skins;
    this.cannonSkinState = options.cannonSkins;
    this.backgroundState = options.backgrounds;
    this.wallet = options.wallet;
    this.metaUpgrades = options.metaUpgrades;
    this.cosmeticUnlockAvailable = options.cosmeticUnlockAvailable;
    this.cosmeticUnlockHandler = options.onCosmeticUnlock;
    this.cosmeticOfferConsumed = false;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.cosmeticTarget = null;
    this.updateNovaValues();
    this.setSettings(options.settings);
    this.bestTime.textContent = formatTime(options.best.timeSeconds);
    this.bestScore.textContent = String(Math.max(0, Math.floor(options.best.score)));
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.closeMeta();
    this.root.hidden = false;
    this.playButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.root.hidden = true;
    this.playHandler = null;
    this.settingsHandler = null;
    this.skinStateHandler = null;
    this.cannonSkinStateHandler = null;
    this.backgroundStateHandler = null;
    this.walletStateHandler = null;
    this.metaUpgradesHandler = null;
    this.cosmeticUnlockHandler = null;
    this.cosmeticOfferConsumed = false;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.cosmeticTarget = null;
    this.hideCosmeticOffer();
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.closeMeta();
  }

  private mountMark(): void {
    const host = this.root.querySelector<HTMLElement>('#start-mark');
    if (!host || host.firstElementChild) return;
    host.insertAdjacentHTML('afterbegin', startMarkSvg);
    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  }

  private mountScene(): void {
    const host = this.root.querySelector<HTMLElement>('#start-scene');
    if (!host || host.firstElementChild) return;
    host.insertAdjacentHTML('afterbegin', heroSceneSvg);
    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  }

  private toggleSettings(): void {
    if (!this.skinsPanelIsClosed()) this.closeSkins();
    if (!this.metaView.hidden) this.closeMeta();
    this.setSettingsExpanded(this.settingsPanel.hidden);
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
    this.skinsPanel.close();
    this.cannonPanel.close();
    this.backgroundPanel.close();
    this.applySkinTab('player');
    this.skinsView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-skins-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-skins-open');
    this.cosmeticTarget = null;
    this.cosmeticRequestPending = false;
    this.cosmeticRequestToken += 1;
    this.hideCosmeticOffer();
  }

  private openMeta(): void {
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.mainView.hidden = true;
    this.metaView.hidden = false;
    this.root.classList.add('is-meta-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.add('is-meta-open');
    this.metaPanel.open({
      wallet: this.wallet,
      upgrades: this.metaUpgrades,
      onWalletChange: (wallet) => this.onWalletChange(wallet),
      onUpgradesChange: (upgrades) => this.onMetaUpgradesChange(upgrades)
    });
    this.metaBack.focus({ preventScroll: true });
  }

  private closeMeta(): void {
    this.metaPanel.close();
    this.metaView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-meta-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-meta-open');
  }

  private selectSkinTab(tab: 'player' | 'cannon' | 'background'): void {
    this.activeSkinTab = tab;
    this.applySkinTab(tab);
    if (tab === 'cannon') {
      this.cannonPanel.open({
        state: this.cannonSkinState,
        wallet: this.wallet,
        onStateChange: this.onCannonSkinStateChange,
        onWalletChange: (wallet) => this.onWalletChange(wallet)
      });
      this.skinsPanel.close();
      this.backgroundPanel.close();
    } else if (tab === 'background') {
      this.backgroundPanel.open({
        state: this.backgroundState,
        wallet: this.wallet,
        onStateChange: this.onBackgroundStateChange,
        onWalletChange: (wallet) => this.onWalletChange(wallet)
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
        onWalletChange: (wallet) => this.onWalletChange(wallet)
      });
    }
    this.updateCosmeticOffer();
  }

  private applySkinTab(tab: 'player' | 'cannon' | 'background'): void {
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

  private onMetaUpgradesChange(upgrades: MetaUpgradeSaveData): void {
    this.metaUpgrades = upgrades;
    this.metaUpgradesHandler?.(upgrades);
  }

  private updateCosmeticOffer(): void {
    if (this.skinsView.hidden || !this.cosmeticUnlockAvailable || this.cosmeticOfferConsumed || this.cosmeticRequestPending) {
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
    this.cosmeticRewardedMessage.textContent = `Desbloquea y equipa este cosmÃ©tico gratis, o cÃ³mpralo por ${formatNova(target.priceNova)} NOVA.`;
    this.cosmeticRewardedButton.hidden = false;
    this.cosmeticRewardedButton.disabled = false;
    this.cosmeticRewardedButton.textContent = 'Ver anuncio Â· desbloquear';
  }

  private findCosmeticTarget(): CosmeticUnlockTarget | null {
    if (this.activeSkinTab === 'player') {
      const definition = PLAYER_SKIN_DEFINITIONS.find((candidate) => !this.skinState.unlocked.includes(candidate.id) && candidate.priceNova > 0);
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
        ? 'Anuncio no disponible. Compra el cosmÃ©tico con NOVA.'
        : 'No se pudo completar el anuncio. Puedes reintentarlo o comprar con NOVA.';
    this.cosmeticRewardedButton.hidden = result === 'unavailable';
    this.cosmeticRewardedButton.disabled = result === 'unavailable';
    this.cosmeticRewardedButton.textContent = 'Reintentar Â· desbloquear';
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

  private emitSettings(): void {
    this.updateVolumeLabels();
    this.settingsHandler?.({
      musicVolume: this.readVolume(this.musicInput),
      sfxVolume: this.readVolume(this.sfxInput),
      muted: this.mutedInput.checked
    });
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
