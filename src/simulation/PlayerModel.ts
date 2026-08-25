import { ARENA_CENTER, ARENA_RADIUS, PLAYER_RADIUS, PLAYER_SPEED } from '../config/constants';
import type { InputVector } from '../input/InputManager';

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
}

export class PlayerModel {
  public readonly state: PlayerState = {
    x: ARENA_CENTER.x,
    y: ARENA_CENTER.y,
    radius: PLAYER_RADIUS
  };

  public update(input: InputVector, dtSeconds: number): void {
    this.state.x += input.x * PLAYER_SPEED * dtSeconds;
    this.state.y += input.y * PLAYER_SPEED * dtSeconds;

    const maxDistance = ARENA_RADIUS - this.state.radius;
    const dx = this.state.x - ARENA_CENTER.x;
    const dy = this.state.y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      const factor = maxDistance / distance;
      this.state.x = ARENA_CENTER.x + dx * factor;
      this.state.y = ARENA_CENTER.y + dy * factor;
    }
  }
}
