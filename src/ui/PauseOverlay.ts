import type { AudioSettings } from '../audio/AudioService';
import { formatNova, type VoluntaryWithdrawalNova } from '../content/meta/EconomyDefinitions';
import { isControlScheme, normalizeControlScheme } from '../input/ControlScheme';
import type { ControlScheme } from '../platform/save/SaveStore';

export type ResumeHandler = () => void;
export type RestartHandler = () => void;
export type ReturnToMenuHandler = () => void;
export type WithdrawHandler = () => boolean;
export type SettingsChangeHandler = (settings: AudioSettings) => void;
export type ControlSchemeChangeHandler = (controlScheme: ControlScheme) => void;

export interface PauseActions {
  readonly settings?: AudioSettings;
  readonly onSettingsChange?: SettingsChangeHandler;
  readonly controlScheme?: ControlScheme;
  readonly onControlSchemeChange?: ControlSchemeChangeHandler;
  readonly onRestart?: RestartHandler;
  readonly onReturnToMenu?: ReturnToMenuHandler;
  readonly onWithdraw?: WithdrawHandler;
  readonly withdrawalQuote?: VoluntaryWithdrawalNova;
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
  private readonly controlSchemeInput: HTMLSelectElement | null;
  private readonly musicValue: HTMLOutputElement | null;
  private readonly sfxValue: HTMLOutputElement | null;
  private readonly restartButton: HTMLButtonElement | null;
  private readonly menuButton: HTMLButtonElement | null;
  private readonly withdrawButton: HTMLButtonElement | null;
  private readonly pausePanel: HTMLElement | null;
  private readonly withdrawalDialog: HTMLElement | null;
  private readonly withdrawalGenerated: HTMLOutputElement | null;
  private readonly withdrawalForfeited: HTMLOutputElement | null;
  private readonly withdrawalPayout: HTMLOutputElement | null;
  private readonly withdrawalBackButton: HTMLButtonElement | null;
  private readonly withdrawalConfirmButton: HTMLButtonElement | null;
  private resumeHandler: ResumeHandler | null = null;
  private settingsHandler: SettingsChangeHandler | null = null;
  private controlSchemeHandler: ControlSchemeChangeHandler | null = null;
  private restartHandler: RestartHandler | null = null;
  private menuHandler: ReturnToMenuHandler | null = null;
  private withdrawHandler: WithdrawHandler | null = null;
  private withdrawalQuote: VoluntaryWithdrawalNova | null = null;

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
    this.controlSchemeInput = root.querySelector<HTMLSelectElement>('#pause-control-scheme');
    this.musicValue = root.querySelector<HTMLOutputElement>('#pause-music-value');
    this.sfxValue = root.querySelector<HTMLOutputElement>('#pause-sfx-value');
    this.restartButton = root.querySelector<HTMLButtonElement>('#pause-restart');
    this.menuButton = root.querySelector<HTMLButtonElement>('#pause-menu');
    this.withdrawButton = root.querySelector<HTMLButtonElement>('#pause-withdraw');
    this.pausePanel = root.querySelector<HTMLElement>('.pause-panel');
    this.withdrawalDialog = root.parentElement?.querySelector<HTMLElement>('#pause-withdrawal-dialog')
      ?? root.querySelector<HTMLElement>('#pause-withdrawal-dialog');
    this.withdrawalGenerated = this.withdrawalDialog?.querySelector<HTMLOutputElement>('#pause-withdrawal-generated') ?? null;
    this.withdrawalForfeited = this.withdrawalDialog?.querySelector<HTMLOutputElement>('#pause-withdrawal-forfeited') ?? null;
    this.withdrawalPayout = this.withdrawalDialog?.querySelector<HTMLOutputElement>('#pause-withdrawal-payout') ?? null;
    this.withdrawalBackButton = this.withdrawalDialog?.querySelector<HTMLButtonElement>('#pause-withdrawal-back') ?? null;
    this.withdrawalConfirmButton = this.withdrawalDialog?.querySelector<HTMLButtonElement>('#pause-withdrawal-confirm') ?? null;
    this.resumeButton.addEventListener('click', () => this.resumeHandler?.());
    this.settingsToggle?.addEventListener('click', () => this.toggleSettings());
    this.musicInput?.addEventListener('input', () => this.emitSettings());
    this.sfxInput?.addEventListener('input', () => this.emitSettings());
    this.mutedInput?.addEventListener('change', () => this.emitSettings());
    this.controlSchemeInput?.addEventListener('change', () => this.emitControlScheme());
    this.restartButton?.addEventListener('click', () => this.restartHandler?.());
    this.menuButton?.addEventListener('click', () => this.menuHandler?.());
    this.withdrawButton?.addEventListener('click', () => this.openWithdrawalConfirmation());
    this.withdrawalBackButton?.addEventListener('click', () => this.closeWithdrawalConfirmation(true));
    this.withdrawalConfirmButton?.addEventListener('click', () => this.confirmWithdrawal());
    this.withdrawalDialog?.addEventListener('click', event => {
      if (event.target === this.withdrawalDialog) this.closeWithdrawalConfirmation(true);
    });
    this.withdrawalDialog?.addEventListener('keydown', event => this.handleWithdrawalKeydown(event));
  }

  public open(message: string, resumeHandler: ResumeHandler, actions: PauseActions = {}): void {
    this.messageElement.textContent = message;
    this.resumeHandler = resumeHandler;
    this.settingsHandler = actions.onSettingsChange ?? null;
    this.controlSchemeHandler = actions.onControlSchemeChange ?? null;
    this.restartHandler = actions.onRestart ?? null;
    this.menuHandler = actions.onReturnToMenu ?? null;
    this.withdrawHandler = actions.onWithdraw ?? null;
    this.withdrawalQuote = actions.withdrawalQuote ?? null;
    if (this.menuButton) this.menuButton.hidden = !this.menuHandler;
    if (this.withdrawButton) this.withdrawButton.hidden = !this.withdrawHandler || !this.withdrawalQuote;
    this.closeWithdrawalConfirmation(false);
    if (actions.settings) this.setSettings(actions.settings);
    if (actions.controlScheme) this.setControlScheme(actions.controlScheme);
    this.setSettingsExpanded(false);
    this.root.hidden = false;
    this.resumeButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.closeWithdrawalConfirmation(false);
    this.root.hidden = true;
    this.resumeHandler = null;
    this.settingsHandler = null;
    this.controlSchemeHandler = null;
    this.restartHandler = null;
    this.menuHandler = null;
    this.withdrawHandler = null;
    this.withdrawalQuote = null;
    this.setSettingsExpanded(false);
  }

  private openWithdrawalConfirmation(): void {
    const quote = this.withdrawalQuote;
    if (!this.withdrawHandler || !quote || !this.withdrawalDialog) return;
    if (this.withdrawalGenerated) this.withdrawalGenerated.value = formatNova(quote.generatedNova);
    if (this.withdrawalForfeited) this.withdrawalForfeited.value = `−${formatNova(quote.forfeitedNova)}`;
    if (this.withdrawalPayout) this.withdrawalPayout.value = formatNova(quote.payoutNova);
    this.withdrawalDialog.hidden = false;
    if (this.pausePanel) this.pausePanel.inert = true;
    this.withdrawalBackButton?.focus({ preventScroll: true });
  }

  private closeWithdrawalConfirmation(returnFocus: boolean): void {
    if (this.withdrawalDialog) this.withdrawalDialog.hidden = true;
    if (this.pausePanel) this.pausePanel.inert = false;
    if (returnFocus && !this.root.hidden) this.withdrawButton?.focus({ preventScroll: true });
  }

  private confirmWithdrawal(): void {
    const handler = this.withdrawHandler;
    if (!handler || !this.withdrawalQuote) return;
    if (handler()) this.close();
    else this.closeWithdrawalConfirmation(true);
  }

  private handleWithdrawalKeydown(event: KeyboardEvent): void {
    if (!this.withdrawalDialog || this.withdrawalDialog.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeWithdrawalConfirmation(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [this.withdrawalBackButton, this.withdrawalConfirmButton]
      .filter((button): button is HTMLButtonElement => button !== null && !button.disabled);
    if (buttons.length === 0) return;
    const first = buttons[0]!;
    const last = buttons[buttons.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

  private setControlScheme(controlScheme: ControlScheme): void {
    if (this.controlSchemeInput) this.controlSchemeInput.value = normalizeControlScheme(controlScheme);
  }

  private emitSettings(): void {
    this.updateVolumeLabels();
    this.settingsHandler?.({
      musicVolume: this.readVolume(this.musicInput),
      sfxVolume: this.readVolume(this.sfxInput),
      muted: this.mutedInput?.checked ?? false
    });
  }

  private emitControlScheme(): void {
    const value = this.controlSchemeInput?.value;
    if (isControlScheme(value)) {
      this.controlSchemeHandler?.(value);
    }
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
