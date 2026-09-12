import { Container, Graphics } from 'pixi.js';
import { PRISM_WEAVER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { EnemyRenderState } from '../../simulation/combat/CombatRenderState';

const FULL_CIRCLE = Math.PI * 2;
const SPOKE_SEPARATION = FULL_CIRCLE / PRISM_WEAVER_DEFINITION.spokeCount;
const INK = 0x081321;
const METAL = 0x29475b;
const TEAL = 0x61dfd0;
const AQUA = 0xb8fff0;
const HOT = 0xf5e5b4;

interface PrismSlot {
  readonly root: Container;
  readonly base: Graphics;
  readonly mantle: Graphics;
  readonly rails: Graphics;
  readonly weave: Graphics;
  readonly filaments: Graphics;
  readonly core: Graphics;
  readonly edge: Graphics;
  readonly nodes: Graphics;
  readonly charge: Graphics;
  readonly travelers: readonly Graphics[];
  readonly ribbons: readonly Graphics[];
  state: EnemyRenderState | null;
  sequence: number;
  radius: number;
}

const polygon = (g: Graphics, points: readonly [number, number][], color: number, alpha: number): void => {
  if (points.length < 3) return;
  g.beginPath().moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) g.lineTo(points[index][0], points[index][1]);
  g.closePath().fill({ color, alpha });
};

const taperedFacet = (
  g: Graphics,
  angle: number,
  innerRadius: number,
  outerRadius: number,
  innerHalfWidth: number,
  outerHalfWidth: number,
  color: number,
  alpha: number
): void => {
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle);
  const point = (radius: number, width: number): [number, number] => [
    axisX * radius + normalX * width,
    axisY * radius + normalY * width
  ];
  polygon(g, [
    point(innerRadius, -innerHalfWidth),
    point(outerRadius, -outerHalfWidth),
    point(outerRadius, outerHalfWidth),
    point(innerRadius, innerHalfWidth)
  ], color, alpha);
};

const taperedOffsetFacet = (
  g: Graphics,
  angle: number,
  innerRadius: number,
  outerRadius: number,
  innerOffset: number,
  outerOffset: number,
  innerHalfWidth: number,
  outerHalfWidth: number,
  color: number,
  alpha: number
): void => {
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);
  const axisX = Math.cos(angle);
  const axisY = Math.sin(angle);
  const point = (radius: number, offset: number, width: number): [number, number] => [
    axisX * radius + normalX * offset + normalX * width,
    axisY * radius + normalY * offset + normalY * width
  ];
  const pointNegative = (radius: number, offset: number, width: number): [number, number] => [
    axisX * radius + normalX * offset - normalX * width,
    axisY * radius + normalY * offset - normalY * width
  ];
  polygon(g, [
    pointNegative(innerRadius, innerOffset, innerHalfWidth),
    pointNegative(outerRadius, outerOffset, outerHalfWidth),
    point(outerRadius, outerOffset, outerHalfWidth),
    point(innerRadius, innerOffset, innerHalfWidth)
  ], color, alpha);
};

const strokeArc = (
  g: Graphics,
  radius: number,
  start: number,
  end: number,
  color: number,
  width: number,
  alpha: number
): void => {
  // Every broken arc is its own subpath; never inherit the previous endpoint.
  g.beginPath().arc(0, 0, radius, start, end).stroke({ color, width, alpha });
};

const drawTraveler = (g: Graphics): void => {
  polygon(g, [[9, 0], [2, 3.1], [-5.5, 2], [-2.1, 0], [-5.5, -2], [2, -3.1]], HOT, 0.95);
  polygon(g, [[5.2, 0], [1.2, 1.25], [-3.2, 0], [1.2, -1.25]], AQUA, 0.95);
};

/** A long, tapered packet gives active energy a direction without a costly trail. */
const drawRibbon = (g: Graphics): void => {
  polygon(g, [[18, 0], [7, 5.4], [-17, 3.8], [-24, 0], [-17, -3.8], [7, -5.4]], METAL, 0.94);
  polygon(g, [[17, 0], [6, 3.7], [-16, 2.7], [-21, 0], [-16, -2.7], [6, -3.7]], TEAL, 0.68);
  polygon(g, [[16, 0], [4.5, 1.85], [-13, 1.15], [-18, 0], [-13, -1.15], [4.5, -1.85]], AQUA, 0.96);
  polygon(g, [[18, 0], [9.1, 2.05], [4.7, 0], [9.1, -2.05]], HOT, 0.98);
};

/** Premium three-spoke warning for Prism Weaver; geometry is cached per cast. */
export class PrismWeaverTelegraphView {
  public readonly root = new Container();
  private readonly slots: PrismSlot[];
  private readonly edgeEnabled: boolean;

  public constructor(quality: FxQuality = 'medium') {
    this.edgeEnabled = quality !== 'low';
    this.root.eventMode = 'none';
    this.slots = Array.from({ length: PRISM_WEAVER_DEFINITION.activeCap }, () => {
      const slot: PrismSlot = {
        root: new Container(),
        base: new Graphics(),
        mantle: new Graphics(),
        rails: new Graphics(),
        weave: new Graphics(),
        filaments: new Graphics(),
        core: new Graphics(),
        edge: new Graphics(),
        nodes: new Graphics(),
        charge: new Graphics(),
        travelers: Array.from({ length: PRISM_WEAVER_DEFINITION.spokeCount }, () => new Graphics()),
        ribbons: Array.from({ length: PRISM_WEAVER_DEFINITION.spokeCount }, () => new Graphics()),
        state: null,
        sequence: -1,
        radius: -1
      };
      slot.root.addChild(
        slot.base,
        slot.mantle,
        slot.rails,
        slot.weave,
        slot.filaments,
        slot.core,
        slot.edge,
        slot.charge,
        slot.nodes,
        ...slot.travelers,
        ...slot.ribbons
      );
      slot.travelers.forEach(drawTraveler);
      slot.ribbons.forEach(drawRibbon);
      slot.root.visible = false;
      this.root.addChild(slot.root);
      return slot;
    });
  }

  public render(enemies: readonly EnemyRenderState[], animationSeconds = 0): void {
    let cursor = 0;
    for (const state of enemies) {
      if (!state.active || state.kind !== 'prism-weaver') continue;
      const phase = state.prismWeaverPhase;
      if (phase !== 'telegraph' && phase !== 'active') continue;
      const slot = this.slots[cursor++];
      if (!slot) break;
      const radius = Math.max(PRISM_WEAVER_DEFINITION.innerRadius + 8, state.prismWeaverRadius ?? 1);
      if (slot.state !== state || slot.sequence !== (state.prismWeaverSequence ?? 0) || slot.radius !== radius) {
        slot.state = state;
        slot.sequence = state.prismWeaverSequence ?? 0;
        slot.radius = radius;
        this.build(slot, radius);
      }
      const progress = Math.min(1, Math.max(0, state.prismWeaverProgress ?? 0));
      const active = phase === 'active';
      const pulse = 0.5 + 0.5 * Math.sin(animationSeconds * 13 + slot.sequence * 0.7);
      slot.root.visible = true;
      // The cast is emitted by the Prism Weaver, not by the arena. Keep the
      // geometry local so simulation collision and presentation share origin.
      slot.root.position.set(state.x, state.y);
      slot.root.rotation = state.prismWeaverAngle ?? 0;
      slot.root.alpha = active ? 0.78 + pulse * 0.16 : 0.24 + progress * 0.48 + pulse * 0.05;
      slot.base.alpha = active ? 0.82 : 0.5 + progress * 0.2;
      slot.mantle.alpha = active ? 0.4 + pulse * 0.12 : 0.1 + progress * 0.24;
      slot.rails.alpha = active ? 0.78 + pulse * 0.12 : 0.34 + progress * 0.3;
      slot.weave.alpha = this.edgeEnabled ? (active ? 0.6 + pulse * 0.2 : progress * 0.54) : 0;
      slot.filaments.alpha = this.edgeEnabled ? (active ? 0.68 + pulse * 0.24 : progress * 0.42) : 0;
      slot.core.alpha = active ? 0.88 + pulse * 0.12 : 0.3 + progress * 0.58;
      slot.edge.alpha = this.edgeEnabled ? (active ? 0.78 + pulse * 0.18 : progress * 0.74) : 0;
      slot.nodes.alpha = active ? 0.78 + pulse * 0.16 : 0.38 + progress * 0.4;
      slot.charge.alpha = active ? 0.72 + pulse * 0.2 : 0.35 + progress * 0.44;
      const chargeRotation = animationSeconds * (active ? 0.9 : 0.48) + slot.sequence * 0.43;
      slot.charge.rotation = chargeRotation;
      const chargeScale = active ? 1 + pulse * 0.1 : 0.84 + progress * 0.2;
      slot.charge.scale.set(chargeScale);
      for (let travelerIndex = 0; travelerIndex < slot.travelers.length; travelerIndex += 1) {
        const traveler = slot.travelers[travelerIndex];
        const spokeAngle = travelerIndex * SPOKE_SEPARATION;
        const wave = active
          ? ((animationSeconds * 0.82 + travelerIndex * 0.31 + slot.sequence * 0.13) % 1 + 1) % 1
          : Math.min(1, progress * 0.55 + travelerIndex * 0.24);
        const travelRadius = PRISM_WEAVER_DEFINITION.innerRadius + 16
          + wave * Math.max(12, radius - PRISM_WEAVER_DEFINITION.innerRadius - 34);
        traveler.position.set(Math.cos(spokeAngle) * travelRadius, Math.sin(spokeAngle) * travelRadius);
        traveler.rotation = spokeAngle;
        traveler.alpha = active
          ? 0.58 + 0.38 * (0.5 + 0.5 * Math.sin(animationSeconds * 15 + travelerIndex * 2.1 + slot.sequence))
          : 0.22 + progress * 0.42;
        const travelerScale = active ? 0.86 + pulse * 0.2 : 0.62 + progress * 0.26;
        traveler.scale.set(travelerScale);

        const ribbon = slot.ribbons[travelerIndex];
        const ribbonWave = active
          ? ((animationSeconds * 0.52 + travelerIndex * 0.43 + slot.sequence * 0.17) % 1 + 1) % 1
          : Math.min(1, progress * 0.42 + travelerIndex * 0.18);
        const ribbonRadius = PRISM_WEAVER_DEFINITION.innerRadius + 29
          + ribbonWave * Math.max(12, radius - PRISM_WEAVER_DEFINITION.innerRadius - 52);
        ribbon.visible = this.edgeEnabled;
        ribbon.position.set(Math.cos(spokeAngle) * ribbonRadius, Math.sin(spokeAngle) * ribbonRadius);
        ribbon.rotation = spokeAngle;
        ribbon.alpha = this.edgeEnabled
          ? (active ? 0.62 + 0.3 * (0.5 + 0.5 * Math.sin(animationSeconds * 10 + travelerIndex * 1.7)) : progress * 0.32)
          : 0;
        ribbon.scale.set(active ? 0.88 + pulse * 0.14 : 0.58 + progress * 0.2);
      }
    }
    for (let index = cursor; index < this.slots.length; index += 1) {
      this.slots[index].root.visible = false;
      this.slots[index].state = null;
    }
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.root.visible = false;
      slot.root.position.set(0, 0);
      slot.charge.scale.set(1);
      for (const traveler of slot.travelers) {
        traveler.visible = true;
        traveler.alpha = 0;
        traveler.position.set(0, 0);
        traveler.rotation = 0;
        traveler.scale.set(1);
      }
      for (const ribbon of slot.ribbons) {
        ribbon.visible = false;
        ribbon.alpha = 0;
        ribbon.position.set(0, 0);
        ribbon.rotation = 0;
        ribbon.scale.set(1);
      }
      slot.state = null;
      slot.sequence = -1;
      slot.radius = -1;
    }
  }

  private build(slot: PrismSlot, radius: number): void {
    slot.base.clear();
    slot.mantle.clear();
    slot.rails.clear();
    slot.weave.clear();
    slot.filaments.clear();
    slot.core.clear();
    slot.edge.clear();
    slot.nodes.clear();
    slot.charge.clear();
    for (let spoke = 0; spoke < PRISM_WEAVER_DEFINITION.spokeCount; spoke += 1) {
      const angle = spoke * SPOKE_SEPARATION;
      const outerWidth = radius * PRISM_WEAVER_DEFINITION.dangerHalfAngle;
      taperedFacet(slot.base, angle, PRISM_WEAVER_DEFINITION.innerRadius + 3, radius, 5.4, outerWidth + 2.5, INK, 0.9);
      taperedFacet(slot.mantle, angle, PRISM_WEAVER_DEFINITION.innerRadius + 9, radius - 10, 3.1, Math.max(5, outerWidth - 4), TEAL, 0.25);
      const innerRailOffset = Math.max(4.8, Math.min(outerWidth * 0.55, 9));
      const outerRailOffset = Math.max(7, outerWidth * 0.78);
      taperedOffsetFacet(slot.rails, angle, PRISM_WEAVER_DEFINITION.innerRadius + 12, radius - 8, innerRailOffset, outerRailOffset, 1.2, 1.7, METAL, 0.9);
      taperedOffsetFacet(slot.rails, angle, PRISM_WEAVER_DEFINITION.innerRadius + 12, radius - 8, -innerRailOffset, -outerRailOffset, 1.2, 1.7, METAL, 0.9);
      // Broken inner conductors are a separate material from the collision
      // mantle. Their segmentation gives the beam a mechanical cadence even
      // when the whole three-spoke cast is rotating.
      for (let conduit = 0; conduit < 4; conduit += 1) {
        const startRatio = 0.11 + conduit * 0.22;
        const endRatio = startRatio + 0.14;
        const conduitStart = PRISM_WEAVER_DEFINITION.innerRadius + (radius - PRISM_WEAVER_DEFINITION.innerRadius) * startRatio;
        const conduitEnd = PRISM_WEAVER_DEFINITION.innerRadius + (radius - PRISM_WEAVER_DEFINITION.innerRadius) * endRatio;
        const innerConduitOffset = Math.max(2.9, outerWidth * (0.16 + conduit * 0.025));
        const outerConduitOffset = innerConduitOffset + 1.1;
        const conductorAccent = conduit % 2 === 0 ? AQUA : HOT;
        taperedOffsetFacet(slot.filaments, angle, conduitStart, conduitEnd, innerConduitOffset, outerConduitOffset, 0.55, 0.82, conductorAccent, 0.9);
        taperedOffsetFacet(slot.filaments, angle, conduitStart, conduitEnd, -innerConduitOffset, -outerConduitOffset, 0.55, 0.82, TEAL, 0.82);
      }
      taperedFacet(slot.core, angle, PRISM_WEAVER_DEFINITION.innerRadius + 11, radius - 13, 1.15, Math.max(2.8, outerWidth * 0.24), AQUA, 0.88);
      // Alternating diagonal braces make each danger wedge read as a powered
      // lattice instead of three unrelated flat beams. They are cached once
      // and suppressed in Low, where the channel itself remains fully honest.
      for (let brace = 1; brace < 4; brace += 1) {
        const progress = brace / 4;
        const braceRadius = PRISM_WEAVER_DEFINITION.innerRadius + (radius - PRISM_WEAVER_DEFINITION.innerRadius) * progress;
        const braceOffset = outerWidth * (0.24 + progress * 0.34);
        const direction = (brace + spoke) % 2 === 0 ? 1 : -1;
        taperedOffsetFacet(
          slot.weave,
          angle,
          braceRadius - 4.6,
          braceRadius + 4.6,
          -direction * braceOffset,
          direction * braceOffset,
          0.72,
          0.72,
          AQUA,
          0.72
        );
        // A short transverse gate tells the eye this is a charged corridor,
        // while the continuous mantle beneath remains the truthful hit area.
        taperedFacet(
          slot.weave,
          angle,
          braceRadius - 1.15,
          braceRadius + 1.15,
          outerWidth * (0.36 + brace * 0.045),
          outerWidth * (0.42 + brace * 0.045),
          brace % 2 === 0 ? AQUA : HOT,
          0.62
        );
      }
      // Deliberate segmentation keeps the cast premium and prevents it reading
      // as a single cheap line from the center to the edge.
      for (let segment = 1; segment < 4; segment += 1) {
        const radiusAt = PRISM_WEAVER_DEFINITION.innerRadius + (radius - PRISM_WEAVER_DEFINITION.innerRadius) * segment / 4;
        const tick = Math.max(1.8, outerWidth * (0.1 + segment * 0.018));
        taperedFacet(slot.edge, angle, radiusAt - 1, radiusAt + 1.5, tick, tick, HOT, 0.75);
      }
      const nodeRadius = 5.5;
      const nodeX = Math.cos(angle) * (radius - 4);
      const nodeY = Math.sin(angle) * (radius - 4);
      polygon(slot.nodes, [
        [nodeX + Math.cos(angle) * 8.2, nodeY + Math.sin(angle) * 8.2],
        [nodeX - Math.sin(angle) * nodeRadius, nodeY + Math.cos(angle) * nodeRadius],
        [nodeX - Math.cos(angle) * 8.2, nodeY - Math.sin(angle) * 8.2],
        [nodeX + Math.sin(angle) * nodeRadius, nodeY - Math.cos(angle) * nodeRadius]
      ], METAL, 0.96);
      polygon(slot.nodes, [
        [nodeX + Math.cos(angle) * 5.5, nodeY + Math.sin(angle) * 5.5],
        [nodeX - Math.sin(angle) * 3.4, nodeY + Math.cos(angle) * 3.4],
        [nodeX - Math.cos(angle) * 5.5, nodeY - Math.sin(angle) * 5.5],
        [nodeX + Math.sin(angle) * 3.4, nodeY - Math.cos(angle) * 3.4]
      ], HOT, 0.92);
      taperedFacet(slot.nodes, angle, radius - 7.1, radius + 0.5, 0.65, 0.65, AQUA, 0.96);
    }
    for (let segment = 0; segment < PRISM_WEAVER_DEFINITION.spokeCount; segment += 1) {
      const start = segment * SPOKE_SEPARATION + 0.14;
      strokeArc(slot.charge, 20.5, start, start + SPOKE_SEPARATION * 0.48, TEAL, 2, 0.85);
      strokeArc(slot.charge, 25.5, start + 0.12, start + SPOKE_SEPARATION * 0.33, HOT, 1.1, 0.7);
      taperedFacet(slot.charge, segment * SPOKE_SEPARATION, 15.4, 19.2, 1.15, 2.2, METAL, 0.94);
      taperedFacet(slot.charge, segment * SPOKE_SEPARATION, 16.2, 18.1, 0.5, 0.9, AQUA, 0.9);
    }
    polygon(slot.nodes, [[0, -8], [7, 0], [0, 8], [-7, 0]], INK, 0.95);
    polygon(slot.nodes, [[0, -4.5], [4.5, 0], [0, 4.5], [-4.5, 0]], AQUA, 0.9);
    polygon(slot.nodes, [[0, -2.1], [2.1, 0], [0, 2.1], [-2.1, 0]], HOT, 0.95);
  }
}
