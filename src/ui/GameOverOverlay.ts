import type { RunSummary } from '../app/RunSummary';

export type RestartHandler = () => void;

export interface GameOverBestValues {
  readonly timeSeconds: number;
  readonly score: number;
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
  private readonly restartButton: HTMLButtonElement;
  private restartHandler: RestartHandler | null = null;

  public constructor(root: HTMLElement) {
    const title = root.querySelector<HTMLElement>('#game-over-title');
    const time = root.querySelector<HTMLElement>('#game-over-time');
    const kills = root.querySelector<HTMLElement>('#game-over-kills');
    const experience = root.querySelector<HTMLElement>('#game-over-experience');
    const score = root.querySelector<HTMLElement>('#game-over-score');
    const best = root.querySelector<HTMLElement>('#game-over-best');
    const restartButton = root.querySelector<HTMLButtonElement>('#game-over-restart');
    if (!title || !time || !kills || !experience || !score || !best || !restartButton) {
      throw new Error('Faltan elementos del resumen de partida');
    }
    this.root = root;
    this.title = title;
    this.time = time;
    this.kills = kills;
    this.experience = experience;
    this.score = score;
    this.best = best;
    this.restartButton = restartButton;
    this.restartButton.addEventListener('click', () => this.restartHandler?.());
  }

  public open(summary: RunSummary, best: GameOverBestValues, restartHandler: RestartHandler): void {
    this.title.textContent = summary.outcome === 'victory' ? 'Victoria' : 'Fin de la partida';
    this.time.textContent = `Tiempo ${formatTime(summary.elapsedSeconds)}`;
    this.kills.textContent = `Bajas ${summary.kills}`;
    this.experience.textContent = `Experiencia ${summary.experience}`;
    this.score.textContent = `Puntuación ${summary.score}`;
    this.best.textContent = `Mejor ${formatTime(best.timeSeconds)} · ${best.score} puntos`;
    this.restartHandler = restartHandler;
    this.root.hidden = false;
    this.restartButton.focus({ preventScroll: true });
  }

  public close(): void {
    this.root.hidden = true;
    this.restartHandler = null;
  }
}
