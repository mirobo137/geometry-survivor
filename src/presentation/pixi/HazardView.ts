import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';

export class HazardView {
  public readonly root = new Container();
  private readonly laser = new Graphics();
  private readonly pulse = new Graphics();

  public constructor() {
    this.root.addChild(this.laser, this.pulse);
  }

  public renderLaser(state: Readonly<LaserHazardState>, arenaRadius: number): void {
    if (state.phase === 'idle') {
      if (this.laser.visible) {
        this.laser.clear();
        this.laser.visible = false;
      }
      this.pulse.clear();
      this.pulse.visible = false;
      return;
    }

    const directionX = Math.cos(state.angle);
    const directionY = Math.sin(state.angle);
    const startX = ARENA_CENTER.x - directionX * (arenaRadius + 18);
    const startY = ARENA_CENTER.y - directionY * (arenaRadius + 18);
    const endX = ARENA_CENTER.x + directionX * (arenaRadius + 18);
    const endY = ARENA_CENTER.y + directionY * (arenaRadius + 18);
    this.laser.visible = true;
    this.laser.clear();
    this.pulse.visible = true;
    this.pulse.clear();
    if (state.phase === 'telegraph') {
      const alpha = 0.24 + state.progress * 0.36;
      this.laser
        .beginPath()
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ color: 0xffd166, width: 4, alpha });
      this.pulse
        .beginPath()
        .circle(ARENA_CENTER.x, ARENA_CENTER.y, 8 + state.progress * 12)
        .stroke({ color: 0xfff1a8, width: 2, alpha: 0.25 + state.progress * 0.4 });
      this.pulse
        .beginPath()
        .circle(startX, startY, 4 + state.progress * 3)
        .fill({ color: 0xffd166, alpha: alpha * 0.7 });
      this.pulse
        .beginPath()
        .circle(endX, endY, 4 + state.progress * 3)
        .fill({ color: 0xffd166, alpha: alpha * 0.7 });
      return;
    }

    const alpha = state.phase === 'active' ? 0.95 : 0.28;
    this.laser
      .beginPath()
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({ color: 0xff5f6d, width: state.phase === 'active' ? state.width : 10, alpha: alpha * 0.24 });
    this.laser
      .beginPath()
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({ color: state.phase === 'active' ? 0xfff1a8 : 0xff9d75, width: state.phase === 'active' ? 6 : 4, alpha });
    const pulse = state.phase === 'active'
      ? 0.5 + Math.sin(state.progress * Math.PI) * 0.5
      : 1 - state.progress;
    this.pulse
      .beginPath()
      .circle(ARENA_CENTER.x, ARENA_CENTER.y, 10 + pulse * 10)
      .stroke({ color: state.phase === 'active' ? 0xffffdc : 0xffb86b, width: 2 + pulse * 2, alpha: pulse * 0.6 });
  }

  public reset(): void {
    this.laser.clear();
    this.pulse.clear();
    this.laser.visible = false;
    this.pulse.visible = false;
  }
}
