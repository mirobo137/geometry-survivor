import {
  ARENA_CENTER,
  ARENA_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_HEALTH_RECOVERY_INTERVAL_SECONDS,
  PLAYER_RADIUS,
  PLAYER_PHASE_SHIFT_COOLDOWN_SECONDS,
  PLAYER_PHASE_SHIFT_DISTANCE,
  PLAYER_SHIELD_RECHARGE_SECONDS,
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

export type PlayerDamageOutcome = 'ignored' | 'damaged' | 'shielded' | 'evaded';

export interface PlayerDamageResolution {
  readonly outcome: PlayerDamageOutcome;
  readonly incomingAmount: number;
  readonly appliedAmount: number;
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
  private lastMovementX = 0;
  private lastMovementY = 0;
  private shieldEnabled = false;
  private shieldCharges = 0;
  private shieldRechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS;
  private shieldRechargeTimer = 0;
  private phaseShiftEnabled = false;
  private phaseShiftReady = false;
  private phaseShiftCooldownSeconds = PLAYER_PHASE_SHIFT_COOLDOWN_SECONDS;
  private phaseShiftDistance = PLAYER_PHASE_SHIFT_DISTANCE;
  private phaseShiftTimer = 0;

  public update(input: MovementVector, dtSeconds: number, arenaRadius = ARENA_RADIUS): void {
    const dt = Math.max(0, dtSeconds);
    this.invulnerabilitySeconds = Math.max(0, this.invulnerabilitySeconds - dt);
    this.vampirismCooldownSeconds = Math.max(0, this.vampirismCooldownSeconds - dt);
    this.updateShieldRecharge(dt);
    this.updatePhaseShift(dt);
    this.updateHealthRecovery(dt);
    this.lastMovementX = input.x;
    this.lastMovementY = input.y;
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
    return this.resolveDamage(amount).outcome === 'damaged';
  }

  /** Resolves a damage packet in a deterministic defensive priority order. */
  public resolveDamage(amount: number, arenaRadius = ARENA_RADIUS): PlayerDamageResolution {
    if (amount <= 0 || this.invulnerabilitySeconds > 0 || this.state.health <= 0) {
      return { outcome: 'ignored', incomingAmount: amount, appliedAmount: 0 };
    }
    if (this.phaseShiftEnabled && this.phaseShiftReady) {
      this.phaseShiftReady = false;
      this.phaseShiftTimer = 0;
      this.teleportToPhaseSafePoint(arenaRadius);
      this.invulnerabilitySeconds = 0.45;
      return { outcome: 'evaded', incomingAmount: amount, appliedAmount: 0 };
    }
    if (this.shieldEnabled && this.shieldCharges > 0) {
      this.shieldCharges = 0;
      this.shieldRechargeTimer = 0;
      this.invulnerabilitySeconds = 0.45;
      return { outcome: 'shielded', incomingAmount: amount, appliedAmount: 0 };
    }
    const mitigatedAmount = Math.max(0, amount - this.state.armor);
    this.state.health = Math.max(0, this.state.health - mitigatedAmount);
    this.invulnerabilitySeconds = 0.45;
    return { outcome: 'damaged', incomingAmount: amount, appliedAmount: mitigatedAmount };
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

  public enableShield(rechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS): void {
    this.shieldEnabled = true;
    this.shieldCharges = 1;
    this.shieldRechargeSeconds = Math.max(0.1, rechargeSeconds);
    this.shieldRechargeTimer = 0;
  }

  public enablePhaseShift(
    cooldownSeconds = PLAYER_PHASE_SHIFT_COOLDOWN_SECONDS,
    distance = PLAYER_PHASE_SHIFT_DISTANCE
  ): void {
    this.phaseShiftEnabled = true;
    this.phaseShiftReady = true;
    this.phaseShiftCooldownSeconds = Math.max(0.1, cooldownSeconds);
    this.phaseShiftTimer = 0;
    this.phaseShiftDistance = Math.max(0, distance);
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

  public get hasShield(): boolean {
    return this.shieldEnabled;
  }

  public get shieldAvailable(): boolean {
    return this.shieldEnabled && this.shieldCharges > 0;
  }

  public get currentShieldRechargeSeconds(): number {
    return this.shieldRechargeSeconds;
  }

  public get hasPhaseShift(): boolean {
    return this.phaseShiftEnabled;
  }

  public get phaseShiftAvailable(): boolean {
    return this.phaseShiftEnabled && this.phaseShiftReady;
  }

  public get currentPhaseShiftCooldownSeconds(): number {
    return this.phaseShiftCooldownSeconds;
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
    this.lastMovementX = 0;
    this.lastMovementY = 0;
    this.shieldEnabled = false;
    this.shieldCharges = 0;
    this.shieldRechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS;
    this.shieldRechargeTimer = 0;
    this.phaseShiftEnabled = false;
    this.phaseShiftReady = false;
    this.phaseShiftCooldownSeconds = PLAYER_PHASE_SHIFT_COOLDOWN_SECONDS;
    this.phaseShiftDistance = PLAYER_PHASE_SHIFT_DISTANCE;
    this.phaseShiftTimer = 0;
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

  private updateShieldRecharge(dtSeconds: number): void {
    if (!this.shieldEnabled || this.shieldCharges > 0 || !this.isAlive || dtSeconds <= 0) return;
    this.shieldRechargeTimer += dtSeconds;
    if (this.shieldRechargeTimer >= this.shieldRechargeSeconds) {
      this.shieldCharges = 1;
      this.shieldRechargeTimer = 0;
    }
  }

  private updatePhaseShift(dtSeconds: number): void {
    if (!this.phaseShiftEnabled || this.phaseShiftReady || !this.isAlive || dtSeconds <= 0) return;
    this.phaseShiftTimer += dtSeconds;
    if (this.phaseShiftTimer >= this.phaseShiftCooldownSeconds) {
      this.phaseShiftReady = true;
      this.phaseShiftTimer = 0;
    }
  }

  private teleportToPhaseSafePoint(arenaRadius: number): void {
    let directionX = this.lastMovementX;
    let directionY = this.lastMovementY;
    const inputLength = Math.hypot(directionX, directionY);
    if (inputLength <= 0.001) {
      const radialX = this.state.x - ARENA_CENTER.x;
      const radialY = this.state.y - ARENA_CENTER.y;
      const radialLength = Math.hypot(radialX, radialY);
      if (radialLength > 0.001) {
        directionX = -radialY / radialLength;
        directionY = radialX / radialLength;
      } else {
        directionX = 1;
        directionY = 0;
      }
    } else {
      directionX /= inputLength;
      directionY /= inputLength;
    }
    this.state.x += directionX * this.phaseShiftDistance;
    this.state.y += directionY * this.phaseShiftDistance;
    this.clampToArena(arenaRadius);
  }

  private clampToArena(arenaRadius: number): void {
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
}
