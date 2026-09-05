import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../config/constants';
import {
  getBackgroundDefinition,
  type BackgroundDefinition,
  type BackgroundId,
  type BackgroundPattern
} from '../../content/visual/BackgroundDefinitions';
import type { FxQuality } from '../../content/visual/VisualTokens';
import { createTexture } from './TextureFactory';

const STAR_POINTS = [
  [0.08, 0.16, 1.2], [0.17, 0.74, 1.6], [0.25, 0.29, 0.9], [0.32, 0.86, 1.3],
  [0.39, 0.12, 1.7], [0.47, 0.68, 1], [0.54, 0.24, 1.25], [0.61, 0.9, 0.8],
  [0.68, 0.11, 1.45], [0.74, 0.57, 1.1], [0.81, 0.22, 0.75], [0.9, 0.77, 1.55],
  [0.94, 0.38, 0.9], [0.12, 0.48, 0.75], [0.22, 0.1, 1.15], [0.36, 0.49, 0.7],
  [0.43, 0.78, 1.45], [0.58, 0.52, 0.8], [0.65, 0.34, 1.05], [0.77, 0.88, 0.75],
  [0.86, 0.08, 1.2], [0.97, 0.62, 0.65], [0.05, 0.9, 0.8], [0.52, 0.07, 0.7],
  [0.72, 0.38, 1.3], [0.29, 0.63, 0.85], [0.89, 0.51, 0.95], [0.15, 0.22, 0.65],
  [0.48, 0.42, 1.1], [0.63, 0.76, 0.7], [0.34, 0.23, 0.75], [0.83, 0.68, 1.15],
  [0.1, 0.61, 0.65], [0.57, 0.14, 0.9]
] as const;

const QUALITY_STAR_LIMIT: Readonly<Record<FxQuality, number>> = {
  low: 12,
  medium: 24,
  high: STAR_POINTS.length
};

const QUALITY_AMBIENT_LIMIT: Readonly<Record<FxQuality, number>> = {
  low: 0,
  medium: 10,
  high: 18
};

const QUALITY_NEBULA_COUNT: Readonly<Record<FxQuality, number>> = {
  low: 2,
  medium: 2,
  high: 3
};

const drawCircle = (graphics: Graphics, x: number, y: number, radius: number, color: number, alpha: number): void => {
  graphics.beginPath().circle(x, y, radius).fill({ color, alpha });
};

const drawLine = (graphics: Graphics, startX: number, startY: number, endX: number, endY: number, color: number, width: number, alpha: number): void => {
  graphics.beginPath().moveTo(startX, startY).lineTo(endX, endY).stroke({ color, width, alpha });
};

interface StarSlot {
  readonly sprite: Sprite;
  readonly baseAlpha: number;
  readonly speed: number;
  readonly phase: number;
}

interface AmbientParticle {
  readonly sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  speed: number;
  phase: number;
}

interface NebulaSlot {
  readonly sprite: Sprite;
  readonly breathSpeed: number;
  readonly breathPhase: number;
  baseScale: number;
  readonly breathAmplitude: number;
}

type AmbientBehavior = 'drift' | 'float-up' | 'electric' | 'rotate';

const PATTERN_BEHAVIOR: Readonly<Record<BackgroundPattern, AmbientBehavior>> = {
  constellation: 'drift',
  nebula: 'electric',
  solar: 'float-up',
  crystal: 'rotate'
};

/**
 * Atmospheric background with animated layers. The static base is redrawn only
 * on theme/viewport changes. Stars twinkle, nebulae breathe and ambient
 * particles drift — all using pooled sprites, no allocations in the ticker.
 */
export class BackgroundView {
  public readonly root = new Container();
  private readonly staticArt = new Graphics();
  private readonly starLayer = new Container();
  private readonly nebulaLayer = new Container();
  private readonly ambientLayer = new Container();
  private readonly quality: FxQuality;
  private readonly renderer: Renderer;
  private width = LOGICAL_WIDTH;
  private height = LOGICAL_HEIGHT;
  private _backgroundId: BackgroundId = 'deep-space';
  private stars: StarSlot[] = [];
  private ambientParticles: AmbientParticle[] = [];
  private nebulae: NebulaSlot[] = [];
  private parallaxStrength = 0.02;
  private playerX = 0;
  private playerY = 0;
  private dotTexture: Texture | null = null;
  private nebulaTexture: Texture | null = null;

  public constructor(renderer: Renderer, backgroundId: BackgroundId = 'deep-space', quality: FxQuality = 'medium') {
    this.renderer = renderer;
    this.quality = quality;
    this.root.eventMode = 'none';
    this.root.addChild(this.staticArt, this.nebulaLayer, this.starLayer, this.ambientLayer);
    this.ensureTextures();
    this.setBackground(backgroundId);
  }

  public get backgroundId(): BackgroundId {
    return this._backgroundId;
  }

  public resize(width: number, height: number): void {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    if (nextWidth === this.width && nextHeight === this.height) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.rebuild();
  }

  public setBackground(backgroundId: BackgroundId): void {
    if (this._backgroundId === backgroundId && this.stars.length > 0) return;
    this._backgroundId = backgroundId;
    this.rebuild();
  }

  /** Call once per frame with the player world position for parallax. */
  public setPlayerPosition(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
  }

  /** Advances all animated layers. Call every frame with presentation delta. */
  public update(deltaSeconds: number, animationSeconds: number): void {
    // Low retains the composition, but no ambient motion or twinkle work.
    if (this.quality === 'low') return;
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);

    // Parallax offset based on player position
    const parallaxX = -this.playerX * this.parallaxStrength;
    const parallaxY = -this.playerY * this.parallaxStrength;
    this.starLayer.position.set(parallaxX * 0.5, parallaxY * 0.5);
    this.ambientLayer.position.set(parallaxX, parallaxY);

    // Twinkle stars
    for (const star of this.stars) {
      star.sprite.alpha = star.baseAlpha * (0.55 + 0.45 * Math.sin(animationSeconds * star.speed + star.phase));
    }

    // Breathe nebulae
    for (const nebula of this.nebulae) {
      const breath = Math.sin(animationSeconds * nebula.breathSpeed + nebula.breathPhase);
      nebula.sprite.scale.set(nebula.baseScale * (1 + breath * nebula.breathAmplitude));
      nebula.sprite.alpha = 0.24 + breath * 0.035;
    }

    // Move ambient particles
    for (const particle of this.ambientParticles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      // Wrap around with margin
      if (particle.x < -20) particle.x = this.width + 20;
      if (particle.x > this.width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = this.height + 20;
      if (particle.y > this.height + 20) particle.y = -20;
      particle.sprite.position.set(particle.x, particle.y);
      particle.sprite.alpha = particle.baseAlpha * (0.5 + 0.5 * Math.sin(animationSeconds * particle.speed + particle.phase));
    }
  }

  private ensureTextures(): void {
    if (this.dotTexture) return;
    this.dotTexture = createTexture(this.renderer, (graphics) => {
      graphics.circle(0, 0, 4).fill({ color: 0xffffff, alpha: 1 });
    });
    this.nebulaTexture = createTexture(this.renderer, (graphics) => {
      // Bake a feathered falloff once into 128x128. No filter or shader per frame.
      for (let radius = 64; radius >= 2; radius -= 2) {
        graphics.beginPath().circle(0, 0, radius).fill({ color: 0xffffff, alpha: 0.025 });
      }
    });
  }

  private rebuild(): void {
    const definition = getBackgroundDefinition(this._backgroundId);
    this.renderStaticBase(definition);
    this.rebuildStars(definition);
    this.rebuildNebulae(definition);
    this.rebuildAmbientParticles(definition);
  }

  private renderStaticBase(definition: BackgroundDefinition): void {
    const { tokens } = definition;
    this.staticArt.clear();
    this.staticArt.beginPath().rect(0, 0, this.width, this.height).fill({ color: tokens.base, alpha: 1 });
    this.drawPattern(tokens.pattern, tokens.accent, tokens.secondary);
  }

  private rebuildStars(definition: BackgroundDefinition): void {
    const limit = QUALITY_STAR_LIMIT[this.quality];
    const { tokens } = definition;
    // Reuse existing sprites or create/remove as needed
    while (this.stars.length > limit) {
      const removed = this.stars.pop()!;
      this.starLayer.removeChild(removed.sprite);
    }
    this.ensureTextures();
    for (let index = 0; index < limit; index += 1) {
      const [x, y, radius] = STAR_POINTS[index];
      const color = index % 4 === 0 ? tokens.secondary : tokens.accent;
      const baseAlpha = 0.2 + (index % 3) * 0.12;
      if (index < this.stars.length) {
        const star = this.stars[index];
        star.sprite.position.set(x * this.width, y * this.height);
        star.sprite.tint = color;
        star.sprite.scale.set(radius * 0.5);
      } else {
        const sprite = new Sprite(this.dotTexture!);
        sprite.anchor.set(0.5);
        sprite.position.set(x * this.width, y * this.height);
        sprite.tint = color;
        sprite.scale.set(radius * 0.5);
        sprite.alpha = baseAlpha;
        this.starLayer.addChild(sprite);
        this.stars.push({
          sprite,
          baseAlpha,
          speed: 1.2 + (index % 7) * 0.6,
          phase: index * 1.37
        });
      }
    }
  }

  private rebuildNebulae(definition: BackgroundDefinition): void {
    const count = QUALITY_NEBULA_COUNT[this.quality];
    const { tokens } = definition;
    while (this.nebulae.length > count) {
      const removed = this.nebulae.pop()!;
      this.nebulaLayer.removeChild(removed.sprite);
    }
    this.ensureTextures();
    const positions = {
      constellation: [[0.12, 0.24, 0.32], [0.88, 0.8, 0.3], [0.7, 0.1, 0.2]],
      nebula: [[0.14, 0.72, 0.4], [0.85, 0.22, 0.38], [0.85, 0.8, 0.22]],
      solar: [[0.88, 0.2, 0.42], [0.15, 0.82, 0.3], [0.7, 0.82, 0.22]],
      crystal: [[0.1, 0.18, 0.3], [0.87, 0.74, 0.34], [0.4, 0.9, 0.18]]
    }[tokens.pattern];
    for (let index = 0; index < count; index += 1) {
      const [px, py, sizeRatio] = positions[index] ?? [0.5, 0.5, 0.15];
      const baseScale = this.width * sizeRatio / 64;
      const color = index % 2 === 0 ? tokens.glow : tokens.secondary;
      if (index < this.nebulae.length) {
        const nebula = this.nebulae[index];
        nebula.sprite.position.set(px * this.width, py * this.height);
        nebula.sprite.tint = color;
        nebula.baseScale = baseScale;
        nebula.sprite.scale.set(baseScale);
      } else {
        const sprite = new Sprite(this.nebulaTexture!);
        sprite.anchor.set(0.5);
        sprite.position.set(px * this.width, py * this.height);
        sprite.tint = color;
        sprite.alpha = 0.24;
        sprite.scale.set(baseScale);
        this.nebulaLayer.addChild(sprite);
        this.nebulae.push({
          sprite,
          breathSpeed: 0.3 + index * 0.15,
          breathPhase: index * 2.1,
          baseScale,
          breathAmplitude: 0.035
        });
      }
    }
  }

  private rebuildAmbientParticles(definition: BackgroundDefinition): void {
    const count = QUALITY_AMBIENT_LIMIT[this.quality];
    const { tokens } = definition;
    const behavior = PATTERN_BEHAVIOR[tokens.pattern];
    while (this.ambientParticles.length > count) {
      const removed = this.ambientParticles.pop()!;
      this.ambientLayer.removeChild(removed.sprite);
    }
    this.ensureTextures();
    for (let index = 0; index < count; index += 1) {
      const x = ((index * 0.618 + 0.1) % 1) * this.width;
      const y = ((index * 0.414 + 0.2) % 1) * this.height;
      const { vx, vy } = this.getAmbientVelocity(behavior, index);
      if (index < this.ambientParticles.length) {
        const p = this.ambientParticles[index];
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.sprite.tint = index % 3 === 0 ? tokens.secondary : tokens.accent;
        p.sprite.position.set(x, y);
      } else {
        const sprite = new Sprite(this.dotTexture!);
        sprite.anchor.set(0.5);
        sprite.position.set(x, y);
        sprite.tint = index % 3 === 0 ? tokens.secondary : tokens.accent;
        sprite.scale.set(0.3 + (index % 4) * 0.15);
        sprite.alpha = 0.25;
        this.ambientLayer.addChild(sprite);
        this.ambientParticles.push({
          sprite, x, y, vx, vy,
          baseAlpha: 0.18 + (index % 5) * 0.06,
          speed: 0.8 + (index % 6) * 0.35,
          phase: index * 0.89
        });
      }
    }
  }

  private getAmbientVelocity(behavior: AmbientBehavior, index: number): { vx: number; vy: number } {
    const sign = index % 2 === 0 ? 1 : -1;
    const speed = 6 + (index % 5) * 3;
    switch (behavior) {
      case 'drift':
        return { vx: sign * speed * 0.7, vy: speed * 0.3 };
      case 'float-up':
        return { vx: sign * speed * 0.2, vy: -speed };
      case 'electric':
        return { vx: sign * speed * 1.2, vy: sign * speed * 0.5 * (index % 3 === 0 ? -1 : 1) };
      case 'rotate':
        return { vx: sign * speed * 0.5, vy: speed * 0.5 * (index % 3 === 0 ? -1 : 1) };
    }
  }

  private drawPattern(pattern: BackgroundPattern, primary: number, secondary: number): void {
    if (pattern === 'constellation') {
      const points = [
        [0.08, 0.16], [0.25, 0.29], [0.39, 0.12], [0.54, 0.24], [0.68, 0.11], [0.81, 0.22]
      ] as const;
      for (let index = 0; index < points.length - 1; index += 1) {
        const [startX, startY] = points[index];
        const [endX, endY] = points[index + 1];
        drawLine(this.staticArt, startX * this.width, startY * this.height, endX * this.width, endY * this.height, primary, 1, 0.11);
      }
      return;
    }

    if (pattern === 'nebula') {
      // Broad currents, not lightning: no resemblance to an attack telegraph.
      for (let index = 0; index < 3; index += 1) {
        const offset = index * this.height * 0.04;
        this.staticArt.beginPath().moveTo(0, this.height * 0.8 + offset)
          .bezierCurveTo(this.width * 0.14, this.height * 0.42 + offset,
            this.width * 0.72, this.height * 0.28 + offset, this.width, this.height * 0.05 + offset)
          .stroke({ color: secondary, width: 12 - index * 3, alpha: 0.025 });
      }
      return;
    }

    if (pattern === 'solar') {
      const centerX = this.width * 0.9;
      const centerY = this.height * 0.18;
      for (const radius of [0.2, 0.31, 0.42] as const) {
        this.staticArt.beginPath()
          .arc(centerX, centerY, this.width * radius, Math.PI * 0.7, Math.PI * 1.72)
          .stroke({ color: primary, width: 1.5, alpha: 0.09 });
      }
      drawCircle(this.staticArt, centerX, centerY, this.width * 0.045, secondary, 0.13);
      return;
    }

    // Four distant facets at the periphery, not a grid over the playable center.
    for (const [px, py, size] of [[0.1, 0.24, 0.1], [0.88, 0.18, 0.07], [0.83, 0.8, 0.11], [0.18, 0.87, 0.06]]) {
      const x = this.width * px;
      const y = this.height * py;
      const r = Math.min(this.width, this.height) * size;
      this.staticArt.beginPath().moveTo(x, y - r).lineTo(x + r * 0.6, y)
        .lineTo(x, y + r).lineTo(x - r * 0.6, y).closePath()
        .fill({ color: primary, alpha: 0.045 });
      this.staticArt.beginPath().moveTo(x, y - r).lineTo(x, y + r)
        .lineTo(x - r * 0.6, y).closePath().fill({ color: secondary, alpha: 0.035 });
    }
  }
}
