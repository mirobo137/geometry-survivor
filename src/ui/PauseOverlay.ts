import type { AudioSettings } from '../audio/AudioService';

export type ResumeHandler = () => void;
export type RestartHandler = () => void;
export type ReturnToMenuHandler = () => void;
export type SettingsChangeHandler = (settings: AudioSettings) => void;

export interface PauseActions {
  readonly settings?: AudioSettings;
  readonly onSettingsChange?: SettingsChangeHandler;
  readonly onRestart?: RestartHandler;
  readonly onReturnToMenu?: ReturnToMenuHandler;
}

export class PauseOverlay {
  private readonly root: HTMLElement;
  private readonly messageElement: HTMLElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly settingsToggle: HTMLButtonElement | null;
  private readonly settingsPanel: HTMLElement | null;
  private readonly musicInput: HTMLInputElement | null;
  private readonly sfxInput: HTMLInputElement | null;
  private readonly mutedInput: HTMLInputElement | null;
  private readonly musicValue: HTMLOutputElement | null;
  private readonly sfxValue: HTMLOutputElement | null;
  private readonly restartButton: HTMLButtonElement | null;
  private readonly menuButton: HTMLButtonElement | null;
  private resumeHandler: ResumeHandler | null = null;
  private settingsHandler: SettingsChangeHandler | null = null;
  private restartHandler: RestartHandler | null = null;
  private menuHandler: ReturnToMenuHandler | null = null;

  public constructor(root: HTMLElement) {
    const messageElement = root.querySelector<HTMLElement>('#pause-message');
    const resumeButton = root.querySelector<HTMLButtonElement>('#pause-resume');
    if (!messageElement || !resumeButton) throw new Error('Faltan elementos de pausa');
    this.root = root;
    this.messageElement = messageElement;
    this.resumeButton = resumeButton;
    this.settingsToggle = root.querySelector<HTMLButtonElement>('#pause-settings-toggle');
    this.settingsPanel = root.querySelector<HTMLElement>('#pause-settings');
    this.musicInput = root.querySelector<HTMLInputElement>('#pause-music');
    this.sfxInput = root.querySelector<HTMLInputElement>('#pause-sfx');
    this.mutedInput = root.querySelector<HTMLInputElement>('#pause-muted');
    this.musicValue = root.querySelector<HTMLOutputElement>('#pause-music-value');
    this.sfxValue = root.querySelector<HTMLOutputElement>('#pause-sfx-value');
    this.restartButton = root.querySelector<HTMLButtonElement>('#pause-restart');
    this.menuButton = root.querySelector<HTMLButtonElement>('#pause-menu');
    this.resumeButton.addEventListener('click', () => this.resumeHandler?.());
    this.settingsToggle?.addEventListener('click', () => this.toggleSettings());
    this.musicInput?.addEventListener('input', () => this.emitSettings());
    this.sfxInput?.addEventListener('input', () => this.emitSettings());
    this.mutedInput?.addEventListener('change', () => this.emitSettings());
    this.restartButton?.addEventListener('click', () => this.restartHandler?.());
    this.menuButton?.addEventListener('click', () => this.menuHandler?.());
  }

  public open(message: string, resumeHandler: ResumeHandler, actions: PauseActions = {}): void {
    this.messageElement.textContent = message;
    this.resumeHandler = resumeHandler;
    this.settingsHandler = actions.onSettingsChange ?? null;
    this.restartHandler = actions.onRestart ?? null;
    this.menuHandler = actions.onReturnToMenu ?? null;
    if (this.menuButton) this.menuButton.hidden = !this.menuHandler;
    if (actions.settings) this.setSettings(actions.settings);
    this.setSettingsExpanded(false);
    this.root.hidden = false;
    this.resumeButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.root.hidden = true;
    this.resumeHandler = null;
    this.settingsHandler = null;
    this.restartHandler = null;
    this.menuHandler = null;
    this.setSettingsExpanded(false);
  }

  private toggleSettings(): void {
    if (!this.settingsPanel) return;
    this.setSettingsExpanded(this.settingsPanel.hidden);
  }

  private setSettingsExpanded(expanded: boolean): void {
    if (this.settingsPanel) this.settingsPanel.hidden = !expanded;
    this.settingsToggle?.setAttribute('aria-expanded', String(expanded));
  }

  private setSettings(settings: AudioSettings): void {
    if (this.musicInput) this.musicInput.value = String(Math.round(settings.musicVolume * 100));
    if (this.sfxInput) this.sfxInput.value = String(Math.round(settings.sfxVolume * 100));
    if (this.mutedInput) this.mutedInput.checked = settings.muted;
    this.updateVolumeLabels();
  }

  private emitSettings(): void {
    this.updateVolumeLabels();
    this.settingsHandler?.({
      musicVolume: this.readVolume(this.musicInput),
      sfxVolume: this.readVolume(this.sfxInput),
      muted: this.mutedInput?.checked ?? false
    });
  }

  private updateVolumeLabels(): void {
    if (this.musicValue) this.musicValue.value = `${Math.round(this.readVolume(this.musicInput) * 100)}%`;
    if (this.sfxValue) this.sfxValue.value = `${Math.round(this.readVolume(this.sfxInput) * 100)}%`;
  }

  private readVolume(input: HTMLInputElement | null): number {
    if (!input) return 1;
    const value = Number(input.value);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value / 100)) : 1;
  }
}
