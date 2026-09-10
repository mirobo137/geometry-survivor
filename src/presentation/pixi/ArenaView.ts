import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import type { ArenaState } from '../../simulation/ArenaModel';
import { getArenaBoundaryPoints, getArenaRadiusAtAngle, type ArenaBoundary } from '../../simulation/ArenaBoundary';
import { ARENA_ART, drawArenaFloor, drawContainmentFrame } from './ArenaFrameArt';

const PERIMETER_SEGMENTS = 144;
const MARKER_COUNT = 8;

const INITIAL_ARENA_STATE: ArenaState = {
  elapsedSeconds: 0,
  radius: ARENA_RADIUS,
  expansionProgress: 0,
  expansionIndex: 0,
  resonance: 0,
  shape: 'circle',
  shapeFrom: 'circle',
  shapeTo: 'circle',
  morphProgress: 0,
  shapeTelegraphProgress: 0,
  shapePhase: 'stable',
  shapeIndex: 0
};

interface ArenaPoint {
  readonly x: number;
  readonly y: number;
}

interface StrokeStyle {
  readonly color: number;
  readonly width: number;
  readonly alpha: number;
}

/**
 * Premium arena identity built from the simulation boundary, not from a
 * circle-specific effect. Every decorative layer reads the same perimeter so
 * future convex shapes inherit the visual language without new render paths.
 */
export class ArenaView {
  public readonly root = new Container();
  private readonly arena = new Graphics();
  private readonly shapeSignal = new Graphics();
  private readonly arenaMounts = new Graphics();
  private readonly arenaRails = new Graphics();
  private readonly arenaSegments = new Graphics();
  private readonly arenaFrame = new Graphics();
  private readonly arenaCore = new Graphics();
  private readonly resonance = new Graphics();
  private readonly shockwave = new Graphics();
  private readonly couriers = Array.from({ length: 6 }, () => new Graphics());
  private boundary: ArenaBoundary = INITIAL_ARENA_STATE;
  private shapeSignalKey = '';
  private resonanceKey = '';
  private shockwaveGeometryDirty = false;
  private readonly reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private arenaRadius = -1;
  private expansionIndex = 0;
  private geometryKey = '';
  private visualSeconds = 0;
  private shockwaveLifeSeconds = 0;
  private shockwaveMaxLifeSeconds = 0;
  private shockwaveStartRadius = 0;
  private shockwaveEndRadius = 0;
  private shockwaveBaseRadius = 1;
  private shockwavePoints: readonly ArenaPoint[] = [];

  public constructor() {
    // Keep shapeSignal at child index 1 for the existing visual smoke contract.
    this.root.addChild(
      this.arena,
      this.shapeSignal,
      this.arenaFrame,
      this.arenaRails,
      this.arenaSegments,
      this.arenaMounts,
      this.arenaCore,
      this.resonance,
      this.shockwave
    );
    for (const graphics of [
      this.arena,
      this.shapeSignal,
      this.arenaFrame,
      this.arenaRails,
      this.arenaSegments,
      this.arenaMounts,
      this.arenaCore,
      this.resonance,
      this.shockwave
    ]) {
      graphics.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    }
    this.shockwave.visible = false;
    for (const courier of this.couriers) {
      courier.beginPath().moveTo(-19, 0).lineTo(-3, -2.8).lineTo(4, 0)
        .lineTo(-3, 2.8).closePath().fill({ color: ARENA_ART.energy, alpha: 0.22 });
      courier.beginPath().moveTo(-12, 0).lineTo(-2, -1).lineTo(3, 0)
        .lineTo(-2, 1).closePath().fill({ color: ARENA_ART.hot, alpha: 0.86 });
      this.root.addChild(courier);
    }
    this.render(INITIAL_ARENA_STATE);
  }

  public render(state: Readonly<ArenaState>): void {
    this.boundary = state;
    if (this.arenaRadius >= 0 && state.expansionIndex > this.expansionIndex) {
      this.shockwaveStartRadius = this.arenaRadius;
      this.shockwaveEndRadius = state.radius + 28;
      this.shockwaveBaseRadius = Math.max(1, state.radius);
      this.shockwavePoints = getArenaBoundaryPoints(state, PERIMETER_SEGMENTS);
      this.shockwaveGeometryDirty = true;
      this.shockwaveMaxLifeSeconds = 0.58;
      this.shockwaveLifeSeconds = this.shockwaveMaxLifeSeconds;
    }
    this.expansionIndex = state.expansionIndex;

    const geometryKey = [
      state.radius.toFixed(3),
      state.shapeFrom,
      state.shapeTo,
      state.morphProgress.toFixed(4)
    ].join('|');
    if (geometryKey !== this.geometryKey) {
      this.drawArena(state);
      this.geometryKey = geometryKey;
    }
    this.arenaRadius = state.radius;
    this.drawShapeSignal(state);
    this.drawResonance(state);
    this.drawShockwave();
    this.positionCouriers();
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.1);
    if (delta > 0 && !this.reducedMotion) this.visualSeconds += delta;

    const pulse = this.reducedMotion ? 0.5 : 0.5 + Math.sin(this.visualSeconds * 2.2) * 0.18;
    this.arenaSegments.alpha = 0.74 + pulse * 0.26;
    this.arenaCore.scale.set(0.96 + pulse * 0.08);
    this.arenaCore.rotation = this.reducedMotion ? 0 : Math.sin(this.visualSeconds * 0.25) * 0.035;
    this.positionCouriers();

    if (this.shockwaveLifeSeconds <= 0) return;
    this.shockwaveLifeSeconds = Math.max(0, this.shockwaveLifeSeconds - delta);
    if (this.shockwaveLifeSeconds <= 0) this.shockwave.visible = false;
  }

  public reset(): void {
    this.arenaRadius = -1;
    this.expansionIndex = 0;
    this.geometryKey = '';
    this.shapeSignalKey = '';
    this.resonanceKey = '';
    for (const courier of this.couriers) courier.visible = false;
    this.visualSeconds = 0;
    this.shockwaveLifeSeconds = 0;
    this.shockwaveMaxLifeSeconds = 0;
    this.shockwavePoints = [];
    this.shockwave.clear();
    this.shockwave.visible = false;
    this.shapeSignal.clear();
    this.shapeSignal.visible = false;
    this.resonance.clear();
    this.resonance.visible = false;
    this.arena.clear();
    this.arenaMounts.clear();
    this.arenaRails.clear();
    this.arenaSegments.clear();
    this.arenaFrame.clear();
    this.arenaCore.clear();
    this.arenaCore.scale.set(1);
    this.arenaCore.rotation = 0;
  }

  private drawArena(state: Readonly<ArenaState>): void {
    const boundary: ArenaBoundary = state;
    drawArenaFloor(this.arena, boundary);

    this.arenaRails.clear();
    this.strokeBoundary(this.arenaRails, boundary, { color: 0x081226, width: 8, alpha: 0.9 });
    this.strokeBoundary(this.arenaRails, boundary, { color: 0x327f7d, width: 3, alpha: 0.9 });
    this.strokeBoundary(this.arenaRails, boundary, { color: ARENA_ART.hot, width: 0.9, alpha: 0.8 });
    // Frame art is outside the continuous playable rail, preserving its authority.
    drawContainmentFrame(this.arenaFrame, this.arenaSegments, this.arenaMounts, boundary);
    this.drawCore();
  }

  private drawShapeSignal(state: Readonly<ArenaState>): void {
    if (state.shapePhase === 'stable') {
      this.shapeSignal.visible = false;
      return;
    }
    this.shapeSignal.visible = true;
    const target: ArenaBoundary = {
      radius: state.radius + 7,
      shapeFrom: state.shapeTo,
      shapeTo: state.shapeTo,
      morphProgress: 0
    };
    const progress = state.shapePhase === 'telegraph' ? state.shapeTelegraphProgress : 1;
    const alpha = 0.2 + progress * 0.5;
    this.shapeSignal.alpha = alpha;
    const key = `${state.radius}|${state.shapeTo}`;
    if (key === this.shapeSignalKey) return;
    this.shapeSignalKey = key;
    this.shapeSignal.clear();
    this.strokeDashedBoundary(this.shapeSignal, target, {
      color: 0xffd166,
      width: 3.5,
      alpha: 1
    }, 3, 2);
    this.drawPerimeterMarkers(this.shapeSignal, target, 0xffd166, 4.5, 1);
  }

  private drawResonance(state: Readonly<ArenaState>): void {
    if (state.resonance <= 0) {
      this.resonance.visible = false;
      return;
    }
    this.resonance.visible = true;
    const intensity = state.resonance;
    this.resonance.alpha = 0.2 + intensity * 0.42;
    this.resonance.scale.set(1 + (12 + intensity * 16) / state.radius);
    if (this.resonanceKey === this.geometryKey) return;
    this.resonanceKey = this.geometryKey;
    this.resonance.clear();
    this.strokeDashedBoundary(
      this.resonance,
      state,
      { color: ARENA_ART.energy, width: 2, alpha: 1 },
      2,
      2
    );
  }

  private drawShockwave(): void {
    this.shockwave.visible = !this.reducedMotion && this.shockwaveLifeSeconds > 0 && this.shockwavePoints.length > 0;
    if (!this.shockwave.visible) return;
    const progress = 1 - this.shockwaveLifeSeconds / this.shockwaveMaxLifeSeconds;
    const eased = progress * progress * (3 - 2 * progress);
    const shockwaveRadius = this.shockwaveStartRadius
      + (this.shockwaveEndRadius - this.shockwaveStartRadius) * eased;
    const scale = shockwaveRadius / this.shockwaveBaseRadius;
    this.shockwave.scale.set(scale);
    this.shockwave.alpha = (1 - progress) * 0.5;
    if (!this.shockwaveGeometryDirty) return;
    this.shockwaveGeometryDirty = false;
    this.shockwave.clear();
    const first = this.shockwavePoints[0];
    this.shockwave.beginPath().moveTo(first.x, first.y);
    for (let index = 1; index < this.shockwavePoints.length; index += 1) {
      const point = this.shockwavePoints[index];
      this.shockwave.lineTo(point.x, point.y);
    }
    this.shockwave.lineTo(first.x, first.y).stroke({
      color: 0x9bf4ff,
      width: 2,
      alpha: 1
    });
  }

  private drawCore(): void {
    this.arenaCore.clear();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const c = Math.cos(a), s = Math.sin(a);
      this.arenaCore.beginPath().moveTo(c * 13, s * 13)
        .lineTo(c * 24 - s * 4, s * 24 + c * 4)
        .lineTo(c * 30, s * 30)
        .lineTo(c * 24 + s * 4, s * 24 - c * 4).closePath()
        .fill({ color: 0x1e484e, alpha: 0.5 });
      this.arenaCore.beginPath().arc(0, 0, 36, a + 0.12, a + 0.42)
        .stroke({ color: ARENA_ART.bevel, width: 0.8, alpha: 0.28 });
    }
    this.arenaCore.beginPath().circle(0, 0, 6).fill({ color: ARENA_ART.ink, alpha: 0.8 });
    this.arenaCore.beginPath().circle(0, 0, 2).fill({ color: ARENA_ART.energy, alpha: 0.65 });
  }

  private positionCouriers(): void {
    for (let i = 0; i < this.couriers.length; i++) {
      const courier = this.couriers[i];
      courier.visible = !this.reducedMotion && this.arenaRadius >= 0;
      const a = i * Math.PI / 3 + this.visualSeconds * 0.12;
      const r = getArenaRadiusAtAngle(this.boundary, a) + 2.5;
      const next = a + 0.002;
      const nextR = getArenaRadiusAtAngle(this.boundary, next) + 2.5;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      courier.position.set(ARENA_CENTER.x + x, ARENA_CENTER.y + y);
      courier.rotation = Math.atan2(Math.sin(next) * nextR - y, Math.cos(next) * nextR - x);
    }
  }

  private drawPerimeterMarkers(
    graphics: Graphics,
    boundary: ArenaBoundary,
    color = 0x8de7d0,
    size = 4,
    alpha = 0.9
  ): void {
    const points = getArenaBoundaryPoints(boundary, MARKER_COUNT);
    for (const point of points) {
      const scale = 0.985;
      const x = point.x * scale;
      const y = point.y * scale;
      graphics.beginPath().moveTo(x, y - size).lineTo(x + size, y)
        .lineTo(x, y + size).lineTo(x - size, y).closePath()
        .fill({ color, alpha });
    }
  }

  private strokeDashedBoundary(
    graphics: Graphics,
    boundary: ArenaBoundary,
    style: StrokeStyle,
    dashPoints: number,
    gapPoints: number
  ): void {
    const points = getArenaBoundaryPoints(boundary, PERIMETER_SEGMENTS);
    const stride = Math.max(1, dashPoints) + Math.max(1, gapPoints);
    for (let start = 0; start < points.length; start += stride) {
      const end = Math.min(points.length - 1, start + Math.max(1, dashPoints));
      graphics.beginPath().moveTo(points[start].x, points[start].y);
      for (let index = start + 1; index <= end; index += 1) {
        graphics.lineTo(points[index].x, points[index].y);
      }
      graphics.stroke(style);
    }
  }

  private strokeBoundary(graphics: Graphics, boundary: ArenaBoundary, style: StrokeStyle): void {
    const points = getArenaBoundaryPoints(boundary, PERIMETER_SEGMENTS);
    if (points.length === 0) return;
    graphics.beginPath().moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      graphics.lineTo(points[index].x, points[index].y);
    }
    graphics.lineTo(points[0].x, points[0].y).stroke(style);
  }

}
