import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER, ARENA_RADIUS } from '../../config/constants';
import type { ArenaState } from '../../simulation/ArenaModel';
import { getArenaBoundaryPoints, type ArenaBoundary } from '../../simulation/ArenaBoundary';

const PERIMETER_SEGMENTS = 36;

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

/** Draws the authored arena and its low-cost shape-change telegraph. */
export class ArenaView {
  public readonly root = new Container();
  private readonly arena = new Graphics();
  private readonly shapeSignal = new Graphics();
  private readonly resonance = new Graphics();
  private readonly shockwave = new Graphics();
  private arenaRadius = -1;
  private geometryKey = '';
  private shockwaveLifeSeconds = 0;
  private shockwaveMaxLifeSeconds = 0;
  private shockwaveStartRadius = 0;
  private shockwaveEndRadius = 0;

  public constructor() {
    this.root.addChild(this.arena, this.shapeSignal, this.resonance, this.shockwave);
    for (const graphics of [this.arena, this.shapeSignal, this.resonance, this.shockwave]) {
      graphics.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    }
    this.shockwave.visible = false;
    this.render(INITIAL_ARENA_STATE);
  }

  public render(state: Readonly<ArenaState>): void {
    if (this.arenaRadius >= 0 && state.radius > this.arenaRadius + 0.5) {
      this.shockwaveStartRadius = this.arenaRadius;
      this.shockwaveEndRadius = state.radius + 28;
      this.shockwaveMaxLifeSeconds = 0.58;
      this.shockwaveLifeSeconds = this.shockwaveMaxLifeSeconds;
    }

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
  }

  public update(deltaSeconds: number): void {
    if (this.shockwaveLifeSeconds <= 0) return;
    this.shockwaveLifeSeconds = Math.max(0, this.shockwaveLifeSeconds - Math.min(Math.max(deltaSeconds, 0), 0.1));
    if (this.shockwaveLifeSeconds <= 0) this.shockwave.visible = false;
  }

  public reset(): void {
    this.arenaRadius = -1;
    this.geometryKey = '';
    this.shockwaveLifeSeconds = 0;
    this.shockwaveMaxLifeSeconds = 0;
    this.shockwave.clear();
    this.shockwave.visible = false;
    this.shapeSignal.clear();
    this.shapeSignal.visible = false;
    this.resonance.clear();
    this.resonance.visible = false;
    this.arena.clear();
  }

  private drawArena(state: Readonly<ArenaState>): void {
    const boundary: ArenaBoundary = state;
    this.arena.clear();
    this.fillBoundary(this.arena, boundary, { color: 0x111a36, alpha: 0.84 });
    this.strokeBoundary(this.arena, boundary, { color: 0x4b6cb7, width: 3, alpha: 0.9 });
    this.strokeBoundary(this.arena, inflateBoundary(boundary, -40), { color: 0x26365f, width: 2, alpha: 0.8 });
    this.arena.beginPath().circle(0, 0, 2).fill({ color: 0x83a8ff, alpha: 0.9 });
  }

  private drawShapeSignal(state: Readonly<ArenaState>): void {
    this.shapeSignal.clear();
    if (state.shapePhase === 'stable') {
      this.shapeSignal.visible = false;
      return;
    }
    this.shapeSignal.visible = true;
    const target: ArenaBoundary = {
      radius: state.radius + 4,
      shapeFrom: state.shapeTo,
      shapeTo: state.shapeTo,
      morphProgress: 0
    };
    const alpha = state.shapePhase === 'telegraph'
      ? 0.2 + state.shapeTelegraphProgress * 0.45
      : 0.26;
    this.strokeBoundary(this.shapeSignal, target, { color: 0xffd166, width: 3, alpha });
  }

  private drawResonance(state: Readonly<ArenaState>): void {
    this.resonance.clear();
    if (state.resonance <= 0) {
      this.resonance.visible = false;
      return;
    }
    this.resonance.visible = true;
    this.strokeBoundary(
      this.resonance,
      inflateBoundary(state, 10 + state.resonance * 16),
      { color: 0x75e6ff, width: 4 + state.resonance * 3, alpha: 0.18 + state.resonance * 0.42 }
    );
  }

  private drawShockwave(): void {
    this.shockwave.clear();
    this.shockwave.visible = this.shockwaveLifeSeconds > 0;
    if (this.shockwaveLifeSeconds <= 0) return;
    const progress = 1 - this.shockwaveLifeSeconds / this.shockwaveMaxLifeSeconds;
    const eased = progress * progress * (3 - 2 * progress);
    const shockwaveRadius = this.shockwaveStartRadius
      + (this.shockwaveEndRadius - this.shockwaveStartRadius) * eased;
    this.shockwave
      .beginPath()
      .circle(0, 0, shockwaveRadius)
      .stroke({
        color: 0x9bf4ff,
        width: 5 - progress * 3,
        alpha: (1 - progress) * 0.78
      });
  }

  private strokeBoundary(
    graphics: Graphics,
    boundary: ArenaBoundary,
    style: { readonly color: number; readonly width: number; readonly alpha: number }
  ): void {
    const points = getArenaBoundaryPoints(boundary, PERIMETER_SEGMENTS);
    if (points.length === 0) return;
    graphics.beginPath().moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      graphics.lineTo(points[index].x, points[index].y);
    }
    graphics.lineTo(points[0].x, points[0].y).stroke(style);
  }

  private fillBoundary(
    graphics: Graphics,
    boundary: ArenaBoundary,
    style: { readonly color: number; readonly alpha: number }
  ): void {
    const points = getArenaBoundaryPoints(boundary, PERIMETER_SEGMENTS);
    if (points.length === 0) return;
    graphics.beginPath().moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      graphics.lineTo(points[index].x, points[index].y);
    }
    graphics.lineTo(points[0].x, points[0].y).fill(style);
  }
}

const inflateBoundary = (boundary: ArenaBoundary, amount: number): ArenaBoundary => ({
  ...boundary,
  radius: Math.max(0, boundary.radius + amount)
});
