import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import {
  ENEMY_POOL_CAPACITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH
} from '../../config/constants';
import { applyHazardPush, type PlayerState } from '../PlayerModel';
import { EnemyPool, type BoomerangState, type EnemyState, type ProjectilePool } from './EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { LASER_DEFINITION } from '../../content/hazards/LaserDefinition';
import { LaserHazard } from '../hazards/LaserHazard';
import { RadialPulseHazard } from '../hazards/RadialPulseHazard';
import { PulseRingHazard } from '../hazards/PulseRingHazard';
import { PULSE_RING_DRILL_DEFINITION } from '../../content/hazards/PulseRingDefinition';
import { ANGULAR_SWEEP_DEFINITION, ANGULAR_SWEEP_DRILL_DEFINITION } from '../../content/hazards/AngularSweepDefinition';
import { AngularSweepHazard } from '../hazards/AngularSweepHazard';
import type { CombatRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { CombatWeaponSystem } from './CombatWeaponSystem';
import { BossSystem } from '../bosses/BossSystem';
import { ORBITAL_WARDEN_DEFINITION } from '../../content/bosses/BossDefinition';
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
  /** Isolated first-family scenario; never changes the normal Radial run. */
  readonly orbiterDrill?: boolean;
  /** Isolated second-family scenario; never changes the normal Radial run. */
  readonly chargerDrill?: boolean;
  /** Isolated third-family scenario; the weapon is enabled to demonstrate fracture. */
  readonly splitterDrill?: boolean;
  /** Isolated EX-07c hazard scenario; not a campaign act. */
  readonly pulseRingDrill?: boolean;
  /** Isolated EX-07d sector hazard scenario; not a campaign act. */
  readonly angularSweepDrill?: boolean;
  /** Isolated EX-07d boss scenario; not a campaign act. */
  readonly wardenDrill?: boolean;
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
    readonly source: 'contact' | 'laser' | 'radial-pulse' | 'pulse-ring' | 'angular-sweep' | 'boss';
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
  public readonly pulseRing: PulseRingHazard;
  public readonly angularSweep: AngularSweepHazard;
  public readonly orbitBlades: CombatWeaponSystem['orbitBlades'];
  public readonly chainSegments: CombatWeaponSystem['chainSegments'];
  public readonly boomerangStates: readonly BoomerangState[];
  public readonly renderState: CombatRenderState;
  private readonly pendingEvents: CombatEvent[] = [];
  private spawnAccumulator = 0;
  private experienceMultiplier = 1;
  private readonly stressMode: boolean;
  private readonly orbiterDrill: boolean;
  private readonly chargerDrill: boolean;
  private readonly splitterDrill: boolean;
  private readonly pulseRingDrill: boolean;
  private readonly angularSweepDrill: boolean;
  private readonly wardenDrill: boolean;
  public readonly hazardCadenceMode: HazardCadenceMode;
  private readonly initialElapsedSeconds: number;
  private stressInitialized = false;
  private currentArenaRadius = 270;

  public constructor(options: CombatSimulationOptions = {}) {
    this.actDirector = options.actDirector ?? new RadialActDirector();
    this.stressMode = options.stress === true;
    this.orbiterDrill = options.orbiterDrill === true;
    this.chargerDrill = options.chargerDrill === true && !this.orbiterDrill;
    this.splitterDrill = options.splitterDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.stressMode;
    this.pulseRingDrill = options.pulseRingDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill && !this.stressMode;
    this.angularSweepDrill = options.angularSweepDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.pulseRingDrill && !this.stressMode;
    this.wardenDrill = options.wardenDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.pulseRingDrill && !this.angularSweepDrill && !this.stressMode;
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
    this.boss = new BossSystem(
      this.enemySystem,
      this.wardenDrill ? ORBITAL_WARDEN_DEFINITION : this.actDirector.bossDefinition
    );
    this.laser = new LaserHazard(
      LASER_DEFINITION,
      this.actDirector,
      hazardCadence.laserIntervalMultiplier
    );
    this.radialPulse = new RadialPulseHazard(radialPulseDefinition);
    this.pulseRing = new PulseRingHazard(
      this.pulseRingDrill ? PULSE_RING_DRILL_DEFINITION : undefined
    );
    this.angularSweep = new AngularSweepHazard(
      this.angularSweepDrill || this.wardenDrill
        ? ANGULAR_SWEEP_DRILL_DEFINITION
        : ANGULAR_SWEEP_DEFINITION
    );
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
      pulseRing: this.pulseRing.state,
      angularSweep: this.angularSweep.state,
      boss: this.boss.state,
      shot: this.weaponSystem.lastShot
    };
    this.hazardCadenceMode = options.hazardCadenceMode ?? 'chaos';
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

  public get isOrbiterDrill(): boolean {
    return this.orbiterDrill;
  }

  public get isChargerDrill(): boolean { return this.chargerDrill; }

  public get isSplitterDrill(): boolean { return this.splitterDrill; }

  public get isPulseRingDrill(): boolean { return this.pulseRingDrill; }

  public get isAngularSweepDrill(): boolean { return this.angularSweepDrill; }

  public get isWardenDrill(): boolean { return this.wardenDrill; }

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
    this.currentArenaRadius = arenaRadius;

    if (this.stressMode && !this.stressInitialized) {
      this.initializeStress(player, arenaRadius);
    }

    this.stats.elapsedSeconds += dt;
    this.spawnAccumulator += dt;
    const isolatedAngularDrill = this.orbiterDrill || this.chargerDrill || this.splitterDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill;
    if (!isolatedAngularDrill && this.laser.update(
      dt,
      this.stats.elapsedSeconds,
      player,
      arenaBoundary,
      this.radialPulse.state.phase === 'idle'
    )) {
      this.stats.damageTaken += LASER_DEFINITION.damage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: LASER_DEFINITION.damage, source: 'laser' });
    }
    if (!isolatedAngularDrill && this.radialPulse.update(
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

    if (this.pulseRingDrill) {
      const pulse = this.pulseRing.update(
        dt,
        this.stats.elapsedSeconds,
        player,
        arenaBoundary,
        true,
        false
      );
      if (pulse.pushX !== 0 || pulse.pushY !== 0) applyHazardPush(player, pulse.pushX, pulse.pushY, arenaBoundary);
      if (pulse.damaged) {
        this.stats.damageTaken += PULSE_RING_DRILL_DEFINITION.damage;
        this.pendingEvents.push({
          type: 'playerDamaged',
          amount: PULSE_RING_DRILL_DEFINITION.damage,
          source: 'pulse-ring'
        });
      }
    }

    if (this.angularSweepDrill || this.wardenDrill) {
      const sector = this.angularSweep.update(
        dt,
        this.stats.elapsedSeconds,
        player,
        arenaBoundary,
        !this.wardenDrill || this.boss.state.phase === 'recovery' || !this.boss.state.active
      );
      if (sector.damaged) {
        this.stats.damageTaken += ANGULAR_SWEEP_DRILL_DEFINITION.damage;
        this.pendingEvents.push({
          type: 'playerDamaged',
          amount: ANGULAR_SWEEP_DRILL_DEFINITION.damage,
          source: 'angular-sweep'
        });
      }
    }

    if (this.orbiterDrill) {
      if (!this.enemies.states.some((enemy) => enemy.active && enemy.kind === 'orbiter')) {
        this.enemySystem.spawnOrbiterDrill(arenaRadius);
      }
    } else if (this.chargerDrill) {
      if (!this.enemies.states.some((enemy) => enemy.active && enemy.kind === 'charger')) this.enemySystem.spawnChargerDrill(arenaRadius);
    } else if (this.splitterDrill) {
      if (!this.enemies.states.some((enemy) => enemy.active && enemy.kind === 'splitter')) this.enemySystem.spawnSplitterDrill(arenaRadius);
    } else if (this.pulseRingDrill) {
      // The EX-07c drill isolates the hazard so its opening and push can be
      // read without enemy silhouettes hiding the answer.
    } else if (this.angularSweepDrill || this.wardenDrill) {
      // EX-07d keeps the hazard/boss pair readable before campaign composition.
    } else {
      const spawnInterval = this.actDirector.getSpawnIntervalSeconds(this.stats.elapsedSeconds);
      const normalEnemyCapacity = this.stressMode ? this.enemies.capacity : Math.max(0, this.enemies.capacity - 1);
      while (this.spawnAccumulator >= spawnInterval && this.enemies.activeCount < normalEnemyCapacity) {
        this.spawnAccumulator -= spawnInterval;
        this.enemySystem.spawn(this.stats.elapsedSeconds, arenaRadius);
      }
      if (this.enemies.activeCount >= normalEnemyCapacity) {
        this.spawnAccumulator = Math.min(this.spawnAccumulator, spawnInterval);
      }
    }

    if (!this.stressMode && (!isolatedAngularDrill || this.wardenDrill)) {
      const bossDamage = this.boss.update(dt, this.stats.elapsedSeconds, player, arenaRadius);
      if (bossDamage > 0) {
        this.stats.damageTaken += bossDamage;
        this.pendingEvents.push({ type: 'playerDamaged', amount: bossDamage, source: 'boss' });
      }
    }

    const contactDamage = this.enemySystem.update(dt, player, arenaRadius);
    if (contactDamage !== null) {
      this.stats.damageTaken += contactDamage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: contactDamage, source: 'contact' });
    }
    this.enemySystem.rebuildGrid();
    // Orbiter/Charger teach a route and keep their authored target alive.
    // Splitter and Warden deliberately keep autofire: their lessons are the
    // bounded fracture and destructible copies, respectively.
    if (!this.orbiterDrill && !this.chargerDrill && !this.angularSweepDrill) {
      this.weaponSystem.update(dt, player);
    }
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
    this.pulseRing.reset();
    this.angularSweep.reset();
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
    if (!this.stressMode || this.orbiterDrill || this.chargerDrill || this.splitterDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill) return;
    this.enemySystem.maintainStress(arenaRadius);
  }

  private maintainStressProjectiles(player: PlayerState): void {
    if (!this.stressMode || this.orbiterDrill || this.chargerDrill || this.splitterDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill) return;
    this.weaponSystem.maintainStressProjectiles(player);
  }

  private defeatEnemy(enemy: EnemyState): void {
    const x = enemy.x;
    const y = enemy.y;
    const kind = enemy.kind;
    const splitterDepth = enemy.splitterDepth;
    const experience = ENEMY_DEFINITIONS[kind].experience * this.experienceMultiplier;
    this.enemies.release(enemy);
    this.stats.kills += 1;
    this.stats.experience += experience;
    if (kind === 'boss') {
      this.boss.markDefeated();
      this.pendingEvents.push({ type: 'bossDefeated' });
      return;
    }
    if (kind === 'splitter') {
      this.enemySystem.spawnSplitterChildren(x, y, splitterDepth, this.currentArenaRadius);
    }
    this.pendingEvents.push({ type: 'enemyDefeated', x, y, kind, experience });
  }
}
