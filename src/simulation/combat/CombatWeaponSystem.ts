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
import type { WeaponMasteryChannel, WeaponPathId, WeaponRank } from '../../content/upgrades/UpgradeDefinitions';
import { OVERDRIVE_POWER_INCREMENT, OVERDRIVE_POWER_MULTIPLIER_CAP } from '../../content/run/OverdriveDefinitions';

const CRITICAL_MULTIPLIER = 2;
const CRITICAL_RANDOM_SEED = 0x6d2b79f5;
const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;
const BOOMERANG_DEFINITION = WEAPON_DEFINITIONS.vectorBoomerang;
const PULSE_RING_DEFINITION = WEAPON_DEFINITIONS.pulseRing;

const createOverdrivePowerMultipliers = (): Record<WeaponPathId, number> => ({
  projectile: 1,
  orbit: 1,
  chain: 1,
  boomerang: 1,
  pulse_ring: 1,
  magnetic_charge: 1
});

const PROJECTILE_RANK_STATS = [
  { damage: 14, speed: 460, cooldownSeconds: 0.55 },
  { damage: 14, speed: 460, cooldownSeconds: 0.55 },
  { damage: 18, speed: 460, cooldownSeconds: 0.55 },
  { damage: 18, speed: 460, cooldownSeconds: 0.47 },
  { damage: 22, speed: 460, cooldownSeconds: 0.47 },
  { damage: 22, speed: 540, cooldownSeconds: 0.47 },
  { damage: 22, speed: 540, cooldownSeconds: 0.39 }
] as const;

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
  private projectileRank = 1;
  private criticalChance = 0;
  public criticalHitSequence = 0;
  private randomState = CRITICAL_RANDOM_SEED;
  private twinEmitters = false;
  private projectileEvolution: ProjectileEvolution | null = null;
  public readonly lastShot: ShotRenderState;
  private readonly stressScenario: StressCombatScenario;
  private permanentBonuses: PermanentCombatBonuses;
  private readonly overdrivePowerMultipliers = createOverdrivePowerMultipliers();

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
      getProjectileDamage: () => this.currentProjectileDamage,
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

  public get currentProjectileRank(): number {
    return this.projectileRank;
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

  public get currentOrbitContactRadius(): number {
    return this.orbitBehavior.currentContactRadius;
  }

  public get currentOrbitRank(): number {
    return this.orbitBehavior.currentRank;
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

  public get currentChainRank(): number {
    return this.chainBehavior.currentRank;
  }

  public get currentChainCooldown(): number {
    return this.chainCooldown;
  }

  public get currentChainJumpRadius(): number {
    return this.chainBehavior.currentJumpRadius;
  }

  public get currentBoomerangDamage(): number {
    return this.boomerangBehavior.currentDamage;
  }

  public get currentBoomerangRank(): number {
    return this.boomerangBehavior.currentRank;
  }

  public get currentBoomerangCooldown(): number {
    return this.boomerangCooldown;
  }

  public get currentBoomerangOutboundDistance(): number {
    return this.boomerangBehavior.currentOutboundDistance;
  }

  public get currentPulseRingDamage(): number {
    return this.pulseRingBehavior.currentDamage;
  }

  public get currentPulseRingRank(): number {
    return this.pulseRingBehavior.currentRank;
  }

  public get currentPulseRingCooldown(): number {
    return this.pulseRingCooldown;
  }

  public get currentPulseRingEndRadius(): number {
    return this.pulseRingBehavior.currentEndRadius;
  }

  public get currentMagneticChargeDamage(): number {
    return this.magneticChargeBehavior.currentDamage;
  }

  public get currentMagneticChargeRank(): number {
    return this.magneticChargeBehavior.currentRank;
  }

  public get currentMagneticChargeCooldown(): number {
    return this.magneticChargeBehavior.currentCooldown;
  }

  public get currentMagneticChargeOuterRadius(): number {
    return this.magneticChargeBehavior.currentOuterRadius;
  }

  public get currentCriticalChance(): number {
    return this.criticalChance;
  }

  /** Current independent Overdrive multiplier for an authored weapon family. */
  public getOverdrivePowerMultiplier(family: WeaponPathId): number {
    return this.overdrivePowerMultipliers[family];
  }

  /**
   * Adds one bounded five-point Overdrive power stack. The multiplier is kept
   * separate from permanent bonuses so authored rank/evolution tuning remains
   * the source of truth and all secondary damage paths share the same factor.
   */
  public applyOverdrivePower(
    family: WeaponPathId,
    amount: number = OVERDRIVE_POWER_INCREMENT
  ): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const current = this.overdrivePowerMultipliers[family];
    const next = Math.min(
      OVERDRIVE_POWER_MULTIPLIER_CAP,
      Math.round((current + amount) * 10_000) / 10_000
    );
    if (next <= current) return false;
    this.overdrivePowerMultipliers[family] = next;
    switch (family) {
      case 'projectile':
        this.projectileDamage *= next / current;
        break;
      case 'orbit':
        this.orbitBehavior.setOverdrivePowerMultiplier(next);
        break;
      case 'chain':
        this.chainBehavior.setOverdrivePowerMultiplier(next);
        break;
      case 'boomerang':
        this.boomerangBehavior.setOverdrivePowerMultiplier(next);
        break;
      case 'pulse_ring':
        this.pulseRingBehavior.setOverdrivePowerMultiplier(next);
        break;
      case 'magnetic_charge':
        this.magneticChargeBehavior.setOverdrivePowerMultiplier(next);
        break;
    }
    return true;
  }

  public get criticalMultiplier(): number {
    return CRITICAL_MULTIPLIER;
  }

  public reset(): void {
    Object.assign(this.overdrivePowerMultipliers, createOverdrivePowerMultipliers());
    this.projectiles.reset();
    this.scheduler.reset();
    this.projectileBehavior.reset();
    this.orbitBehavior.reset();
    this.chainBehavior.reset();
    this.boomerangBehavior.reset();
    this.pulseRingBehavior.reset();
    this.magneticChargeBehavior.reset();
    this.stressScenario.reset();
    this.projectileRank = 1;
    this.applyProjectileRankStats();
    this.chainCooldown = CHAIN_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier;
    this.boomerangCooldown = Math.max(0.35, BOOMERANG_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.pulseRingCooldown = Math.max(0.5, PULSE_RING_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.criticalChance = 0;
    this.criticalHitSequence = 0;
    this.randomState = CRITICAL_RANDOM_SEED;
    this.twinEmitters = false;
    this.projectileEvolution = null;
  }

  /**
   * Stage-transition cleanup. Pools and active casts are transient, whereas
   * weapon upgrades and scheduler accumulators belong to the run and survive.
   */
  public clearTransientState(): void {
    this.projectiles.reset();
    this.projectileBehavior.clearTransient();
    this.boomerangBehavior.clearTransient();
    this.orbitBehavior.clearTransient();
    this.chainBehavior.clearTransient();
    this.pulseRingBehavior.clearTransient();
    this.magneticChargeBehavior.clearTransient();
    this.stressScenario.reset();
  }

  public setPermanentBonuses(permanentBonuses: PermanentCombatBonuses): void {
    this.permanentBonuses = permanentBonuses;
    this.applyProjectileRankStats();
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
    this.chainCooldown = this.getChainCooldownForRank();
    this.boomerangCooldown = this.getBoomerangCooldownForRank();
    this.pulseRingCooldown = this.getPulseRingCooldownForRank();
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

  /** Applies one focused-path rank and keeps it idempotent for test routes. */
  public setProjectileRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.projectileRank + 1) return false;
    this.projectileRank = rank;
    this.applyProjectileRankStats();
    return true;
  }

  /** Single entry point for the data-driven focused paths. */
  public setWeaponRank(path: WeaponPathId, rank: WeaponRank): boolean {
    switch (path) {
      case 'projectile':
        return this.setProjectileRank(rank);
      case 'orbit': {
        const applied = this.orbitBehavior.setRank(rank);
        return applied;
      }
      case 'chain': {
        const applied = this.chainBehavior.setRank(rank);
        if (applied) this.chainCooldown = this.getChainCooldownForRank();
        return applied;
      }
      case 'boomerang': {
        const applied = this.boomerangBehavior.setRank(rank);
        if (applied) this.boomerangCooldown = this.getBoomerangCooldownForRank();
        return applied;
      }
      case 'pulse_ring': {
        const applied = this.pulseRingBehavior.setRank(rank);
        if (applied) this.pulseRingCooldown = this.getPulseRingCooldownForRank();
        return applied;
      }
      case 'magnetic_charge': {
        return this.magneticChargeBehavior.setRank(rank);
      }
    }
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

  /** Applies a post-evolution specialization without coupling content to Pixi. */
  public applyWeaponMastery(family: WeaponPathId, channel: WeaponMasteryChannel): boolean {
    switch (family) {
      case 'projectile':
        if (channel === 'power') this.increaseProjectileDamage(4);
        else if (channel === 'tempo') this.decreaseProjectileCooldown(0.05);
        else this.increaseProjectileSpeed(45);
        return true;
      case 'orbit':
        if (channel === 'power') this.orbitBehavior.increaseDamage(4);
        else if (channel === 'tempo') this.orbitBehavior.decreaseHitCooldown(0.03);
        else if (this.orbitBehavior.currentEvolution === 'solar_crown') this.orbitBehavior.increaseContactRadius(4);
        else this.orbitBehavior.increaseRadius(14);
        return true;
      case 'chain':
        if (channel === 'power') this.chainBehavior.increaseDamage(4);
        else if (channel === 'tempo') this.chainCooldown = Math.max(0.45, this.chainCooldown - 0.12);
        else this.chainBehavior.increaseJumpRadius(30);
        return true;
      case 'boomerang':
        if (channel === 'power') this.boomerangBehavior.increaseDamage(4);
        else if (channel === 'tempo') this.boomerangCooldown = Math.max(0.35, this.boomerangCooldown - 0.08);
        else this.boomerangBehavior.increaseOutboundDistance(40);
        return true;
      case 'pulse_ring':
        if (channel === 'power') this.pulseRingBehavior.increaseDamage(6);
        else if (channel === 'tempo') this.pulseRingCooldown = Math.max(0.5, this.pulseRingCooldown - 0.25);
        else this.pulseRingBehavior.increaseEndRadius(22);
        return true;
      case 'magnetic_charge':
        if (channel === 'power') this.magneticChargeBehavior.increaseDamage(5);
        else if (channel === 'tempo') this.magneticChargeBehavior.decreaseCooldown(0.45);
        else this.magneticChargeBehavior.increaseOuterRadius(24);
        return true;
    }
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
    this.pulseRingBehavior.update(dt, player);
    if ((options.magneticChargeEnabled ?? this.magneticChargeBehavior.isUnlocked)
      && options.magneticChargeArena !== undefined) {
      this.magneticChargeBehavior.update(
        dt,
        player,
        options.magneticChargeArena,
        options.magneticChargeCooldownSeconds
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

  private applyProjectileRankStats(): void {
    const stats = PROJECTILE_RANK_STATS[this.projectileRank - 1] ?? PROJECTILE_RANK_STATS[0];
    this.projectileDamage = stats.damage
      * this.permanentBonuses.weaponDamageMultiplier
      * this.overdrivePowerMultipliers.projectile;
    this.projectileSpeed = stats.speed;
    this.projectileCooldown = Math.max(0.18, stats.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.twinEmitters = this.projectileRank >= 2;
  }

  private getEffectiveBoomerangCooldown(): number {
    const multiplier = this.boomerangBehavior.currentEvolution === 'twin_comet'
      ? 1.2 : this.boomerangBehavior.currentEvolution === 'singularity_return' ? 1.35 : 1;
    return this.boomerangCooldown * multiplier;
  }

  private getChainCooldownForRank(): number {
    const authored = this.chainBehavior.currentRank >= 5 ? 1.05 : CHAIN_DEFINITION.cooldownSeconds;
    return authored * this.permanentBonuses.weaponCadenceMultiplier;
  }

  private getBoomerangCooldownForRank(): number {
    const authored = this.boomerangBehavior.currentRank >= 6 ? 1.10 : BOOMERANG_DEFINITION.cooldownSeconds;
    return Math.max(0.35, authored * this.permanentBonuses.weaponCadenceMultiplier);
  }

  private getPulseRingCooldownForRank(): number {
    const authored = this.pulseRingBehavior.currentRank >= 6 ? 3.30 : PULSE_RING_DEFINITION.cooldownSeconds;
    return Math.max(0.5, authored * this.permanentBonuses.weaponCadenceMultiplier);
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
    this.criticalHitSequence = this.criticalHitSequence >= 2_000_000_000 ? 1 : this.criticalHitSequence + 1;
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
