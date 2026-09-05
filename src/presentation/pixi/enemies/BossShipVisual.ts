import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';

export interface BossShipTextures {
  readonly flat: Texture;
  readonly parts: readonly [Texture, Texture, Texture, Texture];
}

/** One boss assembly, outside the 250-enemy pool. Never owns attack timing. */
export class BossShipVisual {
  public readonly root = new Container();
  private readonly pieces: Sprite[];
  private defeatAge = -1;

  public constructor(textures: BossShipTextures, private readonly quality: FxQuality) {
    this.pieces = (quality === 'low' ? [textures.flat] : textures.parts).map((texture) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      this.root.addChild(sprite);
      return sprite;
    });
    this.root.visible = false;
  }

  public beginFrame(): void {
    if (this.defeatAge < 0) this.root.visible = false;
  }

  public render(state: EnemyRenderState, seconds: number, hitPulse = 0): void {
    if (!state.active || state.kind !== 'boss' || this.defeatAge >= 0) return;
    this.root.visible = true;
    this.root.position.set(state.x, state.y);
    this.root.alpha = Math.max(0.7, state.health / state.maxHealth);
    this.root.scale.set(1 + hitPulse * 0.025);
    if (this.quality === 'low') return;
    // Heavy machinery: minute axial shifts, not an organic flapping motion.
    this.pieces[0].position.y = Math.sin(seconds * 1.8) * 0.45;
    this.pieces[1].scale.x = 1 + Math.sin(seconds * 1.2) * 0.009;
    this.pieces[3].scale.set(1 + Math.sin(seconds * 2.1) * 0.012);
  }

  public playDefeat(x: number, y: number): void {
    this.defeatAge = 0;
    this.root.position.set(x, y);
    this.root.visible = true;
    this.root.scale.set(1);
  }

  public update(deltaSeconds: number): void {
    if (this.defeatAge < 0) return;
    this.defeatAge = Math.min(1.2, this.defeatAge + Math.max(0, deltaSeconds));
    const progress = this.defeatAge / 1.2;
    this.root.alpha = 1 - progress;
    this.root.visible = progress < 1;
    if (this.quality === 'low') {
      this.pieces[0].scale.set(1 - progress * 0.12);
      return;
    }
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      const angle = index * Math.PI / 2 + Math.PI / 4;
      piece.position.set(Math.cos(angle) * progress * 28, Math.sin(angle) * progress * 28);
      piece.rotation = (index % 2 === 0 ? 1 : -1) * progress * 0.18;
    }
  }

  public reset(): void {
    this.defeatAge = -1;
    this.root.visible = false;
    this.root.alpha = 1;
    this.root.scale.set(1);
    for (const piece of this.pieces) {
      piece.position.set(0, 0);
      piece.rotation = 0;
      piece.scale.set(1);
    }
  }
}
