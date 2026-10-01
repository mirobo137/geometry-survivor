import { Container, Sprite, Texture } from 'pixi.js';
import type { FxQuality } from '../../../../content/visual/VisualTokens';
import { getArsenalTexture } from '../../weapons/ArsenalTextures';

/** One glass shell + one impact shell, pooled and local to the player. */
export class RechargeableShieldView {
  public readonly root = new Container();
  private readonly shell = new Sprite(Texture.EMPTY);
  private readonly burst = new Sprite(Texture.EMPTY);
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(private readonly quality: FxQuality) {
    this.root.eventMode = 'none';
    this.root.addChild(this.shell, this.burst);
    this.shell.anchor.set(0.5);
    this.burst.anchor.set(0.5);
    this.reset();
  }

  public render(charge: number, blockProgress: number, seconds: number): boolean {
    this.reset();
    if (this.root.destroyed || (charge <= 0 && blockProgress >= 1)) return false;
    const texture = getArsenalTexture('recharging_shield');
    if (!texture) return false;
    this.shell.texture = this.burst.texture = texture;
    this.shell.visible = charge > 0;
    this.shell.scale.set(33 / 110);
    this.shell.alpha = (0.14 + Math.min(1, charge) * 0.7) * (this.quality === 'low' ? 0.8 : 1);
    this.shell.rotation = this.reducedMotion ? 0 : seconds * 0.14;
    if (blockProgress < 1) {
      this.burst.visible = true;
      this.burst.scale.set((33 + blockProgress * 20) / 110);
      this.burst.alpha = Math.sin(blockProgress * Math.PI) * 0.9;
      this.burst.tint = 0xffdc8f;
      this.burst.rotation = this.reducedMotion ? 0 : -blockProgress * 0.25;
    }
    return true;
  }

  public reset(): void { this.shell.visible = this.burst.visible = false; }
}
