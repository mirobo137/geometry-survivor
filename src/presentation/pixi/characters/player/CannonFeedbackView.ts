import { BufferImageSource, Container, Rectangle, Sprite, Texture, type PointData } from 'pixi.js';
import { getCannonSkinDefinition, type CannonSkinId } from '../../../../content/visual/CannonSkinDefinitions';
import { CANNON_DISCHARGE_PROFILES, CANNON_FEEDBACK_TIMING as TIMING } from '../../../../content/visual/CannonFeedbackDefinitions';
import type { FxQuality } from '../../../../content/visual/VisualTokens';
import type { ShotRenderState } from '../../../../simulation/combat/CombatRenderState';

export interface CannonCableSampler {
  sampleCable(index: 0 | 1, progress: number, target: PointData): boolean;
}

/** One 64×64 RGBA atlas: directional flare, soft spark and petal corona. */
const createDischargeAtlas = (): readonly Texture[] => {
  const pixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    let alpha: number;
    if (x < 32) {
      const t = (y + 0.5) / 64;
      const width = 0.08 + 0.82 * (1 - t) ** 1.1;
      const lateral = ((x + 0.5) / 16 - 1) / width;
      alpha = Math.max(0, 1 - lateral * lateral) ** 1.5 * (1 - t) ** 0.65;
    } else {
      const dx = (x - 32 + 0.5) / 16 - 1;
      const dy = (y % 32 + 0.5) / 16 - 1;
      const radius = Math.hypot(dx, dy);
      if (y < 32) alpha = Math.max(0, 1 - radius) ** 2;
      else {
        const petals = 0.62 + 0.07 * Math.cos(Math.atan2(dy, dx) * 8);
        alpha = Math.max(0, 1 - Math.abs(radius - petals) / 0.12) ** 2;
      }
    }
    const offset = (y * 64 + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(alpha * 255);
  }
  const source = new BufferImageSource({ resource: pixels, width: 64, height: 64,
    format: 'rgba8unorm', alphaMode: 'no-premultiply-alpha', scaleMode: 'linear' });
  return [new Texture({ source, frame: new Rectangle(0, 0, 32, 64) }),
    new Texture({ source, frame: new Rectangle(32, 0, 32, 32) }),
    new Texture({ source, frame: new Rectangle(32, 32, 32, 32) })];
};

const makeEmitter = () => ({ at: Number.NEGATIVE_INFINITY, x: 0, y: 0, angle: 0 });

/** Two independent fixed emitters; accepts the pooled shot descriptor by copying scalars. */
export class CannonFeedbackView {
  public readonly root = new Container({ label: 'cannon-feedback' });
  private readonly emitters = [makeEmitter(), makeEmitter()];
  private readonly cores: Sprite[] = [];
  private readonly halos: Sprite[] = [];
  private readonly coronas: Sprite[] = [];
  private readonly feeds: Sprite[] = [];
  private readonly vapors: Sprite[][] = [];
  private readonly cablePoint = { x: 0, y: 0 };
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  private lastSeconds: number | null = null;
  private skin: CannonSkinId;
  private color: number;

  public constructor(private readonly quality: FxQuality, skin: CannonSkinId) {
    this.skin = skin;
    this.color = getCannonSkinDefinition(skin).accent;
    const atlas = createDischargeAtlas();
    const make = (texture: Texture, label: string, anchorY = 0.5): Sprite => {
      const sprite = new Sprite({ texture, label });
      sprite.anchor.set(0.5, anchorY);
      sprite.visible = false;
      this.root.addChild(sprite);
      return sprite;
    };
    this.root.eventMode = 'none';
    this.root.visible = false;
    for (let index = 0; index < 2; index++) {
      const puffs: Sprite[] = [];
      if (!this.reducedMotion) for (let puff = 0; puff < (quality === 'high' ? 2 : 1); puff++) {
        puffs.push(make(atlas[1], `cannon-vapor-${index}-${puff}`));
      }
      this.vapors.push(puffs);
      if (!this.reducedMotion && quality !== 'low') {
        this.halos.push(make(atlas[1], `cannon-halo-${index}`));
        if (quality === 'high') this.coronas.push(make(atlas[2], `cannon-corona-${index}`));
        this.feeds.push(make(atlas[1], `cannon-feed-${index}`));
      }
      this.cores.push(make(atlas[0], `cannon-flare-${index}`, 0));
    }
    this.root.once('destroyed', () => {
      const source = atlas[0].source;
      for (const texture of atlas) texture.destroy(false);
      source.destroy();
    });
  }

  public setSkin(skin: CannonSkinId): void {
    if (skin === this.skin) return;
    this.skin = skin;
    this.color = getCannonSkinDefinition(skin).accent;
    this.reset();
  }

  public playShot(seconds: number, shot: Readonly<ShotRenderState>): void {
    const angle = Math.atan2(shot.directionY, shot.directionX) + Math.PI / 2;
    for (let index = 0; index < 2; index++) {
      if (!(shot.muzzleMask & (1 << index))) continue;
      const emitter = this.emitters[index];
      emitter.at = seconds;
      emitter.x = index === 0 ? shot.leftOriginX : shot.rightOriginX;
      emitter.y = index === 0 ? shot.leftOriginY : shot.rightOriginY;
      emitter.angle = angle;
    }
    // A shot can be accepted in the same presentation tick as the previous render.
    this.lastSeconds = null;
  }

  public recoilAt(index: 0 | 1, seconds: number): number {
    const age = seconds - this.emitters[index].at;
    if (age < 0 || age >= TIMING.recoilSeconds) return 0;
    return CANNON_DISCHARGE_PROFILES[this.skin].recoil
      * (this.reducedMotion ? 0.35 : 1) * Math.exp(-age / TIMING.recoilDecaySeconds);
  }

  public render(seconds: number, playerX: number, playerY: number, hullAngle: number,
    alive: boolean, cables?: CannonCableSampler, scaleX = 1, scaleY = 1): void {
    if (!alive) { this.reset(); return; }
    if (seconds === this.lastSeconds) return;
    this.lastSeconds = seconds;
    this.root.visible = false;
    const profile = CANNON_DISCHARGE_PROFILES[this.skin];
    const cos = Math.cos(-hullAngle), sin = Math.sin(-hullAngle);
    const duration = this.reducedMotion || this.quality === 'low' ? 0.09 : TIMING.flashSeconds;
    for (let index = 0; index < 2; index++) {
      const emitter = this.emitters[index];
      const age = seconds - emitter.at;
      const progress = Math.min(1, Math.max(0, age / duration));
      const pulse = (1 - progress) ** 2;
      const core = this.cores[index], halo = this.halos[index], corona = this.coronas[index], feed = this.feeds[index];
      const puffs = this.vapors[index];
      for (let puff = 0; puff < puffs.length; puff++) {
        const vapor = puffs[puff];
        const t = (age - 0.025 - puff * 0.045) / TIMING.vaporSeconds;
        vapor.visible = t >= 0 && t < 1;
        if (!vapor.visible) continue;
        const forward = 4 + t * (puff === 0 ? 19 : 12);
        const sideways = (index === 0 ? -1 : 1) * (puff === 0 ? 1 : -1) * t * 7;
        const dx = emitter.x - playerX + Math.sin(emitter.angle) * forward + Math.cos(emitter.angle) * sideways;
        const dy = emitter.y - playerY - Math.cos(emitter.angle) * forward + Math.sin(emitter.angle) * sideways;
        vapor.position.set((dx * cos - dy * sin) / scaleX, (dx * sin + dy * cos) / scaleY);
        vapor.rotation = emitter.angle - hullAngle + t * (index === 0 ? 0.7 : -0.7);
        vapor.width = 14 + t * 34;
        vapor.height = 12 + t * 24;
        vapor.alpha = Math.min(1, t * 12) * (1 - t) ** 1.5 * (this.quality === 'low' ? 0.58 : 0.85);
        vapor.tint = this.skin === 'smoke' ? 0xc0a08d : 0xa9bbc6;
        this.root.visible = true;
      }
      core.visible = age >= 0 && age < duration;
      if (halo) halo.visible = core.visible;
      if (corona) corona.visible = core.visible;
      if (core.visible) {
        const dx = emitter.x - playerX, dy = emitter.y - playerY;
        core.position.set((dx * cos - dy * sin) / scaleX, (dx * sin + dy * cos) / scaleY);
        core.rotation = emitter.angle - hullAngle + Math.PI;
        core.width = profile.width * (0.65 + pulse * 0.35);
        core.height = profile.length * (0.55 + pulse * 0.45);
        core.alpha = pulse * 0.95;
        core.tint = halo ? 0xf4fdff : this.color;
        if (halo) {
          halo.position.copyFrom(core.position);
          halo.width = halo.height = 14 + pulse * 17;
          halo.alpha = pulse * 0.75;
          halo.tint = this.color;
        }
        if (corona) {
          corona.position.copyFrom(core.position);
          corona.rotation = emitter.angle - hullAngle;
          corona.width = 14 + progress * 29;
          corona.height = corona.width * profile.corona;
          corona.alpha = pulse * 0.6;
          corona.tint = this.color;
        }
        this.root.visible = true;
      }
      if (feed) {
        const t = (age - TIMING.feedStartSeconds) / (TIMING.feedSeconds - TIMING.feedStartSeconds);
        feed.visible = t >= 0 && t < 1 && cables?.sampleCable(index as 0 | 1, t, this.cablePoint) === true;
        if (feed.visible) {
          feed.position.set(this.cablePoint.x, this.cablePoint.y);
          feed.width = feed.height = 7 + Math.sin(t * Math.PI) * 3;
          feed.alpha = Math.sin(t * Math.PI) * 0.9;
          feed.tint = this.color;
          this.root.visible = true;
        }
      }
    }
  }

  public reset(): void {
    for (const emitter of this.emitters) emitter.at = Number.NEGATIVE_INFINITY;
    for (const sprite of this.root.children) sprite.visible = false;
    this.root.visible = false;
    this.lastSeconds = null;
  }
}
