import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { ProjectilePool, type EnemyState } from './EntityPools';
import type { ChainSegmentState, OrbitBladeState, ShotRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { StressCombatScenario } from './StressCombatScenario';
import type { PermanentCombatBonuses } from '../../content/meta/PermanentUpgradeDefinitions';
import { WeaponScheduler } from './WeaponScheduler';
import { ProjectileBehavior } from './ProjectileBehavior';
import { OrbitBehavior } from './OrbitBehavior';
import { ChainBehavior } from './ChainBehavior';

const CRITICAL_MULTIPLIER = 2;
const CRITICAL_RANDOM_SEED = 0x6d2b79f5;
const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;

export interface CombatWeaponUpdateOptions {
  readonly projectileEnabled?: boolean;
  readonly orbitEnabled?: boolean;
  readonly chainEnabled?: boolean;
}

/** Runs authored weapon behavior against the enemy query surface. */
export class CombatWeaponSystem {
  public readonly projectiles = new ProjectilePool(PROJECTILE_POOL_CAPACITY);
  public readonly orbitBlades: readonly OrbitBladeState[];
  public readonly chainSegments: readonly ChainSegmentState[];
  private readonly projectileBehavior: ProjectileBehavior;
  private readonly orbitBehavior: OrbitBehavior;
  private readonly chainBehavior: ChainBehavior;
  private readonly scheduler: WeaponScheduler;
  private projectileDamage = PROJECTILE_DEFINITION.damage;
  private projectileSpeed = PROJECTILE_DEFINITION.speed;
  private projectileCooldown = PROJECTILE_DEFINITION.cooldownSeconds;
  private chainCooldown = CHAIN_DEFINITION.cooldownSeconds;
  private criticalChance = 0;
  private randomState = CRITICAL_RANDOM_SEED;
  private twinEmitters = false;
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
    this.orbitBlades = this.orbitBehavior.blades;
    this.chainSegments = this.chainBehavior.segments;
    this.lastShot = this.projectileBehavior.lastShot;
    this.scheduler = new WeaponScheduler({
      fireProjectile: (player) => this.projectileBehavior.fire(player),
      fireChain: (player) => this.chainBehavior.fire(player)
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
    this.stressScenario.reset();
    this.projectileDamage = PROJECTILE_DEFINITION.damage * this.permanentBonuses.weaponDamageMultiplier;
    this.projectileSpeed = PROJECTILE_DEFINITION.speed;
    this.projectileCooldown = Math.max(0.18, PROJECTILE_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier);
    this.chainCooldown = CHAIN_DEFINITION.cooldownSeconds * this.permanentBonuses.weaponCadenceMultiplier;
    this.criticalChance = 0;
    this.randomState = CRITICAL_RANDOM_SEED;
    this.twinEmitters = false;
  }

  public setPermanentBonuses(permanentBonuses: PermanentCombatBonuses): void {
    this.permanentBonuses = permanentBonuses;
    this.projectileDamage = PROJECTILE_DEFINITION.damage * permanentBonuses.weaponDamageMultiplier;
    this.projectileCooldown = Math.max(0.18, PROJECTILE_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier);
    this.chainCooldown = CHAIN_DEFINITION.cooldownSeconds * permanentBonuses.weaponCadenceMultiplier;
    this.orbitBehavior.setPermanentBonuses(
      permanentBonuses.weaponDamageMultiplier,
      permanentBonuses.weaponCadenceMultiplier
    );
    this.chainBehavior.setPermanentDamageMultiplier(permanentBonuses.weaponDamageMultiplier);
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

  public addOrbitBlade(): boolean {
    return this.orbitBehavior.addBlade();
  }

  public unlockChainLightning(): boolean {
    return this.chainBehavior.unlock();
  }

  public get hasChainLightning(): boolean {
    return this.chainBehavior.isUnlocked;
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
    if (options.orbitEnabled ?? true) this.orbitBehavior.update(dt, player);
    this.scheduler.update(
      dt,
      this.projectileCooldown,
      options.chainEnabled ?? this.chainBehavior.isUnlocked,
      this.chainCooldown,
      player,
      options.projectileEnabled ?? true
    );
    this.projectileBehavior.update(dt);
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
