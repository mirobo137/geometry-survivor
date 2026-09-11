import { Container, Graphics } from 'pixi.js';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { RadialPulseState } from '../../simulation/hazards/RadialPulseHazard';
import { ARENA_CENTER } from '../../config/constants';

const INK = 0x080d1b;
const ARMOR = 0x26354d;
const OUTWARD = 0x3ee0ef;
const OUTWARD_HOT = 0xd7ffff;
const INWARD = 0xcba0ff;
const INWARD_HOT = 0xffe7fa;
const WARNING = 0xffcf70;
const WARNING_CORE = 0xfff3d1;
const RECOVERY = 0x8c90e2;
const FULL_CIRCLE = Math.PI * 2;

/**
 * Premium annular-wave read. The simulation supplies the authoritative radius;
 * this view builds a bounded material package once per sequence and animates
 * only transforms, alpha and visibility while the wave travels.
 */
export class RadialPulseView {
  public readonly root = new Container();
  private readonly track = new Graphics();
  private readonly band = new Container();
  private readonly activeShell = new Graphics();
  private readonly activeMantle = new Graphics();
  private readonly activeBody = new Graphics();
  private readonly activeCore = new Graphics();
  private readonly activeCrests = new Graphics();
  private readonly core = new Graphics();
  private readonly markers = new Container();
  private readonly telegraphMarkers = new Graphics();
  private readonly activeMarkers = new Graphics();
  private readonly residue = new Graphics();
  private readonly markerCount: number;
  private readonly reducedMotion: boolean;
  private renderedSequence = -1;
  private activeBaseRadius = 1;

  public constructor(quality: FxQuality = 'medium') {
    this.markerCount = quality === 'low' ? 4 : quality === 'high' ? 8 : 6;
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.band.addChild(this.activeShell, this.activeMantle, this.activeBody, this.activeCore, this.activeCrests);
    this.markers.addChild(this.telegraphMarkers, this.activeMarkers);
    this.root.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.root.addChild(this.track, this.band, this.core, this.markers, this.residue);
    this.reset();
  }

  public render(state: Readonly<RadialPulseState>): void {
    if (state.phase === 'idle') {
      this.root.visible = false;
      return;
    }

    if (state.sequence !== this.renderedSequence) this.buildSequence(state);

    this.root.visible = true;
    this.track.visible = state.phase === 'telegraph';
    this.band.visible = state.phase === 'active';
    this.core.visible = state.phase === 'telegraph';
    this.markers.visible = state.phase !== 'recovery';
    this.telegraphMarkers.visible = state.phase === 'telegraph';
    this.activeMarkers.visible = state.phase === 'active';
    this.residue.visible = state.phase === 'recovery';

    if (state.phase === 'telegraph') this.renderTelegraph(state);
    if (state.phase === 'active') this.renderActive(state);
    if (state.phase === 'recovery') this.renderRecovery(state);
  }

  public reset(): void {
    this.root.visible = false;
    this.track.visible = false;
    this.band.visible = false;
    this.core.visible = false;
    this.markers.visible = false;
    this.telegraphMarkers.visible = false;
    this.activeMarkers.visible = false;
    this.residue.visible = false;
    this.band.scale.set(1);
    this.band.rotation = 0;
    this.markers.scale.set(1);
    this.markers.rotation = 0;
    this.renderedSequence = -1;
    this.clearGeometry();
  }

  private buildSequence(state: Readonly<RadialPulseState>): void {
    this.clearGeometry();
    this.buildTelegraphGeometry(state);
    this.buildActiveGeometry(state);
    this.buildRecoveryGeometry(state);
    this.renderedSequence = state.sequence;
  }

  private clearGeometry(): void {
    this.track.clear();
    this.activeShell.clear();
    this.activeMantle.clear();
    this.activeBody.clear();
    this.activeCore.clear();
    this.activeCrests.clear();
    this.core.clear();
    this.telegraphMarkers.clear();
    this.activeMarkers.clear();
    this.residue.clear();
  }

  private buildTelegraphGeometry(state: Readonly<RadialPulseState>): void {
    const guideRadius = Math.max(14, state.startRadius);
    const innerPocket = Math.min(state.startRadius, state.endRadius);
    const outerPocket = Math.max(state.startRadius, state.endRadius);
    drawDashedRing(this.track, guideRadius, 14, WARNING, 2.4, 1);
    drawRing(this.track, guideRadius, INK, 8, 0.82);
    drawRing(this.track, guideRadius, WARNING_CORE, 1.2, 0.9);
    // Thin brackets mark both harmless pockets without painting over gameplay.
    drawDashedRing(this.track, Math.max(8, innerPocket - 4), 8, WARNING_CORE, 1, 0.35);
    drawDashedRing(this.track, outerPocket + 4, 8, WARNING_CORE, 1, 0.35);
    drawRing(this.core, Math.max(5, guideRadius * 0.08), WARNING_CORE, 2.4, 0.9);
    drawRing(this.core, Math.max(2, guideRadius * 0.035), INK, 3, 0.9);
    drawDirectionalMarkers(this.telegraphMarkers, guideRadius, state.direction, this.markerCount, WARNING_CORE, 0.9);
  }

  private buildActiveGeometry(state: Readonly<RadialPulseState>): void {
    const direction = state.direction === 'outward' ? 1 : -1;
    const bodyRadius = Math.max(18, Math.max(state.startRadius, state.endRadius));
    const width = Math.max(8, state.width);
    this.activeBaseRadius = bodyRadius;

    // Dark containment keeps the hazard legible over ships and bright backgrounds.
    drawAnnularBand(this.activeShell, bodyRadius, width + 18, INK, 0.95);
    drawAnnularBand(this.activeShell, bodyRadius, width + 11, ARMOR, 0.98);
    drawAnnularBand(this.activeMantle, bodyRadius, width + 6, state.direction === 'inward' ? INWARD : OUTWARD, 0.68);
    drawAnnularBand(this.activeBody, bodyRadius, width, state.direction === 'inward' ? INWARD : OUTWARD, 0.9);
    drawRing(this.activeCore, bodyRadius, state.direction === 'inward' ? INWARD_HOT : OUTWARD_HOT, 2.8, 0.98);

    // The leading and trailing lips give the full ring a readable material edge.
    const leadingRadius = bodyRadius + direction * width * 0.44;
    const trailingRadius = bodyRadius - direction * width * 0.44;
    drawRing(this.activeCrests, leadingRadius, state.direction === 'inward' ? INWARD_HOT : OUTWARD_HOT, 2.4, 0.96);
    drawRing(this.activeCrests, trailingRadius, state.direction === 'inward' ? INWARD : OUTWARD, 1.4, 0.7);
    drawSegmentedEnergy(this.activeCrests, bodyRadius, width, state.direction, this.markerCount);
    drawDirectionalMarkers(this.activeMarkers, bodyRadius, state.direction, this.markerCount, INK, 0.96, 38, 14, 12);
    drawDirectionalMarkers(this.activeMarkers, bodyRadius, state.direction, this.markerCount, state.direction === 'inward' ? INWARD_HOT : OUTWARD_HOT, 0.98, 30, 10, 8);
    drawCrestFacets(this.activeCrests, bodyRadius, width, state.direction, this.markerCount);
  }

  private buildRecoveryGeometry(state: Readonly<RadialPulseState>): void {
    const radius = Math.max(5, state.endRadius);
    const color = state.direction === 'inward' ? INWARD : RECOVERY;
    drawDashedRing(this.residue, radius, 12, color, 2.2, 0.65);
    drawRing(this.residue, radius, INK, 5, 0.5);
    drawRing(this.residue, radius, state.direction === 'inward' ? INWARD_HOT : WARNING_CORE, 1, 0.78);
  }

  private renderTelegraph(state: Readonly<RadialPulseState>): void {
    const progress = clamp01(state.progress);
    const intensity = 0.46 + progress * 0.46;
    this.track.alpha = intensity;
    this.core.alpha = 0.7 + progress * 0.3;
    this.telegraphMarkers.alpha = 0.55 + progress * 0.45;
    this.markers.rotation = this.reducedMotion ? 0 : (state.direction === 'outward' ? 1 : -1) * progress * 0.05;
  }

  private renderActive(state: Readonly<RadialPulseState>): void {
    const progress = clamp01(state.travelProgress);
    const radius = Math.max(2, state.radius);
    const scale = radius / this.activeBaseRadius;
    const direction = state.direction === 'outward' ? 1 : -1;
    this.band.scale.set(scale);
    this.band.rotation = this.reducedMotion ? 0 : direction * progress * 0.18;
    this.band.alpha = 0.9 + Math.sin(progress * Math.PI) * 0.1;
    this.activeMarkers.scale.set(scale);
    this.activeMarkers.rotation = this.band.rotation;
    this.activeMarkers.alpha = 0.72 + (1 - progress) * 0.2;
    this.activeCrests.visible = !this.reducedMotion;
  }

  private renderRecovery(state: Readonly<RadialPulseState>): void {
    const fade = (1 - clamp01(state.progress)) ** 2;
    this.residue.alpha = fade;
    this.residue.scale.set(1);
  }
}

const drawRing = (graphics: Graphics, radius: number, color: number, width: number, alpha: number): void => {
  graphics.beginPath().circle(0, 0, Math.max(0.5, radius)).stroke({ color, width, alpha });
};

const drawAnnularBand = (graphics: Graphics, radius: number, width: number, color: number, alpha: number): void => {
  const segments = 72;
  const outer = Math.max(1, radius + width * 0.5);
  const inner = Math.max(0.5, radius - width * 0.5);
  graphics.beginPath();
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * FULL_CIRCLE;
    const x = Math.cos(angle) * outer;
    const y = Math.sin(angle) * outer;
    if (index === 0) graphics.moveTo(x, y);
    else graphics.lineTo(x, y);
  }
  for (let index = segments; index >= 0; index -= 1) {
    const angle = (index / segments) * FULL_CIRCLE;
    graphics.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
  }
  graphics.closePath().fill({ color, alpha });
};

const drawDashedRing = (
  graphics: Graphics,
  radius: number,
  segments: number,
  color: number,
  width: number,
  alpha: number
): void => {
  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * FULL_CIRCLE + 0.035;
    const end = ((index + 0.62) / segments) * FULL_CIRCLE;
    graphics.beginPath().arc(0, 0, Math.max(0.5, radius), start, end).stroke({ color, width, alpha });
  }
};

const drawDirectionalMarkers = (
  graphics: Graphics,
  radius: number,
  direction: RadialPulseState['direction'],
  count: number,
  color: number,
  alpha: number,
  tipDistance = 13,
  shoulderDistance = 4,
  halfTangent = 5
): void => {
  const sign = direction === 'outward' ? 1 : -1;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * FULL_CIRCLE - Math.PI / 2;
    const tipRadius = Math.max(12, radius) + sign * tipDistance;
    const shoulderRadius = Math.max(12, radius) + sign * shoulderDistance;
    const tipX = Math.cos(angle) * tipRadius;
    const tipY = Math.sin(angle) * tipRadius;
    const shoulderX = Math.cos(angle) * shoulderRadius;
    const shoulderY = Math.sin(angle) * shoulderRadius;
    const tangentX = -Math.sin(angle) * halfTangent;
    const tangentY = Math.cos(angle) * halfTangent;
    graphics.beginPath()
      .moveTo(shoulderX - tangentX, shoulderY - tangentY)
      .lineTo(tipX, tipY)
      .lineTo(shoulderX + tangentX, shoulderY + tangentY)
      .closePath()
      .fill({ color, alpha });
  }
};

const drawCrestFacets = (
  graphics: Graphics,
  radius: number,
  width: number,
  direction: RadialPulseState['direction'],
  count: number
): void => {
  const sign = direction === 'outward' ? 1 : -1;
  const accent = direction === 'outward' ? OUTWARD_HOT : INWARD_HOT;
  const body = direction === 'outward' ? OUTWARD : INWARD;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * FULL_CIRCLE + Math.PI / count;
    const tangent = Math.max(8, width * 0.42);
    const inner = radius + sign * width * 0.14;
    const outer = radius + sign * width * 0.9;
    const innerX = Math.cos(angle) * inner;
    const innerY = Math.sin(angle) * inner;
    const outerX = Math.cos(angle) * outer;
    const outerY = Math.sin(angle) * outer;
    const tangentX = -Math.sin(angle) * tangent;
    const tangentY = Math.cos(angle) * tangent;
    graphics.beginPath()
      .moveTo(innerX - tangentX, innerY - tangentY)
      .lineTo(outerX, outerY)
      .lineTo(innerX + tangentX, innerY + tangentY)
      .closePath()
      .fill({ color: body, alpha: 0.9 });
    const hotInner = radius + sign * width * 0.3;
    const hotOuter = radius + sign * width * 0.82;
    const hotInnerX = Math.cos(angle) * hotInner;
    const hotInnerY = Math.sin(angle) * hotInner;
    const hotOuterX = Math.cos(angle) * hotOuter;
    const hotOuterY = Math.sin(angle) * hotOuter;
    graphics.beginPath()
      .moveTo(hotInnerX - tangentX * 0.5, hotInnerY - tangentY * 0.5)
      .lineTo(hotOuterX, hotOuterY)
      .lineTo(hotInnerX + tangentX * 0.5, hotInnerY + tangentY * 0.5)
      .closePath()
      .fill({ color: accent, alpha: 0.92 });
  }
};

const drawSegmentedEnergy = (
  graphics: Graphics,
  radius: number,
  width: number,
  direction: RadialPulseState['direction'],
  count: number
): void => {
  const sign = direction === 'outward' ? 1 : -1;
  const color = direction === 'outward' ? OUTWARD_HOT : INWARD_HOT;
  const segmentAngle = FULL_CIRCLE / count;
  const leadingRadius = radius + sign * width * 0.48;
  const innerRadius = radius - sign * width * 0.22;
  for (let index = 0; index < count; index += 1) {
    const center = index * segmentAngle + segmentAngle * 0.5;
    const span = segmentAngle * 0.54;
    drawArc(graphics, leadingRadius, center - span, center + span, color, Math.max(3.2, width * 0.34), 0.96);
    drawArc(graphics, innerRadius, center - span * 0.76, center + span * 0.76, direction === 'outward' ? OUTWARD : INWARD, Math.max(2, width * 0.16), 0.72);
  }
};

const drawArc = (
  graphics: Graphics,
  radius: number,
  start: number,
  end: number,
  color: number,
  width: number,
  alpha: number
): void => {
  graphics.beginPath().arc(0, 0, Math.max(0.5, radius), start, end).stroke({ color, width, alpha });
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
