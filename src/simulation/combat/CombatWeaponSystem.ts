import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { BOOMERANG_POOL_CAPACITY, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { BoomerangPool, ProjectilePool, type EnemyState } from './EntityPools';
import type {
  BoomerangRenderState,
  ChainExplosionState,
  ChainSegmentState,
  OrbitBladeState,
  OrbitPulseState,
  ShotRenderState
} from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { StressCombatScenario } from './StressCombatScenario';
import type { PermanentCombatBonuses } from '../../content/meta/PermanentUpgradeDefinitions';
import type { ArenaBoundaryInput } from '../ArenaBoundary';
import { WeaponScheduler } from './WeaponScheduler';
import { ProjectileBehavior } from './ProjectileBehavior';
import { OrbitBehavior } from './OrbitBehavior';
import { ChainBehavior } from './ChainBehavior';
import { BoomerangBehavior } from './BoomerangBehavior';
import { PulseRingWeaponBehavior } from './PulseRingWeaponBehavior';
import { MagneticChargeBehavior } from './MagneticChargeBehavior';
import type {
  BoomerangEvolution,
  ChainEvolution,
  MagneticChargeEvolution,
  OrbitEvolution,
  ProjectileEvolution,
  PulseRingEvolution
} from '../../content/weapons/WeaponEvolutionDefinitions';

const CRITICAL_MULTIPLIER = 2;
const CRITICAL_RANDOM_SEED = 0x6d2b79f5;
const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;
const BOOMERANG_DEFINITION = WEAPON_DEFINITIONS.vectorBoomerang;
const PULSE_RING_DEFINITION = WEAPON_DEFINITIONS.pulseRing;
const MAGNETIC_CHARGE_DEFINITION = WEAPON_DEFINITIONS.magneticCharge;

export interface CombatWeaponUpdateOptions {
  readonly projectileEnabled?: boolean;
  readonly orbitEnabled?: boolean;
  readonly chainEnabled?: boolean;
  readonly boomerangEnabled?: boolean;
  readonly pulseRingEnabled?: boolean;
  readonly magneticChargeEnabled?: boolean;
  readonly magneticChargeArena?: ArenaBoundaryInput;
  readonly arena?: ArenaBoundaryInput;
  /** Development-only cadence override for the isolated Pulse Ring drill. */
  readonly pulseRingCooldownSeconds?: number;
  /** Development-only cadence override for the isolated Magnetic Charge drill. */
  readonly magneticChargeCooldownSeconds?: number;
}

/** Runs authored weapon behavior against the enemy query surface. */
export class CombatWeaponSystem {
  public readonly projectiles = new ProjectilePool(PROJECTILE_POOL_CAPACITY);
  public readonly boomerangs = new BoomerangPool(BOOMERANG_POOL_CAPACITY);
  public readonly orbitBlades: readonly OrbitBladeState[];
  public readonly orbitPulse: OrbitPulseState;
  public readonly chainSegments: readonly ChainSegmentState[];
  public readonly chainExplosions: readonly ChainExplosionState[];
  public readonly boomerangStates: readonly BoomerangRenderState[];
  public readonly boomerangPulse: BoomerangBehavior['pulseState'];
  public readonly pulseRingWeapon: PulseRingWeaponBehavior['state'];
  public readonly magneticCharge: MagneticChargeBehavior['state'];
  private readonly projectileBehavior: ProjectileBehavior;
  private readonly orbitBehavior: OrbitBehavior;
  private readonly chainBehavior: ChainBehavior;
  private readonly boomerangBehavior: BoomerangBehavior;
  private readonly pulseRingBehavior: PulseRingWeaponBehavior;
  private readonly magneticChargeBehavior: MagneticChargeBehavior;
  private readonly scheduler: WeaponScheduler;
  private projectileDamage = PROJECTILE_DEFINITION.damage;
  private projectileSpeed = PROJECTILE_DEFINITION.speed;
  private projectileCooldown = PROJECTILE_DEFINITION.cooldownSeconds;
  private chainCooldown = CHAIN_DEFINITION.cooldownSeconds;
  private boomerangCooldown = BOOMERANG_DEFINITION.cooldownSeconds;
  private pulseRingCooldown = PULSE_RING_DEFINITION.cooldownSeconds;
  private magneticChargeCooldown = MAGNETIC_CHARGE_DEFINITION.cooldownSeconds;
  private criticalChance = 0;
  private randomState = CRITICAL_RANDOM_SEED;
  private twinEmitters = false;
  private projectileEvolution: ProjectileEvolution | null = null;
  public readonly lastShot: ShotRenderState;
  private readonly stressScenario: StressCombatScenario;
  private permanentBonuses: PermanentCombatBonuses;

  public constructor(
    private readonly enemies: EnemySystem,
    private readonly onEnemyDefeated: (enemy: EnemyState) => void,
    permanentBonuses: PermanentCombatBonuses = {
      weaponDamageMultiplier: 1,
      weaponCadenceMultiplier: 1
    }
  ) {
    this.permanentBonuses = permanentBonuses;
    this.projectileBehavior = new ProjectileBehavior({
      enemies: this.enemies,
      projectiles: this.projectiles,
      isTwinEmitterEnabled: () => this.twinEmitters,
      getProjectileDamage: () => this.projectileDamage,
      getProjectileSpeed: () => this.projectileSpeed,
      getProjectileEvolution: () => this.projectileEvolution,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.orbitBehavior = new OrbitBehavior({
      enemies: this.enemies,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.chainBehavior = new ChainBehavior({
      enemies: this.enemies,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.boomerangBehavior = new BoomerangBehavior({
      enemies: this.enemies,
      boomerangs: this.boomerangs,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.pulseRingBehavior = new PulseRingWeaponBehavior({
      enemies: this.enemies,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.magneticChargeBehavior = new MagneticChargeBehavior({
      enemies: this.enemies,
      rollCriticalDamage: (baseDamage) => this.rollCriticalDamage(baseDamage),
      onEnemyDefeated: this.onEnemyDefeated
    });
    this.orbitBlades = this.orbitBehavior.blades;
    this.orbitPulse = this.orbitBehavior.pulseState;
    this.chainSegments = this.chainBehavior.segments;
    this.chainExplosions = this.chainBehavior.explosions;
    this.boomerangStates = this.boomerangs.states;
    this.boomerangPulse = this.boomerangBehavior.pulseState;
    this.pulseRingWeapon = this.pulseRingBehavior.state;
    this.magneticCharge = this.magneticChargeBehavior.state;
    this.lastShot = this.projectileBehavior.lastShot;
    this.scheduler = new WeaponScheduler({
      fireProjectile: (player) => this.projectileBehavior.fire(player),
      fireChain: (player) => this.chainBehavior.fire(player),
      fireBoomerang: (player) => this.boomerangBehavior.fire(player),
      firePulseRing: (player) => this.pulseRingBehavior.fire(player)
    });
    this.stressScenario = new StressCombatScenario(
      this.projectiles,
      () => this.projectileSpeed,
      () => this.projectileDamage,
      (player, projectile, directionX, directionY, muzzle) => this.projectileBehavior.recordStressShot(
        player,
        projectile,
        directionX,
        directionY,
        muzzle
      )
    );
    this.setPermanentBonuses(permanentBonuses);
  }

  public get totalShotsFired(): number {
    return this.projectileBehavior.totalShotsFired;
  }

  public get currentProjectileDamage(): number {
    return this.projectileDamage;
  }

  public get currentProjectileCooldown(): number {
    return this.projectileCooldown;
  }

  public get currentProjectileSpeed(): number {
    return this.projectileSpeed;
  }

  public get hasTwinEmitters(): boolean {
    return this.twinEmitters;
  }

  public get currentProjectileEvolution(): ProjectileEvolution | null { return this.projectileEvolution; }
  public get currentOrbitEvolution(): OrbitEvolution | null { return this.orbitBehavior.currentEvolution; }
  public get currentChainEvolution(): ChainEvolution | null { return this.chainBehavior.currentEvolution; }
  public get currentBoomerangEvolution(): BoomerangEvolution | null { return this.boomerangBehavior.currentEvolution; }
  public get currentPulseRingEvolution(): PulseRingEvolution | null { return this.pulseRingBehavior.currentEvolution; }
  public get currentMagneticChargeEvolution(): MagneticChargeEvolution | null { return this.magneticChargeBehavior.currentEvolution; }

  public get currentOrbitRadius(): number {
    return this.orbitBehavior.currentRadius;
  }

  public get currentOrbitDamage(): number {
    return this.orbitBehavior.currentDamage;
  }

  public get currentOrbitHitCooldown(): number {
    return this.orbitBehavior.currentHitCooldown;
  }

  public get currentChainDamage(): number {
    return this.chainBehavior.currentDamage;
  }

  public get currentChainCooldown(): number {
    return this.chainCooldown;
  }

  public get currentBoomerangDamage(): number {
    return this.boomerangBehavior.currentDamage;
  }

  public get currentBoomerangCooldown(): number {
    return this.boomerangCooldown;
  }

  public get currentPulseRingDamage(): number {
    return this.pulseRingBehavior.currentDamage;
  }

  public get currentPulseRingCooldown(): number {
    return this.pulseRingCooldown;
  }

  public get currentMagneticChargeDamage(): number {
    return this.magneticChargeBehavior.currentDamage;
  }

  public get currentMagneticChargeCooldown(): number {
    return this.magneticChargeBehavior.currentCooldown;
  }

  public get currentCriticalChance(): number {
    return this.criticalChance;
  }

  public get criticalMultiplier(): number {
    return CRITICAL_MULTIPLIER;
  }

  public reset(): void {
    this.projectiles.reset();
    this.scheduler.reset();
    this.projectileBehavior.reset();
    this.orbitBehavior.reset();
    this.chainBehavior.reset();
    this.boomerangBehavior.reset();
    this.pulseRingBehavior.reset();
    this.magneticChargeBehavior.reset();
    this.stressScenario.reset();
    this.projectileDamage = PROJECTILE_DEFINITION.damage * this.permanentBonuses.weaponDamageMultiplier;
    this.projectileSpeed = PROJECTILE_DEFINITION.speed;
    this.projectileCooldown = Math.max(0.18, PROJECTILE_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.chainCooldown = CHAIN_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier;
    this.boomerangCooldown = Math.max(0.35, BOOMERANG_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.pulseRingCooldown = Math.max(0.5, PULSE_RING_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.magneticChargeCooldown = Math.max(0.45, MAGNETIC_CHARGE_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.criticalChance = 0;
    this.randomState = CRITICAL_RANDOM_SEED;
    this.twinEmitters = false;
    this.projectileEvolution = null;
  }

  public setPermanentBonuses(permanentBonuses: PermanentCombatBonuses): void {
    this.permanentBonuses = permanentBonuses;
    this.projectileDamage = PROJECTILE_DEFINITION.damage * permanentBonuses.weaponDamageMultiplier;
    this.projectileCooldown = Math.max(0.18, PROJECTILE_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier);
    this.chainCooldown = CHAIN_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier;
    this.boomerangCooldown = Math.max(0.35, BOOMERANG_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier);
    this.pulseRingCooldown = Math.max(0.5, PULSE_RING_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier);
    this.magneticChargeCooldown = Math.max(0.45, MAGNETIC_CHARGE_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier);
    this.orbitBehavior.setPermanentBonuses(
      permanentBonuses.weaponDamageMultiplier,
      permanentBonuses.weaponCadenceMultiplier
    );
    this.chainBehavior.setPermanentDamageMultiplier(permanentBonuses.weaponDamageMultiplier);
    this.boomerangBehavior.setPermanentDamageMultiplier(permanentBonuses.weaponDamageMultiplier);
    this.pulseRingBehavior.setPermanentDamageMultiplier(permanentBonuses.weaponDamageMultiplier);
    this.magneticChargeBehavior.setPermanentBonuses(
      permanentBonuses.weaponDamageMultiplier,
      permanentBonuses.weaponCadenceMultiplier
    );
  }

  public increaseProjectileDamage(amount: number): void {
    this.projectileDamage += Math.max(0, amount);
  }

  public decreaseProjectileCooldown(amount: number): void {
    this.projectileCooldown = Math.max(0.18, this.projectileCooldown - Math.max(0, amount));
  }

  public increaseProjectileSpeed(amount: number): void {
    this.projectileSpeed += Math.max(0, amount);
  }

  public enableTwinEmitters(): boolean {
    if (this.twinEmitters) return false;
    this.twinEmitters = true;
    return true;
  }

  public applyProjectileEvolution(evolution: ProjectileEvolution): boolean {
    if (this.projectileEvolution !== null) return false;
    this.projectileEvolution = evolution;
    return true;
  }

  public applyOrbitEvolution(evolution: OrbitEvolution): boolean { return this.orbitBehavior.setEvolution(evolution); }
  public applyChainEvolution(evolution: ChainEvolution): boolean { return this.chainBehavior.setEvolution(evolution); }
  public applyBoomerangEvolution(evolution: BoomerangEvolution): boolean { return this.boomerangBehavior.setEvolution(evolution); }
  public applyPulseRingEvolution(evolution: PulseRingEvolution): boolean { return this.pulseRingBehavior.setEvolution(evolution); }
  public applyMagneticChargeEvolution(evolution: MagneticChargeEvolution): boolean {
    return this.magneticChargeBehavior.setEvolution(evolution);
  }

  public addOrbitBlade(): boolean {
    return this.orbitBehavior.addBlade();
  }

  public unlockChainLightning(): boolean {
    return this.chainBehavior.unlock();
  }

  public get hasChainLightning(): boolean {
    return this.chainBehavior.isUnlocked;
  }

  public unlockVectorBoomerang(): boolean {
    return this.boomerangBehavior.unlock();
  }

  public get hasVectorBoomerang(): boolean {
    return this.boomerangBehavior.isUnlocked;
  }

  public unlockPulseRing(): boolean {
    return this.pulseRingBehavior.unlock();
  }

  public get hasPulseRing(): boolean {
    return this.pulseRingBehavior.isUnlocked;
  }

  public increasePulseRingDamage(amount: number): void {
    this.pulseRingBehavior.increaseDamage(amount);
  }

  public unlockMagneticCharge(): boolean {
    return this.magneticChargeBehavior.unlock();
  }

  public get hasMagneticCharge(): boolean {
    return this.magneticChargeBehavior.isUnlocked;
  }

  public increaseMagneticChargeDamage(amount: number): void {
    this.magneticChargeBehavior.increaseDamage(amount);
  }

  public get activeOrbitBlades(): number {
    return this.orbitBehavior.activeBladeCount;
  }

  public increaseOrbitRadius(amount: number): void {
    this.orbitBehavior.increaseRadius(amount);
  }

  public increaseChainDamage(amount: number): void {
    this.chainBehavior.increaseDamage(amount);
  }

  public increaseBoomerangDamage(amount: number): void {
    this.boomerangBehavior.increaseDamage(amount);
  }

  public increaseCriticalChance(amount: number): void {
    this.criticalChance = Math.min(1, Math.max(0, this.criticalChance + Math.max(0, amount)));
  }

  public update(
    dtSeconds: number,
    player: PlayerState,
    options: CombatWeaponUpdateOptions = {}
  ): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt === 0) return;

    this.chainBehavior.updateSegments(dt);
    this.chainBehavior.setArenaBoundary(options.arena ?? options.magneticChargeArena ?? 270);
    this.boomerangBehavior.update(dt, player);
    this.pulseRingBehavior.update(dt);
    if ((options.magneticChargeEnabled ?? this.magneticChargeBehavior.isUnlocked)
      && options.magneticChargeArena !== undefined) {
      this.magneticChargeBehavior.update(
        dt,
        player,
        options.magneticChargeArena,
        options.magneticChargeCooldownSeconds ?? this.magneticChargeCooldown
      );
    }
    if (options.orbitEnabled ?? true) this.orbitBehavior.update(dt, player);
    this.scheduler.update(
      dt,
      this.getEffectiveProjectileCooldown(),
      options.chainEnabled ?? this.chainBehavior.isUnlocked,
      this.chainCooldown,
      player,
      options.projectileEnabled ?? true,
      options.boomerangEnabled ?? this.boomerangBehavior.isUnlocked,
      this.getEffectiveBoomerangCooldown(),
      options.pulseRingEnabled ?? this.pulseRingBehavior.isUnlocked,
      options.pulseRingCooldownSeconds ?? this.getEffectivePulseRingCooldown()
    );
    this.projectileBehavior.update(dt);
  }

  private getEffectiveProjectileCooldown(): number {
    return this.projectileCooldown
      * (this.projectileEvolution === 'rail_lance' ? 1.35 : this.projectileEvolution === 'pulse_volley' ? 1.15 : 1);
  }

  private getEffectiveBoomerangCooldown(): number {
    const multiplier = this.boomerangBehavior.currentEvolution === 'twin_comet'
      ? 1.2 : this.boomerangBehavior.currentEvolution === 'singularity_return' ? 1.35 : 1;
    return this.boomerangCooldown * multiplier;
  }

  private getEffectivePulseRingCooldown(): number {
    const multiplier = this.pulseRingBehavior.currentEvolution === 'echo_shock'
      ? 1.15 : this.pulseRingBehavior.currentEvolution === 'compression_wave' ? 1.35 : 1;
    return this.pulseRingCooldown * multiplier;
  }

  public initializeStress(player: PlayerState): void {
    this.stressScenario.initialize(player);
  }

  public maintainStressProjectiles(player: PlayerState): void {
    this.stressScenario.maintain(player);
  }

  private rollCriticalDamage(baseDamage: number): number {
    if (this.criticalChance <= 0) return baseDamage;
    if (this.nextRandom() >= this.criticalChance) return baseDamage;
    return baseDamage * CRITICAL_MULTIPLIER;
  }

  private nextRandom(): number {
    let state = this.randomState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.randomState = state >>> 0;
    return this.randomState / 0x1_0000_0000;
  }
}
