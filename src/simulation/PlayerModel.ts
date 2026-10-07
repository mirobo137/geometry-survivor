import {
  ARENA_CENTER,
  ARENA_RADIUS,
  PLAYER_MAX_HEALTH,
  PLAYER_HEALTH_RECOVERY_INTERVAL_SECONDS,
  PLAYER_RADIUS,
  PLAYER_SHIELD_RECHARGE_SECONDS,
  PLAYER_SPEED,
  PLAYER_VAMPIRISM_COOLDOWN_SECONDS,
  PLAYER_VAMPIRISM_MAX_PERCENT
} from '../config/constants';
import { clampPointToArena, type ArenaBoundaryInput } from './ArenaBoundary';
import type { MovementVector } from './MovementVector';
import type { LaboratoryCombatBonuses } from '../content/meta/LaboratoryDefinitions';

export interface PlayerState {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  armor: number;
}

export type PlayerDamageOutcome = 'ignored' | 'damaged' | 'shielded';

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
  private permanentMovementSpeedMultiplier = 1;
  private permanentMaxHealthMultiplier = 1;
  private incomingDamageMultiplier = 1;
  private runMovementBonus = 0;
  private runMaxHealthBonus = 0;
  private healthRecoveryPercent = 0;
  private healthRecoveryTimer = 0;
  private vampirismPercent = 0;
  private vampirismCooldownSeconds = 0;
  private shieldEnabled = false;
  private shieldCharges = 0;
  private shieldRechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS;
  private shieldRechargeTimer = 0;

  public update(input: MovementVector, dtSeconds: number, arena: ArenaBoundaryInput = ARENA_RADIUS): void {
    const dt = Math.max(0, dtSeconds);
    this.invulnerabilitySeconds = Math.max(0, this.invulnerabilitySeconds - dt);
    this.vampirismCooldownSeconds = Math.max(0, this.vampirismCooldownSeconds - dt);
    this.updateShieldRecharge(dt);
    this.updateHealthRecovery(dt);
    this.state.x += input.x * this.movementSpeed * dt;
    this.state.y += input.y * this.movementSpeed * dt;

    const clamped = clampPointToArena(this.state.x, this.state.y, this.state.radius, arena);
    this.state.x = clamped.x;
    this.state.y = clamped.y;
  }

  /** Applies a bounded hazard displacement while preserving the arena clamp. */
  public applyHazardPush(dx: number, dy: number, arena: ArenaBoundaryInput = ARENA_RADIUS): void {
    applyHazardPush(this.state, dx, dy, arena);
  }

  public takeDamage(amount: number): boolean {
    return this.resolveDamage(amount).outcome === 'damaged';
  }

  /** Resolves a damage packet in a deterministic defensive priority order. */
  public resolveDamage(amount: number): PlayerDamageResolution {
    if (amount <= 0 || this.invulnerabilitySeconds > 0 || this.state.health <= 0) {
      return { outcome: 'ignored', incomingAmount: amount, appliedAmount: 0 };
    }
    if (this.shieldEnabled && this.shieldCharges > 0) {
      this.shieldCharges = 0;
      this.shieldRechargeTimer = 0;
      this.invulnerabilitySeconds = 0.45;
      return { outcome: 'shielded', incomingAmount: amount, appliedAmount: 0 };
    }
    const mitigatedAmount = Math.max(0, amount - this.state.armor) * this.incomingDamageMultiplier;
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

  /** Restores a defeated player without resetting the current run build. */
  public revive(healthPercent = 0.35, invulnerabilitySeconds = 2): boolean {
    if (this.isAlive) return false;
    const ratio = Math.min(1, Math.max(0, healthPercent));
    if (ratio <= 0) return false;
    this.state.health = Math.max(1, this.state.maxHealth * ratio);
    this.invulnerabilitySeconds = Math.max(0, invulnerabilitySeconds);
    this.healthRecoveryTimer = 0;
    this.vampirismCooldownSeconds = 0;
    return true;
  }

  public increaseHealthRecovery(amount: number): void {
    this.healthRecoveryPercent = Math.max(0, this.healthRecoveryPercent + amount);
  }

  public increaseVampirism(amount: number): void {
    this.vampirismPercent = Math.min(PLAYER_VAMPIRISM_MAX_PERCENT, Math.max(0, this.vampirismPercent + amount));
  }

  public enableShield(rechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS): void {
    this.shieldEnabled = true;
    this.shieldCharges = 1;
    this.shieldRechargeSeconds = Math.max(0.1, rechargeSeconds);
    this.shieldRechargeTimer = 0;
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

  /** 0..1 radial recharge amount used only by the presentation layer. */
  public get shieldChargeProgress(): number {
    if (!this.shieldEnabled) return 0;
    if (this.shieldCharges > 0) return 1;
    return Math.min(1, Math.max(0, this.shieldRechargeTimer / this.shieldRechargeSeconds));
  }

  public reset(): void {
    this.state.x = ARENA_CENTER.x;
    this.state.y = ARENA_CENTER.y;
    this.runMovementBonus = 0;
    this.runMaxHealthBonus = 0;
    this.state.maxHealth = PLAYER_MAX_HEALTH * this.permanentMaxHealthMultiplier;
    this.state.health = this.state.maxHealth;
    this.state.armor = 0;
    this.updateMovementSpeed();
    this.invulnerabilitySeconds = 0;
    this.healthRecoveryPercent = 0;
    this.healthRecoveryTimer = 0;
    this.vampirismPercent = 0;
    this.vampirismCooldownSeconds = 0;
    this.shieldEnabled = false;
    this.shieldCharges = 0;
    this.shieldRechargeSeconds = PLAYER_SHIELD_RECHARGE_SECONDS;
    this.shieldRechargeTimer = 0;
  }

  public increaseMovementSpeed(amount: number): void {
    this.runMovementBonus += Math.max(0, amount);
    this.updateMovementSpeed();
  }

  public increaseMaxHealth(amount: number): void {
    const increase = Math.max(0, amount);
    const previousMax = this.state.maxHealth;
    this.runMaxHealthBonus += increase;
    this.updateMaxHealth(this.state.health >= previousMax);
    this.state.health = Math.min(this.state.maxHealth, this.state.health + this.state.maxHealth - previousMax);
  }

  /** Applies menu-owned permanent modifiers; reset() reapplies them at run start. */
  public setPermanentBonuses(bonuses: Pick<
    LaboratoryCombatBonuses,
    'movementSpeedMultiplier' | 'maxHealthMultiplier' | 'incomingDamageMultiplier'
  >): void {
    const previousMax = this.state.maxHealth;
    const wasFull = this.state.health >= previousMax;
    this.permanentMovementSpeedMultiplier = Math.min(1.2, Math.max(1, Number.isFinite(bonuses.movementSpeedMultiplier)
      ? bonuses.movementSpeedMultiplier : 1));
    this.permanentMaxHealthMultiplier = Math.min(1.248, Math.max(1, Number.isFinite(bonuses.maxHealthMultiplier)
      ? bonuses.maxHealthMultiplier : 1));
    this.incomingDamageMultiplier = Math.min(1, Math.max(0.9,
      Number.isFinite(bonuses.incomingDamageMultiplier) ? bonuses.incomingDamageMultiplier : 1));
    this.updateMovementSpeed();
    this.updateMaxHealth(wasFull);
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

  private updateMovementSpeed(): void {
    this.movementSpeed = (PLAYER_SPEED + this.runMovementBonus) * this.permanentMovementSpeedMultiplier;
  }

  private updateMaxHealth(restoreIfFull: boolean): void {
    const previousMax = this.state.maxHealth;
    this.state.maxHealth = (PLAYER_MAX_HEALTH + this.runMaxHealthBonus) * this.permanentMaxHealthMultiplier;
    this.state.health = restoreIfFull
      ? this.state.maxHealth
      : Math.min(this.state.health, this.state.maxHealth);
    // Avoid a negative or non-finite state if malformed data reaches this layer.
    if (!Number.isFinite(this.state.maxHealth) || this.state.maxHealth < PLAYER_MAX_HEALTH) {
      this.state.maxHealth = previousMax || PLAYER_MAX_HEALTH;
      this.state.health = Math.min(this.state.health, this.state.maxHealth);
    }
  }

}

/** State-level counterpart used by combat systems that intentionally receive a snapshot. */
export const applyHazardPush = (
  state: PlayerState,
  dx: number,
  dy: number,
  arena: ArenaBoundaryInput = ARENA_RADIUS
): void => {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
  state.x += dx;
  state.y += dy;
  const clamped = clampPointToArena(state.x, state.y, state.radius, arena);
  state.x = clamped.x;
  state.y = clamped.y;
};
