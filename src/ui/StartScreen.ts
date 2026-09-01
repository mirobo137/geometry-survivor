import type { AudioSettings } from '../audio/AudioService';
import heroSceneSvg from '../assets/svg/ui/start/hero-scene.svg?raw';
import startMarkSvg from '../assets/svg/ui/start/mark.svg?raw';
import type { CannonSkinSaveData, SkinSaveData } from '../platform/save/SaveStore';
import { SkinSelectPanel } from './skins/SkinSelectPanel';
import { CannonSelectPanel } from './skins/CannonSelectPanel';

export interface StartScreenBest {
  readonly timeSeconds: number;
  readonly score: number;
}

export interface StartScreenOptions {
  readonly settings: AudioSettings;
  readonly best: StartScreenBest;
  readonly skins: SkinSaveData;
  readonly cannonSkins: CannonSkinSaveData;
  readonly onPlay: () => void;
  readonly onSettingsChange: (settings: AudioSettings) => void;
  readonly onSkinStateChange: (state: SkinSaveData) => void;
  readonly onCannonSkinStateChange: (state: CannonSkinSaveData) => void;
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
  private readonly skinsView: HTMLElement;
  private readonly playerSkinsTab: HTMLButtonElement;
  private readonly cannonSkinsTab: HTMLButtonElement;
  private readonly cannonSkinsView: HTMLElement;
  private readonly playerPreviewStage: HTMLElement;
  private readonly playerCards: HTMLElement;
  private readonly playerFootnote: HTMLElement | null;
  private playHandler: (() => void) | null = null;
  private settingsHandler: ((settings: AudioSettings) => void) | null = null;
  private skinStateHandler: ((state: SkinSaveData) => void) | null = null;
  private skinState: SkinSaveData = { selected: 'cyan', unlocked: ['cyan'] };
  private cannonSkinState: CannonSkinSaveData = { selected: 'basic', unlocked: ['basic'] };

  private readonly onSkinStateChange = (state: SkinSaveData): void => {
    this.skinState = state;
    this.skinStateHandler?.(state);
  };

  private readonly onCannonSkinStateChange = (state: CannonSkinSaveData): void => {
    this.cannonSkinState = state;
    this.cannonSkinStateHandler?.(state);
  };
  private cannonSkinStateHandler: ((state: CannonSkinSaveData) => void) | null = null;

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
    const cannonSkinsView = root.querySelector<HTMLElement>('#start-cannon-skins-panel');
    const playerPreviewStage = root.querySelector<HTMLElement>('.player-skin-preview-stage');
    const playerCards = root.querySelector<HTMLElement>('#start-skin-cards');
    if (!playButton || !settingsToggle || !settingsPanel || !musicInput || !sfxInput || !mutedInput || !musicValue || !sfxValue || !bestTime || !bestScore || !mainView || !skinsToggle || !skinsBack || !skinsView || !playerSkinsTab || !cannonSkinsTab || !cannonSkinsView || !playerPreviewStage || !playerCards) {
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
    this.cannonSkinsView = cannonSkinsView;
    this.playerPreviewStage = playerPreviewStage;
    this.playerCards = playerCards;
    this.playerFootnote = playerCards.nextElementSibling instanceof HTMLElement ? playerCards.nextElementSibling : null;
    this.skinsPanel = new SkinSelectPanel(skinsView);
    this.cannonPanel = new CannonSelectPanel(skinsView);
    // Keep the cannon tab panel after the player collection in document order;
    // this also lets the existing player cards remain the single scroll body.
    skinsView.append(this.cannonSkinsView);
    this.mountScene();
    this.mountMark();
    this.playButton.addEventListener('click', () => this.playHandler?.());
    this.settingsToggle.addEventListener('click', () => this.toggleSettings());
    this.skinsToggle.addEventListener('click', () => this.openSkins());
    this.skinsBack.addEventListener('click', () => this.closeSkins());
    this.playerSkinsTab.addEventListener('click', () => this.selectSkinTab('player'));
    this.cannonSkinsTab.addEventListener('click', () => this.selectSkinTab('cannon'));
    this.musicInput.addEventListener('input', () => this.emitSettings());
    this.sfxInput.addEventListener('input', () => this.emitSettings());
    this.mutedInput.addEventListener('change', () => this.emitSettings());
  }

  public open(options: StartScreenOptions): void {
    this.playHandler = options.onPlay;
    this.settingsHandler = options.onSettingsChange;
    this.skinStateHandler = options.onSkinStateChange;
    this.cannonSkinStateHandler = options.onCannonSkinStateChange;
    this.skinState = options.skins;
    this.cannonSkinState = options.cannonSkins;
    this.setSettings(options.settings);
    this.bestTime.textContent = formatTime(options.best.timeSeconds);
    this.bestScore.textContent = String(Math.max(0, Math.floor(options.best.score)));
    this.setSettingsExpanded(false);
    this.closeSkins();
    this.root.hidden = false;
    this.playButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.root.hidden = true;
    this.playHandler = null;
    this.settingsHandler = null;
    this.skinStateHandler = null;
    this.cannonSkinStateHandler = null;
    this.setSettingsExpanded(false);
    this.closeSkins();
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
    this.setSettingsExpanded(this.settingsPanel.hidden);
  }

  private openSkins(): void {
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
    this.applySkinTab('player');
    this.skinsView.hidden = true;
    this.mainView.hidden = false;
    this.root.classList.remove('is-skins-mode');
    this.root.querySelector<HTMLElement>('.start-screen-panel')?.classList.remove('is-skins-open');
  }

  private selectSkinTab(tab: 'player' | 'cannon'): void {
    this.applySkinTab(tab);
    if (tab === 'cannon') {
      this.cannonPanel.open({ state: this.cannonSkinState, onStateChange: this.onCannonSkinStateChange });
      this.skinsPanel.close();
    } else {
      this.cannonPanel.close();
      this.skinsPanel.open({ state: this.skinState, onStateChange: this.onSkinStateChange });
    }
  }

  private applySkinTab(tab: 'player' | 'cannon'): void {
    const cannon = tab === 'cannon';
    this.playerSkinsTab.classList.toggle('is-active', !cannon);
    this.cannonSkinsTab.classList.toggle('is-active', cannon);
    this.playerSkinsTab.setAttribute('aria-selected', String(!cannon));
    this.cannonSkinsTab.setAttribute('aria-selected', String(cannon));
    this.playerSkinsTab.tabIndex = cannon ? -1 : 0;
    this.cannonSkinsTab.tabIndex = cannon ? 0 : -1;
    this.cannonSkinsView.hidden = !cannon;
    this.playerPreviewStage.hidden = cannon;
    this.playerCards.hidden = cannon;
    if (this.playerFootnote) this.playerFootnote.hidden = cannon;
  }

  private skinsPanelIsClosed(): boolean {
    const view = this.root.querySelector<HTMLElement>('#start-skins-view');
    return view?.hidden ?? true;
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
