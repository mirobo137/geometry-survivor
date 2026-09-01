import { Container, Graphics } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { FX_QUALITY, type FxQuality } from '../../../content/visual/VisualTokens';
import { createTexture } from '../TextureFactory';
import { FxPool } from './FxPool';

type TerminalFxKind = 'player' | 'boss';

/** Short terminal burst that never delays the summary or restart flow. */
export class TerminalFxView {
  public readonly root = new Container();
  private readonly ring = new Graphics();
  private readonly tone = new Graphics();
  private readonly particles: FxPool;
  private readonly reducedMotion: boolean;
  private life = 0;
  private maxLife = 0;
  private x = 0;
  private y = 0;
  private radius = 0;
  private color = 0xffffff;
  private toneAlpha = 0;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    const texture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 5, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.particles = new FxPool(texture, Math.max(12, FX_QUALITY[quality].particleCount));
    this.reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.tone, this.ring, this.particles.root);
  }

  public playPlayerDefeat(x: number, y: number): void {
    this.play('player', x, y, 22, 0xff6b9b);
  }

  public playBossDefeat(x: number, y: number, radius: number): void {
    this.play('boss', x, y, radius, 0x75e6ff);
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    this.particles.update(delta);
    if (this.life > 0) this.life = Math.max(0, this.life - delta);
    this.ring.clear();
    this.tone.clear();
    if (this.life > 0) {
      const progress = 1 - this.life / this.maxLife;
      if (this.toneAlpha > 0) {
        this.tone.beginPath().rect(0, 0, 1280, 720)
          .fill({ color: 0x9aa1ad, alpha: this.toneAlpha * (1 - progress * 0.35) });
      }
      this.ring.beginPath().circle(this.x, this.y, this.radius + progress * this.radius * 1.8)
        .stroke({ color: this.color, width: 5 - progress * 2, alpha: (1 - progress) * 0.9 });
    }
    this.root.visible = this.life > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    this.life = 0;
    this.particles.clear();
    this.ring.clear();
    this.tone.clear();
    this.toneAlpha = 0;
    this.root.visible = false;
  }

  private play(kind: TerminalFxKind, x: number, y: number, radius: number, color: number): void {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.maxLife = kind === 'boss' ? 0.78 : 0.9;
    this.toneAlpha = kind === 'player' ? 0.58 : 0.1;
    this.life = this.maxLife;
    this.root.visible = true;
    if (this.reducedMotion) return;
    const count = kind === 'boss' ? 8 : 7;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + Math.PI / 8;
      const speed = kind === 'boss' ? 130 + index * 8 : 112 + index * 10;
      this.particles.spawn(x + Math.cos(angle) * radius * 0.58, y + Math.sin(angle) * radius * 0.58, color,
        this.maxLife, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.97, kind === 'boss' ? 1.2 : 1.05);
    }
  }
}
