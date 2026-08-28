import { Container, Graphics } from 'pixi.js';
import { ARENA_CENTER } from '../../config/constants';
import type { LaserHazardState } from '../../simulation/hazards/LaserHazard';

export class HazardView {
  public readonly root = new Container();
  private readonly laser = new Graphics();

  public constructor() {
    this.root.addChild(this.laser);
  }

  public renderLaser(state: Readonly<LaserHazardState>, arenaRadius: number): void {
    if (state.phase === 'idle') {
      if (this.laser.visible) {
        this.laser.clear();
        this.laser.visible = false;
      }
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
    if (state.phase === 'telegraph') {
      const alpha = 0.24 + state.progress * 0.36;
      this.laser
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ color: 0xffd166, width: 4, alpha });
      return;
    }

    const alpha = state.phase === 'active' ? 0.95 : 0.28;
    this.laser
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({ color: 0xff5f6d, width: state.phase === 'active' ? state.width : 10, alpha: alpha * 0.24 });
    this.laser
      .moveTo(startX, startY)
      .lineTo(endX, endY)
      .stroke({ color: state.phase === 'active' ? 0xfff1a8 : 0xff9d75, width: state.phase === 'active' ? 6 : 4, alpha });
  }
}
