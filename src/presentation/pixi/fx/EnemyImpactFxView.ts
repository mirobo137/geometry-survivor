import { Container, Graphics } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';
import { DamageBloomView } from './DamageBloomView';

const FULL_CIRCLE = Math.PI * 2;
const DEATH_RING_SECONDS = 0.34;
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

interface RingSlot {
  active: boolean;
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  lifeSeconds: number;
  maxLifeSeconds: number;
  color: number;
  width: number;
}

const createRingSlot = (): RingSlot => ({
  active: false,
  x: 0,
  y: 0,
  startRadius: 0,
  endRadius: 0,
  lifeSeconds: 0,
  maxLifeSeconds: 0,
  color: 0xffffff,
  width: 2
});

/** Presentation-only enemy impact and defeat recipes. Simulation stays untouched. */
export class EnemyImpactFxView {
  public readonly root = new Container();
  private readonly rings = new Graphics();
  private readonly ringSlots: RingSlot[];
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
    this.ringSlots = Array.from({ length: Math.max(8, Math.floor(tokens.poolCapacity / 8)) }, createRingSlot);
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
    this.root.addChild(this.rings, this.particles.root, this.hits.root);
  }

  public get activeBurstCount(): number {
    return this.hits.activeCount + this.ringSlots.reduce((count, ring) => count + (ring.active ? 1 : 0), 0);
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
  public playDefeat(x: number, y: number, kind: EnemyKind): void {
    const definition = ENEMY_DEFINITIONS[kind];
    const radius = definition.radius;
    this.hits.play(x, y, radius * 1.35);
    this.spawnRing(x, y, radius * 0.58, radius * 1.85, DEATH_RING_SECONDS, definition.color, 3);
    this.root.visible = true;
    if (this.reducedMotion) return;

    const baseCount = kind === 'elite' ? 5 : kind === 'tank' ? 4 : kind === 'splitter' ? 4 : 3;
    const count = Math.min(FX_QUALITY[this.quality].particleCount, baseCount);
    this.spawnParticles(x, y, definition.color, count, {
      minSpeed: 58,
      maxSpeed: 88,
      lifeSeconds: 0.28,
      drag: 0.8,
      scale: Math.max(0.55, radius / 24)
    });
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;
    this.particles.update(delta);
    this.hits.update(delta);
    this.rings.clear();
    let hasActiveRing = false;
    for (const ring of this.ringSlots) {
      if (!ring.active) continue;
      ring.lifeSeconds -= delta;
      if (ring.lifeSeconds <= 0) {
        ring.active = false;
        continue;
      }
      hasActiveRing = true;
      const progress = 1 - ring.lifeSeconds / ring.maxLifeSeconds;
      const radius = ring.startRadius + (ring.endRadius - ring.startRadius) * progress;
      const alpha = (1 - progress) * 0.72;
      this.rings
        .beginPath()
        .circle(ring.x, ring.y, radius)
        .stroke({ color: ring.color, width: ring.width, alpha });
    }
    this.root.visible = hasActiveRing || this.hits.activeCount > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    for (const ring of this.ringSlots) ring.active = false;
    this.particles.clear();
    this.hits.clear();
    this.rings.clear();
    this.root.visible = false;
  }

  private spawnRing(
    x: number,
    y: number,
    startRadius: number,
    endRadius: number,
    lifeSeconds: number,
    color: number,
    width: number
  ): void {
    const ring = this.ringSlots.find((candidate) => !candidate.active);
    if (!ring) return;
    ring.active = true;
    ring.x = x;
    ring.y = y;
    ring.startRadius = Math.max(1, startRadius);
    ring.endRadius = Math.max(ring.startRadius, endRadius);
    ring.lifeSeconds = lifeSeconds;
    ring.maxLifeSeconds = lifeSeconds;
    ring.color = color;
    ring.width = width;
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
