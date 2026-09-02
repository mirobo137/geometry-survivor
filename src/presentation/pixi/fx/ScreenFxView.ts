import type { FxQuality } from '../../../content/visual/VisualTokens';

export type ScreenFxKind =
  | 'enemy-defeat'
  | 'player-damage'
  | 'player-defeat'
  | 'boss-defeat'
  | 'arena-expansion'
  | 'chain-hit'
  | 'laser-hit';

interface ScreenFxRecipe {
  readonly durationSeconds: number;
  readonly intensity: number;
}

const RECIPES: Readonly<Record<ScreenFxKind, ScreenFxRecipe>> = {
  'enemy-defeat': { durationSeconds: 0.12, intensity: 0.65 },
  'player-damage': { durationSeconds: 0.18, intensity: 1.35 },
  'player-defeat': { durationSeconds: 0.48, intensity: 2.2 },
  'boss-defeat': { durationSeconds: 0.62, intensity: 3.2 },
  'arena-expansion': { durationSeconds: 0.42, intensity: 1.6 },
  'chain-hit': { durationSeconds: 0.1, intensity: 0.38 },
  'laser-hit': { durationSeconds: 0.16, intensity: 1.1 }
} as const;

const QUALITY_SCALE: Readonly<Record<FxQuality, number>> = {
  low: 0.45,
  medium: 0.72,
  high: 1
} as const;

/** Presentation-only camera impulse. It never changes logical coordinates. */
export class ScreenFxView {
  private readonly qualityScale: number;
  private readonly reducedMotion: boolean;
  private lifeSeconds = 0;
  private maxLifeSeconds = 0;
  private intensity = 0;
  private elapsedSeconds = 0;
  private phase = 0;
  private offsetX = 0;
  private offsetY = 0;

  public constructor(quality: FxQuality = 'medium') {
    this.qualityScale = QUALITY_SCALE[quality];
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public get x(): number {
    return this.offsetX;
  }

  public get y(): number {
    return this.offsetY;
  }

  public get isActive(): boolean {
    return this.lifeSeconds > 0;
  }

  public play(kind: ScreenFxKind): void {
    if (this.reducedMotion) return;
    const recipe = RECIPES[kind];
    const nextLife = Math.max(this.lifeSeconds, recipe.durationSeconds);
    this.lifeSeconds = nextLife;
    this.maxLifeSeconds = Math.max(this.maxLifeSeconds, nextLife);
    this.intensity = Math.max(this.intensity, recipe.intensity * this.qualityScale);
    this.phase += 0.73;
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (this.lifeSeconds <= 0 || delta <= 0) {
      if (this.lifeSeconds <= 0) this.clearOffset();
      return;
    }

    this.elapsedSeconds += delta;
    this.lifeSeconds = Math.max(0, this.lifeSeconds - delta);
    const progress = this.maxLifeSeconds > 0 ? this.lifeSeconds / this.maxLifeSeconds : 0;
    const envelope = progress * progress;
    const time = this.elapsedSeconds * 48 + this.phase;
    this.offsetX = Math.sin(time * 1.13) * this.intensity * envelope;
    this.offsetY = Math.cos(time * 1.71 + 0.8) * this.intensity * 0.72 * envelope;
    if (this.lifeSeconds <= 0) this.clearOffset();
  }

  public reset(): void {
    this.lifeSeconds = 0;
    this.maxLifeSeconds = 0;
    this.intensity = 0;
    this.elapsedSeconds = 0;
    this.phase = 0;
    this.clearOffset();
  }

  private clearOffset(): void {
    this.offsetX = 0;
    this.offsetY = 0;
    if (this.lifeSeconds <= 0) {
      this.intensity = 0;
      this.maxLifeSeconds = 0;
    }
  }
}
