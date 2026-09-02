import { Container, Graphics, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import type { LevelUpCardInteractionKind } from '../../../../ui/level-up/LevelUpCardInteraction';
import type { UpgradeCardTone } from '../../../../ui/level-up/UpgradeCardVisual';
import { createTexture } from '../../TextureFactory';

const FULL_CIRCLE = Math.PI * 2;
const MAX_PARTICLES = 24;
const PARTICLE_LIFETIME_SECONDS = 0.58;

export interface LevelUpCardAnchor {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tone: UpgradeCardTone;
}

export const LEVEL_UP_FX_COLORS: Readonly<Record<UpgradeCardTone, number>> = {
  cyan: 0x75e6ff,
  gold: 0xffe39a,
  violet: 0xd2a8ff,
  amber: 0xffb86b,
  rose: 0xff92a3,
  mint: 0xb8ffd9
};

interface ParticleState {
  readonly sprite: Sprite;
  lifeSeconds: number;
  maxLifeSeconds: number;
  velocityX: number;
  velocityY: number;
  drag: number;
}

/**
 * Presentation-only feedback for the HTML level-up cards.
 *
 * The cards remain native DOM controls. This layer receives semantic focus /
 * selection events and draws cheap Pixi geometry behind them, so gameplay and
 * pointer mapping never depend on a visual effect.
 */
export class LevelUpFxView {
  public readonly root = new Container();
  private readonly aura = new Graphics();
  private readonly auraCore = new Graphics();
  private readonly ring = new Graphics();
  private readonly rays = new Graphics();
  private readonly particleLayer = new Container();
  private readonly particles: ParticleState[] = [];
  private readonly reducedMotion: boolean;
  private anchors: readonly LevelUpCardAnchor[] = [];
  private focusedIndex: number | null = null;
  private selectedIndex: number | null = null;
  private selectedTimeSeconds = 0;
  private elapsedSeconds = 0;

  public constructor(renderer: Renderer) {
    const particleTexture: Texture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 5, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.particleLayer.blendMode = 'add';
    this.root.eventMode = 'none';
    this.root.addChild(this.aura, this.auraCore, this.ring, this.rays, this.particleLayer);
    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      const sprite = new Sprite(particleTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.particleLayer.addChild(sprite);
      this.particles.push({
        sprite,
        lifeSeconds: 0,
        maxLifeSeconds: PARTICLE_LIFETIME_SECONDS,
        velocityX: 0,
        velocityY: 0,
        drag: 0.9
      });
    }
    this.root.visible = false;
  }

  public open(anchors: readonly LevelUpCardAnchor[]): void {
    this.anchors = anchors.map((anchor) => ({ ...anchor }));
    this.focusedIndex = null;
    this.selectedIndex = null;
    this.selectedTimeSeconds = 0;
    this.elapsedSeconds = 0;
    this.clearParticles();
    this.clearGraphics();
    this.root.visible = this.anchors.length > 0;
  }

  public close(): void {
    this.root.visible = false;
    this.anchors = [];
    this.focusedIndex = null;
    this.selectedIndex = null;
    this.selectedTimeSeconds = 0;
    this.clearParticles();
    this.clearGraphics();
  }

  public handleInteraction(kind: LevelUpCardInteractionKind, index: number): void {
    if (!this.root.visible || !this.findAnchor(index)) return;
    if (kind === 'focus' || kind === 'press') {
      this.focusedIndex = index;
      return;
    }
    if (kind === 'blur') {
      if (this.selectedIndex === null) this.focusedIndex = null;
      return;
    }

    this.selectedIndex = index;
    this.focusedIndex = index;
    this.selectedTimeSeconds = 0;
    if (!this.reducedMotion) this.spawnBurst(this.findAnchor(index) as LevelUpCardAnchor);
  }

  public update(deltaSeconds: number): void {
    if (!this.root.visible) return;
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    this.elapsedSeconds += delta;
    if (this.selectedIndex !== null) this.selectedTimeSeconds += delta;
    const activeIndex = this.selectedIndex ?? this.focusedIndex;
    const anchor = activeIndex === null ? undefined : this.findAnchor(activeIndex);
    this.renderAura(anchor);
    this.updateParticles(delta);
  }

  private renderAura(anchor: LevelUpCardAnchor | undefined): void {
    this.clearGraphics();
    if (!anchor) return;

    const color = LEVEL_UP_FX_COLORS[anchor.tone];
    const pulse = 0.5 + Math.sin(this.elapsedSeconds * 5.5) * 0.5;
    const selected = this.selectedIndex === anchor.index;
    const padding = selected ? 12 + pulse * 5 : 8 + pulse * 3;
    const left = anchor.x - anchor.width * 0.5 - padding;
    const top = anchor.y - anchor.height * 0.5 - padding;
    const width = anchor.width + padding * 2;
    const height = anchor.height + padding * 2;
    const alpha = selected ? 0.3 + pulse * 0.2 : 0.12 + pulse * 0.1;

    this.aura
      .roundRect(left, top, width, height, 18)
      .stroke({ color, width: selected ? 6 : 4, alpha });
    this.auraCore
      .roundRect(left + 5, top + 5, width - 10, height - 10, 14)
      .stroke({ color, width: 1.5, alpha: alpha + 0.16 });

    if (!selected || this.reducedMotion) return;
    const progress = Math.min(1, this.selectedTimeSeconds / 0.58);
    const ringRadius = Math.max(width, height) * 0.32 + progress * 45;
    this.ring
      .beginPath()
      .circle(anchor.x, anchor.y, ringRadius)
      .stroke({ color, width: 3 + (1 - progress) * 3, alpha: (1 - progress) * 0.72 });

    const rayRadius = Math.max(width, height) * 0.5 + 14 + progress * 18;
    const rayLength = 10 + (1 - progress) * 12;
    for (let index = 0; index < 8; index += 1) {
      const angle = index * (FULL_CIRCLE / 8) + Math.PI / 8;
      const startX = anchor.x + Math.cos(angle) * rayRadius;
      const startY = anchor.y + Math.sin(angle) * rayRadius;
      const endX = anchor.x + Math.cos(angle) * (rayRadius + rayLength);
      const endY = anchor.y + Math.sin(angle) * (rayRadius + rayLength);
      this.rays
        .beginPath()
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ color, width: 2, alpha: (1 - progress) * 0.65 });
    }
  }

  private spawnBurst(anchor: LevelUpCardAnchor): void {
    const color = LEVEL_UP_FX_COLORS[anchor.tone];
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      const angle = (index / this.particles.length) * FULL_CIRCLE + Math.PI / 16;
      // Start just outside the card so the DOM surface cannot occlude the
      // burst. The logical offset is scaled with the same viewport as Pixi.
      const edgeX = anchor.width * 0.5 + 24 + (index % 3) * 4;
      const edgeY = anchor.height * 0.5 + 24 + ((index + 1) % 3) * 4;
      particle.lifeSeconds = PARTICLE_LIFETIME_SECONDS + (index % 4) * 0.06;
      particle.maxLifeSeconds = particle.lifeSeconds;
      particle.velocityX = Math.cos(angle) * (65 + (index % 3) * 16);
      particle.velocityY = Math.sin(angle) * (65 + ((index + 1) % 3) * 16);
      particle.drag = 0.86 + (index % 3) * 0.025;
      particle.sprite.position.set(anchor.x + Math.cos(angle) * edgeX, anchor.y + Math.sin(angle) * edgeY);
      particle.sprite.tint = color;
      particle.sprite.alpha = 0.95;
      particle.sprite.scale.set(0.9 + (index % 3) * 0.2);
      particle.sprite.rotation = angle;
      particle.sprite.visible = true;
    }
  }

  private updateParticles(delta: number): void {
    for (const particle of this.particles) {
      if (!particle.sprite.visible) continue;
      particle.lifeSeconds -= delta;
      if (particle.lifeSeconds <= 0) {
        particle.sprite.visible = false;
        continue;
      }
      particle.velocityX *= Math.pow(particle.drag, delta * 60);
      particle.velocityY *= Math.pow(particle.drag, delta * 60);
      particle.sprite.x += particle.velocityX * delta;
      particle.sprite.y += particle.velocityY * delta;
      const lifeRatio = Math.max(0, particle.lifeSeconds / particle.maxLifeSeconds);
      particle.sprite.alpha = lifeRatio * lifeRatio;
      particle.sprite.scale.set(0.45 + lifeRatio * 1.05);
    }
  }

  private findAnchor(index: number): LevelUpCardAnchor | undefined {
    return this.anchors.find((anchor) => anchor.index === index);
  }

  private clearParticles(): void {
    for (const particle of this.particles) particle.sprite.visible = false;
  }

  private clearGraphics(): void {
    this.aura.clear();
    this.auraCore.clear();
    this.ring.clear();
    this.rays.clear();
  }
}
