import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { EnemyDefeatPose, EnemyShipKind, EnemyShipTextureMap } from './EnemyShipVisual';
import { createDefeatFragments, defeatCompression, ENEMY_DEFEAT_SECONDS, poseDefeatFragments } from './SingleImageDefeat';

interface EnemyDefeatSlot {
  readonly root: Container;
  readonly parts: readonly Sprite[];
  lifeSeconds: number;
  body: Texture;
  alpha: number;
  scaleX: number;
  scaleY: number;
}

/** Bounded rupture pool: every family shares the same single-image recipe. */
export class EnemyDefeatFxView {
  public readonly root = new Container();
  private readonly slots: EnemyDefeatSlot[];
  private readonly fragments = new Map<Texture, readonly Texture[]>();

  public constructor(private readonly textures: EnemyShipTextureMap, quality: FxQuality = 'medium') {
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const capacity = reducedMotion ? 0 : quality === 'high' ? 18 : quality === 'medium' ? 12 : 0;
    if (capacity) {
      for (const set of Object.values(textures)) {
        const body = set.flat ?? set.hull;
        if (!this.fragments.has(body)) this.fragments.set(body, createDefeatFragments(body));
      }
    }
    const initial = textures.chaser.flat ?? textures.chaser.hull;
    this.slots = Array.from({ length: capacity }, () => {
      const root = new Container();
      const parts = Array.from({ length: 4 }, () => {
        const sprite = new Sprite(initial);
        sprite.anchor.set(0.5);
        root.addChild(sprite);
        return sprite;
      });
      root.visible = false;
      root.eventMode = 'none';
      this.root.addChild(root);
      return { root, parts, lifeSeconds: 0, body: initial, alpha: 1, scaleX: 1, scaleY: 1 };
    });
    this.root.eventMode = 'none';
    this.root.label = 'enemy-defeat-fragments';
    this.root.once('destroyed', () => {
      for (const fragments of this.fragments.values()) for (const texture of fragments) texture.destroy(false);
      this.fragments.clear();
    });
    this.root.visible = false;
  }

  public get activeCount(): number {
    return this.slots.reduce((count, slot) => count + (slot.root.visible ? 1 : 0), 0);
  }

  /** Register fragment textures for bodies decoded after this pooled view was built. */
  public refreshTextures(): void {
    if (this.slots.length === 0) return;
    for (const set of Object.values(this.textures)) {
      const body = set.flat ?? set.hull;
      if (!this.fragments.has(body)) this.fragments.set(body, createDefeatFragments(body));
    }
  }

  public play(x: number, y: number, kind: EnemyShipKind, pose?: Readonly<EnemyDefeatPose>): void {
    const slot = this.slots.find(candidate => !candidate.root.visible);
    if (!slot) return;
    const set = this.textures[kind] ?? this.textures.chaser;
    slot.body = set.flat ?? set.hull;
    const fragments = this.fragments.get(slot.body)!;
    for (let index = 0; index < slot.parts.length; index += 1) slot.parts[index].texture = fragments[index];
    slot.lifeSeconds = ENEMY_DEFEAT_SECONDS;
    slot.root.visible = true;
    slot.root.position.set(x + (pose?.offsetX ?? 0), y + (pose?.offsetY ?? 0));
    slot.root.rotation = pose?.rotation ?? 0;
    slot.alpha = pose?.alpha ?? 1;
    slot.scaleX = pose?.scaleX ?? 1;
    slot.scaleY = pose?.scaleY ?? 1;
    slot.root.alpha = slot.alpha;
    slot.root.scale.set(slot.scaleX, slot.scaleY);
    poseDefeatFragments(slot.parts, slot.body, 0);
    this.root.visible = true;
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;
    let hasActive = false;
    for (const slot of this.slots) {
      if (!slot.root.visible) continue;
      slot.lifeSeconds -= delta;
      if (slot.lifeSeconds <= 0) { slot.root.visible = false; continue; }
      hasActive = true;
      const progress = 1 - slot.lifeSeconds / ENEMY_DEFEAT_SECONDS;
      poseDefeatFragments(slot.parts, slot.body, progress);
      slot.root.alpha = slot.alpha * Math.max(0, 1 - progress * progress);
      const compression = defeatCompression(progress);
      slot.root.scale.set(slot.scaleX * compression, slot.scaleY * compression);
    }
    this.root.visible = hasActive;
  }

  public clear(): void {
    for (const slot of this.slots) {
      slot.lifeSeconds = 0;
      slot.root.visible = false;
      slot.root.alpha = 1;
      slot.root.position.set(0, 0);
      slot.root.rotation = 0;
      slot.root.scale.set(1);
      slot.alpha = slot.scaleX = slot.scaleY = 1;
      poseDefeatFragments(slot.parts, slot.body, 0);
    }
    this.root.visible = false;
  }
}
