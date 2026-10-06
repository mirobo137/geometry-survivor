import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import type { EnemyKind } from '../../../content/enemies/EnemyDefinitions';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import type { BossRenderState } from '../../../simulation/combat/CombatRenderState';
import { createTexture } from '../TextureFactory';

const PORTAL_FRAME = 112;
const ENEMY_PORTAL_SECONDS = 0.48;
const NORMAL_PORTAL_CAP: Readonly<Record<FxQuality, number>> = {
  low: 6, medium: 10, high: 14
};

interface PortalSlot {
  readonly sprite: Sprite;
  startedAt: number;
  size: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** One baked portal texture, fixed sprite budget, no per-spawn geometry or upload. */
export class SpawnPortalView {
  public readonly root = new Container();
  private readonly normal: readonly PortalSlot[];
  private readonly bosses: readonly Sprite[];
  private readonly bossHalos: readonly Graphics[];
  private readonly bossWaves: readonly Graphics[];
  private readonly motionReduced: boolean;
  private visibleLeft = 0;
  private visibleTop = 0;
  private visibleRight = 1280;
  private visibleBottom = 720;

  public constructor(
    renderer: Renderer,
    quality: FxQuality,
    texture: Texture = createTexture(renderer, graphics => {
      // A faceted aperture rather than another damaging arena ring.
      graphics.beginPath().circle(0, 0, 46).fill({ color: 0x081323, alpha: 0.6 });
      graphics.beginPath().circle(0, 0, 39)
        .stroke({ color: 0x2b677a, width: 5, alpha: 0.56 });
      graphics.beginPath().moveTo(0, -29).lineTo(29, 0).lineTo(0, 29)
        .lineTo(-29, 0).closePath().fill({ color: 0x0c1a2e, alpha: 0.85 });
      graphics.beginPath().moveTo(0, -25).lineTo(25, 0).lineTo(0, 25)
        .lineTo(-25, 0).closePath().stroke({ color: 0x6fdce9, width: 2.5, alpha: 0.74 });
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Math.PI / 4 - Math.PI / 2;
        graphics.beginPath().arc(0, 0, 43, angle + 0.09, angle + 0.58)
          .stroke({ color: index % 2 ? 0xd5ffef : 0x96e9fb, width: 4.5, alpha: 0.94 });
        graphics.beginPath().moveTo(Math.cos(angle) * 48, Math.sin(angle) * 48)
          .lineTo(Math.cos(angle) * 53, Math.sin(angle) * 53)
          .stroke({ color: 0xffdeb0, width: 2, alpha: 0.78 });
      }
      graphics.beginPath().circle(0, 0, 12).fill({ color: 0x03101e, alpha: 0.93 });
      graphics.beginPath().circle(0, 0, 7).stroke({ color: 0xc2f6eb, width: 1.5, alpha: 0.65 });
    }),
    motionReduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  ) {
    this.motionReduced = motionReduced;
    this.normal = Array.from({ length: NORMAL_PORTAL_CAP[quality] }, () => {
      const sprite = this.createSprite(texture);
      return { sprite, startedAt: Number.NEGATIVE_INFINITY, size: 0 };
    });
    this.bosses = [this.createSprite(texture), this.createSprite(texture)];
    // Geometry is authored once. Per-frame work only changes transforms/alpha.
    this.bossHalos = this.bosses.map(() => {
      const halo = new Graphics();
      halo.beginPath().circle(0, 0, 75).fill({ color: 0x030711, alpha: 0.85 });
      halo.beginPath().circle(0, 0, 78).stroke({ color: 0xffffff, width: 16, alpha: 0.08 });
      halo.beginPath().circle(0, 0, 78).stroke({ color: 0xffffff, width: 7, alpha: 0.18 });
      for (let index = 0; index < (quality === 'low' ? 8 : 16); index++) {
        const angle = index * Math.PI / (quality === 'low' ? 4 : 8);
        halo.beginPath().arc(0, 0, 78, angle + 0.025, angle + 0.15)
          .stroke({ color: 0xffffff, width: 2.5, alpha: 0.95 });
        // Radial needles converge as the aperture opens; never free particles.
        halo.beginPath().moveTo(Math.cos(angle) * 88, Math.sin(angle) * 88)
          .lineTo(Math.cos(angle + 0.018) * 117, Math.sin(angle + 0.018) * 117)
          .stroke({ color: 0xffffff, width: 1.5, alpha: 0.55 });
      }
      halo.visible = false;
      return halo;
    });
    this.bossWaves = this.bosses.map(() => {
      const wave = new Graphics();
      wave.beginPath().circle(0, 0, 80).stroke({ color: 0xffffff, width: 10, alpha: 0.1 });
      wave.beginPath().circle(0, 0, 80).stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
      wave.beginPath().circle(0, 0, 72).stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
      wave.blendMode = 'add';
      wave.visible = false;
      return wave;
    });
    this.root.addChild(...this.normal.map(slot => slot.sprite), ...this.bossHalos,
      ...this.bosses, ...this.bossWaves);
  }

  /** Cosmetic only. Saturation drops a portal, never an enemy. */
  public playEnemy(x: number, y: number, radius: number, kind: EnemyKind, seconds: number): boolean {
    const margin = Math.max(48, radius * 2);
    if (x < this.visibleLeft - margin || x > this.visibleRight + margin
      || y < this.visibleTop - margin || y > this.visibleBottom + margin) return false;
    let slot: PortalSlot | undefined;
    for (const candidate of this.normal) {
      if (!candidate.sprite.visible || seconds - candidate.startedAt >= ENEMY_PORTAL_SECONDS) {
        slot = candidate;
        break;
      }
    }
    if (!slot) return false;
    slot.startedAt = seconds;
    slot.size = Math.max(70, radius * 4.2);
    slot.sprite.position.set(x, y);
    slot.sprite.tint = kind === 'fracture-gunner' || kind === 'thorn-bastion'
      || kind === 'zigzag-reaver' || kind === 'rift-miner'
      ? 0xffb59f : kind === 'orbiter' || kind === 'charger' || kind === 'splitter'
        || kind === 'prism-weaver' || kind === 'warden-replica'
        ? 0xc3a8ff : 0xffffff;
    slot.sprite.visible = true;
    return true;
  }

  public setVisibleWorldBounds(left: number, top: number, right: number, bottom: number): void {
    this.visibleLeft = left;
    this.visibleTop = top;
    this.visibleRight = right;
    this.visibleBottom = bottom;
  }

  public render(seconds: number, boss: Readonly<BossRenderState>, bosses?: readonly Readonly<BossRenderState>[]): void {
    for (const slot of this.normal) {
      if (!slot.sprite.visible) continue;
      const age = Math.max(0, seconds - slot.startedAt);
      if (age >= ENEMY_PORTAL_SECONDS) {
        slot.sprite.visible = false;
        continue;
      }
      const progress = age / ENEMY_PORTAL_SECONDS;
      const aperture = Math.sin(progress * Math.PI);
      slot.sprite.scale.set(slot.size / PORTAL_FRAME * (this.motionReduced ? 1 : 0.65 + aperture * 0.45));
      slot.sprite.alpha = (1 - progress) * (this.motionReduced ? 0.7 : 0.85);
      slot.sprite.rotation = this.motionReduced ? 0 : progress * 0.36;
    }
    for (let index = 0; index < this.bosses.length; index += 1) {
      const state = bosses?.[index] ?? (index === 0 ? boss : undefined);
      const sprite = this.bosses[index];
      const halo = this.bossHalos[index];
      const wave = this.bossWaves[index];
      sprite.visible = Boolean(state?.active && state.phase === 'intro');
      halo.visible = sprite.visible;
      wave.visible = sprite.visible;
      if (!sprite.visible || !state) continue;
      const progress = clamp01(state.progress);
      const charge = clamp01(progress / 0.24);
      const opening = 1 - Math.pow(1 - charge, 3);
      sprite.position.set(state.x, state.y);
      const orbital = state.bossId === 'orbital-warden';
      const fracture = state.bossId === 'fracture-engine';
      const size = Math.max(230, state.radius * 5) / PORTAL_FRAME;
      const close = clamp01((progress - 0.62) / 0.38);
      const aperture = this.motionReduced ? 1 : (0.08 + opening * 0.92) * (1 - close * 0.85);
      // Fracture opens a vertical breach; Warden a tilted orbital aperture.
      sprite.scale.set(size * aperture * (this.motionReduced ? 1 : fracture ? 0.28 + opening * 0.35 : 1),
        size * aperture * (this.motionReduced ? 1 : orbital ? 0.66 : 1));
      sprite.alpha = (this.motionReduced ? 0.35 : 0.6) * (1 - close);
      sprite.rotation = this.motionReduced ? 0 : orbital ? progress * 2.4
        : fracture ? -0.12 : -progress * 0.6;
      sprite.tint = state.bossId === 'orbital-warden' ? 0xb5ecff
        : state.bossId === 'fracture-engine' ? 0xffc4a4 : 0xffd5f5;
      halo.position.set(state.x, state.y);
      halo.tint = fracture ? 0xff875d : orbital ? 0x85bdff : 0xffcf7c;
      const gateSize = Math.max(170, state.radius * 3.8) / 160 * aperture;
      halo.scale.set(gateSize * (this.motionReduced ? 1 : fracture ? 0.24 : 1),
        gateSize * (this.motionReduced ? 1 : orbital ? 0.62 : 1));
      halo.rotation = this.motionReduced ? 0 : fracture ? -0.12 : -sprite.rotation * 0.6;
      halo.alpha = (this.motionReduced ? 0.35 : Math.min(1, charge * 2)) * (1 - close);
      wave.position.set(state.x, state.y);
      wave.tint = halo.tint;
      const impact = clamp01((progress - 0.62) / 0.38);
      wave.visible = !this.motionReduced && impact > 0 && impact < 1;
      wave.scale.set(Math.max(120, state.radius * 2.5) / 160
        * (0.75 + Math.sqrt(impact) * 1.9));
      wave.alpha = Math.pow(1 - impact, 2) * (fracture ? 0.85 : 0.65);
    }
  }

  public get activeCount(): number {
    let count = 0;
    for (const slot of this.normal) if (slot.sprite.visible) count += 1;
    for (const sprite of this.bosses) if (sprite.visible) count += 1;
    return count;
  }

  public reset(): void {
    for (const slot of this.normal) slot.sprite.visible = false;
    for (const sprite of this.bosses) sprite.visible = false;
    for (const halo of this.bossHalos) halo.visible = false;
    for (const wave of this.bossWaves) wave.visible = false;
  }

  private createSprite(texture: Texture): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    return sprite;
  }
}
