import { Container, Sprite, Texture } from 'pixi.js';
import { FX_QUALITY, PROJECTILE_TRAIL_TOKENS, type FxQuality } from '../../../content/visual/VisualTokens';
import { getCannonSkinDefinition, type CannonSkinId } from '../../../content/visual/CannonSkinDefinitions';
import type { ProjectileRenderState } from '../../../simulation/combat/CombatRenderState';
import { getProjectileCurveOffset } from './ProjectileMotionVisual';
import { createProjectileTrailTextures } from './ProjectileTrailTexture';

const SPECTRUM = [0xff668f, 0xffb86b, 0x65f2c2, 0x75e6ff] as const;

/** Four connected texture slices per projectile; age controls geometry and fade. */
export class ProjectileTrailView {
  public readonly root = new Container();
  private readonly segments: Sprite[];
  private readonly previousActive: boolean[];
  private readonly ribbonTextures: readonly Texture[];
  private readonly smokeTexture?: Texture;
  private definition;
  private activeSegments = 0;
  private visibleSegments = 0;

  public constructor(
    capacity: number,
    private readonly quality: FxQuality = 'medium',
    cannonSkin: CannonSkinId = 'basic',
    smokeTexture?: Texture
  ) {
    this.definition = getCannonSkinDefinition(cannonSkin);
    this.smokeTexture = smokeTexture;
    this.previousActive = Array.from({ length: Math.max(0, Math.floor(capacity)) }, () => false);
    const limit = FX_QUALITY[quality].projectileTrailLimit;
    const textures = limit > 0 ? createProjectileTrailTextures() : [];
    this.ribbonTextures = textures;
    const source = textures[0]?.source;
    this.segments = Array.from({ length: limit * 4 }, (_, index) => {
      const sprite = new Sprite(textures[index % 4]);
      sprite.anchor.set(0, 0.5);
      sprite.visible = false;
      this.root.addChild(sprite);
      return sprite;
    });
    this.root.once('destroyed', () => {
      for (const texture of textures) texture.destroy(false);
      source?.destroy();
    });
    this.root.eventMode = 'none';
    this.root.visible = false;
  }

  public get activeSegmentCount(): number { return this.activeSegments; }

  public setCannonSkin(cannonSkin: CannonSkinId): void {
    this.definition = getCannonSkinDefinition(cannonSkin);
    this.clear();
  }

  public render(projectiles: readonly ProjectileRenderState[]): void {
    for (let index = 0; index < this.visibleSegments; index += 1) this.segments[index].visible = false;
    this.visibleSegments = 0;
    this.activeSegments = 0;
    const { projectileTrailAlpha: alpha, projectileTrailLimit: limit } = FX_QUALITY[this.quality];
    const recipe = this.definition.trail;
    for (let index = 0; index < this.previousActive.length; index += 1) {
      const state = projectiles[index];
      if (!state?.active) {
        this.previousActive[index] = false;
        continue;
      }
      const speed = Math.hypot(state.vx, state.vy);
      if (alpha > 0 && this.previousActive[index] && this.activeSegments < limit && speed > 0.5) {
        // A newborn shot cannot have a tail behind its muzzle.
        const seconds = Math.min(state.ageSeconds, PROJECTILE_TRAIL_TOKENS.lengthSeconds, PROJECTILE_TRAIL_TOKENS.maxLength / speed);
        const normalX = -state.vy / speed;
        const normalY = state.vx / speed;
        let age = state.ageSeconds - seconds;
        let offset = getProjectileCurveOffset(state, recipe, age, state.lifetimeSeconds + seconds);
        let x = state.x - state.vx * seconds + normalX * offset;
        let y = state.y - state.vy * seconds + normalY * offset;
        for (let band = 0; band < 4; band += 1) {
          const behind = seconds * (3 - band) / 4;
          age = state.ageSeconds - behind;
          offset = getProjectileCurveOffset(state, recipe, age, state.lifetimeSeconds + behind);
          const endX = state.x - state.vx * behind + normalX * offset;
          const endY = state.y - state.vy * behind + normalY * offset;
          const sprite = this.segments[this.activeSegments * 4 + band];
          const smoke = recipe === 'smoke' && this.smokeTexture;
          if (smoke) {
            sprite.texture = smoke;
            sprite.anchor.set(0.5, 0.5);
            sprite.position.set((x + endX) * 0.5, (y + endY) * 0.5);
            // A tiny deterministic rotation keeps pooled puffs from looking stamped.
            sprite.rotation = (index * 1.37 + band * 0.73) % (Math.PI * 2);
            const size = 13 + (band % 2) * 3;
            sprite.width = size;
            sprite.height = size;
            sprite.tint = 0xe8d8d1;
            sprite.alpha = alpha * (0.42 + band * 0.08);
          } else {
            sprite.texture = this.ribbonTextures[band];
            sprite.anchor.set(0, 0.5);
            sprite.position.set(x, y);
            sprite.rotation = Math.atan2(endY - y, endX - x);
            sprite.width = Math.max(0.01, Math.hypot(endX - x, endY - y));
            sprite.height = recipe === 'smoke' ? 11 : recipe === 'curve' ? 6 : recipe === 'helix' ? 7 : 8;
            sprite.tint = recipe === 'rainbow' ? SPECTRUM[band]
              : recipe === 'lattice' && band % 2 === 0 ? 0xd3e8ff
                : recipe === 'helix' && band % 2 === 0 ? this.definition.accent
                  : this.definition.projectileAccent;
            sprite.alpha = alpha;
          }
          sprite.visible = seconds > 0;
          x = endX;
          y = endY;
        }
        this.activeSegments += 1;
      }
      this.previousActive[index] = true;
    }
    this.visibleSegments = this.activeSegments * 4;
    this.root.visible = this.activeSegments > 0;
  }

  public clear(): void {
    for (let index = 0; index < this.visibleSegments; index += 1) this.segments[index].visible = false;
    this.visibleSegments = 0;
    this.activeSegments = 0;
    this.root.visible = false;
    this.previousActive.fill(false);
  }
}
