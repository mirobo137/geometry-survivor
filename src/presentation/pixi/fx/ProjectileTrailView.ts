import { Graphics } from 'pixi.js';
import { FX_QUALITY, PROJECTILE_TRAIL_TOKENS, type FxQuality } from '../../../content/visual/VisualTokens';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';

/** Draws short, bounded projectile trails without adding one node per shot. */
export class ProjectileTrailView {
  public readonly root = new Graphics();
  private readonly previousActive: boolean[];
  private readonly quality: FxQuality;
  private activeSegments = 0;

  public constructor(capacity: number, quality: FxQuality = 'medium') {
    this.quality = quality;
    this.previousActive = Array.from({ length: Math.max(0, Math.floor(capacity)) }, () => false);
    this.root.eventMode = 'none';
    this.root.visible = false;
  }

  public get activeSegmentCount(): number {
    return this.activeSegments;
  }

  public render(projectiles: readonly ProjectileRenderState[]): void {
    this.root.clear();
    this.activeSegments = 0;
    const alpha = FX_QUALITY[this.quality].projectileTrailAlpha;
    const limit = FX_QUALITY[this.quality].projectileTrailLimit;
    for (let index = 0; index < this.previousActive.length; index += 1) {
      const state = projectiles[index];
      if (!state || !state.active) {
        this.previousActive[index] = false;
        continue;
      }

      if (alpha > 0 && this.previousActive[index] && this.activeSegments < limit) {
        const speed = Math.hypot(state.vx, state.vy);
        if (speed > 0.5) {
          const length = Math.min(PROJECTILE_TRAIL_TOKENS.maxLength, speed * PROJECTILE_TRAIL_TOKENS.lengthSeconds);
          const directionX = state.vx / speed;
          const directionY = state.vy / speed;
          this.root
            .beginPath()
            .moveTo(state.x - directionX * length, state.y - directionY * length)
            .lineTo(state.x, state.y)
            .stroke({
              color: PROJECTILE_TRAIL_TOKENS.color,
              width: PROJECTILE_TRAIL_TOKENS.width,
              alpha
            });
          this.activeSegments += 1;
        }
      }
      this.previousActive[index] = true;
    }
    this.root.visible = this.activeSegments > 0;
  }

  public clear(): void {
    this.root.clear();
    this.root.visible = false;
    this.activeSegments = 0;
    this.previousActive.fill(false);
  }
}
