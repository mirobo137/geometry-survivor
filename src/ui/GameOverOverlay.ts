import type { RunSummary } from '../app/RunSummary';
import { formatNova } from '../content/meta/EconomyDefinitions';
import novaSvg from '../assets/svg/ui/nova.svg?raw';
import { isCalibrationId, type CalibrationDefinition, type CalibrationId } from '../content/run/CalibrationDefinitions';

export type RestartHandler = () => void;
export type DoubleNovaHandler = () => void;
export type ReviveHandler = () => void;
export type ReturnToMenuHandler = () => void;
export type ContinueHandler = () => void;
export type CalibrationSelectHandler = (id: CalibrationId) => void;

export interface GameOverBestValues {
  readonly timeSeconds: number;
  readonly score: number;
}

export interface GameOverRewardedOptions {
  readonly doubleNovaAvailable?: boolean;
  readonly onDoubleNova?: DoubleNovaHandler;
  readonly reviveAvailable?: boolean;
  readonly onRevive?: ReviveHandler;
}

/** Presentation-only details for a boss-clear intermission. */
export interface ActIntermissionOptions {
  readonly actName: string;
  readonly message: string;
  readonly restartLabel: string;
  readonly continueLabel?: string;
  readonly onContinue?: ContinueHandler;
  readonly templates?: readonly CalibrationDefinition[];
  readonly onSelectTemplate?: CalibrationSelectHandler;
  readonly onReturnToMenu?: ReturnToMenuHandler;
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export class GameOverOverlay {
  private readonly root: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly title: HTMLElement;
  private readonly actMessage: HTMLElement;
  private readonly time: HTMLElement;
  private readonly kills: HTMLElement;
  private readonly experience: HTMLElement;
  private readonly score: HTMLElement;
  private readonly best: HTMLElement;
  private readonly nova: HTMLElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly continueButton: HTMLButtonElement;
  private readonly templateSection: HTMLElement;
  private readonly templateButtons: readonly HTMLButtonElement[];
  private readonly menuButton: HTMLButtonElement;
  private readonly rewardedSection: HTMLElement;
  private readonly rewardedMessage: HTMLElement;
  private readonly doubleNovaButton: HTMLButtonElement;
  private readonly reviveSection: HTMLElement;
  private readonly reviveMessage: HTMLElement;
  private readonly reviveButton: HTMLButtonElement;
  private restartHandler: RestartHandler | null = null;
  private continueHandler: ContinueHandler | null = null;
  private templateHandler: CalibrationSelectHandler | null = null;
  private menuHandler: ReturnToMenuHandler | null = null;
  private doubleNovaHandler: DoubleNovaHandler | null = null;
  private reviveHandler: ReviveHandler | null = null;

  public constructor(root: HTMLElement) {
    const kicker = root.querySelector<HTMLElement>('#game-over-kicker');
    const title = root.querySelector<HTMLElement>('#game-over-title');
    const actMessage = root.querySelector<HTMLElement>('#game-over-act-message');
    const time = root.querySelector<HTMLElement>('#game-over-time');
    const kills = root.querySelector<HTMLElement>('#game-over-kills');
    const experience = root.querySelector<HTMLElement>('#game-over-experience');
    const score = root.querySelector<HTMLElement>('#game-over-score');
    const best = root.querySelector<HTMLElement>('#game-over-best');
    const nova = root.querySelector<HTMLElement>('#game-over-nova');
    const restartButton = root.querySelector<HTMLButtonElement>('#game-over-restart');
    const continueButton = root.querySelector<HTMLButtonElement>('#game-over-continue');
    const templateSection = root.querySelector<HTMLElement>('#game-over-entry');
    const templateButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-game-over-calibration]'));
    const menuButton = root.querySelector<HTMLButtonElement>('#game-over-menu');
    const rewardedSection = root.querySelector<HTMLElement>('#game-over-rewarded');
    const rewardedMessage = root.querySelector<HTMLElement>('#game-over-rewarded-message');
    const doubleNovaButton = root.querySelector<HTMLButtonElement>('#game-over-double-nova');
    const reviveSection = root.querySelector<HTMLElement>('#game-over-revive');
    const reviveMessage = root.querySelector<HTMLElement>('#game-over-revive-message');
    const reviveButton = root.querySelector<HTMLButtonElement>('#game-over-revive-button');
    if (!kicker || !title || !actMessage || !time || !kills || !experience || !score || !best || !nova || !restartButton || !continueButton || !templateSection || templateButtons.length === 0 || !menuButton
      || !rewardedSection || !rewardedMessage || !doubleNovaButton
      || !reviveSection || !reviveMessage || !reviveButton) {
      throw new Error('Faltan elementos del resumen de partida');
    }
    this.root = root;
    this.kicker = kicker;
    this.title = title;
    this.actMessage = actMessage;
    this.time = time;
    this.kills = kills;
    this.experience = experience;
    this.score = score;
    this.best = best;
    this.nova = nova;
    this.restartButton = restartButton;
    this.continueButton = continueButton;
    this.templateSection = templateSection;
    this.templateButtons = templateButtons;
    this.menuButton = menuButton;
    this.rewardedSection = rewardedSection;
    this.rewardedMessage = rewardedMessage;
    this.doubleNovaButton = doubleNovaButton;
    this.reviveSection = reviveSection;
    this.reviveMessage = reviveMessage;
    this.reviveButton = reviveButton;
    this.restartButton.addEventListener('click', () => this.restartHandler?.());
    this.continueButton.addEventListener('click', () => this.continueHandler?.());
    for (const button of this.templateButtons) {
      button.addEventListener('click', () => {
        const id = button.dataset.gameOverCalibration;
        if (isCalibrationId(id)) this.templateHandler?.(id);
      });
    }
    this.menuButton.addEventListener('click', () => this.menuHandler?.());
    this.doubleNovaButton.addEventListener('click', () => this.doubleNovaHandler?.());
    this.reviveButton.addEventListener('click', () => this.reviveHandler?.());
  }

  public open(
    summary: RunSummary,
    best: GameOverBestValues,
    novaReward: number,
    totalNova: number,
    restartHandler: RestartHandler,
    rewarded: GameOverRewardedOptions = {},
    intermission?: ActIntermissionOptions
  ): void {
    const isIntermission = summary.outcome === 'victory' && intermission !== undefined;
    this.kicker.textContent = isIntermission ? 'ACTO COMPLETADO' : 'RUN COMPLETE';
    this.title.textContent = isIntermission
      ? `${intermission.actName} superado`
      : summary.outcome === 'victory' ? 'Victoria' : 'Fin de la partida';
    this.actMessage.textContent = isIntermission ? intermission.message : '';
    this.actMessage.hidden = !isIntermission;
    this.time.textContent = `Tiempo ${formatTime(summary.elapsedSeconds)}`;
    this.kills.textContent = `Bajas ${summary.kills}`;
    this.experience.textContent = `Experiencia ${summary.experience}`;
    this.score.textContent = `Puntuación ${summary.score}`;
    this.best.textContent = `Mejor ${formatTime(best.timeSeconds)} · ${best.score} puntos`;
    this.renderNova(novaReward, totalNova);
    this.restartHandler = restartHandler;
    this.continueHandler = intermission?.onContinue ?? null;
    this.templateHandler = intermission?.onSelectTemplate ?? null;
    this.menuHandler = intermission?.onReturnToMenu ?? null;
    this.doubleNovaHandler = rewarded.onDoubleNova ?? null;
    this.reviveHandler = summary.outcome === 'game-over' ? rewarded.onRevive ?? null : null;
    const canDouble = rewarded.doubleNovaAvailable === true && this.doubleNovaHandler !== null;
    const canRevive = rewarded.reviveAvailable === true && this.reviveHandler !== null;
    this.rewardedSection.hidden = !canDouble;
    this.rewardedMessage.textContent = canDouble ? 'Recompensa opcional: duplica la NOVA de esta run.' : '';
    this.doubleNovaButton.hidden = !canDouble;
    this.doubleNovaButton.disabled = !canDouble;
    this.doubleNovaButton.textContent = 'Ver anuncio · duplicar NOVA';
    this.reviveSection.hidden = !canRevive;
    this.reviveMessage.textContent = canRevive ? 'Vuelve con 35% de vida y 2 s de proteccion.' : '';
    this.reviveButton.hidden = !canRevive;
    this.reviveButton.disabled = !canRevive;
    this.reviveButton.textContent = 'Ver anuncio · revivir';
    this.restartButton.textContent = intermission?.restartLabel ?? 'Jugar de nuevo';
    const canContinue = isIntermission && this.continueHandler !== null && intermission?.continueLabel !== undefined;
    const templates = isIntermission ? intermission?.templates ?? [] : [];
    const hasTemplates = templates.length > 0 && this.templateHandler !== null;
    this.templateSection.hidden = !hasTemplates;
    for (const button of this.templateButtons) {
      const id = button.dataset.gameOverCalibration;
      button.hidden = !hasTemplates || !isCalibrationId(id) || !templates.some((template) => template.id === id);
      button.disabled = button.hidden;
    }
    this.continueButton.hidden = !canContinue || hasTemplates;
    this.continueButton.disabled = !canContinue || hasTemplates;
    this.continueButton.textContent = intermission?.continueLabel ?? 'Continuar';
    this.menuButton.hidden = this.menuHandler === null;
    this.root.hidden = false;
    if (hasTemplates) this.templateButtons.find((button) => !button.hidden)?.focus({ preventScroll: true });
    else (canContinue ? this.continueButton : this.restartButton).focus({ preventScroll: true });
  }

  public updateNova(novaReward: number, totalNova: number): void {
    this.renderNova(novaReward, totalNova);
  }

  public setDoubleNovaPending(): void {
    this.rewardedMessage.textContent = 'Cargando recompensa...';
    this.doubleNovaButton.disabled = true;
    this.doubleNovaButton.textContent = 'Anuncio en curso';
  }

  public setRevivePending(): void {
    this.reviveMessage.textContent = 'Cargando recompensa...';
    this.reviveButton.disabled = true;
    this.reviveButton.textContent = 'Anuncio en curso';
  }

  public setDoubleNovaResult(result: 'rewarded' | 'dismissed' | 'unavailable' | 'error'): void {
    if (result === 'rewarded') {
      this.rewardedMessage.textContent = 'Recompensa aplicada. NOVA duplicada una sola vez.';
      this.doubleNovaButton.hidden = true;
      this.doubleNovaButton.disabled = true;
      return;
    }
    if (result === 'unavailable') {
      this.rewardedMessage.textContent = 'Anuncio no disponible. Conservas la recompensa normal.';
      this.doubleNovaSectionHidden();
      return;
    }
    this.rewardedMessage.textContent = result === 'dismissed'
      ? 'Anuncio cancelado. Puedes intentarlo otra vez.'
      : 'No se pudo completar el anuncio. Puedes intentarlo otra vez.';
    this.doubleNovaButton.disabled = false;
    this.doubleNovaButton.textContent = 'Reintentar · duplicar NOVA';
  }

  public setReviveResult(result: 'rewarded' | 'dismissed' | 'unavailable' | 'error'): void {
    if (result === 'rewarded') {
      this.reviveMessage.textContent = 'Recompensa aplicada. Regresas a la arena.';
      this.reviveSection.hidden = true;
      this.reviveButton.hidden = true;
      this.reviveButton.disabled = true;
      return;
    }
    if (result === 'unavailable') {
      this.reviveMessage.textContent = 'Anuncio no disponible. La run termina de forma normal.';
      this.reviveSectionHidden();
      return;
    }
    this.reviveMessage.textContent = result === 'dismissed'
      ? 'Anuncio cancelado. Puedes intentarlo otra vez.'
      : 'No se pudo completar el anuncio. Puedes intentarlo otra vez.';
    this.reviveButton.disabled = false;
    this.reviveButton.textContent = 'Reintentar · revivir';
  }

  public close(): void {
    this.root.hidden = true;
    this.restartHandler = null;
    this.continueHandler = null;
    this.templateHandler = null;
    this.menuHandler = null;
    this.doubleNovaHandler = null;
    this.reviveHandler = null;
  }

  private renderNova(novaReward: number, totalNova: number): void {
    this.nova.replaceChildren();
    this.nova.insertAdjacentHTML('afterbegin', novaSvg);
    const icon = this.nova.querySelector('svg');
    icon?.setAttribute('aria-hidden', 'true');
    icon?.setAttribute('focusable', 'false');
    this.nova.append(document.createTextNode(` +${formatNova(novaReward)} · Total ${formatNova(totalNova)} NOVA`));
  }

  private doubleNovaSectionHidden(): void {
    this.doubleNovaButton.hidden = true;
    this.doubleNovaButton.disabled = true;
    this.rewardedSection.hidden = true;
  }

  private reviveSectionHidden(): void {
    this.reviveButton.hidden = true;
    this.reviveButton.disabled = true;
    this.reviveSection.hidden = true;
  }
}
