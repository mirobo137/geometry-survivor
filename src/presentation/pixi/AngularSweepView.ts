import { Container, Graphics } from 'pixi.js';
import type { FxQuality } from '../../content/visual/VisualTokens';
import type { AngularSweepState } from '../../simulation/hazards/AngularSweepHazard';
import type { ArenaBoundaryInput } from '../../simulation/ArenaBoundary';
import { ARENA_CENTER } from '../../config/constants';
import { getArenaRadiusAtAngle } from '../../simulation/ArenaBoundary';

const INK = 0x091225;
const ACTIVE = 0xe65f8d;
const ACTIVE_HOT = 0xffe0ac;
const WARNING = 0xffcf70;
const WARNING_HOT = 0xfff2c8;
const TELEGRAPH_METAL = 0x536879;
const RECOVERY = 0x73d9e5;

/**
 * Premium angular-sector read. Geometry is authored once per radius/sequence;
 * gameplay animation uses the container rotation and alpha only. The active
 * fan is the real danger shape, while the telegraph only marks its committed
 * route and direction.
 */
export class AngularSweepView {
  public readonly root = new Container();
  private readonly axis = new Container();
  private readonly telegraph = new Graphics();
  private readonly telegraphCore = new Graphics();
  private readonly telegraphOrigin = new Graphics();
  private readonly activeShell = new Graphics();
  private readonly activeMantle = new Graphics();
  private readonly activeBody = new Graphics();
  private readonly activeCore = new Graphics();
  private readonly activeEdges = new Graphics();
  private readonly directionForward = new Graphics();
  private readonly directionReverse = new Graphics();
  private readonly residue = new Graphics();
  private renderedSequence = -1;
  private renderedRadius = -1;
  private readonly chevronCount: number;
  private readonly reducedMotion: boolean;

  public constructor(quality: FxQuality = 'medium') {
    this.chevronCount = quality === 'low' ? 2 : quality === 'high' ? 4 : 3;
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.root.position.set(ARENA_CENTER.x, ARENA_CENTER.y);
    this.axis.addChild(
      this.telegraph,
      this.telegraphCore,
      this.telegraphOrigin,
      this.activeShell,
      this.activeMantle,
      this.activeBody,
      this.activeCore,
      this.activeEdges,
      this.directionForward,
      this.directionReverse,
      this.residue
    );
    this.root.addChild(this.axis);
    this.reset();
  }

  public render(state: Readonly<AngularSweepState>, arena: ArenaBoundaryInput): void {
    if (state.phase === 'idle') {
      this.root.visible = false;
      return;
    }

    const radius = Math.max(24, getArenaRadiusAtAngle(arena, state.angle));
    if (state.sequence !== this.renderedSequence || Math.abs(radius - this.renderedRadius) > 0.5) {
      this.buildGeometry(radius, state.dangerHalfAngle, Math.abs(state.travelRadians));
      this.renderedSequence = state.sequence;
      this.renderedRadius = radius;
    }

    this.root.visible = true;
    this.axis.rotation = state.angle;
    this.telegraph.visible = state.phase === 'telegraph';
    this.telegraphCore.visible = state.phase === 'telegraph';
    this.telegraphOrigin.visible = state.phase === 'telegraph';
    this.activeShell.visible = state.phase === 'active';
    this.activeMantle.visible = state.phase === 'active';
    this.activeBody.visible = state.phase === 'active';
    this.activeCore.visible = state.phase === 'active';
    this.activeEdges.visible = state.phase === 'active';
    this.directionForward.visible = state.phase === 'telegraph' && state.travelRadians >= 0;
    this.directionReverse.visible = state.phase === 'telegraph' && state.travelRadians < 0;
    this.residue.visible = state.phase === 'recovery';

    const progress = clamp01(state.progress);
    if (state.phase === 'telegraph') {
      this.telegraph.alpha = 0.42 + progress * 0.52;
      this.telegraphCore.alpha = 0.58 + progress * 0.34;
      this.telegraphOrigin.alpha = 0.7 + progress * 0.25;
      this.directionForward.alpha = this.directionReverse.alpha = 0.56 + progress * 0.36;
      this.axis.scale.set(1 + (this.reducedMotion ? 0 : Math.sin(progress * Math.PI) * 0.012));
    } else if (state.phase === 'active') {
      this.axis.scale.set(1);
      this.activeShell.alpha = 0.92;
      this.activeMantle.alpha = 0.76;
      this.activeBody.alpha = 0.92;
      this.activeCore.alpha = 0.9 + Math.sin(progress * Math.PI) * 0.1;
      this.activeEdges.alpha = 0.8 + Math.sin(progress * Math.PI) * 0.15;
    } else {
      this.axis.scale.set(1);
      const fade = (1 - progress) ** 2;
      this.residue.alpha = fade * 0.62;
    }
  }

  public reset(): void {
    this.root.visible = false;
    this.axis.rotation = 0;
    this.axis.scale.set(1);
    this.renderedSequence = -1;
    this.renderedRadius = -1;
    this.telegraph.visible = false;
    this.telegraphCore.visible = false;
    this.telegraphOrigin.visible = false;
    this.activeShell.visible = false;
    this.activeMantle.visible = false;
    this.activeBody.visible = false;
    this.activeCore.visible = false;
    this.activeEdges.visible = false;
    this.directionForward.visible = false;
    this.directionReverse.visible = false;
    this.residue.visible = false;
    this.clearGeometry();
  }

  private buildGeometry(radius: number, halfAngle: number, travelRadians: number): void {
    this.clearGeometry();
    const safeHalfAngle = Math.max(0.08, Math.min(0.6, halfAngle));
    const innerRadius = 10;

    // Telegraph: a segmented command rail, not two unbroken lines. The dark
    // under-rail gives the warning contrast over the arena and the warm core
    // gives it a material edge without implying a solid hitbox.
    drawSector(this.telegraph, radius, 10, safeHalfAngle, INK, 0.1);
    drawSector(this.telegraphCore, radius, 10, safeHalfAngle, WARNING, 0.022);
    drawSegmentedSectorRail(this.telegraph, radius, safeHalfAngle, TELEGRAPH_METAL, 5.8, 0.9);
    drawSegmentedSectorRail(this.telegraph, radius * 0.74, safeHalfAngle * 0.86, INK, 3.6, 0.76);
    drawSegmentedSectorRail(this.telegraphCore, radius, safeHalfAngle, WARNING, 2.15, 0.94);
    drawSegmentedSectorRail(this.telegraphCore, radius * 0.74, safeHalfAngle * 0.86, WARNING_HOT, 1.1, 0.76);
    drawDashedArc(this.telegraphCore, radius * 0.64, -safeHalfAngle, safeHalfAngle, WARNING_HOT, 1.8, 7, 0.82);
    drawTelegraphTerminals(this.telegraph, this.telegraphCore, radius, safeHalfAngle);
    drawTelegraphOrigin(this.telegraph, this.telegraphCore, this.telegraphOrigin);
    // A thin field keeps the whole hit sector legible; energy is concentrated
    // in the leading edges and segmented radial vanes, not an opaque pizza fan.
    drawSector(this.activeShell, radius, 0, safeHalfAngle, INK, 0.26);
    drawSector(this.activeBody, radius, 0, safeHalfAngle, ACTIVE, 0.13);
    drawSectorEdges(this.activeMantle, radius, innerRadius, safeHalfAngle, INK, 7, 0.7);
    drawSectorEdges(this.activeEdges, radius, innerRadius, safeHalfAngle, ACTIVE, 3.6, 0.85);
    drawSectorEdges(this.activeCore, radius, innerRadius, safeHalfAngle, ACTIVE_HOT, 1, 0.95);
    // Swept induction vanes: tapered continuous surfaces inside the hit sector.
    // Three local materials establish depth without an opaque triangular fill.
    for (let blade=0;blade<3;blade++) {
      for (let layer=0;layer<3;layer++) {
        const points:number[]=[];
        for(let side=-1;side<=1;side+=2) {
          for(let k=0;k<=12;k++) {
            const t=side===-1?k/12:1-k/12;
            const r=radius*(0.09+0.9*t);
            const bend=Math.sin(t*Math.PI)*safeHalfAngle*0.16;
            const a=(blade-1)*safeHalfAngle*0.59+bend
              +side*Math.sin(Math.PI*t)*safeHalfAngle*(0.24-layer*0.07);
            points.push(Math.cos(a)*r,Math.sin(a)*r);
          }
        }
        const target=layer===0?this.activeMantle:layer===1?this.activeBody:this.activeCore;
        target.beginPath().poly(points).fill({
          color:layer===0?0x283d53:layer===1?0xcc789b:ACTIVE_HOT,
          alpha:layer===0?0.8:layer===1?0.7:0.75
        });
      }
    }
    // Physical origin: split induction jaws, never an unanchored triangle.
    for(let sign=-1;sign<=1;sign+=2) {
      this.activeEdges.beginPath().poly([-8,sign*7,7,sign*16,28,sign*12,34,sign*5,16,sign*8,4,sign*3]).fill({color:INK});
      this.activeEdges.beginPath().poly([0,sign*8,9,sign*13,26,sign*10,30,sign*6,15,sign*10]).fill({color:0x7293a3});
      this.activeEdges.beginPath().moveTo(8,sign*11).lineTo(23,sign*9).stroke({color:WARNING_HOT,width:1.2});
      this.telegraphCore.beginPath().moveTo(0,sign*8).lineTo(9,sign*13).lineTo(28,sign*9).stroke({color:WARNING_HOT,width:1.8,alpha:0.88});
    }
    this.activeCore.beginPath().poly([-8,0,0,-4,16,0,0,4]).fill({color:ACTIVE_HOT});
    drawArc(this.activeMantle,radius-3,-safeHalfAngle,safeHalfAngle,INK,9,0.8);
    drawArc(this.activeEdges,radius-3,-safeHalfAngle,safeHalfAngle,0xd88795,5,0.85);
    drawArc(this.activeCore,radius-5,-safeHalfAngle,safeHalfAngle,ACTIVE_HOT,1.5,0.9);
    drawRecovery(this.residue, radius, safeHalfAngle, RECOVERY);
    drawChevrons(this.directionForward, radius * 0.54, safeHalfAngle, this.chevronCount, 1, WARNING_HOT);
    drawChevrons(this.directionReverse, radius * 0.54, safeHalfAngle, this.chevronCount, -1, WARNING_HOT);
    // Keep a tiny central collar so the origin reads as a machine aperture,
    // not as a line accidentally connected to a previous path.
    drawRing(this.activeEdges, innerRadius, INK, 2.4, 0.82);
    void travelRadians;
  }

  private clearGeometry(): void {
    this.telegraph.clear();
    this.telegraphCore.clear();
    this.telegraphOrigin.clear();
    this.activeShell.clear();
    this.activeMantle.clear();
    this.activeBody.clear();
    this.activeCore.clear();
    this.activeEdges.clear();
    this.directionForward.clear();
    this.directionReverse.clear();
    this.residue.clear();
  }
}

const drawSector = (
  graphics: Graphics,
  outerRadius: number,
  innerRadius: number,
  halfAngle: number,
  color: number,
  alpha: number
): void => {
  const outer = Math.max(innerRadius + 1, outerRadius);
  const inner = Math.max(0, Math.min(innerRadius, outer - 1));
  graphics.beginPath()
    .moveTo(Math.cos(-halfAngle) * inner, Math.sin(-halfAngle) * inner)
    .lineTo(Math.cos(-halfAngle) * outer, Math.sin(-halfAngle) * outer)
    .arc(0, 0, outer, -halfAngle, halfAngle)
    .lineTo(Math.cos(halfAngle) * inner, Math.sin(halfAngle) * inner)
    .arc(0, 0, inner, halfAngle, -halfAngle, true)
    .closePath()
    .fill({ color, alpha });
};

const drawSegmentedSectorRail = (
  graphics: Graphics,
  radius: number,
  halfAngle: number,
  color: number,
  width: number,
  alpha: number
): void => {
  const innerRadius = 12;
  const segmentCount = 5;
  const radialSpan = Math.max(1, radius - innerRadius);
  for (const side of [-1, 1] as const) {
    for (let index = 0; index < segmentCount; index += 1) {
      const from = innerRadius + radialSpan * (index / segmentCount + 0.06);
      const to = innerRadius + radialSpan * ((index + 0.82) / segmentCount);
      const angle = side * halfAngle;
      drawLine(
        graphics,
        Math.cos(angle) * from,
        Math.sin(angle) * from,
        Math.cos(angle) * to,
        Math.sin(angle) * to,
        color,
        width,
        alpha
      );
    }
  }
  drawSegmentedArc(graphics, radius, -halfAngle, halfAngle, color, width, alpha, 6, 0.3);
};

const drawSegmentedArc = (
  graphics: Graphics,
  radius: number,
  start: number,
  end: number,
  color: number,
  width: number,
  alpha: number,
  segments: number,
  gap: number
): void => {
  const span = end - start;
  for (let index = 0; index < segments; index += 1) {
    const from = start + span * ((index + gap * 0.5) / segments);
    const to = start + span * ((index + 1 - gap * 0.5) / segments);
    drawArc(graphics, radius, from, to, color, width, alpha);
  }
};

const drawTelegraphOrigin = (
  base: Graphics,
  core: Graphics,
  origin: Graphics
): void => {
  drawRing(origin, 14, INK, 4.5, 0.94);
  drawRing(origin, 10.5, TELEGRAPH_METAL, 2, 0.9);
  drawRing(core, 10.5, WARNING, 1.5, 0.86);
  drawRing(origin, 5.5, INK, 2, 0.96);
  origin.beginPath().poly([0, -5, 5, 0, 0, 5, -5, 0]).fill({
    color: WARNING_HOT,
    alpha: 0.92
  });
  for (const side of [-1, 1] as const) {
    base.beginPath().poly([side * 7, side * 2, side * 14, side * 7, side * 18, side * 4, side * 11, side * 1]).fill({
      color: INK,
      alpha: 0.92
    });
    core.beginPath().moveTo(side * 9, side * 3).lineTo(side * 15, side * 6).stroke({
      color: WARNING_HOT,
      width: 1.2,
      alpha: 0.88
    });
  }
};

const drawTelegraphTerminals = (
  base: Graphics,
  core: Graphics,
  radius: number,
  halfAngle: number
): void => {
  for (const side of [-1, 1] as const) {
    const angle = side * halfAngle;
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const tangentX = -radialY;
    const tangentY = radialX;
    const x = radialX * radius;
    const y = radialY * radius;
    base.beginPath().poly([
      x + radialX * 4 + tangentX * 7, y + radialY * 4 + tangentY * 7,
      x - radialX * 3 + tangentX * 6, y - radialY * 3 + tangentY * 6,
      x - radialX * 5 - tangentX * 6, y - radialY * 5 - tangentY * 6,
      x + radialX * 3 - tangentX * 7, y + radialY * 3 - tangentY * 7
    ]).fill({ color: INK, alpha: 0.92 });
    core.beginPath().poly([
      x + radialX * 2 + tangentX * 4, y + radialY * 2 + tangentY * 4,
      x - radialX * 2 + tangentX * 3, y - radialY * 2 + tangentY * 3,
      x - radialX * 3 - tangentX * 3, y - radialY * 3 - tangentY * 3,
      x + radialX * 2 - tangentX * 4, y + radialY * 2 - tangentY * 4
    ]).fill({ color: WARNING_HOT, alpha: 0.84 });
  }
};

const drawSectorEdges = (
  graphics: Graphics,
  radius: number,
  innerRadius: number,
  halfAngle: number,
  color: number,
  width: number,
  alpha: number
): void => {
  drawLine(graphics, Math.cos(-halfAngle) * innerRadius, Math.sin(-halfAngle) * innerRadius,
    Math.cos(-halfAngle) * radius, Math.sin(-halfAngle) * radius, color, width, alpha);
  drawLine(graphics, Math.cos(halfAngle) * innerRadius, Math.sin(halfAngle) * innerRadius,
    Math.cos(halfAngle) * radius, Math.sin(halfAngle) * radius, color, width, alpha);
};

const drawSegmentedSectorEdges = (
  graphics: Graphics,
  radius: number,
  innerRadius: number,
  halfAngle: number,
  color: number,
  width: number,
  alpha: number
): void => {
  const segmentCount = 4;
  const span = Math.max(1, radius - innerRadius);
  for (const side of [-1, 1] as const) {
    const angle = side * halfAngle;
    for (let index = 0; index < segmentCount; index += 1) {
      const from = innerRadius + span * (index / segmentCount + 0.08);
      const to = innerRadius + span * ((index + 0.78) / segmentCount);
      drawLine(
        graphics,
        Math.cos(angle) * from,
        Math.sin(angle) * from,
        Math.cos(angle) * to,
        Math.sin(angle) * to,
        color,
        width,
        alpha
      );
    }
  }
};

const drawDashedArc = (
  graphics: Graphics,
  radius: number,
  start: number,
  end: number,
  color: number,
  width: number,
  segments: number,
  alpha: number
): void => {
  for (let index = 0; index < segments; index += 1) {
    const from = start + (end - start) * (index / segments);
    const to = start + (end - start) * ((index + 0.56) / segments);
    drawArc(graphics, radius, from, to, color, width, alpha);
  }
};

const drawRecovery = (graphics: Graphics, radius: number, halfAngle: number, color: number): void => {
  drawDashedArc(graphics, radius - 4, -halfAngle, halfAngle, color, 2, 6, 0.68);
  drawSegmentedSectorEdges(graphics, radius - 4, radius * 0.32, halfAngle, color, 1, 0.42);
};

const drawChevrons = (
  graphics: Graphics,
  radius: number,
  halfAngle: number,
  count: number,
  direction: 1 | -1,
  color: number
): void => {
  for (let index = 0; index < count; index += 1) {
    const across = count <= 1 ? 0 : index / (count - 1) - 0.5;
    const angle = across * halfAngle * 1.35;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const tangentX = -Math.sin(angle) * direction;
    const tangentY = Math.cos(angle) * direction;
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const tipX = x + tangentX * 7;
    const tipY = y + tangentY * 7;
    const backX = x - tangentX * 5;
    const backY = y - tangentY * 5;
    drawLine(graphics, backX - tangentX * 7, backY - tangentY * 7, backX, backY, color, 1.5, 0.62);
    graphics.beginPath().poly([
      tipX + radialX * 1.8, tipY + radialY * 1.8,
      backX + radialX * 4.3, backY + radialY * 4.3,
      backX - radialX * 4.3, backY - radialY * 4.3
    ]).fill({ color: INK, alpha: 0.92 });
    graphics.beginPath().poly([
      tipX + radialX * 0.5, tipY + radialY * 0.5,
      backX + radialX * 2.1, backY + radialY * 2.1,
      backX - radialX * 2.1, backY - radialY * 2.1
    ]).fill({ color, alpha: 0.9 });
  }
};

const drawArc = (graphics: Graphics, radius: number, start: number, end: number,
  color: number, width: number, alpha: number): void => {
  graphics.beginPath().arc(0, 0, Math.max(0.5, radius), start, end).stroke({ color, width, alpha });
};

const drawLine = (graphics: Graphics, x1: number, y1: number, x2: number, y2: number,
  color: number, width: number, alpha: number): void => {
  graphics.beginPath().moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width, alpha });
};

const drawRing = (graphics: Graphics, radius: number, color: number, width: number, alpha: number): void => {
  graphics.beginPath().circle(0, 0, Math.max(0.5, radius)).stroke({ color, width, alpha });
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
