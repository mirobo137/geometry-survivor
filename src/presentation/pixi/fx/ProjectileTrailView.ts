import { Container, Sprite, Texture } from 'pixi.js';
import { FX_QUALITY, PROJECTILE_TRAIL_TOKENS, type FxQuality } from '../../../content/visual/VisualTokens';
import { getCannonSkinDefinition, type CannonSkinId, type CannonTrailKind } from '../../../content/visual/CannonSkinDefinitions';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';
import { getProjectileCurveOffset } from './ProjectileMotionVisual';

const RAINBOW_COLORS = [0xff668f, 0xffb86b, 0xffe39a, 0x65f2c2] as const;

interface TrailSegment {
  readonly sprite: Sprite;
}

const createBeam = (): TrailSegment => {
  const sprite = new Sprite(Texture.WHITE);
  sprite.anchor.set(0, 0.5);
  sprite.visible = false;
  return { sprite };
};

/** Draws bounded projectile trails with a fixed pool of reusable sprites. */
export class ProjectileTrailView {
  public readonly root = new Container();
  private readonly segments: TrailSegment[];
  private readonly previousActive: boolean[];
  private readonly quality: FxQuality;
  private trailKind: CannonTrailKind = 'straight';
  private activeSegments = 0;
  private visibleSegments = 0;

  public constructor(capacity: number, quality: FxQuality = 'medium', cannonSkin: CannonSkinId = 'basic') {
    this.quality = quality;
    this.trailKind = getCannonSkinDefinition(cannonSkin).trail;
    this.previousActive = Array.from({ length: Math.max(0, Math.floor(capacity)) }, () => false);
    // Rainbow needs four stripes; the other recipes use at most three pooled
    // sprites per projectile. The pool is sized once, never during gameplay.
    const segmentCapacity = FX_QUALITY[quality].projectileTrailLimit * 4;
    this.segments = Array.from({ length: segmentCapacity }, createBeam);
    for (const segment of this.segments) this.root.addChild(segment.sprite);
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
    for (let index = 0; index < this.visibleSegments; index += 1) this.segments[index].sprite.visible = false;
    this.visibleSegments = 0;
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
          const normalX = -directionY;
          const normalY = directionX;
          const tailAge = Math.max(0, state.ageSeconds - length / speed);
          const tailLifetime = state.lifetimeSeconds + state.ageSeconds - tailAge;
          const headOffset = getProjectileCurveOffset(state, recipe);
          const tailOffset = getProjectileCurveOffset(state, recipe, tailAge, tailLifetime);
          const headX = state.x + normalX * headOffset;
          const headY = state.y + normalY * headOffset;
          const tailX = state.x - directionX * length + normalX * tailOffset;
          const tailY = state.y - directionY * length + normalY * tailOffset;
          const slot = this.activeSegments * 4;

          if (recipe === 'curve') {
            const midAge = (state.ageSeconds + tailAge) * 0.5;
            const midLifetime = state.lifetimeSeconds + state.ageSeconds - midAge;
            const midOffset = getProjectileCurveOffset(state, recipe, midAge, midLifetime);
            const midX = state.x - directionX * length * 0.52 + normalX * midOffset;
            const midY = state.y - directionY * length * 0.52 + normalY * midOffset;
            this.setBeam(slot, tailX, tailY, midX, midY, 0xd2a8ff, 3.1, alpha);
            this.setBeam(slot + 1, midX, midY, headX, headY, 0xffb8df, 3.1, alpha);
          } else if (recipe === 'smoke') {
            this.setBeam(slot, tailX, tailY, headX, headY, 0xffb86b, 3.4, alpha);
            this.setDot(slot + 1, tailX + normalX * 2, tailY + normalY * 2, 4.2, 0xb56b53, alpha * 0.72);
            this.setDot(
              slot + 2,
              tailX + directionX * 5 - normalX * 2,
              tailY + directionY * 5 - normalY * 2,
              2.8,
              0xffd7ad,
              alpha * 0.62
            );
          } else if (recipe === 'rainbow') {
            const stripeWidth = Math.max(1.4, PROJECTILE_TRAIL_TOKENS.width * 0.66);
            for (let stripe = 0; stripe < RAINBOW_COLORS.length; stripe += 1) {
              const offset = (stripe - 1.5) * 1.8;
              this.setBeam(
                slot + stripe,
                tailX + normalX * offset,
                tailY + normalY * offset,
                headX + normalX * offset,
                headY + normalY * offset,
                RAINBOW_COLORS[stripe],
                stripeWidth,
                alpha * 0.92
              );
            }
          } else if (recipe === 'lattice') {
            const midX = (tailX + headX) * 0.5;
            const midY = (tailY + headY) * 0.5;
            this.setBeam(slot, tailX, tailY, headX, headY, 0xff7ca8, 2.4, alpha * 0.86);
            this.setBeam(
              slot + 1,
              midX - normalX * 5,
              midY - normalY * 5,
              midX + normalX * 5,
              midY + normalY * 5,
              0xd3e8ff,
              1.25,
              alpha * 0.78
            );
            this.setDot(slot + 2, midX, midY, 2.4, 0xfff0fa, alpha * 0.82);
          } else {
            this.setBeam(slot, tailX, tailY, headX, headY, PROJECTILE_TRAIL_TOKENS.color, PROJECTILE_TRAIL_TOKENS.width + 0.6, alpha);
          }
          this.activeSegments += 1;
        }
      }
      this.previousActive[index] = true;
    }
    this.root.visible = this.activeSegments > 0;
  }

  public clear(): void {
    for (let index = 0; index < this.visibleSegments; index += 1) this.segments[index].sprite.visible = false;
    this.visibleSegments = 0;
    this.activeSegments = 0;
    this.root.visible = false;
    this.previousActive.fill(false);
  }

  private setBeam(index: number, x1: number, y1: number, x2: number, y2: number, color: number, width: number, alpha: number): void {
    const sprite = this.segments[index].sprite;
    const dx = x2 - x1;
    const dy = y2 - y1;
    sprite.anchor.set(0, 0.5);
    sprite.position.set(x1, y1);
    sprite.rotation = Math.atan2(dy, dx);
    sprite.scale.set(Math.max(0.1, Math.hypot(dx, dy)), width);
    sprite.tint = color;
    sprite.alpha = alpha;
    sprite.visible = true;
    this.visibleSegments = Math.max(this.visibleSegments, index + 1);
  }

  private setDot(index: number, x: number, y: number, radius: number, color: number, alpha: number): void {
    const sprite = this.segments[index].sprite;
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.rotation = 0;
    sprite.scale.set(radius * 2);
    sprite.tint = color;
    sprite.alpha = alpha;
    sprite.visible = true;
    this.visibleSegments = Math.max(this.visibleSegments, index + 1);
  }
}
