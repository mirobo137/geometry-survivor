import { Container, Graphics } from 'pixi.js';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { RadialPulseState } from '../../simulation/hazards/RadialPulseHazard';
import { ARENA_CENTER } from '../../config/constants';

const INK = 0x080d1b;
const WARNING = 0x8ef7ff;
const WARNING_CORE = 0xd9ffff;
const ACTIVE = 0x35d8ef;
const ACTIVE_CORE = 0xf5ffff;
const INWARD = 0xc795ff;
const RECOVERY = 0x7c82da;
const FULL_CIRCLE = Math.PI * 2;

/**
 * Premium annular-wave read. The simulation supplies the authoritative radius;
 * this view reuses five Graphics objects and rebuilds only bounded paths (no
 * display-object allocation, filters or per-entity glow).
 */
export class RadialPulseView {
  public readonly root = new Container();
  private readonly track = new Graphics();
  private readonly band = new Graphics();
  private readonly core = new Graphics();
  private readonly markers = new Graphics();
  private readonly residue = new Graphics();
  private readonly markerCount: number;

  public constructor(quality: FxQuality = 'medium') {
    this.markerCount = quality === 'low' ? 4 : quality === 'high' ? 8 : 6;
    this.root.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.root.addChild(this.track, this.band, this.core, this.markers, this.residue);
    this.reset();
  }

  public render(state: Readonly<RadialPulseState>): void {
    this.root.visible = state.phase !== 'idle';
    if (!this.root.visible) return;

    this.track.clear();
    this.band.clear();
    this.core.clear();
    this.markers.clear();
    this.residue.clear();
    this.track.visible = state.phase === 'telegraph';
    this.band.visible = state.phase === 'active';
    this.core.visible = state.phase === 'telegraph' || state.phase === 'active';
    this.markers.visible = state.phase !== 'recovery';
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
    this.residue.visible = false;
  }

  private renderTelegraph(state: Readonly<RadialPulseState>): void {
    const progress = clamp01(state.progress);
    const guideRadius = Math.max(14, state.startRadius);
    const intensity = 0.45 + progress * 0.45;
    drawDashedRing(this.track, guideRadius, 14, WARNING, 2.4, intensity);
    drawRing(this.track, guideRadius, WARNING_CORE, 1, 0.42 + progress * 0.2);
    // Thin bracket rings mark the two non-damaging pockets without painting
    // opaque safe zones over enemies or the player.
    const innerPocket = Math.min(state.startRadius, state.endRadius);
    const outerPocket = Math.max(state.startRadius, state.endRadius);
    drawDashedRing(this.track, Math.max(8, innerPocket - 4), 8, WARNING_CORE, 1, 0.22);
    drawDashedRing(this.track, outerPocket + 4, 8, WARNING_CORE, 1, 0.22);
    drawRing(this.core, Math.max(5, guideRadius * 0.08), state.direction === 'inward' ? INWARD : WARNING_CORE, 2.4, 0.85);
    drawMarkers(this.markers, guideRadius, state.direction, this.markerCount, WARNING_CORE, 0.55 + progress * 0.35);
  }

  private renderActive(state: Readonly<RadialPulseState>): void {
    const progress = clamp01(state.travelProgress);
    const radius = Math.max(2, state.radius);
    const color = state.direction === 'inward' ? INWARD : ACTIVE;
    drawRing(this.band, radius, INK, state.width + 13, 0.7);
    drawRing(this.band, radius, color, state.width + 5, 0.23);
    drawRing(this.band, radius, color, state.width, 0.8);
    drawRing(this.band, radius, ACTIVE_CORE, 3, 0.94);
    drawRing(this.core, radius, WARNING_CORE, 1, 0.65 * (1 - progress * 0.35));
    drawMarkers(this.markers, radius, state.direction, this.markerCount, ACTIVE_CORE, 0.72);
    if (radius < 42) {
      drawRing(this.core, Math.max(5, radius), state.direction === 'inward' ? INWARD : WARNING, 6, 0.35);
    }
  }

  private renderRecovery(state: Readonly<RadialPulseState>): void {
    const fade = (1 - clamp01(state.progress)) ** 2;
    const radius = Math.max(5, state.endRadius);
    drawDashedRing(this.residue, radius, 12, RECOVERY, 2, fade * 0.35);
    drawRing(this.residue, radius, WARNING_CORE, 1, fade * 0.5);
  }
}

const drawRing = (graphics: Graphics, radius: number, color: number, width: number, alpha: number): void => {
  graphics.beginPath().circle(0, 0, Math.max(0.5, radius)).stroke({ color, width, alpha });
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

const drawMarkers = (
  graphics: Graphics,
  radius: number,
  direction: RadialPulseState['direction'],
  count: number,
  color: number,
  alpha: number
): void => {
  const sign = direction === 'outward' ? 1 : -1;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * FULL_CIRCLE - Math.PI / 2;
    const centerRadius = Math.max(12, radius);
    const tipRadius = centerRadius + sign * 11;
    const baseRadius = centerRadius - sign * 8;
    const tangent = 5;
    const tipX = Math.cos(angle) * tipRadius;
    const tipY = Math.sin(angle) * tipRadius;
    const baseX = Math.cos(angle) * baseRadius;
    const baseY = Math.sin(angle) * baseRadius;
    const tangentX = -Math.sin(angle) * tangent;
    const tangentY = Math.cos(angle) * tangent;
    graphics.beginPath()
      .moveTo(baseX - tangentX, baseY - tangentY)
      .lineTo(tipX, tipY)
      .lineTo(baseX + tangentX, baseY + tangentY)
      .stroke({ color, width: 2, alpha });
  }
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
