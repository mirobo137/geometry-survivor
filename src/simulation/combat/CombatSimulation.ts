import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import {
  ENEMY_POOL_CAPACITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH
} from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { EnemyPool, type BoomerangState, type EnemyState, type ProjectilePool } from './EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { LASER_DEFINITION } from '../../content/hazards/LaserDefinition';
import { LaserHazard } from '../hazards/LaserHazard';
import { RadialPulseHazard } from '../hazards/RadialPulseHazard';
import type { CombatRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { CombatWeaponSystem } from './CombatWeaponSystem';
import { BossSystem } from '../bosses/BossSystem';
import type { PermanentCombatBonuses } from '../../content/meta/PermanentUpgradeDefinitions';
import { asArenaBoundary, type ArenaBoundaryInput } from '../ArenaBoundary';
import { RadialActDirector } from '../acts/RadialActDirector';
import {
  getHazardCadenceProfile,
  type HazardCadenceMode
} from '../../content/hazards/HazardCadenceDefinitions';

export { selectEnemyKind } from '../enemies/EnemySystem';

export interface CombatSimulationOptions {
  readonly stress?: boolean;
  /** Optional simulation clock offset used by deterministic development scenarios. */
  readonly initialElapsedSeconds?: number;
  readonly permanentBonuses?: PermanentCombatBonuses;
  readonly actDirector?: RadialActDirector;
  /** Explicit development-only cadence profile; authored is the default. */
  readonly hazardCadenceMode?: HazardCadenceMode;
}

export type CombatEvent =
  | {
    readonly type: 'enemyDefeated';
    readonly x: number;
    readonly y: number;
    readonly kind: EnemyKind;
    readonly experience: number;
  }
  | { readonly type: 'bossDefeated' }
  | {
    readonly type: 'playerDamaged';
    readonly amount: number;
    readonly source: 'contact' | 'laser' | 'radial-pulse' | 'boss';
  };

export interface CombatStats {
  elapsedSeconds: number;
  kills: number;
  experience: number;
  shotsFired: number;
  damageTaken: number;
}

export class CombatSimulation {
  public readonly enemies = new EnemyPool(ENEMY_POOL_CAPACITY);
  public readonly stats: CombatStats = {
    elapsedSeconds: 0,
    kills: 0,
    experience: 0,
    shotsFired: 0,
    damageTaken: 0
  };
  private readonly actDirector: RadialActDirector;
  private readonly enemySystem: EnemySystem;
  public readonly boss: BossSystem;
  private readonly weaponSystem: CombatWeaponSystem;
  public readonly projectiles: ProjectilePool;
  public readonly boomerangs: CombatWeaponSystem['boomerangs'];
  public readonly laser: LaserHazard;
  public readonly radialPulse: RadialPulseHazard;
  public readonly orbitBlades: CombatWeaponSystem['orbitBlades'];
  public readonly chainSegments: CombatWeaponSystem['chainSegments'];
  public readonly boomerangStates: readonly BoomerangState[];
  public readonly renderState: CombatRenderState;
  private readonly pendingEvents: CombatEvent[] = [];
  private spawnAccumulator = 0;
  private experienceMultiplier = 1;
  private readonly stressMode: boolean;
  public readonly hazardCadenceMode: HazardCadenceMode;
  private readonly initialElapsedSeconds: number;
  private stressInitialized = false;

  public constructor(options: CombatSimulationOptions = {}) {
    this.actDirector = options.actDirector ?? new RadialActDirector();
    const hazardCadence = getHazardCadenceProfile(options.hazardCadenceMode);
    const radialPulseDefinition = {
      ...this.actDirector.radialPulseDefinition,
      intervalSeconds: this.actDirector.radialPulseDefinition.intervalSeconds
        * hazardCadence.radialPulseIntervalMultiplier
    };
    this.enemySystem = new EnemySystem(
      this.enemies,
      new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT),
      this.actDirector
    );
    this.boss = new BossSystem(this.enemySystem, this.actDirector.bossDefinition);
    this.laser = new LaserHazard(
      LASER_DEFINITION,
      this.actDirector,
      hazardCadence.laserIntervalMultiplier
    );
    this.radialPulse = new RadialPulseHazard(radialPulseDefinition);
    this.weaponSystem = new CombatWeaponSystem(
      this.enemySystem,
      (enemy) => this.defeatEnemy(enemy),
      options.permanentBonuses
    );
    this.projectiles = this.weaponSystem.projectiles;
    this.boomerangs = this.weaponSystem.boomerangs;
    this.orbitBlades = this.weaponSystem.orbitBlades;
    this.chainSegments = this.weaponSystem.chainSegments;
    this.boomerangStates = this.weaponSystem.boomerangStates;
    this.renderState = {
      enemies: this.enemies.states,
      projectiles: this.projectiles.states,
      orbitBlades: this.orbitBlades,
      chainSegments: this.chainSegments,
      boomerangs: this.boomerangStates,
      laser: this.laser.state,
      radialPulse: this.radialPulse.state,
      boss: this.boss.state,
      shot: this.weaponSystem.lastShot
    };
    this.stressMode = options.stress === true;
    this.hazardCadenceMode = options.hazardCadenceMode ?? 'authored';
    this.initialElapsedSeconds = Number.isFinite(options.initialElapsedSeconds)
      ? Math.max(0, options.initialElapsedSeconds ?? 0)
      : 0;
    this.stats.elapsedSeconds = this.initialElapsedSeconds;
  }

  public get isStressMode(): boolean {
    return this.stressMode;
  }

  public get currentProjectileDamage(): number {
    return this.weaponSystem.currentProjectileDamage;
  }

  public get currentProjectileCooldown(): number {
    return this.weaponSystem.currentProjectileCooldown;
  }

  public get currentProjectileSpeed(): number {
    return this.weaponSystem.currentProjectileSpeed;
  }

  public get currentOrbitRadius(): number {
    return this.weaponSystem.currentOrbitRadius;
  }

  public get currentOrbitDamage(): number {
    return this.weaponSystem.currentOrbitDamage;
  }

  public get currentOrbitHitCooldown(): number {
    return this.weaponSystem.currentOrbitHitCooldown;
  }

  public get currentChainDamage(): number {
    return this.weaponSystem.currentChainDamage;
  }

  public get currentChainCooldown(): number {
    return this.weaponSystem.currentChainCooldown;
  }

  public get currentExperienceMultiplier(): number {
    return this.experienceMultiplier;
  }

  public get currentExperienceBonus(): number {
    return Math.round((this.experienceMultiplier - 1) * 10_000) / 10_000;
  }

  public get currentCriticalChance(): number {
    return this.weaponSystem.currentCriticalChance;
  }

  /** Updates menu-owned modifiers; they take effect on the next run reset. */
  public setPermanentBonuses(bonuses: PermanentCombatBonuses): void {
    this.weaponSystem.setPermanentBonuses(bonuses);
  }

  public increaseProjectileDamage(amount: number): void {
    this.weaponSystem.increaseProjectileDamage(amount);
  }

  public decreaseProjectileCooldown(amount: number): void {
    this.weaponSystem.decreaseProjectileCooldown(amount);
  }

  public increaseProjectileSpeed(amount: number): void {
    this.weaponSystem.increaseProjectileSpeed(amount);
  }

  public enableTwinEmitters(): boolean {
    return this.weaponSystem.enableTwinEmitters();
  }

  public get hasTwinEmitters(): boolean {
    return this.weaponSystem.hasTwinEmitters;
  }

  public addOrbitBlade(): boolean {
    return this.weaponSystem.addOrbitBlade();
  }

  public unlockChainLightning(): boolean {
    return this.weaponSystem.unlockChainLightning();
  }

  public get hasChainLightning(): boolean {
    return this.weaponSystem.hasChainLightning;
  }

  public unlockVectorBoomerang(): boolean {
    return this.weaponSystem.unlockVectorBoomerang();
  }

  public get hasVectorBoomerang(): boolean {
    return this.weaponSystem.hasVectorBoomerang;
  }

  public get activeOrbitBlades(): number {
    return this.weaponSystem.activeOrbitBlades;
  }

  public increaseOrbitRadius(amount: number): void {
    this.weaponSystem.increaseOrbitRadius(amount);
  }

  public increaseChainDamage(amount: number): void {
    this.weaponSystem.increaseChainDamage(amount);
  }

  public increaseBoomerangDamage(amount: number): void {
    this.weaponSystem.increaseBoomerangDamage(amount);
  }

  public increaseExperienceGain(amount: number): void {
    this.experienceMultiplier = Math.max(
      1,
      Math.round((this.experienceMultiplier + Math.max(0, amount)) * 10_000) / 10_000
    );
  }

  public increaseCriticalChance(amount: number): void {
    this.weaponSystem.increaseCriticalChance(amount);
  }

  public update(dtSeconds: number, player: PlayerState, arena: ArenaBoundaryInput): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    this.pendingEvents.length = 0;
    if (dt === 0) return;
    const arenaBoundary = asArenaBoundary(arena);
    const arenaRadius = arenaBoundary.radius;

    if (this.stressMode && !this.stressInitialized) {
      this.initializeStress(player, arenaRadius);
    }

    this.stats.elapsedSeconds += dt;
    this.spawnAccumulator += dt;
    if (this.laser.update(
      dt,
      this.stats.elapsedSeconds,
      player,
      arenaBoundary,
      this.radialPulse.state.phase === 'idle'
    )) {
      this.stats.damageTaken += LASER_DEFINITION.damage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: LASER_DEFINITION.damage, source: 'laser' });
    }
    if (this.radialPulse.update(
      dt,
      this.stats.elapsedSeconds,
      player,
      arenaBoundary,
      this.laser.state.phase === 'idle',
      this.boss.state.active
    )) {
      this.stats.damageTaken += this.actDirector.radialPulseDefinition.damage;
      this.pendingEvents.push({
        type: 'playerDamaged',
        amount: this.actDirector.radialPulseDefinition.damage,
        source: 'radial-pulse'
      });
    }

    const spawnInterval = this.actDirector.getSpawnIntervalSeconds(this.stats.elapsedSeconds);
    const normalEnemyCapacity = this.stressMode ? this.enemies.capacity : Math.max(0, this.enemies.capacity - 1);
    while (this.spawnAccumulator >= spawnInterval && this.enemies.activeCount < normalEnemyCapacity) {
      this.spawnAccumulator -= spawnInterval;
      this.enemySystem.spawn(this.stats.elapsedSeconds, arenaRadius);
    }
    if (this.enemies.activeCount >= normalEnemyCapacity) {
      this.spawnAccumulator = Math.min(this.spawnAccumulator, spawnInterval);
    }

    if (!this.stressMode) {
      const bossDamage = this.boss.update(dt, this.stats.elapsedSeconds, player, arenaRadius);
      if (bossDamage > 0) {
        this.stats.damageTaken += bossDamage;
        this.pendingEvents.push({ type: 'playerDamaged', amount: bossDamage, source: 'boss' });
      }
    }

    const contactDamage = this.enemySystem.update(dt, player);
    if (contactDamage !== null) {
      this.stats.damageTaken += contactDamage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: contactDamage, source: 'contact' });
    }
    this.enemySystem.rebuildGrid();
    this.weaponSystem.update(dt, player);
    this.stats.shotsFired = this.weaponSystem.totalShotsFired;
    this.maintainStressEnemies(arenaRadius);
    this.maintainStressProjectiles(player);
  }

  public get events(): readonly CombatEvent[] {
    return this.pendingEvents;
  }

  public reset(): void {
    this.enemySystem.reset();
    this.boss.reset();
    this.weaponSystem.reset();
    this.laser.reset();
    this.radialPulse.reset();
    this.stats.elapsedSeconds = this.initialElapsedSeconds;
    this.stats.kills = 0;
    this.stats.experience = 0;
    this.stats.shotsFired = 0;
    this.stats.damageTaken = 0;
    this.experienceMultiplier = 1;
    this.pendingEvents.length = 0;
    this.spawnAccumulator = 0;
    this.stressInitialized = false;
  }

  private initializeStress(player: PlayerState, arenaRadius: number): void {
    this.enemySystem.initializeStress(arenaRadius);
    this.weaponSystem.initializeStress(player);
    this.stressInitialized = true;
  }

  private maintainStressEnemies(arenaRadius: number): void {
    if (!this.stressMode) return;
    this.enemySystem.maintainStress(arenaRadius);
  }

  private maintainStressProjectiles(player: PlayerState): void {
    if (!this.stressMode) return;
    this.weaponSystem.maintainStressProjectiles(player);
  }

  private defeatEnemy(enemy: EnemyState): void {
    const x = enemy.x;
    const y = enemy.y;
    const kind = enemy.kind;
    const experience = ENEMY_DEFINITIONS[kind].experience * this.experienceMultiplier;
    this.enemies.release(enemy);
    this.stats.kills += 1;
    this.stats.experience += experience;
    if (kind === 'boss') {
      this.boss.markDefeated();
      this.pendingEvents.push({ type: 'bossDefeated' });
      return;
    }
    this.pendingEvents.push({ type: 'enemyDefeated', x, y, kind, experience });
  }
}
