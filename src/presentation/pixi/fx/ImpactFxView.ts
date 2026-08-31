import { Container, Graphics } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { FX_QUALITY, PLAYER_SKINS, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';

const PLAYER_DAMAGE_COLOR = 0xff6b9b;
const PLAYER_DAMAGE_RING_SECONDS = 0.24;
const FULL_CIRCLE = Math.PI * 2;

/** Presentation recipe for a player damage pulse; gameplay remains untouched. */
export class ImpactFxView {
  public readonly root = new Container();
  private readonly ring = new Graphics();
  private readonly particles: FxPool;
  private readonly quality: FxQuality;
  private readonly reducedMotion: boolean;
  private ringLifeSeconds = 0;
  private ringX = 0;
  private ringY = 0;
  private ringStrength = 1;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    this.quality = quality;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleTexture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 4, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.particles = new FxPool(particleTexture, FX_QUALITY[quality].poolCapacity);
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.ring, this.particles.root);
  }

  public get activeParticleCount(): number {
    return this.particles.activeCount;
  }

  public get isActive(): boolean {
    return this.root.visible;
  }

  /** Starts the visual response after the simulation accepted player damage. */
  public playPlayerDamage(x: number, y: number, amount: number): void {
    this.ringX = x;
    this.ringY = y;
    this.ringLifeSeconds = PLAYER_DAMAGE_RING_SECONDS;
    this.ringStrength = Math.min(1.4, Math.max(0.6, amount / 12));
    this.root.visible = true;
    if (this.reducedMotion) return;

    const { particleCount } = FX_QUALITY[this.quality];
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (index / particleCount) * FULL_CIRCLE + Math.PI / 8;
      const speed = 45 + (index % 3) * 14;
      this.particles.spawn(
        x,
        y,
        index % 2 === 0 ? PLAYER_DAMAGE_COLOR : PLAYER_SKINS.cyan.accent,
        0.18 + (index % 3) * 0.035,
        Math.cos(angle) * speed * this.ringStrength,
        Math.sin(angle) * speed * this.ringStrength,
        0.82,
        0.7 + (index % 2) * 0.25
      );
    }
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    this.particles.update(delta);
    if (this.ringLifeSeconds > 0 && delta > 0) this.ringLifeSeconds = Math.max(0, this.ringLifeSeconds - delta);

    this.ring.clear();
    if (this.ringLifeSeconds > 0) {
      const progress = 1 - this.ringLifeSeconds / PLAYER_DAMAGE_RING_SECONDS;
      const radius = 24 + progress * 36 * this.ringStrength;
      const alpha = (1 - progress) * FX_QUALITY[this.quality].ringAlpha;
      this.ring
        .circle(this.ringX, this.ringY, radius)
        .stroke({ color: PLAYER_DAMAGE_COLOR, width: 3 + (1 - progress) * 2, alpha });
    }

    this.root.visible = this.ringLifeSeconds > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    this.ringLifeSeconds = 0;
    this.particles.clear();
    this.ring.clear();
    this.root.visible = false;
  }
}
