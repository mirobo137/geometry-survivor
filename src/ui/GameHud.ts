export interface GameHudValues {
  readonly elapsedSeconds: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly xp: number;
  readonly levelStartExperience: number;
  readonly nextLevelExperience: number;
  readonly kills: number;
  readonly level: number;
  readonly assault?: {
    readonly healthMultiplier: number;
    readonly bossesDefeated: number;
    readonly killsTowardNextBoss: number;
    readonly killsPerBoss: number;
    readonly bossActive: boolean;
    readonly nextBossQueued: boolean;
  };
}

const formatTime = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
  const remainder = (wholeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

/** XP keeps fractional precision in simulation but stays integer in the HUD. */
export const formatExperience = (experience: number): string => String(Math.max(0, Math.floor(experience)));

/** Display whole HP consistently without changing fractional simulation values. */
export const formatHealth = (health: number, maxHealth: number): string => {
  const maximum = Math.max(0, Math.ceil(maxHealth));
  const current = Math.max(0, Math.min(maximum, Math.ceil(health)));
  return `HP ${current}/${maximum}`;
};

export const getMeterPercent = (current: number, maximum: number): number => (
  maximum > 0 && Number.isFinite(current) && Number.isFinite(maximum)
    ? Math.round(Math.max(0, Math.min(1, current / maximum)) * 1000) / 10
    : 0
);

export const getLevelExperience = (xp: number, start: number, next: number): { current: number; required: number } => {
  const required = Math.max(0, next - start);
  return { current: Math.max(0, Math.min(required, xp - start)), required };
};

export class GameHud {
  private readonly timeElement: HTMLElement;
  private readonly healthElement: HTMLElement;
  private readonly xpElement: HTMLElement;
  private readonly killsElement: HTMLElement;
  private readonly levelElement: HTMLElement;
  private readonly assaultElement: HTMLElement | null;
  private readonly healthMeter: HTMLElement | null;
  private readonly xpMeter: HTMLElement | null;
  private lastMeters = '';
  private lastText = '';

  public constructor(root: HTMLElement) {
    const timeElement = root.querySelector<HTMLElement>('#hud-time');
    const healthElement = root.querySelector<HTMLElement>('#hud-health');
    const xpElement = root.querySelector<HTMLElement>('#hud-xp');
    const killsElement = root.querySelector<HTMLElement>('#hud-kills');
    const levelElement = root.querySelector<HTMLElement>('#hud-level');
    const assaultElement = root.querySelector<HTMLElement>('#hud-assault');
    if (!timeElement || !healthElement || !xpElement || !killsElement || !levelElement) {
      throw new Error('Faltan elementos del HUD');
    }
    this.timeElement = timeElement;
    this.healthElement = healthElement;
    this.xpElement = xpElement;
    this.killsElement = killsElement;
    this.levelElement = levelElement;
    this.assaultElement = assaultElement;
    this.healthMeter = root.querySelector<HTMLElement>('#hud-health-meter');
    this.xpMeter = root.querySelector<HTMLElement>('#hud-xp-meter');
  }

  public update(values: GameHudValues): void {
    const experience = getLevelExperience(values.xp, values.levelStartExperience, values.nextLevelExperience);
    const healthPercent = getMeterPercent(values.health, values.maxHealth);
    const xpPercent = getMeterPercent(experience.current, experience.required);
    const meters = `${healthPercent}|${xpPercent}`;
    if (meters !== this.lastMeters) {
      this.lastMeters = meters;
      this.updateMeter(this.healthMeter, healthPercent);
      this.updateMeter(this.xpMeter, xpPercent);
      if (this.healthMeter) this.healthMeter.dataset.critical = String(values.health > 0 && healthPercent <= 25);
    }
    const text = [
      formatTime(values.elapsedSeconds),
      formatHealth(values.health, values.maxHealth),
      `XP ${formatExperience(experience.current)}/${formatExperience(experience.required)}`,
      `K ${values.kills}`,
      `LV ${values.level}`,
      values.assault
        ? `ASALTO ×${values.assault.healthMultiplier} · ${values.assault.bossActive ? 'JEFE' : 'SIG.'} ${values.assault.bossesDefeated + 1} · ${values.assault.nextBossQueued ? 'LISTO' : `${values.assault.killsTowardNextBoss}/${values.assault.killsPerBoss}`}`
        : ''
    ];
    const joined = text.join('|');
    if (joined === this.lastText) return;
    this.lastText = joined;
    this.timeElement.textContent = text[0];
    this.healthElement.textContent = text[1];
    this.xpElement.textContent = text[2];
    this.killsElement.textContent = text[3];
    this.levelElement.textContent = text[4];
    if (this.assaultElement) {
      // Keep diagnostic values available internally, but never expose this row to players.
      this.assaultElement.hidden = true;
      this.assaultElement.textContent = text[5] ?? '';
    }
  }

  private updateMeter(element: HTMLElement | null, percent: number): void {
    if (!element) return;
    element.style.setProperty('--meter-scale', String(percent / 100));
    element.setAttribute('aria-valuenow', String(percent));
  }
}
