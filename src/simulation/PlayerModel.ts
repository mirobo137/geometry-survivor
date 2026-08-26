import {
  ARENA_CENTER,
  ARENA_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  PLAYER_SPEED
} from '../config/constants';
import type { InputVector } from '../input/InputManager';

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
}

export class PlayerModel {
  public readonly state: PlayerState = {
    x: ARENA_CENTER.x,
    y: ARENA_CENTER.y,
    radius: PLAYER_RADIUS,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH
  };
  private invulnerabilitySeconds = 0;

  public update(input: InputVector, dtSeconds: number, arenaRadius = ARENA_RADIUS): void {
    this.invulnerabilitySeconds = Math.max(0, this.invulnerabilitySeconds - Math.max(0, dtSeconds));
    this.state.x += input.x * PLAYER_SPEED * dtSeconds;
    this.state.y += input.y * PLAYER_SPEED * dtSeconds;

    const maxDistance = Math.max(0, arenaRadius - this.state.radius);
    const dx = this.state.x - ARENA_CENTER.x;
    const dy = this.state.y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      const factor = maxDistance / distance;
      this.state.x = ARENA_CENTER.x + dx * factor;
      this.state.y = ARENA_CENTER.y + dy * factor;
    }
  }

  public takeDamage(amount: number): boolean {
    if (amount <= 0 || this.invulnerabilitySeconds > 0 || this.state.health <= 0) return false;
    this.state.health = Math.max(0, this.state.health - amount);
    this.invulnerabilitySeconds = 0.45;
    return true;
  }

  public get isAlive(): boolean {
    return this.state.health > 0;
  }
}
