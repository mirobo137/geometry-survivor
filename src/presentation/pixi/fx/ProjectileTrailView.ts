import { Graphics } from 'pixi.js';
import { FX_QUALITY, PROJECTILE_TRAIL_TOKENS, type FxQuality } from '../../../content/visual/VisualTokens';
import { getCannonSkinDefinition, type CannonSkinId, type CannonTrailKind } from '../../../content/visual/CannonSkinDefinitions';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';

const RAINBOW_COLORS = [0xff668f, 0xffb86b, 0xffe39a, 0x65f2c2, 0x75e6ff, 0xd2a8ff] as const;

/** Draws short, bounded projectile trails without adding one node per shot. */
export class ProjectileTrailView {
  public readonly root = new Graphics();
  private readonly previousActive: boolean[];
  private readonly quality: FxQuality;
  private trailKind: CannonTrailKind = 'straight';
  private activeSegments = 0;

  public constructor(capacity: number, quality: FxQuality = 'medium', cannonSkin: CannonSkinId = 'basic') {
    this.quality = quality;
    this.trailKind = getCannonSkinDefinition(cannonSkin).trail;
    this.previousActive = Array.from({ length: Math.max(0, Math.floor(capacity)) }, () => false);
    this.root.eventMode = 'none';
    this.root.visible = false;
  }

  public get activeSegmentCount(): number {
    return this.activeSegments;
  }

  public setCannonSkin(cannonSkin: CannonSkinId): void {
    this.trailKind = getCannonSkinDefinition(cannonSkin).trail;
  }

  public render(projectiles: readonly ProjectileRenderState[]): void {
    this.root.clear();
    this.activeSegments = 0;
    const alpha = FX_QUALITY[this.quality].projectileTrailAlpha;
    const limit = FX_QUALITY[this.quality].projectileTrailLimit;
    const recipe = this.trailKind;
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
          const tailX = state.x - directionX * length;
          const tailY = state.y - directionY * length;
          const normalX = -directionY;
          const normalY = directionX;
          if (recipe === 'curve') {
            const bend = Math.min(7, length * 0.34);
            this.root
              .beginPath()
              .moveTo(tailX, tailY)
              .lineTo(state.x - directionX * length * 0.52 + normalX * bend, state.y - directionY * length * 0.52 + normalY * bend)
              .lineTo(state.x, state.y)
              .stroke({ color: 0xd2a8ff, width: 1.8, alpha });
          } else if (recipe === 'smoke') {
            this.root
              .beginPath()
              .moveTo(tailX, tailY)
              .lineTo(state.x, state.y)
              .stroke({ color: 0xffb86b, width: 2.2, alpha });
            this.root
              .beginPath()
              .circle(tailX + normalX * 2, tailY + normalY * 2, 4.2)
              .fill({ color: 0xb56b53, alpha: alpha * 0.42 });
            this.root
              .beginPath()
              .circle(tailX + directionX * 5 - normalX * 2, tailY + directionY * 5 - normalY * 2, 2.8)
              .fill({ color: 0xffd7ad, alpha: alpha * 0.35 });
          } else if (recipe === 'rainbow') {
            const stripeWidth = Math.max(1.2, PROJECTILE_TRAIL_TOKENS.width * 0.62);
            for (let stripe = 0; stripe < 4; stripe += 1) {
              const offset = (stripe - 1.5) * 1.8;
              this.root
                .beginPath()
                .moveTo(tailX + normalX * offset, tailY + normalY * offset)
                .lineTo(state.x + normalX * offset, state.y + normalY * offset)
                .stroke({ color: RAINBOW_COLORS[stripe], width: stripeWidth, alpha: alpha * 0.86 });
            }
          } else {
            this.root
              .beginPath()
              .moveTo(tailX, tailY)
              .lineTo(state.x, state.y)
              .stroke({
                color: PROJECTILE_TRAIL_TOKENS.color,
                width: PROJECTILE_TRAIL_TOKENS.width,
                alpha
              });
          }
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
