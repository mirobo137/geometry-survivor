import type { RunSummary } from '../app/RunSummary';
import { formatNova } from '../content/meta/EconomyDefinitions';
import novaSvg from '../assets/svg/ui/nova.svg?raw';

export type RestartHandler = () => void;
export type DoubleNovaHandler = () => void;

export interface GameOverBestValues {
  readonly timeSeconds: number;
  readonly score: number;
}

export interface GameOverRewardedOptions {
  readonly doubleNovaAvailable?: boolean;
  readonly onDoubleNova?: DoubleNovaHandler;
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export class GameOverOverlay {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly time: HTMLElement;
  private readonly kills: HTMLElement;
  private readonly experience: HTMLElement;
  private readonly score: HTMLElement;
  private readonly best: HTMLElement;
  private readonly nova: HTMLElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly rewardedSection: HTMLElement;
  private readonly rewardedMessage: HTMLElement;
  private readonly doubleNovaButton: HTMLButtonElement;
  private restartHandler: RestartHandler | null = null;
  private doubleNovaHandler: DoubleNovaHandler | null = null;

  public constructor(root: HTMLElement) {
    const title = root.querySelector<HTMLElement>('#game-over-title');
    const time = root.querySelector<HTMLElement>('#game-over-time');
    const kills = root.querySelector<HTMLElement>('#game-over-kills');
    const experience = root.querySelector<HTMLElement>('#game-over-experience');
    const score = root.querySelector<HTMLElement>('#game-over-score');
    const best = root.querySelector<HTMLElement>('#game-over-best');
    const nova = root.querySelector<HTMLElement>('#game-over-nova');
    const restartButton = root.querySelector<HTMLButtonElement>('#game-over-restart');
    const rewardedSection = root.querySelector<HTMLElement>('#game-over-rewarded');
    const rewardedMessage = root.querySelector<HTMLElement>('#game-over-rewarded-message');
    const doubleNovaButton = root.querySelector<HTMLButtonElement>('#game-over-double-nova');
    if (!title || !time || !kills || !experience || !score || !best || !nova || !restartButton
      || !rewardedSection || !rewardedMessage || !doubleNovaButton) {
      throw new Error('Faltan elementos del resumen de partida');
    }
    this.root = root;
    this.title = title;
    this.time = time;
    this.kills = kills;
    this.experience = experience;
    this.score = score;
    this.best = best;
    this.nova = nova;
    this.restartButton = restartButton;
    this.rewardedSection = rewardedSection;
    this.rewardedMessage = rewardedMessage;
    this.doubleNovaButton = doubleNovaButton;
    this.restartButton.addEventListener('click', () => this.restartHandler?.());
    this.doubleNovaButton.addEventListener('click', () => this.doubleNovaHandler?.());
  }

  public open(
    summary: RunSummary,
    best: GameOverBestValues,
    novaReward: number,
    totalNova: number,
    restartHandler: RestartHandler,
    rewarded: GameOverRewardedOptions = {}
  ): void {
    this.title.textContent = summary.outcome === 'victory' ? 'Victoria' : 'Fin de la partida';
    this.time.textContent = `Tiempo ${formatTime(summary.elapsedSeconds)}`;
    this.kills.textContent = `Bajas ${summary.kills}`;
    this.experience.textContent = `Experiencia ${summary.experience}`;
    this.score.textContent = `Puntuación ${summary.score}`;
    this.best.textContent = `Mejor ${formatTime(best.timeSeconds)} · ${best.score} puntos`;
    this.renderNova(novaReward, totalNova);
    this.restartHandler = restartHandler;
    this.doubleNovaHandler = rewarded.onDoubleNova ?? null;
    const canDouble = rewarded.doubleNovaAvailable === true && this.doubleNovaHandler !== null;
    this.rewardedSection.hidden = !canDouble;
    this.rewardedMessage.textContent = canDouble ? 'Recompensa opcional: duplica la NOVA de esta run.' : '';
    this.doubleNovaButton.hidden = !canDouble;
    this.doubleNovaButton.disabled = !canDouble;
    this.doubleNovaButton.textContent = 'Ver anuncio · duplicar NOVA';
    this.root.hidden = false;
    this.restartButton.focus({ preventScroll: true });
  }

  public updateNova(novaReward: number, totalNova: number): void {
    this.renderNova(novaReward, totalNova);
  }

  public setDoubleNovaPending(): void {
    this.rewardedMessage.textContent = 'Cargando recompensa...';
    this.doubleNovaButton.disabled = true;
    this.doubleNovaButton.textContent = 'Anuncio en curso';
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

  public close(): void {
    this.root.hidden = true;
    this.restartHandler = null;
    this.doubleNovaHandler = null;
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
}
