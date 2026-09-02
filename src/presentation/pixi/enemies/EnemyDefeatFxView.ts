import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { EnemyShipKind, EnemyShipTextureMap } from './EnemyShipVisual';

const DEFEAT_SECONDS = 0.42;

interface EnemyDefeatSlot {
  readonly root: Container;
  readonly parts: readonly Sprite[];
  lifeSeconds: number;
  kind: EnemyShipKind;
}

const createPart = (texture: Texture): Sprite => {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  return sprite;
};

/** Pooled disassembly for every playable enemy ship family. */
export class EnemyDefeatFxView {
  public readonly root = new Container();
  private readonly slots: EnemyDefeatSlot[];
  private readonly reducedMotion: boolean;

  public constructor(textures: EnemyShipTextureMap, quality: FxQuality = 'medium') {
    this.textures = textures;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const capacity = quality === 'high' ? 18 : quality === 'medium' ? 12 : 0;
    this.slots = Array.from({ length: capacity }, () => {
      const root = new Container();
      const parts = [
        createPart(textures.chaser.rear),
        createPart(textures.chaser.wings),
        createPart(textures.chaser.hull),
        createPart(textures.chaser.cockpit)
      ] as const;
      root.visible = false;
      root.eventMode = 'none';
      root.addChild(...parts);
      this.root.addChild(root);
      return { root, parts, lifeSeconds: 0, kind: 'chaser' };
    });
    this.root.eventMode = 'none';
    this.root.visible = false;
  }

  public get activeCount(): number {
    return this.slots.reduce((count, slot) => count + (slot.root.visible ? 1 : 0), 0);
  }

  public play(x: number, y: number, kind: EnemyShipKind): void {
    if (this.reducedMotion) return;
    const slot = this.slots.find((candidate) => !candidate.root.visible);
    if (!slot) return;
    const textures = this.textures[kind];
    const [rear, wings, hull, cockpit] = slot.parts;
    rear.texture = textures.rear;
    wings.texture = textures.wings;
    hull.texture = textures.hull;
    cockpit.texture = textures.cockpit;
    slot.lifeSeconds = DEFEAT_SECONDS;
    slot.kind = kind;
    slot.root.visible = true;
    slot.root.position.set(x, y);
    slot.root.rotation = ((Math.abs(x * 0.021 + y * 0.037) % 1) - 0.5) * 0.8;
    slot.root.alpha = 1;
    slot.root.scale.set(1);
    this.applyPose(slot, 0, kind);
    this.root.visible = true;
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta <= 0) return;
    let hasActive = false;
    for (const slot of this.slots) {
      if (!slot.root.visible) continue;
      slot.lifeSeconds -= delta;
      if (slot.lifeSeconds <= 0) {
        slot.root.visible = false;
        continue;
      }
      hasActive = true;
      const progress = 1 - slot.lifeSeconds / DEFEAT_SECONDS;
      this.applyPose(slot, progress, slot.kind);
      slot.root.alpha = Math.max(0, 1 - progress * progress);
      slot.root.scale.set(1 - progress * 0.1);
    }
    this.root.visible = hasActive;
  }

  public clear(): void {
    for (const slot of this.slots) {
      slot.lifeSeconds = 0;
      slot.kind = 'chaser';
      slot.root.visible = false;
      slot.root.alpha = 1;
      slot.root.position.set(0, 0);
      slot.root.rotation = 0;
      slot.root.scale.set(1);
      this.applyPose(slot, 0, 'chaser');
    }
    this.root.visible = false;
  }

  private applyPose(slot: EnemyDefeatSlot, progress: number, kind: EnemyShipKind): void {
    const spread = kind === 'tank' ? 0.78 : kind === 'fast' ? 1.15 : kind === 'elite' ? 1.05 : 1;
    const distance = progress * 24 * spread;
    const [rear, wings, hull, cockpit] = slot.parts;
    rear.position.set(-distance * 0.55, distance * 0.62);
    rear.rotation = -progress * 0.45;
    wings.position.set(distance * 0.85, distance * 0.25);
    wings.rotation = progress * 0.62;
    hull.position.set(-distance * 0.08, distance * 0.12);
    hull.rotation = -progress * 0.18;
    hull.scale.set(1 - progress * 0.14, 1 - progress * 0.04);
    cockpit.position.set(-distance * 0.12, -distance * 1.08);
    cockpit.rotation = progress * 0.54;
  }

  private readonly textures: EnemyShipTextureMap;
}
