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
  private readonly collapse = new Graphics();
  private readonly core = new Graphics();
  private readonly tone = new Graphics();
  private readonly particles: FxPool;
  private readonly reducedMotion: boolean;
  private life = 0;
  private maxLife = 0;
  private toneLife = 0;
  private maxToneLife = 0;
  private x = 0;
  private y = 0;
  private radius = 0;
  private color = 0xffffff;
  private kind: TerminalFxKind = 'player';
  private toneAlpha = 0;

  public constructor(renderer: Renderer, quality: FxQuality = 'medium') {
    const texture = createTexture(renderer, (graphics) => {
      graphics.regularPoly(0, 0, 5, 4, Math.PI / 4).fill({ color: 0xffffff });
    });
    this.particles = new FxPool(texture, Math.max(12, FX_QUALITY[quality].particleCount));
    this.reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.root.eventMode = 'none';
    this.root.visible = false;
    this.root.addChild(this.tone, this.ring, this.collapse, this.core, this.particles.root);
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
    if (this.toneLife > 0) this.toneLife = Math.max(0, this.toneLife - delta);
    this.ring.clear();
    this.collapse.clear();
    this.core.clear();
    this.tone.clear();
    if (this.toneLife > 0) {
      const toneProgress = 1 - this.toneLife / this.maxToneLife;
      const progress = 1 - this.life / this.maxLife;
      // The world is letterboxed and offset in portrait. Overscan the wash
      // so the gray mood covers the complete presentation in both modes.
      this.tone.beginPath().rect(-320, -300, 1920, 1320)
        .fill({ color: 0x9aa1ad, alpha: this.toneAlpha * (1 - toneProgress * 0.35) });
      if (this.life <= 0) {
        this.root.visible = this.toneLife > 0 || this.particles.activeCount > 0;
        return;
      }
      const expansion = this.kind === 'player' ? 3.4 : 1.8;
      this.ring.beginPath().circle(this.x, this.y, this.radius + progress * this.radius * expansion)
        .stroke({ color: this.color, width: this.kind === 'player' ? 6 - progress * 3 : 5 - progress * 2, alpha: (1 - progress) * 0.9 });
      if (this.kind === 'boss') this.renderBossCollapse(progress);
    }
    this.root.visible = this.life > 0 || this.toneLife > 0 || this.particles.activeCount > 0;
  }

  public clear(): void {
    this.life = 0;
    this.toneLife = 0;
    this.maxToneLife = 0;
    this.particles.clear();
    this.ring.clear();
    this.collapse.clear();
    this.core.clear();
    this.tone.clear();
    this.toneAlpha = 0;
    this.root.visible = false;
  }

  private play(kind: TerminalFxKind, x: number, y: number, radius: number, color: number): void {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.maxLife = kind === 'boss' ? 1.2 : 2.2;
    this.maxToneLife = kind === 'player' ? 3 : this.maxLife;
    this.toneAlpha = kind === 'player' ? 0.58 : 0.1;
    this.life = this.maxLife;
    this.toneLife = this.maxToneLife;
    this.root.visible = true;
    if (this.reducedMotion) return;
    const count = kind === 'boss' ? 8 : this.reducedMotion ? 0 : 10;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + Math.PI / 8;
      const speed = kind === 'boss' ? 130 + index * 8 : 126 + index * 13;
      this.particles.spawn(x + Math.cos(angle) * radius * 0.58, y + Math.sin(angle) * radius * 0.58, color,
        this.maxLife, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.985, kind === 'boss' ? 1.2 : 1.2,
        undefined, kind === 'boss' ? 1 : 0.92);
    }
  }

  private renderBossCollapse(progress: number): void {
    const split = Math.min(1, Math.max(0, (progress - 0.22) / 0.78));
    const collapseRadius = this.radius * (0.42 + progress * 1.28);
    const separation = this.radius * 0.95 * split;
    const ringAlpha = (1 - progress) * 0.82;
    // Two independently started paths avoid Pixi's inherited subpath joining.
    this.collapse.beginPath().circle(this.x - separation, this.y, collapseRadius)
      .stroke({ color: 0xff6cf2, width: 4 - progress * 2, alpha: ringAlpha });
    this.collapse.beginPath().circle(this.x + separation, this.y, collapseRadius * (0.82 + progress * 0.18))
      .stroke({ color: 0x75e6ff, width: 3 - progress * 1.5, alpha: ringAlpha * 0.9 });

    const centralAlpha = progress < 0.38 ? 0.95 : Math.max(0, 1 - progress) * 0.95;
    const centralRadius = this.radius * (0.42 - Math.min(0.22, progress * 0.22));
    this.core.beginPath().circle(this.x, this.y, centralRadius)
      .fill({ color: 0x241044, alpha: centralAlpha })
      .stroke({ color: 0xffe8ff, width: 3, alpha: centralAlpha });
    if (split > 0) {
      const shardAlpha = (1 - split) * 0.88;
      this.core.beginPath().circle(this.x - separation, this.y - this.radius * 0.28 * split, this.radius * 0.11)
        .fill({ color: 0x75e6ff, alpha: shardAlpha });
      this.core.beginPath().circle(this.x + separation, this.y + this.radius * 0.28 * split, this.radius * 0.11)
        .fill({ color: 0xffd166, alpha: shardAlpha });
    }
  }
}
