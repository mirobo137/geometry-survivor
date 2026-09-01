import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { FxQuality } from '../../../../content/visual/VisualTokens';
import type { TurtleTextureSet } from './TurtleVisual';

const DEFEAT_SECONDS = 0.36;

interface TurtleDefeatSlot {
  readonly root: Container;
  readonly parts: readonly Sprite[];
  lifeSeconds: number;
  maxLifeSeconds: number;
}

const createPart = (texture: Texture): Sprite => {
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  return sprite;
};

/**
 * Small presentation pool for the four cached turtle pieces. A defeated
 * chaser may be recycled by simulation immediately; this view keeps a visual
 * copy for a short disassembly without retaining or changing that game slot.
 */
export class TurtleDefeatFxView {
  public readonly root = new Container();
  private readonly slots: TurtleDefeatSlot[];
  private readonly reducedMotion: boolean;

  public constructor(textures: TurtleTextureSet, quality: FxQuality = 'medium') {
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const capacity = quality === 'high' ? 6 : quality === 'medium' ? 4 : 0;
    this.slots = Array.from({ length: capacity }, () => {
      const root = new Container();
      const parts = [
        createPart(textures.limbsRear),
        createPart(textures.limbsFront),
        createPart(textures.shell),
        createPart(textures.head)
      ] as const;
      root.visible = false;
      root.eventMode = 'none';
      root.addChild(...parts);
      this.root.addChild(root);
      return { root, parts, lifeSeconds: 0, maxLifeSeconds: DEFEAT_SECONDS };
    });
    this.root.eventMode = 'none';
    this.root.visible = false;
  }

  public get activeCount(): number {
    return this.slots.reduce((count, slot) => count + (slot.root.visible ? 1 : 0), 0);
  }

  public play(x: number, y: number): void {
    if (this.reducedMotion) return;
    const slot = this.slots.find((candidate) => !candidate.root.visible);
    if (!slot) return;
    slot.lifeSeconds = DEFEAT_SECONDS;
    slot.maxLifeSeconds = DEFEAT_SECONDS;
    slot.root.visible = true;
    slot.root.position.set(x, y);
    // The defeat event deliberately has no render slot/facing dependency. A
    // deterministic phase preserves visual variety while gameplay stays free
    // to recycle the original pooled enemy on the same tick.
    slot.root.rotation = ((Math.abs(x * 0.021 + y * 0.037) % 1) - 0.5) * 0.6;
    slot.root.alpha = 1;
    slot.root.scale.set(1);
    this.applyPose(slot, 0);
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
      const progress = 1 - slot.lifeSeconds / slot.maxLifeSeconds;
      this.applyPose(slot, progress);
      slot.root.alpha = Math.max(0, 1 - progress * progress);
      const scale = 1 - progress * 0.12;
      slot.root.scale.set(scale);
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
      this.applyPose(slot, 0);
    }
    this.root.visible = false;
  }

  private applyPose(slot: TurtleDefeatSlot, progress: number): void {
    const distance = progress * 24;
    const [rear, front, shell, head] = slot.parts;
    rear.position.set(-distance * 0.72, distance * 0.5);
    rear.rotation = -progress * 0.34;
    front.position.set(distance * 0.78, distance * 0.34);
    front.rotation = progress * 0.38;
    shell.position.set(0, distance * 0.12);
    shell.rotation = -progress * 0.12;
    head.position.set(0, -distance * 1.05);
    head.rotation = progress * 0.18;
  }
}
