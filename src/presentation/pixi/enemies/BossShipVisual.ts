import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { BossId } from '../../../content/bosses/BossDefinition';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';
import { createDefeatFragments, defeatCompression, ENEMY_DEFEAT_SECONDS, poseDefeatFragments } from './SingleImageDefeat';

export interface BossShipTextures {
  flat: Texture;
  /** Legacy fixtures only; rendering never assembles separate layers. */
  readonly parts?: readonly [Texture, Texture, Texture, Texture];
}

export type BossShipTextureMap = Readonly<Record<'core-sentinel' | 'orbital-warden', BossShipTextures>>
  & Readonly<Partial<Record<Exclude<BossId, 'core-sentinel' | 'orbital-warden'>, BossShipTextures>>>;

/** Complete hull with a depth arrival; extra sprites are defeat fragments only. */
export class BossShipVisual {
  public readonly root = new Container();
  private readonly pieces: Sprite[];
  private defeatAge = -1;
  private defeatAlpha = 1;
  private defeatScale = 1;
  private readonly fragments = new Map<Texture, readonly Texture[]>();
  private bossId: BossId = 'core-sentinel';
  private readonly textures: BossShipTextureMap;
  private readonly motionReduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(
    textures: BossShipTextureMap | BossShipTextures,
    private readonly quality: FxQuality
  ) {
    this.textures = 'core-sentinel' in textures
      ? textures
      : { 'core-sentinel': textures, 'orbital-warden': textures, 'fracture-engine': textures };
    const initial = this.textures[this.bossId] ?? this.textures['core-sentinel'];
    this.pieces = Array.from({ length: quality === 'low' ? 1 : 4 }, () => {
      const texture = initial.flat;
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      return sprite;
    });
    // Stable sprite order also keeps the four death fragments aligned with
    // their matching regions of the complete hull.
    this.root.addChild(...this.pieces);
    this.root.visible = false;
    this.prepareFragments(initial.flat);
    this.root.once('destroyed', () => {
      for (const fragments of this.fragments.values()) for (const texture of fragments) texture.destroy(false);
      this.fragments.clear();
    });
  }

  public setBossId(bossId: BossId): void {
    if (this.bossId === bossId) return;
    this.bossId = bossId;
    const textures = this.textures[bossId] ?? this.textures['core-sentinel'];
    this.prepareFragments(textures.flat);
    if (this.quality === 'low') {
      this.pieces[0].texture = textures.flat;
      return;
    }
    for (let index = 0; index < this.pieces.length; index += 1) {
      this.pieces[index].texture = textures.flat;
    }
  }

  /** Apply a decoded hull without restarting the entrance progress. */
  public refreshBodyTexture(previousFlat: Texture): void {
    const body = (this.textures[this.bossId] ?? this.textures['core-sentinel']).flat;
    this.prepareFragments(body);
    if (this.defeatAge < 0) for (const piece of this.pieces) {
      if (piece.texture === previousFlat) piece.texture = body;
    }
  }

  public beginFrame(): void {
    if (this.defeatAge < 0) this.root.visible = false;
  }

  public render(state: EnemyRenderState, _seconds: number, hitPulse = 0, introProgress = 1): void {
    if (!state.active || state.kind !== 'boss' || this.defeatAge >= 0) return;
    const progress = Math.max(0, Math.min(1, introProgress));
    this.root.visible = true;
    this.root.position.set(state.x, state.y);
    this.root.alpha = Math.max(0.7, state.health / state.maxHealth);
    this.root.scale.set(1 + hitPulse * 0.025);
    if (progress < 1) this.root.rotation = 0;
    else if (this.bossId === 'orbital-warden' && Math.hypot(state.vx,state.vy)>1) {
      this.root.rotation = Math.atan2(state.vy,state.vx)+Math.PI/2;
    }
    const body = (this.textures[this.bossId] ?? this.textures['core-sentinel']).flat;
    const hull = this.pieces[0];
    for (let index = 0; index < this.pieces.length; index++) {
      const piece = this.pieces[index];
      piece.texture = body;
      piece.visible = index === 0;
      piece.position.set(0, 0);
      piece.scale.set(1);
      piece.rotation = 0;
      piece.alpha = 1;
      piece.tint = 0xffffff;
      piece.blendMode = 'normal';
    }
    if (progress >= 1) return;
    if (this.motionReduced) { hull.alpha = 0.4 + 0.6 * progress; return; }
    const orbital = this.bossId === 'orbital-warden';
    const fracture = this.bossId === 'fracture-engine';
    // Anticipation → emergence → recoil → settled hull. Progress is the
    // simulation's intro clock, so pause/retry cannot desynchronise the arrival.
    const emerge = Math.max(0, Math.min(1, (progress - 0.22) / 0.4));
    const depth = 1 - Math.pow(1 - emerge, 3);
    const settle = Math.max(0, Math.min(1, (progress - 0.62) / 0.38));
    const recoil = Math.sin(settle * Math.PI * 2) * Math.pow(1 - settle, 2) * 0.14;
    hull.alpha = Math.min(1, emerge * 3);
    const scale = 0.12 + depth * 0.88 + recoil;
    // The hull stays centered on its logical position throughout the entrance.
    hull.scale.set(scale * (fracture ? 0.45 + depth * 0.55 : 1), scale);
    hull.rotation = orbital ? -(1 - depth) * 0.85 : fracture ? (1 - depth) * 0.1 : 0;
  }

  public playDefeat(x: number, y: number): void {
    if (this.defeatAge >= 0) return;
    this.defeatAlpha = this.root.alpha;
    this.defeatScale = this.root.scale.x;
    this.defeatAge = 0;
    this.root.position.set(x, y);
    const body = (this.textures[this.bossId] ?? this.textures['core-sentinel']).flat;
    const fragments = this.fragments.get(body);
    this.root.visible = Boolean(fragments);
    if (!fragments) return;
    for (let index = 0; index < this.pieces.length; index += 1) {
      this.pieces[index].texture = fragments[index];
      this.pieces[index].visible = true;
      this.pieces[index].blendMode = 'normal';
    }
    poseDefeatFragments(this.pieces, body, 0);
  }

  public update(deltaSeconds: number): void {
    if (this.defeatAge < 0) return;
    this.defeatAge = Math.min(ENEMY_DEFEAT_SECONDS, this.defeatAge + Math.min(0.1, Math.max(0, deltaSeconds)));
    const progress = this.defeatAge / ENEMY_DEFEAT_SECONDS;
    const body = (this.textures[this.bossId] ?? this.textures['core-sentinel']).flat;
    this.root.alpha = this.defeatAlpha * (1 - progress * progress);
    this.root.scale.set(this.defeatScale * defeatCompression(progress));
    if (!this.fragments.has(body)) { this.root.visible = false; return; }
    this.root.visible = progress < 1;
    poseDefeatFragments(this.pieces, body, progress);
  }

  public reset(): void {
    // A reset clears transient defeat animation only. The visual instance is
    // permanently assigned to its boss family by CombatEntitiesView; falling
    // back to Core Sentinel here made later Overdrive stages render the wrong
    // hull after a stage transition.
    this.setBossId(this.bossId);
    const textures = this.textures[this.bossId] ?? this.textures['core-sentinel'];
    this.root.rotation = 0;
    this.defeatAge = -1;
    this.root.visible = false;
    this.root.alpha = 1;
    this.root.scale.set(1);
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      piece.texture = textures.flat;
      piece.visible = index === 0;
      piece.blendMode = 'normal';
      piece.position.set(0, 0);
      piece.rotation = 0;
      piece.scale.set(1);
      piece.tint = 0xffffff;
      piece.alpha = 1;
    }
  }

  public get isDefeatActive(): boolean {
    return this.defeatAge >= 0 && this.defeatAge < ENEMY_DEFEAT_SECONDS && this.root.visible;
  }

  private prepareFragments(body: Texture): void {
    if (this.quality !== 'low' && !this.motionReduced && !this.fragments.has(body)) {
      this.fragments.set(body, createDefeatFragments(body));
    }
  }
}
