import type { AudioSettings } from '../audio/AudioService';
import heroSceneSvg from '../assets/svg/ui/start/hero-scene.svg?raw';
import startMarkSvg from '../assets/svg/ui/start/mark.svg?raw';
import type { BackgroundSaveData, CannonSkinSaveData, MetaUpgradeSaveData, SkinSaveData, WalletSaveData } from '../platform/save/SaveStore';
import { formatNova } from '../content/meta/EconomyDefinitions';
import novaSvg from '../assets/svg/ui/nova.svg?raw';
import { SkinSelectPanel } from './skins/SkinSelectPanel';
import { CannonSelectPanel } from './skins/CannonSelectPanel';
import { BackgroundSelectPanel } from './skins/BackgroundSelectPanel';
import { MetaProgressionPanel } from './meta/MetaProgressionPanel';

export interface StartScreenBest {
  readonly timeSeconds: number;
  readonly score: number;
}

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
  private playHandler: (() => void) | null = null;
  private settingsHandler: ((settings: AudioSettings) => void) | null = null;
  private skinStateHandler: ((state: SkinSaveData) => void) | null = null;
  private skinState: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private cannonSkinState: CannonSkinSaveData = { selected: 'basic', unlocked: ['basic'] };
  private backgroundState: BackgroundSaveData = { selected: 'deep-space', unlocked: ['deep-space'] };
  private wallet: WalletSaveData = { nova: 0 };
  private metaUpgrades: MetaUpgradeSaveData = { levels: {} };

  private readonly onSkinStateChange = (state: SkinSaveData): void => {
    this.skinState = state;
    this.skinStateHandler?.(state);
  };

  private readonly onCannonSkinStateChange = (state: CannonSkinSaveData): void => {
    this.cannonSkinState = state;
    this.cannonSkinStateHandler?.(state);
  };
  private readonly onBackgroundStateChange = (state: BackgroundSaveData): void => {
    this.backgroundState = state;
    this.backgroundStateHandler?.(state);
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
    if (!playButton || !settingsToggle || !settingsPanel || !musicInput || !sfxInput || !mutedInput || !musicValue || !sfxValue || !bestTime || !bestScore || !mainView || !skinsToggle || !skinsBack || !skinsView || !playerSkinsTab || !cannonSkinsTab || !backgroundsTab || !metaToggle || !metaBack || !metaView || !playerSkinsView || !cannonSkinsView || !backgroundsView) {
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
  }

  private onMetaUpgradesChange(upgrades: MetaUpgradeSaveData): void {
    this.metaUpgrades = upgrades;
    this.metaUpgradesHandler?.(upgrades);
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
