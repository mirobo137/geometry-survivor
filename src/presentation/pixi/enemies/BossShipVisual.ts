import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { BossId } from '../../../content/bosses/BossDefinition';
import type { EnemyRenderState } from '../../../simulation/combat/CombatRenderState';
import { createDefeatFragments, defeatCompression, ENEMY_DEFEAT_SECONDS, poseDefeatFragments } from './SingleImageDefeat';

export interface BossShipTextures {
  readonly flat: Texture;
  readonly parts: readonly [Texture, Texture, Texture, Texture];
}

export type BossShipTextureMap = Readonly<Record<'core-sentinel' | 'orbital-warden', BossShipTextures>>
  & Readonly<Partial<Record<Exclude<BossId, 'core-sentinel' | 'orbital-warden'>, BossShipTextures>>>;

/** One boss assembly, outside the 250-enemy pool. Never owns attack timing. */
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
    this.pieces = (quality === 'low' ? [initial.flat] : initial.parts).map((texture) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      this.root.addChild(sprite);
      return sprite;
    });
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
      this.pieces[index].texture = textures.parts[index];
    }
  }

  public beginFrame(): void {
    if (this.defeatAge < 0) this.root.visible = false;
  }

  public render(state: EnemyRenderState, seconds: number, hitPulse = 0, introProgress = 1): void {
    if (!state.active || state.kind !== 'boss' || this.defeatAge >= 0) return;
    const progress = Math.max(0, Math.min(1, introProgress));
    const assembly = this.motionReduced ? 1 : progress * progress * (3 - 2 * progress);
    this.root.visible = true;
    this.root.position.set(state.x, state.y);
    this.root.alpha = Math.max(0.7, state.health / state.maxHealth) * (0.35 + 0.65 * progress);
    this.root.scale.set((this.motionReduced ? 1 : 0.8 + 0.2 * assembly) * (1 + hitPulse * 0.025));
    if (progress < 1) this.root.rotation = 0;
    else if (this.bossId === 'orbital-warden' && Math.hypot(state.vx,state.vy)>1) {
      this.root.rotation = Math.atan2(state.vy,state.vx)+Math.PI/2;
    }
    if (this.quality === 'low') return;
    if (progress >= 1) {
      // Keep the existing modular entrance, but use a complete body once
      // assembled. Future PNGs replace only this flat texture.
      this.pieces[0].texture = (this.textures[this.bossId] ?? this.textures['core-sentinel']).flat;
      this.pieces[0].visible = true;
      this.pieces[0].position.set(0, 0);
      this.pieces[0].rotation = 0;
      this.pieces[0].scale.set(1);
      this.pieces[0].alpha = 1;
      for (let index = 1; index < this.pieces.length; index += 1) this.pieces[index].visible = false;
      return;
    }
    const textures = this.textures[this.bossId] ?? this.textures['core-sentinel'];
    for (let index = 0; index < this.pieces.length; index += 1) {
      this.pieces[index].texture = textures.parts[index];
      this.pieces[index].visible = true;
    }
    // Four cached ship layers dock during the existing non-attacking intro.
    // At progress 1 the complete body takes over; entrances change separately.
    const remaining = 1 - assembly;
    this.pieces[0].position.set(0, Math.sin(seconds * 1.8) * 0.45 + remaining * 44);
    this.pieces[1].position.set(-remaining * 52, 0);
    this.pieces[2].position.set(remaining * 46, 0);
    this.pieces[3].position.set(0, -remaining * 54);
    for (let index = 0; index < this.pieces.length; index += 1) {
      this.pieces[index].alpha = progress >= 1 ? 1
        : Math.max(0.14, Math.min(1, (progress - index * 0.075) / 0.6));
    }
    this.pieces[1].scale.x = 1 + Math.sin(seconds * 1.2) * 0.009;
    this.pieces[3].scale.set(1 + Math.sin(seconds * 2.1) * 0.012);
    this.pieces[0].rotation = remaining * -0.12;
    this.pieces[1].rotation = remaining * 0.18
      + (this.bossId === 'orbital-warden' ? Math.sin(seconds*1.2)*0.055 : 0);
    this.pieces[2].rotation = remaining * -0.16;
    this.pieces[3].rotation = remaining * 0.1;
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
      piece.texture = this.quality === 'low' ? textures.flat : textures.parts[index];
      piece.visible = true;
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
