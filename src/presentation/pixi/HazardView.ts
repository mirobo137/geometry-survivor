import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';
import { getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../../simulation/ArenaBoundary';

// All geometry is built once in local +X space. Rendering only transforms it.
const INK = 0x11182b;
const ARMOR = 0x495673;
const EDGE = 0xaab6cc;
const EMBER = 0xf26449;
const GOLD = 0xffbe69;
const HOT = 0xfff3d1;

function line(g: Graphics, x1: number, y1: number, x2: number, y2: number,
  color: number, width: number, alpha = 1): void {
  g.beginPath().moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width, alpha });
}

function ribbon(g: Graphics, halfWidth: number, color: number, alpha: number): void {
  g.beginPath().moveTo(-1, 0).lineTo(-0.96, -halfWidth * 0.5)
    .lineTo(-0.82, -halfWidth).lineTo(0.82, -halfWidth)
    .lineTo(0.96, -halfWidth * 0.5).lineTo(1, 0)
    .lineTo(0.96, halfWidth * 0.5).lineTo(0.82, halfWidth)
    .lineTo(-0.82, halfWidth).lineTo(-0.96, halfWidth * 0.5)
    .closePath().fill({ color, alpha });
}

/** Solar rail: faceted emitters, converging charge, contained plasma, cold decay.
 * No display-object creation, path rebuilding, filters or wall-clock animation in render.
 */
export class HazardView {
  public readonly root = new Container();
  private readonly axis = new Container();
  private readonly warning = new Graphics();
  private readonly charge = new Graphics();
  private readonly plasma = new Graphics();
  private readonly ignition = new Graphics();
  private readonly residue = new Graphics();
  private readonly left = new Container();
  private readonly right = new Container();
  private readonly leftLight = new Graphics();
  private readonly rightLight = new Graphics();
  private readonly leftCharge = new Graphics();
  private readonly rightCharge = new Graphics();
  private readonly streaks: Graphics[] = [];

  public constructor(quality: FxQuality = 'medium') {
    this.root.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.root.addChild(this.axis);
    this.axis.addChild(this.warning, this.charge, this.plasma, this.ignition, this.residue);
    // Twin broken rails are visibly a warning, never the solid active beam.
    for (let i = 0; i < 24; i += 1) {
      const x = -1 + i / 12;
      line(this.warning, x, -8, x + 0.045, -8, GOLD, 1, 0.7);
      line(this.warning, x, 8, x + 0.045, 8, GOLD, 1, 0.7);
    }
    line(this.warning, -1, 0, 1, 0, GOLD, 1, 0.45);
    ribbon(this.charge, 2.2, HOT, 0.9);
    // Dark underlay gives the hot center contrast even over light backgrounds.
    ribbon(this.plasma, 0.56, INK, 0.8);
    ribbon(this.plasma, 0.5, EMBER, 0.95);
    ribbon(this.plasma, 0.34, GOLD, 1);
    ribbon(this.plasma, 0.14, HOT, 1);
    // Fine asymmetric inner filaments keep the broad band from looking flat.
    line(this.plasma, -0.76, -0.25, 0.62, -0.25, HOT, 0.035, 0.65);
    line(this.plasma, -0.58, 0.23, 0.82, 0.23, EMBER, 0.06, 0.8);
    ribbon(this.ignition, 0.5, HOT, 0.32);
    for (let i = 0; i < 13; i += 1) {
      const x = -0.9 + i * 0.14;
      line(this.residue, x, 0, x + 0.055, 0, GOLD, 1, 0.55);
    }
    const count = quality === 'low' ? 0 : quality === 'high' ? 6 : 4;
    for (let i = 0; i < count; i += 1) {
      const streak = new Graphics();
      ribbon(streak, 0.65, HOT, 0.8);
      this.streaks.push(streak);
      this.axis.addChild(streak);
    }
    this.buildEmitter(this.left, this.leftLight, this.leftCharge);
    this.buildEmitter(this.right, this.rightLight, this.rightCharge);
    this.right.rotation = Math.PI;
    this.axis.addChild(this.left, this.right);
    this.reset();
  }

  public renderLaser(state: Readonly<LaserHazardState>, arena: ArenaBoundaryInput): void {
    this.root.visible = state.phase !== 'idle';
    if (!this.root.visible) return;
    const radius = getArenaRadiusAtAngle(arena, state.angle);
    const p = Math.min(1, Math.max(0, state.progress));
    const active = state.phase === 'active';
    const warning = state.phase === 'telegraph';
    const recovery = state.phase === 'recovery';
    // Angle is authoritative. No fake trailing rays in a safe part of the arena.
    this.axis.rotation = state.angle;
    this.left.position.set(-radius, 0);
    this.right.position.set(radius, 0);
    this.warning.visible = warning;
    this.warning.scale.set(radius, 1);
    this.warning.alpha = 0.4 + 0.6 * p;
    this.charge.visible = warning;
    this.charge.scale.set(radius * p * p, 0.4 + p * 0.6);
    this.charge.alpha = 0.12 + 0.48 * p;
    this.plasma.visible = active;
    this.plasma.scale.set(radius, state.width);
    this.ignition.visible = active && p < 0.22;
    this.ignition.scale.set(radius, state.width * (1.1 + 0.4 * p / 0.22));
    this.ignition.alpha = Math.max(0, 1 - p / 0.22);
    this.residue.visible = recovery;
    this.residue.scale.set(radius, 1);
    this.residue.alpha = (1 - p) * (1 - p) * 0.5;
    const intensity = warning ? 0.3 + p * 0.6 : active ? 1 : (1 - p) * 0.35;
    this.leftLight.alpha = intensity;
    this.rightLight.alpha = intensity;
    const chargeScale = warning ? 1.8 - 0.8 * p : active ? 1 + 0.25 * p : 1.3 + p;
    this.leftCharge.scale.set(chargeScale);
    this.rightCharge.scale.set(chargeScale);
    this.leftCharge.alpha = intensity * 0.65;
    this.rightCharge.alpha = intensity * 0.65;
    this.left.alpha = this.right.alpha = recovery ? 1 - p : 1;
    for (let i = 0; i < this.streaks.length; i += 1) {
      const streak = this.streaks[i];
      streak.visible = active;
      const travel = (p * 2 + i / this.streaks.length) % 1;
      const sign = i % 2 === 0 ? 1 : -1;
      streak.position.set(sign * radius * (0.08 + travel * 0.8), sign * state.width * 0.23);
      streak.scale.set(Math.min(26, radius * 0.07), 1);
      streak.alpha = Math.sin(travel * Math.PI) * 0.7;
    }
  }

  public reset(): void {
    this.root.visible = false;
  }

  private buildEmitter(root: Container, light: Graphics, charge: Graphics): void {
    const body = new Graphics();
    // Inward-facing split jaws: dark cavity, planar armor, selective lit bevel.
    body.beginPath().moveTo(-12, -17).lineTo(5, -17).lineTo(13, -9)
      .lineTo(6, -5).lineTo(-4, -7).lineTo(-4, 7).lineTo(6, 5)
      .lineTo(13, 9).lineTo(5, 17).lineTo(-12, 17).lineTo(-18, 8)
      .lineTo(-18, -8).closePath().fill(INK);
    for (const sign of [-1, 1]) {
      body.beginPath().moveTo(-11, sign * 15).lineTo(4, sign * 15)
        .lineTo(10, sign * 10).lineTo(4, sign * 8).lineTo(-9, sign * 10)
        .closePath().fill(ARMOR);
      line(body, -10, sign * 15, 4, sign * 15, EDGE, 1.5);
      line(light, -7, sign * 9, 5, sign * 7, GOLD, 2);
      line(body, -15, sign * 7, -15, sign * 2, EDGE, 1);
    }
    light.beginPath().moveTo(-5, 0).lineTo(0, -4).lineTo(7, 0)
      .lineTo(0, 4).closePath().fill(HOT);
    // Disjoint brackets avoid the generic concentric target-circle look.
    for (const sign of [-1, 1]) {
      line(charge, -10, sign * 21, 3, sign * 21, GOLD, 1);
      line(charge, 3, sign * 21, 9, sign * 15, GOLD, 1);
    }
    root.addChild(body, light, charge);
  }
}
