import { Container, Graphics, Sprite } from 'pixi.js';
import type { Renderer, Texture } from 'pixi.js';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { CombatRenderState } from '../../simulation/combat/CombatRenderState';
import { createTexture } from './TextureFactory';
import { createSvgTexture } from './SvgTextureFactory';
import vectorBoomerangSvg from '../../assets/svg/weapons/vector-boomerang.svg?raw';
import { BOOMERANG_POOL_CAPACITY, CHAIN_SEGMENT_POOL_CAPACITY } from '../../config/constants';

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
const PULSE_INK = 0x071120;
const PULSE_ARMOR = 0x332044;
const PULSE_VIOLET = 0xc477ff;
const PULSE_MAGENTA = 0xff66c9;
const PULSE_HOT = 0xfff0cf;
const PULSE_AMBER = 0xffad63;
const PULSE_RECOVERY = 0x8a6ba9;
const MAGNETIC_CHARGE_INK = 0x071120;
const MAGNETIC_CHARGE_ARMOR = 0x1b2a44;
const MAGNETIC_CHARGE_CYAN = 0x6fe7f2;
const MAGNETIC_CHARGE_VIOLET = 0xb77cff;
const MAGNETIC_CHARGE_GOLD = 0xffd478;
const MAGNETIC_CHARGE_WHITE = 0xf1fbff;
const FULL_CIRCLE = Math.PI * 2;

interface OrbitBladeVisual {
  readonly root: Container;
  readonly wake: Sprite;
  readonly aura: Sprite;
  readonly shell: Sprite;
  readonly accent: Sprite;
  readonly core: Sprite;
}

interface BoomerangVisual {
  readonly root: Container;
  readonly trail: Graphics;
  readonly aura: Sprite;
  readonly wake: Sprite;
  readonly body: Sprite;
  readonly core: Sprite;
}

type WeaponRenderInput = Pick<CombatRenderState, 'orbitBlades' | 'chainSegments'>
  & Partial<Pick<CombatRenderState, 'orbitPulse' | 'chainExplosions' | 'boomerangs' | 'boomerangPulse' | 'pulseRingWeapon' | 'magneticCharge'>>;

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
  private readonly orbitPulseLayer = new Graphics();
  private readonly chainLayer = new Graphics();
  private readonly chainImpactLayer = new Container();
  private readonly chainPulseLayer = new Container();
  private readonly boomerangLayer = new Container();
  private readonly pulseRingLayer = new Container();
  private readonly pulseRingTrack = new Graphics();
  private readonly pulseRingCore = new Graphics();
  private readonly pulseRingActiveShell = new Graphics();
  private readonly pulseRingActiveMantle = new Graphics();
  private readonly pulseRingActiveBody = new Graphics();
  private readonly pulseRingActiveEdge = new Graphics();
  private readonly pulseRingMarkers = new Graphics();
  private readonly pulseRingResidue = new Graphics();
  private readonly magneticChargeLayer = new Container();
  private readonly magneticChargeTrail = new Graphics();
  private readonly magneticChargeBeacon = new Graphics();
  private readonly magneticChargeField = new Graphics();
  private readonly magneticChargeBackplate = new Graphics();
  private readonly magneticChargeBand = new Graphics();
  private readonly magneticChargeRails = new Graphics();
  private readonly magneticChargeCore = new Graphics();
  private readonly magneticChargeResidue = new Graphics();
  private readonly boomerangPulseLayer = new Graphics();
  private readonly orbitVisuals: OrbitBladeVisual[] = [];
  private readonly boomerangVisuals: BoomerangVisual[] = [];
  private readonly chainImpactSprites: Sprite[] = [];
  private readonly chainPulseSprites: Sprite[] = [];
  private readonly previousChainActive: boolean[];
  private pulseRingSequence = -1;
  private pulseRingBaseRadius = 1;
  private magneticChargeSequence = -1;
  private readonly reducedMotion: boolean;

  public constructor(
    renderer: Renderer,
    private readonly onChainImpact?: () => void,
    private readonly quality: FxQuality = 'medium'
  ) {
    this.previousChainActive = Array.from({ length: CHAIN_SEGMENT_POOL_CAPACITY }, () => false);
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.root.addChild(
      this.orbitLayer,
      this.chainLayer,
      this.chainImpactLayer,
      this.chainPulseLayer,
      this.boomerangLayer,
      this.pulseRingLayer,
      this.magneticChargeLayer
    );
    this.pulseRingLayer.addChild(
      this.pulseRingTrack,
      this.pulseRingActiveShell,
      this.pulseRingActiveMantle,
      this.pulseRingActiveBody,
      this.pulseRingActiveEdge,
      this.pulseRingCore,
      this.pulseRingMarkers,
      this.pulseRingResidue
    );
    this.magneticChargeLayer.addChild(
      this.magneticChargeTrail,
      this.magneticChargeBeacon,
      this.magneticChargeField,
      this.magneticChargeBackplate,
      this.magneticChargeBand,
      this.magneticChargeRails,
      this.magneticChargeCore,
      this.magneticChargeResidue
    );
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
    // Keep the pooled blade roots first for stable layer ordering and tests;
    // the transient evolution pulse is deliberately rendered after them.
    this.orbitLayer.addChild(this.orbitPulseLayer);
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
    for (let index = 0; index < CHAIN_SEGMENT_POOL_CAPACITY; index += 1) {
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

    const boomerangBodyTexture = createSvgTexture(renderer, vectorBoomerangSvg, {
      x: -24,
      y: -24,
      width: 48,
      height: 48
    });
    const boomerangAuraTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().arc(0, 0, 17, -2.55, -1.45).stroke({ color: 0x75e6ff, width: 1.5, alpha: 0.52 });
      graphics.beginPath().arc(0, 0, 17, 0.6, 1.7).stroke({ color: 0xd2a8ff, width: 1.5, alpha: 0.48 });
      graphics.beginPath().moveTo(-12, -8).lineTo(-7, -11).lineTo(-9, -5).closePath().fill({ color: 0xffd978, alpha: 0.72 });
    });
    const boomerangWakeTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().moveTo(-19, -3).lineTo(-7, 0).lineTo(-19, 3).closePath().fill({ color: 0x75e6ff, alpha: 0.52 });
      graphics.beginPath().moveTo(-16, -7).lineTo(-5, -1).lineTo(-16, -4).closePath().fill({ color: 0xffd978, alpha: 0.44 });
    });
    const boomerangCoreTexture = createTexture(renderer, (graphics) => {
      graphics.beginPath().regularPoly(0, 0, 4.2, 4, Math.PI / 4)
        .fill({ color: 0xfff4cf, alpha: 1 })
        .stroke({ color: 0xffffff, width: 1, alpha: 0.9 });
    });
    for (let index = 0; index < BOOMERANG_POOL_CAPACITY; index += 1) {
      const root = new Container();
      const trail = new Graphics();
      const aura = new Sprite(boomerangAuraTexture);
      const wake = new Sprite(boomerangWakeTexture);
      const body = new Sprite(boomerangBodyTexture);
      const core = new Sprite(boomerangCoreTexture);
      aura.anchor.set(0.5);
      wake.anchor.set(0.5);
      body.anchor.set(0.5);
      core.anchor.set(0.5);
      root.addChild(trail, aura, wake, body, core);
      root.visible = false;
      this.boomerangVisuals.push({ root, trail, aura, wake, body, core });
      this.boomerangLayer.addChild(root);
    }
    // The capture pulse must sit above the pooled boomerang bodies without
    // changing the public child ordering of the weapon layer.
    this.boomerangLayer.addChild(this.boomerangPulseLayer);
  }

  public render(combat: WeaponRenderInput): void {
    const orbitPulse = combat.orbitPulse;
    this.orbitPulseLayer.clear();
    this.orbitPulseLayer.visible = orbitPulse?.active === true;
    if (orbitPulse?.active) {
      const progress = clamp01(orbitPulse.progress);
      const radius = orbitPulse.radius * (0.32 + progress * 0.68);
      const alpha = (1 - progress) * (this.quality === 'high' ? 0.78 : this.quality === 'medium' ? 0.62 : 0.5);
      drawSegmentedPulse(this.orbitPulseLayer, radius, alpha, 0x9b7cff, 0x75e6ff);
      this.orbitPulseLayer.position.set(orbitPulse.x, orbitPulse.y);
    }
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

    const boomerangs = combat.boomerangs ?? [];
    for (let index = 0; index < this.boomerangVisuals.length; index += 1) {
      const visual = this.boomerangVisuals[index];
      const state = boomerangs[index];
      visual.root.visible = state?.active === true;
      if (!state?.active) {
        visual.trail.clear();
        continue;
      }
      const speed = Math.hypot(state.vx, state.vy);
      const directionX = speed > 0.5 ? state.vx / speed : state.directionX;
      const directionY = speed > 0.5 ? state.vy / speed : state.directionY;
      const angle = Math.atan2(directionY, directionX);
      const returning = state.phase === 'returning';
      const singularity = state.evolution === 'singularity_return';
      const twinComet = state.evolution === 'twin_comet';
      const pulse = 1 + Math.sin(state.ageSeconds * (returning ? 26 : 20) + index * 0.8) * 0.06;
      const baseScale = state.radius / WEAPON_DEFINITIONS.vectorBoomerang.radius;
      const trailLength = this.quality === 'high' ? 38 : this.quality === 'medium' ? 29 : 20;
      const trailWidth = this.quality === 'high' ? 5.5 : this.quality === 'medium' ? 4.5 : 3.2;
      visual.root.position.set(state.x, state.y);
      visual.root.rotation = angle;
      visual.trail.clear();
      visual.trail.beginPath()
        .moveTo(-trailLength, 0)
        .lineTo(-trailLength * 0.32, trailWidth)
        .lineTo(0, 0)
        .lineTo(-trailLength * 0.32, -trailWidth)
        .closePath()
        .fill({ color: singularity ? 0x9b7cff : twinComet ? 0xffd978 : returning ? 0xd2a8ff : 0x75e6ff, alpha: this.quality === 'low' ? 0.34 : 0.5 });
      visual.trail.beginPath()
        .moveTo(-trailLength * 0.82, 0)
        .lineTo(-trailLength * 0.18, 0)
        .stroke({ color: 0xfff4cf, width: this.quality === 'high' ? 1.5 : 1, alpha: returning ? 0.72 : 0.58 });
      visual.aura.rotation = returning ? -state.ageSeconds * 2.6 : state.ageSeconds * 2.1;
      visual.aura.scale.set(baseScale * (returning ? 1.15 : 1));
      visual.aura.alpha = this.quality === 'high' ? (returning ? 0.92 : 0.74) : this.quality === 'medium' ? 0.62 : 0.42;
      visual.wake.visible = this.quality !== 'low';
      visual.wake.position.set(returning ? -3 : 0, 0);
      visual.wake.scale.set(baseScale * (returning ? 1.12 : 0.92), baseScale);
      visual.wake.alpha = this.quality === 'high' ? 0.82 : 0.58;
      visual.body.scale.set(baseScale * 0.58 * pulse);
      visual.body.alpha = 1;
      visual.core.scale.set(baseScale * (returning ? 1.05 : 0.9) * pulse);
      visual.core.alpha = returning ? 1 : 0.88;
    }

    this.boomerangPulseLayer.clear();
    const boomerangPulse = combat.boomerangPulse;
    this.boomerangPulseLayer.visible = boomerangPulse?.active === true;
    if (boomerangPulse?.active) {
      const progress = clamp01(boomerangPulse.progress);
      drawSegmentedPulse(
        this.boomerangPulseLayer,
        boomerangPulse.radius * (0.45 + progress * 0.55),
        (1 - progress) * (this.quality === 'high' ? 0.78 : 0.58),
        0x9b7cff,
        0xffd978
      );
      this.boomerangPulseLayer.position.set(boomerangPulse.x, boomerangPulse.y);
    }

    this.renderPulseRing(combat.pulseRingWeapon);
    this.renderMagneticCharge(combat.magneticCharge);

    let hasActiveChain = false;
    for (const segment of combat.chainSegments) {
      if (segment.active) {
        hasActiveChain = true;
        break;
      }
    }
    const chainExplosions = combat.chainExplosions ?? [];
    const hasActiveExplosion = chainExplosions.some((explosion) => explosion.active);
    if (!hasActiveChain && !hasActiveExplosion) {
      this.chainLayer.clear();
      this.chainLayer.visible = false;
      this.chainPulseLayer.visible = false;
      for (let index = 0; index < this.previousChainActive.length; index += 1) {
        this.previousChainActive[index] = false;
        this.chainImpactSprites[index].visible = false;
      }
      this.chainImpactLayer.visible = false;
      this.chainLayer.clear();
      return;
    }

    this.chainLayer.visible = true;
    this.chainLayer.clear();
    this.chainImpactLayer.visible = hasActiveChain;
    this.chainPulseLayer.visible = hasActiveChain && this.quality !== 'low';
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
    for (let index = 0; index < chainExplosions.length; index += 1) {
      const explosion = chainExplosions[index];
      if (!explosion.active) continue;
      const progress = clamp01(explosion.progress);
      const radius = explosion.phase === 'telegraph'
        ? explosion.radius * (0.46 + progress * 0.24)
        : explosion.radius * (0.76 + progress * 0.24);
      const alpha = explosion.phase === 'telegraph'
        ? 0.4 + progress * 0.35
        : (1 - progress) * 0.9;
      drawSegmentedPulse(this.chainLayer, radius, alpha, 0xff92a3, 0xffd978, explosion.x, explosion.y);
    }
  }

  public reset(): void {
    this.chainLayer.clear();
    this.chainLayer.visible = false;
    this.chainImpactLayer.visible = false;
    this.chainPulseLayer.visible = false;
    this.pulseRingLayer.visible = false;
    this.magneticChargeLayer.visible = false;
    this.orbitPulseLayer.visible = false;
    this.orbitPulseLayer.clear();
    this.boomerangPulseLayer.visible = false;
    this.boomerangPulseLayer.clear();
    this.pulseRingSequence = -1;
    this.magneticChargeSequence = -1;
    this.pulseRingTrack.clear();
    this.pulseRingCore.clear();
    this.pulseRingActiveShell.clear();
    this.pulseRingActiveMantle.clear();
    this.pulseRingActiveBody.clear();
    this.pulseRingActiveEdge.clear();
    this.pulseRingMarkers.clear();
    this.pulseRingResidue.clear();
    this.magneticChargeTrail.clear();
    this.magneticChargeBeacon.clear();
    this.magneticChargeField.clear();
    this.magneticChargeBackplate.clear();
    this.magneticChargeBand.clear();
    this.magneticChargeRails.clear();
    this.magneticChargeCore.clear();
    this.magneticChargeCore.position.set(0, 0);
    this.magneticChargeCore.scale.set(1);
    this.magneticChargeCore.alpha = 1;
    this.magneticChargeResidue.clear();
    this.magneticChargeBackplate.scale.set(1);
    this.magneticChargeBand.scale.set(1);
    this.magneticChargeRails.scale.set(1);
    for (const visual of this.orbitVisuals) {
      visual.root.visible = false;
      visual.root.scale.set(1);
      visual.core.scale.set(1);
    }
    for (const visual of this.boomerangVisuals) {
      visual.root.visible = false;
      visual.trail.clear();
      visual.aura.alpha = 1;
      visual.wake.alpha = 1;
      visual.body.alpha = 1;
      visual.core.alpha = 1;
    }
    for (let index = 0; index < this.previousChainActive.length; index += 1) {
      this.previousChainActive[index] = false;
      this.chainImpactSprites[index].visible = false;
      this.chainPulseSprites[index].visible = false;
    }
  }

  private renderPulseRing(
    state: CombatRenderState['pulseRingWeapon'] | undefined
  ): void {
    if (!state?.active || state.phase === 'idle') {
      this.pulseRingLayer.visible = false;
      return;
    }
    if (state.sequence !== this.pulseRingSequence) this.buildPulseRingSequence(state);

    this.pulseRingLayer.visible = true;
    this.pulseRingLayer.position.set(state.originX, state.originY);
    this.pulseRingTrack.visible = state.phase === 'telegraph';
    this.pulseRingCore.visible = state.phase === 'telegraph';
    this.pulseRingActiveShell.visible = state.phase === 'active';
    this.pulseRingActiveMantle.visible = state.phase === 'active' && this.quality !== 'low';
    this.pulseRingActiveBody.visible = state.phase === 'active';
    this.pulseRingActiveEdge.visible = state.phase === 'active' && this.quality !== 'low';
    this.pulseRingMarkers.visible = state.phase === 'active' && this.quality === 'high';
    this.pulseRingResidue.visible = state.phase === 'recovery';

    const progress = clamp01(state.progress);
    if (state.phase === 'telegraph') {
      this.pulseRingTrack.alpha = 0.52 + progress * 0.42;
      this.pulseRingCore.alpha = 0.68 + progress * 0.32;
      this.pulseRingCore.scale.set(0.9 + progress * 0.1);
      this.pulseRingTrack.scale.set(this.reducedMotion ? 1 : 1.32 - progress * 0.32);
      this.pulseRingCore.rotation = this.reducedMotion ? 0 : -progress * Math.PI / 4;
      this.pulseRingTrack.rotation = this.reducedMotion ? 0 : progress * 0.08;
      return;
    }
    if (state.phase === 'active') {
      const scale = Math.max(0.05, state.radius / this.pulseRingBaseRadius);
      const rotation = this.reducedMotion ? 0 : progress * 0.12;
      this.pulseRingActiveShell.scale.set(scale);
      this.pulseRingActiveMantle.scale.set(scale);
      this.pulseRingActiveBody.scale.set(scale);
      this.pulseRingActiveEdge.scale.set(scale);
      this.pulseRingMarkers.scale.set(scale);
      this.pulseRingActiveShell.rotation = rotation;
      this.pulseRingActiveMantle.rotation = -rotation * 1.4;
      this.pulseRingActiveBody.rotation = rotation * 0.6;
      this.pulseRingActiveEdge.rotation = -rotation * 1.8;
      this.pulseRingMarkers.rotation = rotation;
      this.pulseRingActiveShell.alpha = 0.88;
      this.pulseRingActiveMantle.alpha = 0.34 + Math.sin(progress * Math.PI) * 0.18;
      this.pulseRingActiveBody.alpha = 0.76 + Math.sin(progress * Math.PI) * 0.18;
      this.pulseRingActiveEdge.alpha = 0.62 + Math.exp(-progress * 10) * 0.38;
      this.pulseRingMarkers.alpha = 0.72 + (1 - progress) * 0.22;
      return;
    }
    const fade = (1 - progress) ** 2;
    this.pulseRingResidue.alpha = fade * 0.82;
    this.pulseRingResidue.scale.set(this.reducedMotion ? 1 : 1 + progress * 0.09);
    this.pulseRingResidue.rotation = this.reducedMotion ? 0 : -progress * 0.08;
  }

  private renderMagneticCharge(
    state: CombatRenderState['magneticCharge'] | undefined
  ): void {
    if (!state?.active) {
      this.magneticChargeLayer.visible = false;
      return;
    }
    if (state.sequence !== this.magneticChargeSequence) this.buildMagneticChargeSequence(state);

    this.magneticChargeLayer.visible = true;
    this.magneticChargeLayer.position.set(0, 0);
    const progress = clamp01(state.progress);
    const rhythm = Math.sin(progress * Math.PI);
    const intensity = this.quality === 'high' ? 0.9 : this.quality === 'medium' ? 0.74 : 0.56;
    const inFlight = state.phase === 'travel';
    const attracting = state.phase === 'attract';
    const detonating = state.phase === 'detonate' || state.phase === 'collapse';
    const collapsing = state.phase === 'collapse';
    const recovering = state.phase === 'recovery';

    const lift = inFlight && !this.reducedMotion ? Math.sin(progress * Math.PI) * 62 : 0;
    this.magneticChargeTrail.clear();
    if (inFlight) {
      drawMagneticTravelTrail(
        this.magneticChargeTrail,
        state.x - (state.targetX - state.originX) * Math.min(progress, 0.16),
        state.y - lift - (state.targetY - state.originY) * Math.min(progress, 0.16),
        state.x,
        state.y - lift,
        intensity
      );
    }
    this.magneticChargeTrail.visible = inFlight;
    this.magneticChargeBeacon.visible = inFlight || attracting;
    this.magneticChargeField.visible = attracting && this.quality !== 'low';
    this.magneticChargeBackplate.visible = detonating;
    this.magneticChargeBand.visible = detonating;
    this.magneticChargeRails.visible = detonating;
    this.magneticChargeCore.visible = !recovering;
    this.magneticChargeResidue.visible = recovering;

    const rotation = this.reducedMotion ? 0 : state.rotation;
    this.magneticChargeBeacon.rotation = rotation * 0.35;
    this.magneticChargeField.rotation = -rotation * 0.7;
    this.magneticChargeBackplate.rotation = -rotation * 0.28;
    this.magneticChargeBand.rotation = rotation * 0.42;
    this.magneticChargeRails.rotation = -rotation * 0.78;
    this.magneticChargeResidue.rotation = rotation * 0.5;

    this.magneticChargeBeacon.alpha = intensity * (inFlight ? 0.62 + progress * 0.28 : 0.86 + rhythm * 0.1);
    this.magneticChargeField.alpha = intensity * (0.62 + rhythm * 0.2);
    this.magneticChargeBackplate.alpha = intensity * (0.7 + rhythm * 0.1);
    this.magneticChargeBand.alpha = intensity * (0.86 + rhythm * 0.14);
    this.magneticChargeRails.alpha = intensity * (0.72 + rhythm * 0.16);
    this.magneticChargeResidue.alpha = intensity * (1 - progress) ** 2;

    // Contract: the damage boundaries stay at their exact radii. Only ornaments contract.
    this.magneticChargeField.scale.set(attracting ? 1 - progress * 0.48 : 1);
    const collapseScale = collapsing ? 1 - Math.sin(progress * Math.PI) * 0.28 : 1;
    const polarCollapse = state.evolution === 'polar_collapse';
    const polarFrontScale = polarCollapse && state.phase === 'detonate'
      ? Math.max(0.08, 1 - progress)
      : polarCollapse ? 0.08 : collapseScale;
    this.magneticChargeBackplate.scale.set(collapseScale);
    this.magneticChargeBand.scale.set(polarFrontScale);
    this.magneticChargeRails.scale.set(polarCollapse ? polarFrontScale : collapseScale);
    this.magneticChargeResidue.scale.set(1 + progress * 0.12);
    this.magneticChargeCore.position.set(state.x, state.y - lift);
    this.magneticChargeCore.scale.set(inFlight ? 0.65 + Math.sin(progress * Math.PI) * 0.9
      : polarCollapse && collapsing ? 0.82 + Math.sin(progress * Math.PI * 2) * 0.13
      : detonating ? 0.65 + Math.exp(-progress * (collapsing ? 4 : 14)) * 0.65 : 0.85 + progress * 0.15);
    this.magneticChargeCore.rotation = inFlight && !this.reducedMotion ? progress * Math.PI * 2 : 0;
    this.magneticChargeCore.alpha = intensity * (recovering ? 0 : 0.92 + rhythm * 0.08);
  }

  private buildMagneticChargeSequence(state: CombatRenderState['magneticCharge']): void {
    this.magneticChargeBeacon.clear();
    this.magneticChargeField.clear();
    this.magneticChargeBackplate.clear();
    this.magneticChargeBand.clear();
    this.magneticChargeRails.clear();
    this.magneticChargeCore.clear();
    this.magneticChargeResidue.clear();
    drawMagneticBeacon(this.magneticChargeBeacon, 0, 0, state.pullRadius);
    drawMagneticField(this.magneticChargeField, 0, 0, state.pullRadius);
    if (state.evolution === 'polar_collapse') {
      const polarRadius = state.polarRadius ?? state.outerRadius * 0.61;
      const polarAngle = state.polarAngle ?? 0;
      drawPolarCollapseBackplate(this.magneticChargeBackplate, 0, 0, polarRadius, polarAngle);
      drawPolarCollapseFronts(this.magneticChargeBand, 0, 0, polarRadius, polarAngle);
      drawPolarCollapseRails(this.magneticChargeRails, 0, 0, polarRadius, polarAngle);
    } else {
      drawMagneticDetonationBackplate(
        this.magneticChargeBackplate,
        0,
        0,
        state.innerRadius,
        state.outerRadius
      );
      drawMagneticDetonationBand(
        this.magneticChargeBand,
        0,
        0,
        state.innerRadius,
        state.outerRadius
      );
      drawMagneticRails(
        this.magneticChargeRails,
        0,
        0,
        state.innerRadius,
        state.outerRadius
      );
    }
    drawMagneticCore(this.magneticChargeCore, 0, 0, 1, MAGNETIC_CHARGE_CYAN);
    drawMagneticResidue(this.magneticChargeResidue, 0, 0, state.outerRadius);
    for (const layer of [this.magneticChargeBeacon, this.magneticChargeField,
      this.magneticChargeBackplate, this.magneticChargeBand, this.magneticChargeRails,
      this.magneticChargeResidue]) {
      layer.position.set(state.targetX, state.targetY);
      layer.pivot.set(0, 0);
    }
    this.magneticChargeSequence = state.sequence;
  }

  private buildPulseRingSequence(state: CombatRenderState['pulseRingWeapon']): void {
    this.pulseRingTrack.clear();
    this.pulseRingCore.clear();
    this.pulseRingActiveShell.clear();
    this.pulseRingActiveMantle.clear();
    this.pulseRingActiveBody.clear();
    this.pulseRingActiveEdge.clear();
    this.pulseRingMarkers.clear();
    this.pulseRingResidue.clear();
    this.pulseRingBaseRadius = Math.max(1, state.endRadius);
    const compressionWave = state.evolution === 'compression_wave';
    const directionX = state.directionX ?? 0;
    const directionY = state.directionY ?? -1;

    // Telegraph: four independent reactor shutters, never a closed shield.
    if (compressionWave) {
      drawPulseDirectionalSegmentedBand(this.pulseRingTrack, state.startRadius, 4,
        PULSE_AMBER, 0.92, 5, directionX, directionY);
    } else {
      drawPulseChargeBrackets(this.pulseRingTrack, state.startRadius, PULSE_AMBER, 2.5, 0.92);
      drawPulseChargeSpokes(this.pulseRingTrack, state.startRadius, PULSE_HOT, 0.82);
    }
    drawPulseAperture(this.pulseRingCore);
    // Four armored shutters close toward the captured origin before release.
    for (let index = 0; index < (compressionWave ? 2 : 4); index += 1) {
      const angle = index * Math.PI / 2 + Math.PI / 4;
      const radius = state.startRadius + 7;
      const a = polarPoint(radius, angle - 0.22);
      const b = polarPoint(radius + 10, angle);
      const c = polarPoint(radius, angle + 0.22);
      const d = polarPoint(radius - 5, angle);
      this.pulseRingTrack.beginPath().moveTo(a.x, a.y).lineTo(b.x, b.y)
        .lineTo(c.x, c.y).lineTo(d.x, d.y).closePath()
        .fill({ color: PULSE_INK, alpha: 0.96 })
        .stroke({ color: PULSE_VIOLET, width: 1.8, alpha: 0.9 });
      this.pulseRingTrack.beginPath().moveTo(a.x, a.y).lineTo(b.x, b.y)
        .stroke({ color: PULSE_HOT, width: 1.2, alpha: 0.9 });
    }

    // Active cast: a segmented, serrated wavefront. Compression reuses the
    // same premium construction but clips every layer to the captured cone,
    // so its visual reach agrees with its collision reach.
    if (compressionWave) {
      drawPulseDirectionalSegmentedBand(this.pulseRingActiveShell, this.pulseRingBaseRadius,
        state.width + 16, PULSE_INK, 0.96, 7, directionX, directionY);
      drawPulseDirectionalSegmentedBand(this.pulseRingActiveMantle, this.pulseRingBaseRadius,
        state.width + 7, PULSE_ARMOR, 0.96, 6, directionX, directionY);
      drawPulseDirectionalSegmentedBand(this.pulseRingActiveBody, this.pulseRingBaseRadius,
        state.width, PULSE_VIOLET, 0.92, 6, directionX, directionY);
      drawPulseDirectionalEdge(this.pulseRingActiveEdge, this.pulseRingBaseRadius, state.width,
        6, directionX, directionY);
      drawPulseDirectionalVectors(this.pulseRingMarkers, this.pulseRingBaseRadius, 5,
        PULSE_HOT, 0.92, directionX, directionY);
    } else {
      drawPulseSegmentedBand(this.pulseRingActiveShell, this.pulseRingBaseRadius, state.width + 16, PULSE_INK, 0.96, 16, 0);
      drawPulseSegmentedBand(this.pulseRingActiveMantle, this.pulseRingBaseRadius, state.width + 7, PULSE_ARMOR, 0.96, 12, Math.PI / 12);
      drawPulseWaveBand(this.pulseRingActiveBody, this.pulseRingBaseRadius, state.width, PULSE_VIOLET, 0.92, 14);
      drawPulseSerratedEdge(this.pulseRingActiveEdge, this.pulseRingBaseRadius, state.width, 14);
      drawPulseExpansionVectors(this.pulseRingMarkers, this.pulseRingBaseRadius, 8, PULSE_HOT, 0.92);
    }

    // Recovery: eight fading echo shards, not another full arena ring.
    drawPulseEchoTicks(this.pulseRingResidue, state.endRadius, PULSE_RECOVERY, 0.78);
    this.pulseRingSequence = state.sequence;
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

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const drawSegmentedPulse = (
  graphics: Graphics,
  radius: number,
  alpha: number,
  primary: number,
  secondary: number,
  centerX = 0,
  centerY = 0
): void => {
  const segments = 10;
  const gap = 0.09;
  for (let index = 0; index < segments; index += 1) {
    const start = index / segments * FULL_CIRCLE + gap;
    const end = (index + 0.72) / segments * FULL_CIRCLE - gap;
    graphics.beginPath().arc(centerX, centerY, radius, start, end)
      .stroke({ color: index % 2 === 0 ? primary : secondary, width: 2.4, alpha });
    if (index % 2 === 0) {
      const x = centerX + Math.cos(end) * radius;
      const y = centerY + Math.sin(end) * radius;
      graphics.beginPath().moveTo(x, y)
        .lineTo(centerX + Math.cos(end + 0.1) * (radius + 7), centerY + Math.sin(end + 0.1) * (radius + 7))
        .stroke({ color: 0xfff4cf, width: 1, alpha: alpha * 0.82 });
    }
  }
  graphics.beginPath().circle(centerX, centerY, Math.max(2, radius * 0.08))
    .fill({ color: 0xf4ffff, alpha: alpha * 0.55 });
};

const drawMagneticTravelTrail = (
  graphics: Graphics,
  originX: number,
  originY: number,
  x: number,
  y: number,
  intensity: number
): void => {
  const dx = x - originX;
  const dy = y - originY;
  const length = Math.hypot(dx, dy);
  if (length < 2) return;
  const nx = -dy / length;
  const ny = dx / length;
  const tailX = x - dx * 0.9;
  const tailY = y - dy * 0.9;
  const wide = Math.min(14, 4 + length * 0.035);
  graphics.beginPath().moveTo(tailX + nx * wide, tailY + ny * wide)
    .lineTo(x, y)
    .lineTo(tailX - nx * wide, tailY - ny * wide)
    .closePath()
    .fill({ color: MAGNETIC_CHARGE_CYAN, alpha: intensity * 0.16 });
  graphics.beginPath().moveTo(originX, originY).lineTo(x, y)
    .stroke({ color: MAGNETIC_CHARGE_INK, width: 8, alpha: intensity * 0.55 });
  graphics.beginPath().moveTo(originX, originY).lineTo(x, y)
    .stroke({ color: MAGNETIC_CHARGE_CYAN, width: 2.6, alpha: intensity * 0.78 });
  graphics.beginPath().moveTo(originX, originY).lineTo(tailX + dx * 0.08, tailY + dy * 0.08)
    .stroke({ color: MAGNETIC_CHARGE_WHITE, width: 0.9, alpha: intensity * 0.7 });
  for (let index = 0; index < 3; index += 1) {
    const t = 0.18 + index * 0.2;
    const centerX = originX + dx * t;
    const centerY = originY + dy * t;
    const size = 4 - index * 0.8;
    graphics.beginPath().moveTo(centerX - nx * size, centerY - ny * size)
      .lineTo(centerX + nx * size, centerY + ny * size)
      .stroke({ color: index === 0 ? MAGNETIC_CHARGE_GOLD : MAGNETIC_CHARGE_WHITE, width: 1.2, alpha: intensity * (0.7 - index * 0.12) });
  }
};

const drawMagneticBeacon = (graphics: Graphics, x: number, y: number, pullRadius: number): void => {
  const radius = Math.max(42, pullRadius * 0.36);
  const count = 8;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const start = index * sector + sector * 0.18;
    const end = (index + 1) * sector - sector * 0.12;
    drawMagneticArc(graphics, x, y, radius + 8, start, end, MAGNETIC_CHARGE_INK, 6, 0.9);
    drawMagneticArc(graphics, x, y, radius, start, end, index % 2 === 0 ? MAGNETIC_CHARGE_CYAN : MAGNETIC_CHARGE_VIOLET, 1.7, 0.78);
  }
  graphics.beginPath().regularPoly(x, y, 18, 8, Math.PI / 8)
    .fill({ color: MAGNETIC_CHARGE_INK, alpha: 0.86 })
    .stroke({ color: MAGNETIC_CHARGE_CYAN, width: 1.3, alpha: 0.75 });
  graphics.beginPath().moveTo(x - 9, y).lineTo(x, y - 5).lineTo(x + 9, y).lineTo(x, y + 5).closePath()
    .stroke({ color: MAGNETIC_CHARGE_GOLD, width: 1.2, alpha: 0.88 });
};

const drawMagneticField = (graphics: Graphics, x: number, y: number, pullRadius: number): void => {
  const count = 8;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const angle = index * sector + Math.PI / 8;
    const outer = pullRadius * (0.72 + (index % 2) * 0.08);
    const start = polarPoint(outer, angle - sector * 0.23);
    const end = polarPoint(outer, angle + sector * 0.23);
    graphics.beginPath().moveTo(x + start.x, y + start.y).lineTo(x + end.x, y + end.y)
      .stroke({ color: index % 2 === 0 ? MAGNETIC_CHARGE_CYAN : MAGNETIC_CHARGE_VIOLET, width: 1.4, alpha: 0.7 });
    const tip = polarPoint(outer - 18, angle);
    const left = polarPoint(outer - 5, angle - 0.12);
    const right = polarPoint(outer - 5, angle + 0.12);
    graphics.beginPath().moveTo(x + left.x, y + left.y)
      .lineTo(x + tip.x, y + tip.y)
      .lineTo(x + right.x, y + right.y)
      .stroke({ color: MAGNETIC_CHARGE_WHITE, width: 1.5, alpha: 0.8 });
  }
  drawMagneticArc(graphics, x, y, pullRadius * 0.54, 0.2, 1.18, MAGNETIC_CHARGE_CYAN, 1, 0.48);
  drawMagneticArc(graphics, x, y, pullRadius * 0.54, Math.PI + 0.2, Math.PI + 1.18, MAGNETIC_CHARGE_VIOLET, 1, 0.48);
};

const drawPolarCollapseBackplate = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  angle: number
): void => {
  const points = [0, 1, 2].map((index) => polarPoint(radius + 10, angle + index * FULL_CIRCLE / 3));
  graphics.beginPath()
    .moveTo(x + points[0].x, y + points[0].y)
    .lineTo(x + points[1].x, y + points[1].y)
    .lineTo(x + points[2].x, y + points[2].y)
    .closePath()
    .fill({ color: MAGNETIC_CHARGE_INK, alpha: 0.72 })
    .stroke({ color: MAGNETIC_CHARGE_VIOLET, width: 5, alpha: 0.34 });
};

const drawPolarCollapseFronts = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  angle: number
): void => {
  for (let index = 0; index < 3; index += 1) {
    const vertex = polarPoint(radius, angle + index * FULL_CIRCLE / 3);
    graphics.beginPath().moveTo(x + vertex.x, y + vertex.y).lineTo(x, y)
      .stroke({ color: MAGNETIC_CHARGE_INK, width: 9, alpha: 0.92 });
    graphics.beginPath().moveTo(x + vertex.x, y + vertex.y).lineTo(x, y)
      .stroke({ color: MAGNETIC_CHARGE_VIOLET, width: 4.2, alpha: 0.9 });
    graphics.beginPath().moveTo(x + vertex.x, y + vertex.y).lineTo(x, y)
      .stroke({ color: MAGNETIC_CHARGE_CYAN, width: 1.5, alpha: 0.94 });
    graphics.beginPath().regularPoly(x + vertex.x, y + vertex.y, 6, 6, angle)
      .fill({ color: MAGNETIC_CHARGE_INK, alpha: 0.96 })
      .stroke({ color: MAGNETIC_CHARGE_GOLD, width: 1.5, alpha: 0.9 });
  }
};

const drawPolarCollapseRails = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  angle: number
): void => {
  for (const scale of [0.42, 0.76, 1]) {
    const points = [0, 1, 2].map((index) => polarPoint(radius * scale, angle + index * FULL_CIRCLE / 3));
    graphics.beginPath()
      .moveTo(x + points[0].x, y + points[0].y)
      .lineTo(x + points[1].x, y + points[1].y)
      .lineTo(x + points[2].x, y + points[2].y)
      .closePath()
      .stroke({
        color: scale === 1 ? MAGNETIC_CHARGE_GOLD : MAGNETIC_CHARGE_CYAN,
        width: scale === 1 ? 1.8 : 1.1,
        alpha: scale === 1 ? 0.82 : 0.5
      });
  }
};

const drawMagneticDetonationBackplate = (
  graphics: Graphics,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number
): void => {
  const count = 12;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const start = index * sector + sector * 0.14;
    const end = (index + 1) * sector - sector * 0.1;
    drawMagneticArc(graphics, x, y, outerRadius + 8, start, end, MAGNETIC_CHARGE_INK, 10, 0.92);
    drawMagneticArc(graphics, x, y, Math.max(2, innerRadius - 6), start + 0.03, end - 0.03, MAGNETIC_CHARGE_INK, 3, 0.9);
  }
};

const drawMagneticDetonationBand = (
  graphics: Graphics,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number
): void => {
  graphics.beginPath().arc(x, y, (innerRadius + outerRadius) * 0.5, 0, FULL_CIRCLE)
    .stroke({ color: MAGNETIC_CHARGE_VIOLET, width: outerRadius - innerRadius, alpha: 0.09 });
  const count = 12;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const start = index * sector + sector * 0.15;
    const end = (index + 1) * sector - sector * 0.12;
    const panelInner = innerRadius + (index % 3 === 0 ? 3 : 0);
    const panelOuter = outerRadius - (index % 4 === 0 ? 4 : 0);
    drawMagneticAnnularPanel(
      graphics,
      x,
      y,
      panelInner,
      panelOuter,
      start,
      end,
      index % 3 === 0 ? MAGNETIC_CHARGE_VIOLET : index % 2 === 0 ? MAGNETIC_CHARGE_CYAN : MAGNETIC_CHARGE_ARMOR,
      index % 3 === 0 ? 0.22 : 0.14
    );
    const edgeInner = polarPoint(panelInner + 2, end);
    const edgeOuter = polarPoint(panelOuter - 2, end);
    // Nested plasma ribbons concentrate light instead of filling the whole zone.
    for (let ribbon = 0; ribbon < 3; ribbon += 1) {
      const radius = innerRadius + (outerRadius - innerRadius) * (0.25 + ribbon * 0.27);
      drawMagneticArc(graphics, x, y, radius, start + ribbon * 0.035,
        end - 0.06, ribbon === 1 ? MAGNETIC_CHARGE_CYAN : MAGNETIC_CHARGE_VIOLET,
        ribbon === 1 ? 2.2 : 1.1, ribbon === 1 ? 0.6 : 0.36);
    }
    const tip = polarPoint(panelOuter - 5, start + 0.08);
    const heel = polarPoint(panelOuter - 15, start + 0.14);
    graphics.beginPath().moveTo(x + tip.x, y + tip.y)
      .lineTo(x + heel.x, y + heel.y)
      .stroke({ color: MAGNETIC_CHARGE_WHITE, width: 1.6, alpha: 0.82 });
    graphics.beginPath().moveTo(x + edgeInner.x, y + edgeInner.y).lineTo(x + edgeOuter.x, y + edgeOuter.y)
      .stroke({ color: index % 2 === 0 ? MAGNETIC_CHARGE_GOLD : MAGNETIC_CHARGE_WHITE, width: 1, alpha: 0.62 });
  }
};

const drawMagneticRails = (
  graphics: Graphics,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number
): void => {
  for (const radius of [innerRadius, outerRadius]) {
    drawMagneticArc(graphics, x, y, radius, 0, FULL_CIRCLE, MAGNETIC_CHARGE_INK, 6, 0.9);
    drawMagneticArc(graphics, x, y, radius, 0, FULL_CIRCLE, MAGNETIC_CHARGE_VIOLET, 3.4, 0.84);
    drawMagneticArc(graphics, x, y, radius, 0, FULL_CIRCLE, MAGNETIC_CHARGE_CYAN, 1.2, 0.92);
  }
  const count = 8;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const start = index * sector + sector * 0.2;
    const end = (index + 1) * sector - sector * 0.18;
    drawMagneticArc(graphics, x, y, innerRadius - 1, start, end, MAGNETIC_CHARGE_WHITE, 1.5, 0.76);
    drawMagneticArc(graphics, x, y, outerRadius + 1, start + 0.04, end - 0.04, MAGNETIC_CHARGE_GOLD, 1.3, 0.72);
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = index * FULL_CIRCLE / 6 + Math.PI / 6;
    const inner = polarPoint(innerRadius - 9, angle);
    const outer = polarPoint(innerRadius + 10, angle);
    graphics.beginPath().moveTo(x + inner.x, y + inner.y).lineTo(x + outer.x, y + outer.y)
      .stroke({ color: MAGNETIC_CHARGE_CYAN, width: 1.4, alpha: 0.64 });
  }
};

const drawMagneticCore = (
  graphics: Graphics,
  x: number,
  y: number,
  scale: number,
  accent: number
): void => {
  const radius = 16 * scale;
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI / 2 + Math.PI / 4;
    const px = x + Math.cos(angle) * 25 * scale;
    const py = y + Math.sin(angle) * 25 * scale;
    graphics.beginPath().regularPoly(px, py, 6 * scale, 4, angle)
      .fill({ color: MAGNETIC_CHARGE_INK }).stroke({ color: 0x788ba8, width: 1.4 });
    graphics.beginPath().moveTo(px - 3, py).lineTo(px, py - 4).lineTo(px + 3, py)
      .stroke({ color: MAGNETIC_CHARGE_WHITE, width: 1.1, alpha: 0.9 });
  }
  graphics.beginPath().regularPoly(x, y, radius + 7, 8, Math.PI / 8)
    .fill({ color: MAGNETIC_CHARGE_INK, alpha: 0.94 })
    .stroke({ color: MAGNETIC_CHARGE_ARMOR, width: 3, alpha: 0.94 });
  graphics.beginPath().regularPoly(x, y, radius, 8, Math.PI / 8)
    .fill({ color: MAGNETIC_CHARGE_ARMOR, alpha: 0.96 })
    .stroke({ color: accent, width: 1.8, alpha: 0.95 });
  graphics.beginPath().moveTo(x - radius * 0.62, y).lineTo(x, y - radius * 0.32).lineTo(x + radius * 0.62, y)
    .lineTo(x, y + radius * 0.32).closePath()
    .fill({ color: accent, alpha: 0.78 });
  graphics.beginPath().circle(x, y, Math.max(2.5, radius * 0.22))
    .fill({ color: MAGNETIC_CHARGE_WHITE, alpha: 0.96 });
  graphics.beginPath().moveTo(x - radius - 4, y).lineTo(x - radius + 2, y)
    .moveTo(x + radius - 2, y).lineTo(x + radius + 4, y)
    .stroke({ color: MAGNETIC_CHARGE_GOLD, width: 1.5, alpha: 0.9 });
};

const drawMagneticResidue = (graphics: Graphics, x: number, y: number, outerRadius: number): void => {
  for (let index = 0; index < 8; index += 1) {
    const angle = index * FULL_CIRCLE / 8 + Math.PI / 8;
    const point = polarPoint(outerRadius * (0.78 + (index % 2) * 0.12), angle);
    const tip = polarPoint(outerRadius * (0.91 + (index % 2) * 0.08), angle);
    graphics.beginPath().moveTo(x + point.x, y + point.y).lineTo(x + tip.x, y + tip.y)
      .stroke({ color: index % 2 === 0 ? MAGNETIC_CHARGE_CYAN : MAGNETIC_CHARGE_VIOLET, width: 2, alpha: 0.82 });
    graphics.beginPath().regularPoly(x + tip.x, y + tip.y, 3.2, 4, angle)
      .fill({ color: MAGNETIC_CHARGE_WHITE, alpha: 0.78 });
  }
};

const drawMagneticAnnularPanel = (
  graphics: Graphics,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  start: number,
  end: number,
  color: number,
  alpha: number
): void => {
  const steps = 3;
  graphics.beginPath();
  for (let step = 0; step <= steps; step += 1) {
    const angle = start + (end - start) * step / steps;
    const point = polarPoint(outerRadius, angle);
    if (step === 0) graphics.moveTo(x + point.x, y + point.y);
    else graphics.lineTo(x + point.x, y + point.y);
  }
  for (let step = steps; step >= 0; step -= 1) {
    const angle = start + (end - start) * step / steps;
    const point = polarPoint(innerRadius, angle);
    graphics.lineTo(x + point.x, y + point.y);
  }
  graphics.closePath().fill({ color, alpha });
};

const drawMagneticArc = (
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  start: number,
  end: number,
  color: number,
  width: number,
  alpha: number
): void => {
  graphics.beginPath().arc(x, y, Math.max(1, radius), start, end)
    .stroke({ color, width, alpha });
};

const drawPulseChargeBrackets = (
  graphics: Graphics,
  radius: number,
  color: number,
  width: number,
  alpha: number
): void => {
  const bracketCount = 4;
  const sector = FULL_CIRCLE / bracketCount;
  const span = sector * 0.26;
  for (let index = 0; index < bracketCount; index += 1) {
    const center = index * sector + Math.PI / 4;
    graphics.beginPath()
      .arc(0, 0, Math.max(1, radius), center - span, center + span)
      .stroke({ color, width, alpha });
    graphics.beginPath()
      .arc(0, 0, Math.max(1, radius - 7), center - span * 0.72, center + span * 0.72)
      .stroke({ color: PULSE_VIOLET, width: 1.1, alpha: alpha * 0.72 });
  }
};

const drawPulseChargeSpokes = (
  graphics: Graphics,
  radius: number,
  color: number,
  alpha: number
): void => {
  for (let index = 0; index < 4; index += 1) {
    const angle = index * (FULL_CIRCLE / 4);
    const inner = Math.max(8, radius - 11);
    const outer = radius + 8;
    const innerX = Math.cos(angle) * inner;
    const innerY = Math.sin(angle) * inner;
    const outerX = Math.cos(angle) * outer;
    const outerY = Math.sin(angle) * outer;
    graphics.beginPath().moveTo(innerX, innerY).lineTo(outerX, outerY)
      .stroke({ color, width: 1.3, alpha: alpha * 0.7 });
    const tipX = Math.cos(angle) * (outer + 6);
    const tipY = Math.sin(angle) * (outer + 6);
    const tangentX = -Math.sin(angle) * 3.5;
    const tangentY = Math.cos(angle) * 3.5;
    graphics.beginPath()
      .moveTo(outerX - tangentX, outerY - tangentY)
      .lineTo(tipX, tipY)
      .lineTo(outerX + tangentX, outerY + tangentY)
      .closePath()
      .fill({ color: PULSE_HOT, alpha: alpha * 0.9 });
  }
};

const drawPulseAperture = (graphics: Graphics): void => {
  graphics.beginPath().regularPoly(0, 0, 13, 8, Math.PI / 8)
    .fill({ color: PULSE_INK, alpha: 0.96 })
    .stroke({ color: PULSE_VIOLET, width: 1.8, alpha: 0.96 });
  graphics.beginPath().regularPoly(0, 0, 8, 8, Math.PI / 8)
    .stroke({ color: PULSE_HOT, width: 1.4, alpha: 0.95 });
  graphics.beginPath().moveTo(-3, 0).lineTo(0, -4).lineTo(3, 0).lineTo(0, 4).closePath()
    .fill({ color: PULSE_MAGENTA, alpha: 0.94 });
  for (let index = 0; index < 4; index += 1) {
    const angle = index * (FULL_CIRCLE / 4) + Math.PI / 4;
    const x = Math.cos(angle) * 17;
    const y = Math.sin(angle) * 17;
    graphics.beginPath().moveTo(x, y - 2.6).lineTo(x + 2.6, y).lineTo(x, y + 2.6).lineTo(x - 2.6, y).closePath()
      .fill({ color: PULSE_AMBER, alpha: 0.82 });
  }
};

const drawPulseSegmentedBand = (
  graphics: Graphics,
  radius: number,
  width: number,
  color: number,
  alpha: number,
  count: number,
  phase: number
): void => {
  const sector = FULL_CIRCLE / count;
  const gap = sector * 0.14;
  for (let index = 0; index < count; index += 1) {
    const start = phase + index * sector + gap;
    const end = phase + (index + 1) * sector - gap;
    drawPulseSectorBand(graphics, radius, width, color, alpha, start, end);
  }
};

const drawPulseDirectionalSegmentedBand = (
  graphics: Graphics,
  radius: number,
  width: number,
  color: number,
  alpha: number,
  count: number,
  directionX: number,
  directionY: number
): void => {
  const center = Math.atan2(directionY, directionX);
  const halfSpan = Math.PI * 55 / 180;
  const sector = (halfSpan * 2) / count;
  const gap = Math.min(0.07, sector * 0.18);
  for (let index = 0; index < count; index += 1) {
    const start = center - halfSpan + index * sector + gap;
    const end = center - halfSpan + (index + 1) * sector - gap;
    drawPulseSectorBand(graphics, radius, width, color, alpha, start, end);
  }
};

const drawPulseSectorBand = (
  graphics: Graphics,
  radius: number,
  width: number,
  color: number,
  alpha: number,
  start: number,
  end: number
): void => {
  const outer = Math.max(1, radius + width * 0.5);
  const inner = Math.max(0.5, radius - width * 0.5);
  const arcSteps = 3;
  graphics.beginPath();
  for (let step = 0; step <= arcSteps; step += 1) {
    const angle = start + (end - start) * (step / arcSteps);
    const x = Math.cos(angle) * outer;
    const y = Math.sin(angle) * outer;
    if (step === 0) graphics.moveTo(x, y);
    else graphics.lineTo(x, y);
  }
  for (let step = arcSteps; step >= 0; step -= 1) {
    const angle = start + (end - start) * (step / arcSteps);
    graphics.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
  }
  graphics.closePath().fill({ color, alpha });
};

const drawPulseWaveBand = (
  graphics: Graphics,
  radius: number,
  width: number,
  color: number,
  alpha: number,
  count: number
): void => {
  const sector = FULL_CIRCLE / count;
  const outer = Math.max(1, radius + width * 0.5);
  const inner = Math.max(0.5, radius - width * 0.46);
  for (let index = 0; index < count; index += 1) {
    const center = index * sector + sector * 0.5;
    const halfSpan = sector * 0.31;
    const tipRadius = outer + (index % 2 === 0 ? width * 0.32 : width * 0.18);
    const outerStart = polarPoint(outer, center - halfSpan);
    const outerTip = polarPoint(tipRadius, center);
    const outerEnd = polarPoint(outer, center + halfSpan);
    const innerEnd = polarPoint(inner, center + halfSpan * 0.86);
    const innerTip = polarPoint(inner - width * 0.12, center);
    const innerStart = polarPoint(inner, center - halfSpan * 0.86);
    graphics.beginPath()
      .moveTo(outerStart.x, outerStart.y)
      .lineTo(outerTip.x, outerTip.y)
      .lineTo(outerEnd.x, outerEnd.y)
      .lineTo(innerEnd.x, innerEnd.y)
      .lineTo(innerTip.x, innerTip.y)
      .lineTo(innerStart.x, innerStart.y)
      .closePath()
      .fill({ color: PULSE_ARMOR, alpha: alpha * 0.9 });
    // A broad dark heel, a colored bevel and a narrow hot crest give each
    // pressure petal a cross-section. Keep these facets in Low as well.
    graphics.beginPath().moveTo(outerStart.x, outerStart.y)
      .lineTo(outerTip.x, outerTip.y).lineTo(outerEnd.x, outerEnd.y)
      .lineTo(innerTip.x, innerTip.y).closePath()
      .fill({ color: index % 3 === 0 ? PULSE_MAGENTA : color, alpha: alpha * 0.7 });
    graphics.beginPath().moveTo(outerStart.x, outerStart.y)
      .lineTo(outerTip.x, outerTip.y).lineTo(outerEnd.x, outerEnd.y)
      .stroke({ color: PULSE_AMBER, width: 2.6, alpha: alpha * 0.9 });
    graphics.beginPath().moveTo(outerStart.x, outerStart.y)
      .lineTo(outerTip.x, outerTip.y)
      .stroke({ color: PULSE_HOT, width: 1.2, alpha: alpha * 0.95 });
    const seam = polarPoint(radius - width * 0.12, center);
    graphics.beginPath().moveTo(innerStart.x, innerStart.y)
      .lineTo(seam.x, seam.y).lineTo(innerEnd.x, innerEnd.y)
      .stroke({ color: PULSE_VIOLET, width: 1.2, alpha: alpha * 0.6 });
  }
};

const drawPulseSerratedEdge = (
  graphics: Graphics,
  radius: number,
  width: number,
  count: number
): void => {
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const center = index * sector + sector * 0.5;
    const inner = radius + width * 0.1;
    const outer = radius + width * (index % 2 === 0 ? 0.74 : 0.58);
    const tangent = Math.max(3.5, sector * 0.16);
    const innerPoint = polarPoint(inner, center);
    const outerPoint = polarPoint(outer, center);
    const left = polarPoint(inner, center - tangent / Math.max(inner, 1));
    const right = polarPoint(inner, center + tangent / Math.max(inner, 1));
    graphics.beginPath()
      .moveTo(left.x, left.y)
      .lineTo(outerPoint.x, outerPoint.y)
      .lineTo(right.x, right.y)
      .closePath()
      .fill({ color: index % 2 === 0 ? PULSE_HOT : PULSE_AMBER, alpha: 0.92 });
    graphics.beginPath().moveTo(innerPoint.x, innerPoint.y).lineTo(outerPoint.x, outerPoint.y)
      .stroke({ color: PULSE_MAGENTA, width: 1.1, alpha: 0.72 });
  }
};

const drawPulseDirectionalEdge = (
  graphics: Graphics,
  radius: number,
  width: number,
  count: number,
  directionX: number,
  directionY: number
): void => {
  const center = Math.atan2(directionY, directionX);
  const halfSpan = Math.PI * 55 / 180;
  const sector = (halfSpan * 2) / count;
  for (let index = 0; index < count; index += 1) {
    const angle = center - halfSpan + (index + 0.5) * sector;
    const inner = polarPoint(radius + width * 0.08, angle);
    const tip = polarPoint(radius + width * (index % 2 === 0 ? 0.76 : 0.58), angle);
    const left = polarPoint(radius + width * 0.08, angle - sector * 0.28);
    const right = polarPoint(radius + width * 0.08, angle + sector * 0.28);
    graphics.beginPath()
      .moveTo(left.x, left.y)
      .lineTo(tip.x, tip.y)
      .lineTo(right.x, right.y)
      .closePath()
      .fill({ color: index % 2 === 0 ? PULSE_HOT : PULSE_AMBER, alpha: 0.92 });
    graphics.beginPath().moveTo(inner.x, inner.y).lineTo(tip.x, tip.y)
      .stroke({ color: PULSE_MAGENTA, width: 1.1, alpha: 0.72 });
  }
};

const drawPulseExpansionVectors = (
  graphics: Graphics,
  radius: number,
  count: number,
  color: number,
  alpha: number
): void => {
  for (let index = 0; index < count; index += 1) {
    const angle = index * (FULL_CIRCLE / count) - Math.PI / 2 + Math.PI / 8;
    const base = radius + 5;
    const tip = radius + 17;
    const tangent = 3.8;
    const baseLeft = polarPoint(base, angle - tangent / Math.max(base, 1));
    const baseRight = polarPoint(base, angle + tangent / Math.max(base, 1));
    const tipPoint = polarPoint(tip, angle);
    graphics.beginPath()
      .moveTo(baseLeft.x, baseLeft.y)
      .lineTo(tipPoint.x, tipPoint.y)
      .lineTo(baseRight.x, baseRight.y)
      .closePath()
      .fill({ color: index % 2 === 0 ? color : PULSE_MAGENTA, alpha });
  }
};

const drawPulseDirectionalVectors = (
  graphics: Graphics,
  radius: number,
  count: number,
  color: number,
  alpha: number,
  directionX: number,
  directionY: number
): void => {
  const center = Math.atan2(directionY, directionX);
  const halfSpan = Math.PI * 55 / 180;
  for (let index = 0; index < count; index += 1) {
    const angle = center - halfSpan + ((index + 0.5) / count) * halfSpan * 2;
    const base = radius + 5;
    const tip = radius + 17;
    const baseLeft = polarPoint(base, angle - 0.035);
    const baseRight = polarPoint(base, angle + 0.035);
    const tipPoint = polarPoint(tip, angle);
    graphics.beginPath()
      .moveTo(baseLeft.x, baseLeft.y)
      .lineTo(tipPoint.x, tipPoint.y)
      .lineTo(baseRight.x, baseRight.y)
      .closePath()
      .fill({ color: index % 2 === 0 ? color : PULSE_MAGENTA, alpha });
  }
};

const drawPulseEchoTicks = (
  graphics: Graphics,
  radius: number,
  color: number,
  alpha: number
): void => {
  const count = 8;
  const sector = FULL_CIRCLE / count;
  for (let index = 0; index < count; index += 1) {
    const center = index * sector + (index % 2 === 0 ? 0.08 : -0.08);
    const span = sector * 0.18;
    graphics.beginPath().arc(0, 0, Math.max(1, radius), center - span, center + span)
      .stroke({ color, width: 2.1, alpha });
    graphics.beginPath().arc(0, 0, Math.max(1, radius - 8), center - span * 0.68, center + span * 0.68)
      .stroke({ color: PULSE_MAGENTA, width: 1, alpha: alpha * 0.58 });
  }
};

const polarPoint = (radius: number, angle: number): { x: number; y: number } => ({
  x: Math.cos(angle) * radius,
  y: Math.sin(angle) * radius
});
