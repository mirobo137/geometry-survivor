export interface GameHudValues {
  readonly elapsedSeconds: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly xp: number;
  readonly kills: number;
  readonly level: number;
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

/** XP keeps fractional precision in simulation but stays integer in the HUD. */
export const formatExperience = (experience: number): string => String(Math.max(0, Math.floor(experience)));

export class GameHud {
  private readonly timeElement: HTMLElement;
  private readonly healthElement: HTMLElement;
  private readonly xpElement: HTMLElement;
  private readonly killsElement: HTMLElement;
  private readonly levelElement: HTMLElement;
  private lastText = '';

  public constructor(root: HTMLElement) {
    const timeElement = root.querySelector<HTMLElement>('#hud-time');
    const healthElement = root.querySelector<HTMLElement>('#hud-health');
    const xpElement = root.querySelector<HTMLElement>('#hud-xp');
    const killsElement = root.querySelector<HTMLElement>('#hud-kills');
    const levelElement = root.querySelector<HTMLElement>('#hud-level');
    if (!timeElement || !healthElement || !xpElement || !killsElement || !levelElement) {
      throw new Error('Faltan elementos del HUD');
    }
    this.timeElement = timeElement;
    this.healthElement = healthElement;
    this.xpElement = xpElement;
    this.killsElement = killsElement;
    this.levelElement = levelElement;
  }

  public update(values: GameHudValues): void {
    const text = [
      formatTime(values.elapsedSeconds),
      `HP ${Math.ceil(values.health)}/${values.maxHealth}`,
      `XP ${formatExperience(values.xp)}`,
      `K ${values.kills}`,
      `LV ${values.level}`
    ];
    const joined = text.join('|');
    if (joined === this.lastText) return;
    this.lastText = joined;
    this.timeElement.textContent = text[0];
    this.healthElement.textContent = text[1];
    this.xpElement.textContent = text[2];
    this.killsElement.textContent = text[3];
    this.levelElement.textContent = text[4];
  }
}
