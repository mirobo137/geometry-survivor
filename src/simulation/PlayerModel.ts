import {
  ARENA_CENTER,
  ARENA_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_HEALTH_RECOVERY_INTERVAL_SECONDS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_VAMPIRISM_COOLDOWN_SECONDS
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
  private healthRecoveryPercent = 0;
  private healthRecoveryTimer = 0;
  private vampirismPercent = 0;
  private vampirismCooldownSeconds = 0;

  public update(input: MovementVector, dtSeconds: number, arenaRadius = ARENA_RADIUS): void {
    const dt = Math.max(0, dtSeconds);
    this.invulnerabilitySeconds = Math.max(0, this.invulnerabilitySeconds - dt);
    this.vampirismCooldownSeconds = Math.max(0, this.vampirismCooldownSeconds - dt);
    this.updateHealthRecovery(dt);
    this.state.x += input.x * this.movementSpeed * dt;
    this.state.y += input.y * this.movementSpeed * dt;

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

  /** Heals the player without exceeding max health and returns the actual amount restored. */
  public heal(amount: number): number {
    if (amount <= 0 || !this.isAlive) return 0;
    const previousHealth = this.state.health;
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
    return this.state.health - previousHealth;
  }

  public increaseHealthRecovery(amount: number): void {
    this.healthRecoveryPercent = Math.max(0, this.healthRecoveryPercent + amount);
  }

  public increaseVampirism(amount: number): void {
    this.vampirismPercent = Math.max(0, this.vampirismPercent + amount);
  }

  /** Applies one kill-triggered heal, throttled to prevent dense waves from snowballing. */
  public applyVampirism(): number {
    if (this.vampirismPercent <= 0 || this.vampirismCooldownSeconds > 0) return 0;
    const healed = this.heal(this.state.maxHealth * this.vampirismPercent);
    if (healed > 0) this.vampirismCooldownSeconds = PLAYER_VAMPIRISM_COOLDOWN_SECONDS;
    return healed;
  }

  public get isAlive(): boolean {
    return this.state.health > 0;
  }

  public get currentMovementSpeed(): number {
    return this.movementSpeed;
  }

  public get currentHealthRecovery(): number {
    return this.healthRecoveryPercent;
  }

  public get currentVampirism(): number {
    return this.vampirismPercent;
  }

  public reset(): void {
    this.state.x = ARENA_CENTER.x;
    this.state.y = ARENA_CENTER.y;
    this.state.health = PLAYER_MAX_HEALTH;
    this.state.maxHealth = PLAYER_MAX_HEALTH;
    this.state.armor = 0;
    this.movementSpeed = PLAYER_SPEED;
    this.invulnerabilitySeconds = 0;
    this.healthRecoveryPercent = 0;
    this.healthRecoveryTimer = 0;
    this.vampirismPercent = 0;
    this.vampirismCooldownSeconds = 0;
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

  private updateHealthRecovery(dtSeconds: number): void {
    if (this.healthRecoveryPercent <= 0 || !this.isAlive || dtSeconds <= 0) return;
    this.healthRecoveryTimer += dtSeconds;
    while (this.healthRecoveryTimer >= PLAYER_HEALTH_RECOVERY_INTERVAL_SECONDS) {
      this.healthRecoveryTimer -= PLAYER_HEALTH_RECOVERY_INTERVAL_SECONDS;
      this.heal(this.state.maxHealth * this.healthRecoveryPercent);
    }
  }
}
