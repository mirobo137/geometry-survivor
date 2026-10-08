import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { CombatRenderState } from '../../../simulation/combat/CombatRenderState';
import type { FxQuality } from '../../../content/visual/VisualTokens';
import { BOOMERANG_POOL_CAPACITY, CHAIN_SEGMENT_POOL_CAPACITY } from '../../../config/constants';
import { CHAIN_EVOLUTION_TUNING } from '../../../content/weapons/WeaponEvolutionDefinitions';
import { MAGNETIC_ART_IDS, type ArsenalArtId } from './ArsenalTextures';
import { CastArt } from './CastArt';

export type ArsenalRenderInput = Pick<CombatRenderState, 'orbitBlades' | 'chainSegments'>
  & Partial<Pick<CombatRenderState, 'orbitEvolution' | 'chainEvolution' | 'orbitPulse' | 'chainExplosions'
  | 'boomerangs' | 'boomerangPulse' | 'pulseRingWeapon' | 'magneticCharge'>>;
const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const makeSprite = (parent: Container, label: string): Sprite => {
  const sprite = new Sprite(Texture.EMPTY);
  sprite.anchor.set(0.5);
  sprite.visible = false;
  sprite.label = label;
  parent.addChild(sprite);
  return sprite;
};

/**
 * Bounded PNG compositor. Areas are behind enemies; bodies and connecting beams
 * are above them, below hazards/player. No clocks, damage rules or emitters here.
 */
export class RasterArsenalView {
  public readonly root = new Container();
  public readonly underlay = new Container();
  private readonly orbit = Array.from({ length: 6 }, (_, i) => makeSprite(this.root, 'arsenal-orbit-' + i));
  private readonly boomerangs = Array.from({ length: BOOMERANG_POOL_CAPACITY }, (_, i) => makeSprite(this.root, 'arsenal-boomerang-' + i));
  private readonly wakes = Array.from({ length: BOOMERANG_POOL_CAPACITY }, (_, i) => makeSprite(this.underlay, 'arsenal-wake-' + i));
  private readonly chains = Array.from({ length: CHAIN_SEGMENT_POOL_CAPACITY }, (_, i) => makeSprite(this.root, 'arsenal-chain-' + i));
  private readonly impacts = Array.from({ length: CHAIN_SEGMENT_POOL_CAPACITY }, (_, i) => makeSprite(this.underlay, 'arsenal-impact-' + i));
  private readonly explosions = Array.from({ length: CHAIN_EVOLUTION_TUNING.thunderheadMarks }, (_, i) => makeSprite(this.underlay, 'arsenal-explosion-' + i));
  private readonly orbitPulse = makeSprite(this.underlay, 'arsenal-orbit-pulse');
  private readonly boomerangPulse = makeSprite(this.underlay, 'arsenal-boomerang-pulse');
  private readonly pulse = makeSprite(this.underlay, 'arsenal-pulse');
  private readonly pulseAfterglow = makeSprite(this.underlay, 'arsenal-pulse-afterglow');
  private readonly magneticCore = makeSprite(this.underlay, 'arsenal-magnetic-core');
  private readonly magneticField = makeSprite(this.underlay, 'arsenal-magnetic-field');
  private readonly magneticTravel = makeSprite(this.underlay, 'arsenal-magnetic-travel');
  private readonly magneticFronts = Array.from({ length: 3 }, (_, i) => makeSprite(this.underlay, 'arsenal-polar-front-' + i));
  private readonly magneticBurst = makeSprite(this.underlay, 'arsenal-magnetic-burst');
  private readonly boundary = new Graphics();
  private readonly reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  public constructor(private readonly quality: FxQuality) {
    this.root.eventMode = this.underlay.eventMode = 'none';
    this.underlay.addChild(this.boundary);
  }

  private readonly castArt = new CastArt();
  private scope = 'orbit';
  public ready(id: ArsenalArtId, scope = 'orbit'): boolean { return this.castArt.get(scope, id) !== null; }
  public clearCastArt(): void { this.castArt.clear(); }

  public render(state: ArsenalRenderInput): void {
    if (this.root.destroyed || this.underlay.destroyed) return;
    this.reset();
    this.scope = 'orbit';
    const orbitId = state.orbitEvolution ?? 'orbit';
    for (let i = 0; i < this.orbit.length; i++) {
      const blade = state.orbitBlades[i];
      if (blade?.active) this.body(this.orbit[i], orbitId, blade.x, blade.y,
        blade.radius * 3.4, this.reducedMotion ? 0 : blade.angle);
    }
    for (let i = 0; i < this.boomerangs.length; i++) {
      const blade = state.boomerangs?.[i];
      this.scope = `boomerang-${i}`;
      this.castArt.begin(this.scope, blade?.active === true, blade?.ageSeconds ?? 0);
      if (!blade?.active) continue;
      const id = blade.fragment ? 'singularity_shard' : blade.evolution ?? 'boomerang';
      const angle = Math.atan2(blade.vy, blade.vx);
      this.body(this.boomerangs[i], id, blade.x, blade.y, blade.radius * 3.6,
        angle + (this.reducedMotion || blade.fragment ? 0 : blade.ageSeconds * (blade.evolution === 'twin_comet' ? 14 : 6)));
      if (this.boomerangs[i].visible && this.quality !== 'low') {
        this.beam(this.wakes[i], 'magnetic_travel', blade.x - Math.cos(angle) * 34,
          blade.y - Math.sin(angle) * 34, blade.x, blade.y, 13, 0.5);
        this.wakes[i].tint = blade.phase === 'returning' ? 0xcbb5ff : 0xaff8ff;
      }
    }
    const orbitPulse = state.orbitPulse;
    this.scope = 'orbit-pulse';
    this.castArt.begin(this.scope, orbitPulse?.active === true, 0, orbitPulse?.sequence);
    if (orbitPulse?.active) this.ring(this.orbitPulse, 'event_horizon', orbitPulse.x, orbitPulse.y,
      orbitPulse.radius * (0.32 + clamp(orbitPulse.progress) * 0.68), (1 - clamp(orbitPulse.progress)) * 0.65);
    const burst = state.boomerangPulse;
    this.scope = 'boomerang-pulse';
    this.castArt.begin(this.scope, burst?.active === true, 0, burst?.sequence);
    if (burst?.active) this.ring(this.boomerangPulse, 'singularity_split', burst.x, burst.y, burst.radius,
      (1 - clamp(burst.progress)) * 0.85);

    const chainId = state.chainEvolution ?? 'chain';
    for (let i = 0; i < this.chains.length; i++) {
      const segment = state.chainSegments[i];
      this.scope = `chain-${i}`;
      this.castArt.begin(this.scope, segment?.active === true, -(segment?.lifeSeconds ?? 0));
      if (segment?.active) {
        const alpha = segment.persistent ? 0.72 : clamp(segment.lifeSeconds / 0.14);
        this.beam(this.chains[i], chainId, segment.x1, segment.y1, segment.x2, segment.y2,
          chainId === 'thunderhead' ? 32 : chainId === 'closed_circuit' ? 17 : 22, alpha);
        if (this.chains[i].visible && this.quality !== 'low') {
          this.body(this.impacts[i], 'magnetic_core', segment.x2, segment.y2, 24, 0);
          this.impacts[i].alpha = alpha * 0.65;
        }
      }
      const explosion = state.chainExplosions?.[i];
      this.scope = `explosion-${i}`;
      this.castArt.begin(this.scope, explosion?.active === true, 0, explosion?.sequence);
      if (explosion?.active) {
        const p = clamp(explosion.progress);
        this.ring(this.explosions[i], 'thunderhead_burst', explosion.x, explosion.y,
          explosion.radius * (explosion.phase === 'active' ? 1 : 0.55 + p * 0.45),
          explosion.phase === 'active' ? (1 - p) * 0.9 : 0.22 + p * 0.2);
        if (explosion.phase === 'active') this.boundary.beginPath().circle(explosion.x, explosion.y, explosion.radius)
          .stroke({ color: 0xffe7ad, width: 1.2, alpha: (1 - p) * 0.4 });
      }
    }
    this.scope = 'pulse';
    this.castArt.begin(this.scope, state.pulseRingWeapon?.active === true, 0, state.pulseRingWeapon?.sequence);
    this.renderPulse(state.pulseRingWeapon);
    this.scope = 'magnetic';
    this.castArt.begin(this.scope, state.magneticCharge?.active === true, 0, state.magneticCharge?.sequence);
    // Snapshot the complete pack even for the base renderer owned by WeaponView.
    for (const id of MAGNETIC_ART_IDS) {
      if (state.magneticCharge?.active) this.ready(id, 'magnetic');
    }
    this.renderMagnetic(state.magneticCharge);
  }

  private renderPulse(state: ArsenalRenderInput['pulseRingWeapon']): void {
    if (!state?.active || state.phase === 'idle' || !this.ready(state.evolution ?? 'pulse_ring', 'pulse')) return;
    const id = state.evolution ?? 'pulse_ring';
    const p = clamp(state.progress);
    const radius = state.phase === 'telegraph' ? state.startRadius : state.radius;
    const alpha = state.phase === 'active' ? 0.88 : state.phase === 'telegraph' ? 0.2 + p * 0.35 : (1 - p) ** 2 * 0.55;
    this.ring(this.pulse, id, state.originX, state.originY, radius, alpha);
    // Register the generated crescent to its circle's centre, not the art bbox.
    if (id === 'compression_wave') {
      this.pulse.anchor.set(0.28125, 0.5);
      this.pulse.scale.set(Math.max(1, radius) / 128);
      this.pulse.rotation = Math.atan2(state.directionY ?? 0, state.directionX ?? 1);
    } else if (!this.reducedMotion) this.pulse.rotation = p * (id === 'echo_shock' && state.wave === 1 ? -0.14 : 0.14);
    if (state.phase === 'active') {
      // A thin exact front remains legible beneath the painted vapor. The wider
      // alpha fringe is material, not additional damage or a larger cone.
      const axis = Math.atan2(state.directionY ?? 0, state.directionX ?? 1);
      const halfAngle = 55 * Math.PI / 180;
      this.boundary.beginPath().arc(state.originX, state.originY, radius,
        id === 'compression_wave' ? axis - halfAngle : 0,
        id === 'compression_wave' ? axis + halfAngle : Math.PI * 2)
        .stroke({ color: 0xf6f3ff, width: 1.2, alpha: 0.35 });
    }
    if (state.phase === 'active' && this.quality === 'high' && !this.reducedMotion) {
      this.ring(this.pulseAfterglow, id, state.originX, state.originY, radius, 0.16);
      this.pulseAfterglow.anchor.copyFrom(this.pulse.anchor);
      this.pulseAfterglow.scale.copyFrom(this.pulse.scale);
      this.pulseAfterglow.rotation = this.pulse.rotation;
    }
  }

  public magneticReady(state: ArsenalRenderInput['magneticCharge']): boolean {
    if (!state?.evolution) return false;
    const material = this.ready(state.evolution, 'magnetic');
    const core = this.ready('magnetic_core', 'magnetic');
    const travel = this.ready('magnetic_travel', 'magnetic');
    const burst = this.ready('magnetic_burst', 'magnetic');
    const field = this.ready('magnetic_field', 'magnetic');
    return material && core && travel && burst && field;
  }

  private renderMagnetic(state: ArsenalRenderInput['magneticCharge']): void {
    if (!state?.active || !this.magneticReady(state)) return;
    const p = clamp(state.progress);
    const horizon = state.evolution === 'event_horizon';
    const travel = state.phase === 'travel';
    const attract = state.phase === 'attract';
    const recovery = state.phase === 'recovery';
    const lift = travel && !this.reducedMotion ? Math.sin(p * Math.PI) * 62 : 0;
    this.body(this.magneticCore, 'magnetic_core', travel ? state.x : state.targetX,
      travel ? state.y - lift : state.targetY, travel ? 64 : 45, this.reducedMotion ? 0 : state.rotation * 0.3);
    this.magneticCore.anchor.set(0.4907, 0.4938);
    this.magneticCore.alpha = recovery ? (1 - p) * 0.45 : 0.9;
    if (travel) this.beam(this.magneticTravel, 'magnetic_travel',
      state.x - (state.targetX - state.originX) * 0.12,
      state.y - lift - (state.targetY - state.originY) * 0.12, state.x, state.y - lift, 28, 0.7);
    if (travel || attract || (horizon && recovery)) {
      this.ring(this.magneticField, horizon ? 'event_horizon' : 'magnetic_field',
        state.targetX, state.targetY, travel ? state.pullRadius * 0.4 : state.pullRadius,
        recovery ? (1 - p) ** 2 * 0.4 : travel ? 0.3 : 0.58);
      if (!this.reducedMotion) this.magneticField.rotation = -state.rotation * 0.3;
    }
    // Event Horizon dissipates into slowing mist, never shows a terminal explosion.
    if (horizon) return;
    if (state.phase === 'detonate') {
      const radius = state.polarFrontRadius ?? state.polarRadius ?? state.outerRadius;
      const angle = state.polarAngle ?? 0;
      // Three radial damaging segments (not a filled triangle), fixed 24u width.
      for (let i = 0; i < 3; i++) {
        const a = angle + i * Math.PI * 2 / 3;
        this.beam(this.magneticFronts[i], 'polar_collapse', state.targetX, state.targetY,
          state.targetX + Math.cos(a) * radius, state.targetY + Math.sin(a) * radius, 24, 0.88);
      }
    }
    if (state.phase === 'collapse' || recovery) {
      const radius = state.polarFinalRadius ?? state.outerRadius * 0.55;
      const pulse = (state.polarPulseCount ?? 0) > 1;
      this.ring(this.magneticBurst, 'magnetic_burst', state.targetX, state.targetY, radius,
        recovery ? (1 - p) ** 2 * 0.5 : pulse ? 1 : 0.74);
      this.magneticBurst.tint = pulse ? 0xffffff : 0xb5a9ff;
      // Thin actual damaging-disk boundary; material never invents a larger radius.
      this.boundary.beginPath().circle(state.targetX, state.targetY, radius)
        .stroke({ color: 0xb8ecff, width: 1.2, alpha: recovery ? (1 - p) * 0.3 : 0.5 });
    }
  }

  private body(sprite: Sprite, id: ArsenalArtId, x: number, y: number, diameter: number, rotation: number): void {
    const texture = this.castArt.get(this.scope, id);
    if (!texture) return;
    sprite.texture = texture;
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.scale.set(diameter / texture.width);
    sprite.rotation = rotation;
    sprite.alpha = 1;
    sprite.tint = 0xffffff;
    sprite.visible = true;
  }

  private ring(sprite: Sprite, id: ArsenalArtId, x: number, y: number, radius: number, alpha: number): void {
    this.body(sprite, id, x, y, Math.max(1, radius) * 256 / 110, 0);
    sprite.alpha = alpha * (this.quality === 'low' ? 0.75 : 1);
    if (id === 'magnetic_burst') sprite.anchor.set(0.5075, 0.5023);
  }

  private beam(sprite: Sprite, id: ArsenalArtId, x1: number, y1: number, x2: number, y2: number, width: number, alpha: number): void {
    const texture = this.castArt.get(this.scope, id);
    if (!texture) return;
    sprite.texture = texture;
    sprite.anchor.set(0.5);
    sprite.position.set((x1 + x2) * 0.5, (y1 + y2) * 0.5);
    sprite.rotation = Math.atan2(y2 - y1, x2 - x1);
    // Closed Circuit's replacement has a 21px alpha band in its 128px frame;
    // register that band so the diamonds remain legible, not the empty margins.
    const materialHeight = id === 'magnetic_travel' ? 64 : id === 'closed_circuit' ? 24 : 42;
    sprite.scale.set(Math.hypot(x2 - x1, y2 - y1) / texture.width, width / materialHeight);
    sprite.alpha = alpha;
    sprite.tint = 0xffffff;
    sprite.visible = true;
  }

  public reset(): void {
    for (const child of this.root.children) child.visible = false;
    for (const child of this.underlay.children) child.visible = false;
    this.boundary.clear();
    this.boundary.visible = true;
  }
}
