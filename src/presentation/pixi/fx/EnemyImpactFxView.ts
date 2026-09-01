import { Container, Graphics } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { ENEMY_DEFINITIONS, type EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';

const FULL_CIRCLE = Math.PI * 2;
const HIT_RING_SECONDS = 0.16;
const DEATH_RING_SECONDS = 0.34;
const DUST_COLOR = 0xd8d2c4;

interface ParticleRecipe {
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly lifeSeconds: number;
  readonly drag: number;
  readonly scale: number;
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
  private readonly dustTexture: Texture;
  private readonly quality: FxQuality;
  private readonly reducedMotion: boolean;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    this.quality = quality;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tokens = FX_QUALITY[quality];
    this.ringSlots = Array.from({ length: Math.max(8, Math.floor(tokens.poolCapacity / 8)) }, createRingSlot);
    const particleTexture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 4, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.dustTexture = createTexture(renderer, (graphics) => {
      // At portrait mobile scale, a 3 px source with a 0.42 transform became
      // less than two CSS pixels. Keep this source deliberately legible while
      // retaining a single cached texture and the existing bounded pool.
      graphics.circle(0, 0, 6).fill({ color: 0xffffff, alpha: 0.9 });
    });
    this.particles = new FxPool(particleTexture, Math.max(24, Math.floor(tokens.poolCapacity * 0.55)));
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.rings, this.particles.root);
  }

  public get activeRingCount(): number {
    return this.ringSlots.reduce((count, ring) => count + (ring.active ? 1 : 0), 0);
  }

  public get activeParticleCount(): number {
    return this.particles.activeCount;
  }

  public get isActive(): boolean {
    return this.root.visible;
  }

  /** Starts a short response after an enemy health value decreased. */
  public playHit(x: number, y: number, radius: number, kind: EnemyKind): void {
    const color = ENEMY_DEFINITIONS[kind].color;
    this.spawnRing(x, y, radius * 0.85, radius * 1.4, HIT_RING_SECONDS, color, 2);
    this.root.visible = true;
    if (this.reducedMotion) return;

    const count = this.quality === 'high' ? 4 : this.quality === 'medium' ? 3 : 2;
    this.spawnParticles(x, y, DUST_COLOR, count, {
      minSpeed: 24,
      maxSpeed: 44,
      lifeSeconds: 0.28,
      drag: 0.72,
      scale: Math.max(0.9, radius / 20),
      texture: this.dustTexture,
      alpha: 0.88
    });
  }

  /** Starts a bounded defeat burst; fragments never interact with gameplay. */
  public playDefeat(x: number, y: number, kind: EnemyKind): void {
    const definition = ENEMY_DEFINITIONS[kind];
    const radius = definition.radius;
    this.spawnRing(x, y, radius * 0.58, radius * 1.85, DEATH_RING_SECONDS, definition.color, 3);
    this.root.visible = true;
    if (this.reducedMotion) return;

    const baseCount = kind === 'elite' ? 5 : kind === 'tank' ? 4 : 3;
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
      this.rings.circle(ring.x, ring.y, radius).stroke({ color: ring.color, width: ring.width, alpha });
    }
    this.root.visible = hasActiveRing || this.particles.activeCount > 0;
  }

  public clear(): void {
    for (const ring of this.ringSlots) ring.active = false;
    this.particles.clear();
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
      this.particles.spawn(
        x,
        y,
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
