import {
  ARENA_CENTER,
  ARENA_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  PLAYER_SPEED
} from '../config/constants';
import type { MovementVector } from './MovementVector';

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  armor: number;
}

export class PlayerModel {
  public readonly state: PlayerState = {
    x: ARENA_CENTER.x,
    y: ARENA_CENTER.y,
    radius: PLAYER_RADIUS,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    armor: 0
  };
  private invulnerabilitySeconds = 0;
  private movementSpeed = PLAYER_SPEED;

  public update(input: MovementVector, dtSeconds: number, arenaRadius = ARENA_RADIUS): void {
    this.invulnerabilitySeconds = Math.max(0, this.invulnerabilitySeconds - Math.max(0, dtSeconds));
    this.state.x += input.x * this.movementSpeed * dtSeconds;
    this.state.y += input.y * this.movementSpeed * dtSeconds;

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
    const mitigatedAmount = Math.max(0, amount - this.state.armor);
    this.state.health = Math.max(0, this.state.health - mitigatedAmount);
    this.invulnerabilitySeconds = 0.45;
    return true;
  }

  public get isAlive(): boolean {
    return this.state.health > 0;
  }

  public increaseMovementSpeed(amount: number): void {
    this.movementSpeed = Math.max(PLAYER_SPEED, this.movementSpeed + Math.max(0, amount));
  }

  public increaseMaxHealth(amount: number): void {
    const increase = Math.max(0, amount);
    this.state.maxHealth += increase;
    this.state.health = Math.min(this.state.maxHealth, this.state.health + increase);
  }

  public increaseArmor(amount: number): void {
    this.state.armor += Math.max(0, amount);
  }
}
