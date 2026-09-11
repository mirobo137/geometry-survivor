import { Container } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { FX_QUALITY, PLAYER_SKINS, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';
import { DamageBloomView } from './DamageBloomView';

const PLAYER_DAMAGE_COLOR = 0xff6b9b;
const FULL_CIRCLE = Math.PI * 2;

/** Presentation recipe for a player damage pulse; gameplay remains untouched. */
export class ImpactFxView {
  public readonly root = new Container();
  private readonly bloom = new DamageBloomView('player', 1);
  private readonly particles: FxPool;
  private readonly quality: FxQuality;
  private readonly reducedMotion: boolean;
  private ringStrength = 1;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    this.quality = quality;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleTexture = createTexture(renderer, (graphics) => {
      graphics.poly([-7, 0, 1, -2.5, 6, 0, 1, 2.5]).fill({ color: 0xffffff });
    });
    this.particles = new FxPool(particleTexture, FX_QUALITY[quality].poolCapacity);
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.bloom.root, this.particles.root);
  }

  public get activeParticleCount(): number {
    return this.particles.activeCount;
  }

  public get isActive(): boolean {
    return this.root.visible;
  }

  /** Starts the visual response after the simulation accepted player damage. */
  public playPlayerDamage(x: number, y: number, amount: number): void {
    this.ringStrength = Math.min(1.4, Math.max(0.6, amount / 12));
    this.bloom.clear();
    this.bloom.play(x, y, 36 + this.ringStrength * 6);
    this.root.visible = true;
    if (this.reducedMotion) return;

    const { particleCount } = FX_QUALITY[this.quality];
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (index / particleCount) * FULL_CIRCLE + Math.PI / 8;
      const speed = 45 + (index % 3) * 14;
      this.particles.spawn(
        x + Math.cos(angle) * 23,
        y + Math.sin(angle) * 23,
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
    if (delta <= 0) return;
    this.particles.update(delta);
    this.bloom.update(delta);
    this.root.visible = this.bloom.activeCount > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    this.bloom.clear();
    this.particles.clear();
    this.root.visible = false;
  }
}
