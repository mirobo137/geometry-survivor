import { Container } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';
import { DamageBloomView } from './DamageBloomView';

const FULL_CIRCLE = Math.PI * 2;
const DUST_COLOR = 0xffd29b;

interface ParticleRecipe {
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly lifeSeconds: number;
  readonly drag: number;
  readonly scale: number;
  readonly spawnRadius?: number;
  readonly texture?: Texture;
  readonly alpha?: number;
}

/** Presentation-only enemy impact and defeat recipes. Simulation stays untouched. */
export class EnemyImpactFxView {
  public readonly root = new Container();
  private readonly particles: FxPool;
  private readonly hits: DamageBloomView;
  private readonly dustTexture: Texture;
  private readonly quality: FxQuality;
  private readonly reducedMotion: boolean;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    this.quality = quality;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tokens = FX_QUALITY[quality];
    this.hits = new DamageBloomView('enemy', quality === 'low' ? 8 : quality === 'medium' ? 12 : 16);
    const particleTexture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 4, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.dustTexture = createTexture(renderer, (graphics) => {
      // A tapered hot chip, rasterized once. Velocity aligns its long axis.
      graphics.poly([-8, 0, 2, -1.8, 7, 0, 2, 1.8]).fill({ color: 0xffdeb0 });
      graphics.poly([-3, 0, 2, -.6, 6, 0, 2, .6]).fill({ color: 0xffffff });
    });
    this.particles = new FxPool(particleTexture, Math.max(24, Math.floor(tokens.poolCapacity * 0.55)));
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.particles.root, this.hits.root);
  }

  public get activeBurstCount(): number {
    return this.hits.activeCount;
  }

  public get activeParticleCount(): number {
    return this.particles.activeCount;
  }

  public get isActive(): boolean {
    return this.root.visible;
  }

  /** Starts a short response after an enemy health value decreased. */
  public playHit(x: number, y: number, radius: number, _kind: EnemyKind): void {
    this.hits.play(x, y, radius * 1.35);
    this.root.visible = true;

    if (this.reducedMotion) return;

    const count = this.quality === 'high' ? 4 : this.quality === 'medium' ? 3 : 2;
    this.spawnParticles(x, y, DUST_COLOR, count, {
      minSpeed: 102,
      maxSpeed: 152,
      lifeSeconds: 0.22,
      drag: 0.97,
      scale: Math.max(0.9, radius / 24),
      spawnRadius: radius * .35,
      texture: this.dustTexture,
      alpha: 0.88
    });
  }

  /** Starts a bounded defeat burst; fragments never interact with gameplay. */
  public playDefeat(x: number, y: number, kind: EnemyKind, radius = ENEMY_DEFINITIONS[kind].radius): void {
    // Shared bloom slots switch recipes; neither recipe reads the hull texture.
    this.hits.play(x, y, Math.min(56, radius) * 1.35, true);
    this.root.visible = true;
    if (this.reducedMotion) return;
    const size = Math.min(2.4, Math.max(0.7, radius / 20));
    this.spawnParticles(x, y, DUST_COLOR, FX_QUALITY[this.quality].particleCount, {
      minSpeed: 160 * Math.sqrt(size), maxSpeed: 280 * Math.sqrt(size),
      lifeSeconds: 0.34, drag: 0.985, spawnRadius: radius * 0.18,
      scale: size, texture: this.dustTexture, alpha: 1
    });
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;
    this.particles.update(delta);
    this.hits.update(delta);
    this.root.visible = this.hits.activeCount > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    this.particles.clear();
    this.hits.clear();
    this.root.visible = false;
  }

  private spawnParticles(
    x: number,
    y: number,
    color: number,
    count: number,
    recipe: ParticleRecipe
  ): void {
    const phase = ((Math.abs(x * 0.017 + y * 0.031) % 1) + 1) % 1;
    for (let index = 0; index < count; index += 1) {
      const angle = phase * FULL_CIRCLE + (index / count) * FULL_CIRCLE;
      const speed = recipe.minSpeed + ((index * 17) % 23) / 23 * (recipe.maxSpeed - recipe.minSpeed);
      const spawnRadius = recipe.spawnRadius ?? 0;
      this.particles.spawn(
        x + Math.cos(angle) * spawnRadius,
        y + Math.sin(angle) * spawnRadius,
        color,
        recipe.lifeSeconds + (index % 2) * 0.035,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        recipe.drag,
        recipe.scale,
        recipe.texture,
        recipe.alpha
      );
    }
  }
}
