import { Container, Graphics, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import { createTexture } from './TextureFactory';

const PRISM_INK = 0x0d1025;
const PRISM_ARMOR = 0x51456f;
const PRISM_PLATE = 0x9b82c8;
const PRISM_EDGE = 0xe8dcff;
const PRISM_CYAN = 0x75e6ff;
const PRISM_GOLD = 0xffd978;
const PRISM_CORE = 0xfff4cf;
const ARC_INK = 0x11142f;
const ARC_VIOLET = 0x9b7cff;
const ARC_CYAN = 0x75e6ff;
const ARC_HOT = 0xffd978;
const ARC_WHITE = 0xf4ffff;

interface OrbitBladeVisual {
  readonly root: Container;
  readonly wake: Sprite;
  readonly aura: Sprite;
  readonly shell: Sprite;
  readonly accent: Sprite;
  readonly core: Sprite;
}

const polygon = (graphics: Graphics, points: readonly [number, number][], color: number, alpha = 1): void => {
  graphics.beginPath().moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index][0], points[index][1]);
  }
  graphics.closePath().fill({ color, alpha });
};

const createOrbitTextures = (renderer: Renderer): Readonly<Record<'wake' | 'aura' | 'shell' | 'accent' | 'core', Texture>> => ({
  wake: createTexture(renderer, (graphics) => {
    // Two short tangent rails imply movement without becoming a second weapon.
    graphics.beginPath().moveTo(-3, -27).lineTo(0, -11).stroke({ color: PRISM_CYAN, width: 2, alpha: 0.28 });
    graphics.beginPath().moveTo(3, -24).lineTo(0, -11).stroke({ color: PRISM_GOLD, width: 1, alpha: 0.5 });
    graphics.beginPath().moveTo(-2, -20).lineTo(0, -13).stroke({ color: PRISM_EDGE, width: 1, alpha: 0.42 });
  }),
  aura: createTexture(renderer, (graphics) => {
    // Broken arcs keep the energy geometric and cheaper than a filter/glow.
    graphics.beginPath().arc(0, 0, 21, -2.62, -1.86).stroke({ color: PRISM_CYAN, width: 1.5, alpha: 0.58 });
    graphics.beginPath().arc(0, 0, 21, -0.95, -0.21).stroke({ color: PRISM_GOLD, width: 1.5, alpha: 0.52 });
    graphics.beginPath().arc(0, 0, 21, 0.45, 1.18).stroke({ color: PRISM_CYAN, width: 1.5, alpha: 0.42 });
    graphics.beginPath().moveTo(-16, -7).lineTo(-12, -9).lineTo(-14, -4).closePath().fill({ color: PRISM_CYAN, alpha: 0.72 });
    graphics.beginPath().moveTo(15, 7).lineTo(11, 9).lineTo(13, 4).closePath().fill({ color: PRISM_GOLD, alpha: 0.72 });
  }),
  shell: createTexture(renderer, (graphics) => {
    // A dark aperture and offset facets give the blade volume at small size.
    polygon(graphics, [[-16, 0], [-9, -11], [0, -16], [11, -9], [16, 0], [9, 11], [0, 16], [-11, 9]], PRISM_INK);
    graphics.beginPath().moveTo(-16, 0).lineTo(-9, -11).lineTo(0, -16).lineTo(11, -9)
      .lineTo(16, 0).lineTo(9, 11).lineTo(0, 16).lineTo(-11, 9).closePath()
      .stroke({ color: PRISM_EDGE, width: 1.4, alpha: 0.9 });
    polygon(graphics, [[-11, 0], [-6, -8], [0, -11], [7, -6], [11, 0], [6, 8], [0, 11], [-7, 6]], PRISM_ARMOR);
    polygon(graphics, [[-11, 0], [-6, -8], [0, -11], [0, 0]], PRISM_PLATE, 0.92);
    polygon(graphics, [[0, 0], [7, -6], [11, 0], [6, 8]], PRISM_PLATE, 0.68);
    graphics.beginPath().circle(0, 0, 6.2).fill({ color: PRISM_INK, alpha: 1 });
    graphics.beginPath().moveTo(-10, -2).lineTo(-7, -5).stroke({ color: PRISM_CYAN, width: 1.5, alpha: 0.9 });
    graphics.beginPath().moveTo(8, 5).lineTo(11, 2).stroke({ color: PRISM_GOLD, width: 1.5, alpha: 0.9 });
  }),
  accent: createTexture(renderer, (graphics) => {
    graphics.beginPath().arc(0, 0, 12.5, -2.35, -1.25).stroke({ color: PRISM_CYAN, width: 1.1, alpha: 0.85 });
    graphics.beginPath().arc(0, 0, 12.5, 0.78, 1.75).stroke({ color: PRISM_GOLD, width: 1.1, alpha: 0.85 });
    graphics.beginPath().moveTo(-4, -13).lineTo(0, -16).lineTo(4, -13).stroke({ color: PRISM_EDGE, width: 1, alpha: 0.78 });
    graphics.beginPath().moveTo(-4, 13).lineTo(0, 16).lineTo(4, 13).stroke({ color: PRISM_EDGE, width: 1, alpha: 0.58 });
  }),
  core: createTexture(renderer, (graphics) => {
    graphics.beginPath().regularPoly(0, 0, 4.9, 6, Math.PI / 6)
      .fill({ color: PRISM_CORE, alpha: 1 })
      .stroke({ color: PRISM_EDGE, width: 1.1, alpha: 0.95 });
    graphics.beginPath().moveTo(-2.2, 0).lineTo(0, -2.8).lineTo(2.2, 0).lineTo(0, 2.8).closePath()
      .fill({ color: PRISM_CYAN, alpha: 0.9 });
  })
});

export class WeaponView {
  public readonly root = new Container();
  private readonly orbitLayer = new Container();
  private readonly chainLayer = new Graphics();
  private readonly chainImpactLayer = new Container();
  private readonly chainPulseLayer = new Container();
  private readonly orbitVisuals: OrbitBladeVisual[] = [];
  private readonly chainImpactSprites: Sprite[] = [];
  private readonly chainPulseSprites: Sprite[] = [];
  private readonly previousChainActive: boolean[];

  public constructor(
    renderer: Renderer,
    private readonly onChainImpact?: () => void,
    private readonly quality: FxQuality = 'medium'
  ) {
    this.previousChainActive = Array.from({ length: WEAPON_DEFINITIONS.chainLightning.maxTargets }, () => false);
    this.root.addChild(this.orbitLayer, this.chainLayer, this.chainImpactLayer, this.chainPulseLayer);
    const textures = createOrbitTextures(renderer);
    for (let index = 0; index < WEAPON_DEFINITIONS.orbit.maxBlades; index += 1) {
      const root = new Container();
      const wake = new Sprite(textures.wake);
      const aura = new Sprite(textures.aura);
      const shell = new Sprite(textures.shell);
      const accent = new Sprite(textures.accent);
      const core = new Sprite(textures.core);
      root.addChild(wake, aura, shell, accent, core);
      root.visible = false;
      this.orbitVisuals.push({ root, wake, aura, shell, accent, core });
      this.orbitLayer.addChild(root);
    }
    const chainImpactTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().regularPoly(0, 0, 10, 6, Math.PI / 6)
        .fill({ color: ARC_INK, alpha: 1 })
        .stroke({ color: ARC_VIOLET, width: 1.6, alpha: 0.95 });
      graphics.beginPath().regularPoly(0, 0, 6.5, 4, Math.PI / 4)
        .fill({ color: ARC_CYAN, alpha: 0.88 })
        .stroke({ color: ARC_WHITE, width: 1, alpha: 0.9 });
      graphics.beginPath().circle(0, 0, 2.2).fill({ color: ARC_HOT, alpha: 1 });
    });
    const chainPulseTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().moveTo(0, -5).lineTo(5, 0).lineTo(0, 5).lineTo(-5, 0).closePath()
        .fill({ color: ARC_HOT, alpha: 1 })
        .stroke({ color: ARC_WHITE, width: 1, alpha: 0.95 });
    });
    for (let index = 0; index < WEAPON_DEFINITIONS.chainLightning.maxTargets; index += 1) {
      const sprite = new Sprite(chainImpactTexture);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.chainImpactSprites.push(sprite);
      this.chainImpactLayer.addChild(sprite);
      const pulse = new Sprite(chainPulseTexture);
      pulse.anchor.set(0.5);
      pulse.visible = false;
      this.chainPulseSprites.push(pulse);
      this.chainPulseLayer.addChild(pulse);
    }
  }

  public render(combat: Pick<CombatRenderState, 'orbitBlades' | 'chainSegments'>): void {
    for (let index = 0; index < this.orbitVisuals.length; index += 1) {
      const state = combat.orbitBlades[index];
      const visual = this.orbitVisuals[index];
      visual.root.visible = state.active;
      if (!state.active) continue;
      visual.root.position.set(state.x, state.y);
      visual.root.rotation = state.angle;
      visual.root.scale.set(state.radius / WEAPON_DEFINITIONS.orbit.radius);
      visual.wake.visible = this.quality !== 'low';
      visual.wake.alpha = this.quality === 'high' ? 0.82 : 0.56;
      visual.aura.alpha = this.quality === 'low' ? 0.48 : this.quality === 'high' ? 0.9 : 0.7;
      visual.aura.rotation = -state.angle * 0.65;
      visual.accent.rotation = -state.angle * 1.2;
      visual.core.rotation = state.angle * 1.8;
      const pulse = 1 + Math.sin(state.angle * 3 + index * 0.9) * 0.07;
      visual.core.scale.set(pulse);
    }

    let hasActiveChain = false;
    for (const segment of combat.chainSegments) {
      if (segment.active) {
        hasActiveChain = true;
        break;
      }
    }
    if (!hasActiveChain) {
      this.chainLayer.clear();
      this.chainLayer.visible = false;
      this.chainPulseLayer.visible = false;
      for (let index = 0; index < this.previousChainActive.length; index += 1) {
        this.previousChainActive[index] = false;
        this.chainImpactSprites[index].visible = false;
      }
      this.chainImpactLayer.visible = false;
      return;
    }

    this.chainLayer.visible = true;
    this.chainLayer.clear();
    this.chainImpactLayer.visible = true;
    this.chainPulseLayer.visible = this.quality !== 'low';
    for (let index = 0; index < combat.chainSegments.length; index += 1) {
      const segment = combat.chainSegments[index];
      if (!segment.active) {
        this.previousChainActive[index] = false;
        this.chainImpactSprites[index].visible = false;
        this.chainPulseSprites[index].visible = false;
        continue;
      }
      if (!this.previousChainActive[index]) this.onChainImpact?.();
      this.previousChainActive[index] = true;
      const alpha = Math.max(0, Math.min(1, segment.lifeSeconds / WEAPON_DEFINITIONS.chainLightning.segmentLifetimeSeconds));
      this.drawChainBeam(segment, alpha, index);
      const sprite = this.chainImpactSprites[index];
      sprite.position.set(segment.x2, segment.y2);
      sprite.rotation = (1 - alpha) * Math.PI * 0.5;
      sprite.scale.set(0.75 + alpha * 0.85);
      sprite.alpha = alpha;
      sprite.visible = true;
      const pulse = this.chainPulseSprites[index];
      const travel = 1 - alpha;
      pulse.position.set(
        segment.x1 + (segment.x2 - segment.x1) * travel,
        segment.y1 + (segment.y2 - segment.y1) * travel
      );
      pulse.rotation = travel * Math.PI * 2 + index * 0.6;
      pulse.scale.set(0.65 + alpha * 0.65);
      pulse.alpha = alpha * 0.9;
      pulse.visible = this.quality !== 'low';
    }
  }

  public reset(): void {
    this.chainLayer.clear();
    this.chainLayer.visible = false;
    this.chainImpactLayer.visible = false;
    this.chainPulseLayer.visible = false;
    for (const visual of this.orbitVisuals) {
      visual.root.visible = false;
      visual.root.scale.set(1);
      visual.core.scale.set(1);
    }
    for (let index = 0; index < this.previousChainActive.length; index += 1) {
      this.previousChainActive[index] = false;
      this.chainImpactSprites[index].visible = false;
      this.chainPulseSprites[index].visible = false;
    }
  }

  private drawChainBeam(
    segment: CombatRenderState['chainSegments'][number],
    alpha: number,
    index: number
  ): void {
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const length = Math.hypot(dx, dy);
    const safeLength = Math.max(1, length);
    const nx = -dy / safeLength;
    const ny = dx / safeLength;
    const bend = Math.min(22, length * 0.16) * (index % 2 === 0 ? 1 : -1);
    const p1x = segment.x1 + dx * 0.28 + nx * bend;
    const p1y = segment.y1 + dy * 0.28 + ny * bend;
    const p2x = segment.x1 + dx * 0.68 - nx * bend * 0.72;
    const p2y = segment.y1 + dy * 0.68 - ny * bend * 0.72;
    this.strokeChainPath(segment.x1, segment.y1, p1x, p1y, p2x, p2y, segment.x2, segment.y2, ARC_INK, 12, alpha * 0.4);
    this.strokeChainPath(segment.x1, segment.y1, p1x, p1y, p2x, p2y, segment.x2, segment.y2, ARC_VIOLET, 6, alpha * 0.92);
    this.strokeChainPath(segment.x1, segment.y1, p1x, p1y, p2x, p2y, segment.x2, segment.y2, ARC_CYAN, 3, alpha);
    this.strokeChainPath(segment.x1, segment.y1, p1x, p1y, p2x, p2y, segment.x2, segment.y2, ARC_WHITE, 1.2, alpha * 0.92);
    // Transfer nodes make the jump read as a relay instead of a straight line.
    this.chainLayer.beginPath().circle(p1x, p1y, 3.2)
      .fill({ color: ARC_HOT, alpha: alpha * 0.75 });
    this.chainLayer.beginPath().circle(p2x, p2y, 3.2)
      .fill({ color: ARC_HOT, alpha: alpha * 0.75 });
    if (this.quality === 'high') {
      this.chainLayer.beginPath().moveTo(p1x - nx * 8, p1y - ny * 8)
        .lineTo(p1x + nx * 8, p1y + ny * 8)
        .stroke({ color: ARC_CYAN, width: 1, alpha: alpha * 0.65 });
    }
  }

  private strokeChainPath(
    x1: number,
    y1: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    x2: number,
    y2: number,
    color: number,
    width: number,
    alpha: number
  ): void {
    this.chainLayer.beginPath()
      .moveTo(x1, y1)
      .lineTo(p1x, p1y)
      .lineTo(p2x, p2y)
      .lineTo(x2, y2)
      .stroke({ color, width, alpha });
  }
}
