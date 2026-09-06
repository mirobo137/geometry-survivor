import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';
import { getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../../simulation/ArenaBoundary';

interface BeamStyle {
  readonly color: number;
  readonly width: number;
  readonly alpha: number;
}

/** Renders the laser as a readable layered hazard, without changing gameplay. */
export class HazardView {
  public readonly root = new Container();
  private readonly beamEcho = new Graphics();
  private readonly laser = new Graphics();
  private readonly pulse = new Graphics();
  private readonly nodes = new Graphics();

  public constructor() {
    this.root.addChild(this.beamEcho, this.laser, this.pulse, this.nodes);
  }

  public renderLaser(state: Readonly<LaserHazardState>, arena: ArenaBoundaryInput): void {
    this.clearIfIdle(state.phase === 'idle');
    if (state.phase === 'idle') return;

    const directionX = Math.cos(state.angle);
    const directionY = Math.sin(state.angle);
    const arenaRadius = getArenaRadiusAtAngle(arena, state.angle) + 18;
    const startX = ARENA_CENTER.x - directionX * arenaRadius;
    const startY = ARENA_CENTER.y - directionY * arenaRadius;
    const endX = ARENA_CENTER.x + directionX * arenaRadius;
    const endY = ARENA_CENTER.y + directionY * arenaRadius;
    const isTelegraph = state.phase === 'telegraph';
    const isActive = state.phase === 'active';

    this.beamEcho.clear();
    this.laser.clear();
    this.pulse.clear();
    this.nodes.clear();
    this.beamEcho.visible = isActive && state.sweeping;
    this.laser.visible = true;
    this.pulse.visible = true;
    this.nodes.visible = true;

    if (isTelegraph) {
      this.drawTelegraph(startX, startY, endX, endY, state.progress);
      return;
    }

    this.drawActiveBeam(state, arena, arenaRadius, startX, startY, endX, endY);
    this.drawDetonationPulse(state, startX, startY, endX, endY);
  }

  public reset(): void {
    this.beamEcho.clear();
    this.laser.clear();
    this.pulse.clear();
    this.nodes.clear();
    this.beamEcho.visible = false;
    this.laser.visible = false;
    this.pulse.visible = false;
    this.nodes.visible = false;
  }

  private clearIfIdle(isIdle: boolean): void {
    if (!isIdle || (!this.beamEcho.visible && !this.laser.visible && !this.pulse.visible && !this.nodes.visible)) return;
    this.reset();
  }

  private drawTelegraph(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    progress: number
  ): void {
    const warning = 0.24 + progress * 0.36;
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0x6d4762,
      width: 11,
      alpha: warning * 0.42
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xffd166,
      width: 3,
      alpha: warning
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xf8c978,
      width: 1,
      alpha: 0.55 + progress * 0.35
    });

    const charge = 0.35 + progress * 0.65;
    this.drawCircle(this.pulse, ARENA_CENTER.x, ARENA_CENTER.y, 9 + progress * 13, {
      color: 0xfff1a8,
      width: 2,
      alpha: 0.24 + progress * 0.42
    });
    this.drawCircle(this.pulse, ARENA_CENTER.x, ARENA_CENTER.y, 4 + progress * 4, {
      color: 0xfffff2,
      width: 1,
      alpha: charge * 0.72
    });
    this.drawEndpointNode(this.nodes, startX, startY, 5 + progress * 3, 0xffd166, warning * 0.9);
    this.drawEndpointNode(this.nodes, endX, endY, 5 + progress * 3, 0xffd166, warning * 0.9);
    this.drawDiamond(this.nodes, ARENA_CENTER.x, ARENA_CENTER.y, 4 + progress * 2, 0xffffdc, charge * 0.8);
  }

  private drawActiveBeam(
    state: Readonly<LaserHazardState>,
    arena: ArenaBoundaryInput,
    arenaRadius: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    if (state.sweeping) {
      const echoStrength = Math.min(1, state.sweepProgress * 1.5);
      this.drawBeamAtAngle(this.beamEcho, state.angle - 0.22 * echoStrength, arena, arenaRadius, {
        color: 0xff8b63,
        width: state.width + 12,
        alpha: 0.08 * echoStrength
      });
      this.drawBeamAtAngle(this.beamEcho, state.angle - 0.1 * echoStrength, arena, arenaRadius, {
        color: 0xffd166,
        width: state.width + 7,
        alpha: 0.16 * echoStrength
      });
    }

    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0x4b294c,
      width: state.width + 28,
      alpha: 0.16
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xff5f6d,
      width: state.width + 12,
      alpha: 0.28
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xffb86b,
      width: state.width + 3,
      alpha: 0.76
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xf7c978,
      width: 6,
      alpha: 0.98
    });
    this.drawBeam(this.laser, startX, startY, endX, endY, {
      color: 0xfffff5,
      width: 2,
      alpha: 0.98
    });

    const nodeAlpha = 0.7 + Math.sin(state.progress * Math.PI) * 0.3;
    this.drawEndpointNode(this.nodes, startX, startY, 9 + nodeAlpha * 3, 0xfff1a8, nodeAlpha);
    this.drawEndpointNode(this.nodes, endX, endY, 9 + nodeAlpha * 3, 0xfff1a8, nodeAlpha);
    this.drawDiamond(this.nodes, ARENA_CENTER.x, ARENA_CENTER.y, 6 + nodeAlpha * 2, 0xffffdc, nodeAlpha);
  }

  private drawDetonationPulse(
    state: Readonly<LaserHazardState>,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    const pulse = 0.5 + Math.sin(state.progress * Math.PI) * 0.5;
    this.drawCircle(this.pulse, ARENA_CENTER.x, ARENA_CENTER.y, 11 + pulse * 13, {
      color: 0xffffdc,
      width: 2 + pulse * 2,
      alpha: pulse * 0.58
    });
    this.drawCircle(this.pulse, ARENA_CENTER.x, ARENA_CENTER.y, 4 + pulse * 3, {
      color: 0xffffff,
      width: 1,
      alpha: 0.8
    });
    this.drawCircle(this.pulse, startX, startY, 4 + pulse * 3, {
      color: 0xffffdc,
      width: 2,
      alpha: pulse * 0.7
    });
    this.drawCircle(this.pulse, endX, endY, 4 + pulse * 3, {
      color: 0xffffdc,
      width: 2,
      alpha: pulse * 0.7
    });
  }

  private drawBeamAtAngle(
    graphics: Graphics,
    angle: number,
    arena: ArenaBoundaryInput,
    fallbackRadius: number,
    style: BeamStyle
  ): void {
    const boundaryRadius = getArenaRadiusAtAngle(arena, angle) + 18;
    const radius = Number.isFinite(boundaryRadius) && boundaryRadius > 0 ? boundaryRadius : fallbackRadius;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    this.drawBeam(
      graphics,
      ARENA_CENTER.x - directionX * radius,
      ARENA_CENTER.y - directionY * radius,
      ARENA_CENTER.x + directionX * radius,
      ARENA_CENTER.y + directionY * radius,
      style
    );
  }

  private drawBeam(
    graphics: Graphics,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    style: BeamStyle
  ): void {
    graphics
      .beginPath()
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke(style);
  }

  private drawCircle(
    graphics: Graphics,
    x: number,
    y: number,
    radius: number,
    style: { readonly color: number; readonly width: number; readonly alpha: number }
  ): void {
    graphics
      .beginPath()
      .circle(x, y, radius)
      .stroke(style);
  }

  private drawEndpointNode(
    graphics: Graphics,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ): void {
    this.drawCircle(graphics, x, y, size, { color, width: 2, alpha: alpha * 0.7 });
    this.drawDiamond(graphics, x, y, size * 0.56, color, alpha);
  }

  private drawDiamond(graphics: Graphics, x: number, y: number, size: number, color: number, alpha: number): void {
    graphics
      .beginPath()
      .moveTo(x, y - size)
      .lineTo(x + size, y)
      .lineTo(x, y + size)
      .lineTo(x - size, y)
      .lineTo(x, y - size)
      .fill({ color, alpha });
  }
}
