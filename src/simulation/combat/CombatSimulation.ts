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
import { PULSE_RING_DEFINITION, PULSE_RING_DRILL_DEFINITION } from '../../content/hazards/PulseRingDefinition';
import type { RadialPulseDefinition } from '../../content/hazards/RadialPulseDefinition';
import { ANGULAR_SWEEP_DEFINITION, ANGULAR_SWEEP_DRILL_DEFINITION } from '../../content/hazards/AngularSweepDefinition';
import { AngularSweepHazard } from '../hazards/AngularSweepHazard';
import type { CombatRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { CombatWeaponSystem } from './CombatWeaponSystem';
import { BossSystem, type BossAttackGate, type BossInstanceId } from '../bosses/BossSystem';
import { ORBITAL_WARDEN_DEFINITION } from '../../content/bosses/BossDefinition';
import type { PermanentCombatBonuses } from '../../content/meta/PermanentUpgradeDefinitions';
import { asArenaBoundary, type ArenaBoundaryInput } from '../ArenaBoundary';
import { RadialActDirector } from '../acts/RadialActDirector';
import {
  getHazardCadenceProfile,
  type HazardCadenceMode
} from '../../content/hazards/HazardCadenceDefinitions';
import { PULSE_RING_WEAPON_DRILL_COOLDOWN_SECONDS } from '../../content/weapons/WeaponDefinitions';
import type { WeaponEvolutionId, WeaponEvolutionScenario } from '../../content/weapons/WeaponEvolutionDefinitions';
import type { WeaponMasteryChannel, WeaponPathId, WeaponRank } from '../../content/upgrades/UpgradeDefinitions';
import { OVERDRIVE_POWER_INCREMENT } from '../../content/run/OverdriveDefinitions';
import { FractureThreatSystem } from '../fracture/FractureThreatSystem';
import { OverdriveActDirector, type OverdriveBossPair } from '../acts/OverdriveActDirector';
import type { BossId, BossPattern } from '../../content/bosses/BossDefinition';

export { selectEnemyKind } from '../enemies/EnemySystem';

export interface CombatSimulationOptions {
  readonly stress?: boolean;
  /** Optional simulation clock offset used by deterministic development scenarios. */
  readonly initialElapsedSeconds?: number;
  readonly permanentBonuses?: PermanentCombatBonuses;
  readonly actDirector?: RadialActDirector;
  /** Optional seeded pair used by public Overdrive and its reproducible QA routes. */
  readonly overdriveBossPair?: OverdriveBossPair;
  /** Explicit development-only cadence profile; authored is the default. */
  readonly hazardCadenceMode?: HazardCadenceMode;
  /** Isolated first-family scenario; never changes the normal Radial run. */
  readonly orbiterDrill?: boolean;
  /** Isolated second-family scenario; never changes the normal Radial run. */
  readonly chargerDrill?: boolean;
  /** Isolated third-family scenario; the weapon is enabled to demonstrate fracture. */
  readonly splitterDrill?: boolean;
  /** Isolated fourth-family scenario; demonstrates the rotating three-spoke cast. */
  readonly prismWeaverDrill?: boolean;
  /** Isolated EX-07c hazard scenario; not a campaign act. */
  readonly pulseRingDrill?: boolean;
  /** Isolated EX-07d sector hazard scenario; not a campaign act. */
  readonly angularSweepDrill?: boolean;
  /** Isolated EX-07d boss scenario; not a campaign act. */
  readonly wardenDrill?: boolean;
  /** Isolated fifth-weapon scenario; distinct from the Act II hazard drill. */
  readonly pulseRingWeaponDrill?: boolean;
  /** Isolated sixth-weapon scenario; remote magnetic charge and detonation. */
  readonly magneticChargeWeaponDrill?: boolean;
  /** Isolated evolution lab: one durable target or a dense target formation. */
  readonly evolutionDrill?: WeaponEvolutionScenario;
  /** Family selected by the evolution lab; omitted by simulation-only fixtures. */
  readonly evolutionDrillWeapon?: WeaponEvolutionId;
  /** Isolated Act III family drill; never changes the campaign timeline. */
  readonly fractureDrill?: boolean;
  readonly fractureEnemyKind?: EnemyKind;
}

export type CombatEvent =
  | {
    readonly type: 'enemyDefeated';
    readonly x: number;
    readonly y: number;
    readonly kind: EnemyKind;
    readonly experience: number;
  }
  | {
    readonly type: 'bossDefeated';
    readonly bossId?: BossId;
    readonly instanceId?: BossInstanceId;
    readonly x?: number;
    readonly y?: number;
    readonly radius?: number;
  }
  | {
    readonly type: 'playerDamaged';
    readonly amount: number;
    readonly source: 'contact' | 'laser' | 'radial-pulse' | 'pulse-ring' | 'angular-sweep' | 'boss' | 'fracture-projectile' | 'fracture-mine';
  };

export interface CombatStats {
  elapsedSeconds: number;
  kills: number;
  experience: number;
  shotsFired: number;
  damageTaken: number;
}

/**
 * Serializes special attacks for a paired encounter without changing any
 * authored BossDefinition. The lock includes the persistent projectile/mine
 * tail and a short readability gap before the other boss gets priority.
 */
class PairedBossAttackGate implements BossAttackGate {
  private activeOwner: BossInstanceId | null = null;
  private cooldownSeconds = 0;
  private nextPriority: BossInstanceId = 'primary';
  private primaryEnabled = true;
  private secondaryEnabled = true;

  public constructor(private paired: boolean) {}

  public configure(paired: boolean): void {
    this.paired = paired;
    this.activeOwner = null;
    this.cooldownSeconds = 0;
    this.nextPriority = 'primary';
    this.primaryEnabled = true;
    this.secondaryEnabled = paired;
  }

  public update(dtSeconds: number): void {
    this.cooldownSeconds = Math.max(0, this.cooldownSeconds - Math.max(0, dtSeconds));
  }

  public canStart(instanceId: BossInstanceId, _pattern: BossPattern): boolean {
    if (!this.paired) return true;
    return this.isEnabled(instanceId)
      && this.activeOwner === null
      && this.cooldownSeconds <= 0
      && this.nextPriority === instanceId;
  }

  public onStart(instanceId: BossInstanceId, _pattern: BossPattern): void {
    if (!this.paired) return;
    this.activeOwner = instanceId;
    this.nextPriority = instanceId === 'primary' ? 'secondary' : 'primary';
  }

  public onComplete(instanceId: BossInstanceId, pattern: BossPattern): void {
    if (!this.paired || this.activeOwner !== instanceId) return;
    this.activeOwner = null;
    const persistentTail = pattern === 'battery' ? 3.1 : pattern === 'mines' ? 2.45 : 0;
    this.cooldownSeconds = persistentTail + 0.35;
    this.nextPriority = this.nextEnabledOwner(instanceId);
  }

  public skip(instanceId: BossInstanceId): void {
    if (!this.paired) return;
    if (instanceId === 'primary') this.primaryEnabled = false;
    else this.secondaryEnabled = false;
    if (this.activeOwner === instanceId) this.activeOwner = null;
    if (this.nextPriority === instanceId || !this.isEnabled(this.nextPriority)) {
      this.nextPriority = this.nextEnabledOwner(instanceId);
    }
  }

  private isEnabled(instanceId: BossInstanceId): boolean {
    return instanceId === 'primary' ? this.primaryEnabled : this.secondaryEnabled;
  }

  private nextEnabledOwner(after: BossInstanceId): BossInstanceId {
    const other = after === 'primary' ? 'secondary' : 'primary';
    if (this.isEnabled(other)) return other;
    if (this.isEnabled(after)) return after;
    return 'primary';
  }
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
  public readonly secondaryBoss: BossSystem;
  public readonly bosses: readonly BossSystem[];
  private readonly weaponSystem: CombatWeaponSystem;
  public readonly projectiles: ProjectilePool;
  public readonly boomerangs: CombatWeaponSystem['boomerangs'];
  public readonly laser: LaserHazard;
  public readonly radialPulse: RadialPulseHazard;
  public readonly pulseRing: PulseRingHazard;
  public readonly angularSweep: AngularSweepHazard;
  public readonly orbitBlades: CombatWeaponSystem['orbitBlades'];
  public readonly orbitPulse: CombatWeaponSystem['orbitPulse'];
  public readonly chainSegments: CombatWeaponSystem['chainSegments'];
  public readonly chainExplosions: CombatWeaponSystem['chainExplosions'];
  public readonly boomerangStates: readonly BoomerangState[];
  public readonly boomerangPulse: CombatWeaponSystem['boomerangPulse'];
  public readonly pulseRingWeapon: CombatWeaponSystem['pulseRingWeapon'];
  public readonly renderState: CombatRenderState;
  private readonly pendingEvents: CombatEvent[] = [];
  private spawnAccumulator = 0;
  private experienceMultiplier = 1;
  private readonly stressMode: boolean;
  private readonly orbiterDrill: boolean;
  private readonly chargerDrill: boolean;
  private readonly splitterDrill: boolean;
  private readonly prismWeaverDrill: boolean;
  private readonly pulseRingDrill: boolean;
  private readonly angularSweepDrill: boolean;
  private readonly wardenDrill: boolean;
  private readonly pulseRingWeaponDrill: boolean;
  private readonly magneticChargeWeaponDrill: boolean;
  private readonly fractureDrill: boolean;
  private readonly fractureEnemyKind: EnemyKind;
  private readonly evolutionDrill: WeaponEvolutionScenario | null;
  private readonly evolutionDrillWeapon: WeaponEvolutionId | null;
  public readonly fractureThreats: FractureThreatSystem;
  private pulseRingWeaponDrillInitialized = false;
  private magneticChargeWeaponDrillInitialized = false;
  private evolutionDrillInitialized = false;
  public readonly hazardCadenceMode: HazardCadenceMode;
  private readonly initialElapsedSeconds: number;
  private stageElapsedSeconds = 0;
  private stressInitialized = false;
  private currentArenaRadius = 270;
  private readonly overdriveBossPair: OverdriveBossPair | undefined;
  private readonly bossAttackGate: PairedBossAttackGate | undefined;
  private doubleBossEncounter = false;

  public constructor(options: CombatSimulationOptions = {}) {
    this.actDirector = options.actDirector ?? new RadialActDirector();
    this.overdriveBossPair = options.overdriveBossPair;
    this.stressMode = options.stress === true;
    this.orbiterDrill = options.orbiterDrill === true;
    this.chargerDrill = options.chargerDrill === true && !this.orbiterDrill;
    this.splitterDrill = options.splitterDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.stressMode;
    this.prismWeaverDrill = options.prismWeaverDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill && !this.stressMode;
    this.pulseRingDrill = options.pulseRingDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill && !this.prismWeaverDrill && !this.stressMode;
    this.angularSweepDrill = options.angularSweepDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.prismWeaverDrill && !this.pulseRingDrill && !this.stressMode;
    this.wardenDrill = options.wardenDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.prismWeaverDrill && !this.pulseRingDrill && !this.angularSweepDrill && !this.stressMode;
    this.pulseRingWeaponDrill = options.pulseRingWeaponDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.prismWeaverDrill && !this.pulseRingDrill && !this.angularSweepDrill
      && !this.wardenDrill && !this.stressMode;
    this.magneticChargeWeaponDrill = options.magneticChargeWeaponDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.prismWeaverDrill && !this.pulseRingDrill && !this.angularSweepDrill
      && !this.wardenDrill && !this.pulseRingWeaponDrill && !this.stressMode;
    this.fractureDrill = options.fractureDrill === true
      && !this.orbiterDrill && !this.chargerDrill && !this.splitterDrill
      && !this.prismWeaverDrill && !this.pulseRingDrill && !this.angularSweepDrill
      && !this.wardenDrill && !this.pulseRingWeaponDrill && !this.magneticChargeWeaponDrill
      && !this.stressMode;
    this.fractureEnemyKind = options.fractureEnemyKind ?? 'fracture-gunner';
    this.evolutionDrill = options.evolutionDrill ?? null;
    this.evolutionDrillWeapon = options.evolutionDrillWeapon ?? null;
    const hazardCadence = getHazardCadenceProfile(options.hazardCadenceMode);
    const isAngularAct = this.actDirector.definition.id === 'angular';
    const radialPulseDefinition = {
      ...this.actDirector.radialPulseDefinition,
      intervalSeconds: this.actDirector.radialPulseDefinition.intervalSeconds
        * hazardCadence.radialPulseIntervalMultiplier
    };
    this.fractureThreats = new FractureThreatSystem();
    this.enemySystem = new EnemySystem(
      this.enemies,
      new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT),
      this.actDirector,
      this.fractureThreats
    );
    const initialBosses = this.getOverdriveBossEncounter();
    this.bossAttackGate = this.actDirector instanceof OverdriveActDirector
      ? new PairedBossAttackGate(initialBosses.length > 1)
      : undefined;
    this.doubleBossEncounter = initialBosses.length > 1;
    this.boss = new BossSystem(
      this.enemySystem,
      initialBosses[0] ?? (this.wardenDrill ? ORBITAL_WARDEN_DEFINITION : this.actDirector.bossDefinition),
      this.fractureThreats,
      'primary',
      this.bossAttackGate
    );
    this.secondaryBoss = new BossSystem(
      this.enemySystem,
      initialBosses[1] ?? initialBosses[0] ?? this.actDirector.bossDefinition,
      this.fractureThreats,
      'secondary',
      this.bossAttackGate
    );
    this.secondaryBoss.setEnabled(initialBosses.length > 1);
    this.bosses = [this.boss, this.secondaryBoss];
    this.laser = new LaserHazard(
      LASER_DEFINITION,
      this.actDirector,
      hazardCadence.laserIntervalMultiplier
    );
    this.radialPulse = new RadialPulseHazard(radialPulseDefinition);
    this.pulseRing = new PulseRingHazard(
      this.pulseRingDrill
        ? PULSE_RING_DRILL_DEFINITION
        : isAngularAct || this.actDirector.definition.id === 'fracture'
          ? this.actDirector.pulseRingDefinition : undefined
    );
    this.angularSweep = new AngularSweepHazard(
      this.angularSweepDrill || this.wardenDrill
        ? ANGULAR_SWEEP_DRILL_DEFINITION
        : isAngularAct || this.actDirector.definition.id === 'fracture'
          ? this.actDirector.angularSweepDefinition : ANGULAR_SWEEP_DEFINITION
    );
    this.weaponSystem = new CombatWeaponSystem(
      this.enemySystem,
      (enemy) => this.defeatEnemy(enemy),
      options.permanentBonuses
    );
    if (this.pulseRingWeaponDrill) this.weaponSystem.unlockPulseRing();
    if (this.magneticChargeWeaponDrill) this.weaponSystem.unlockMagneticCharge();
    this.projectiles = this.weaponSystem.projectiles;
    this.boomerangs = this.weaponSystem.boomerangs;
    this.orbitBlades = this.weaponSystem.orbitBlades;
    this.orbitPulse = this.weaponSystem.orbitPulse;
    this.chainSegments = this.weaponSystem.chainSegments;
    this.chainExplosions = this.weaponSystem.chainExplosions;
    this.boomerangStates = this.weaponSystem.boomerangStates;
    this.boomerangPulse = this.weaponSystem.boomerangPulse;
    this.pulseRingWeapon = this.weaponSystem.pulseRingWeapon;
    this.renderState = {
      enemies: this.enemies.states,
      projectiles: this.projectiles.states,
      orbitBlades: this.orbitBlades,
      orbitPulse: this.orbitPulse,
      chainSegments: this.chainSegments,
      chainExplosions: this.chainExplosions,
      boomerangs: this.boomerangStates,
      boomerangPulse: this.boomerangPulse,
      pulseRingWeapon: this.pulseRingWeapon,
      magneticCharge: this.weaponSystem.magneticCharge,
      laser: this.laser.state,
      radialPulse: this.radialPulse.state,
      pulseRing: this.pulseRing.state,
      angularSweep: this.angularSweep.state,
      boss: this.boss.state,
      bosses: this.bosses.map((system) => system.state),
      fractureProjectiles: this.fractureThreats.projectiles,
      fractureMines: this.fractureThreats.mines,
      shot: this.weaponSystem.lastShot
    };
    this.hazardCadenceMode = options.hazardCadenceMode ?? 'chaos';
    this.initialElapsedSeconds = Number.isFinite(options.initialElapsedSeconds)
      ? Math.max(0, options.initialElapsedSeconds ?? 0)
      : 0;
    this.stats.elapsedSeconds = this.initialElapsedSeconds;
    this.stageElapsedSeconds = this.initialElapsedSeconds;
  }

  public get isStressMode(): boolean {
    return this.stressMode;
  }

  public get allBossesDefeated(): boolean {
    return this.bosses.some((system) => system.state.phase !== 'inactive')
      && this.bosses.every((system) => !system.state.active);
  }

  public get activeBossCount(): number {
    return this.bosses.reduce((count, system) => count + (system.state.active ? 1 : 0), 0);
  }

  public get currentProjectileDamage(): number {
    return this.weaponSystem.currentProjectileDamage;
  }

  /** Presentation feedback for one or more critical procs authored this run. */
  public get criticalHitSequence(): number {
    return this.weaponSystem.criticalHitSequence;
  }

  private getOverdriveBossEncounter(): readonly import('../../content/bosses/BossDefinition').BossDefinition[] {
    if (this.actDirector instanceof OverdriveActDirector) {
      return this.actDirector.getBossEncounter(this.overdriveBossPair);
    }
    return [this.wardenDrill ? ORBITAL_WARDEN_DEFINITION : this.actDirector.bossDefinition];
  }

  public get currentProjectileCooldown(): number {
    return this.weaponSystem.currentProjectileCooldown;
  }

  public get currentProjectileSpeed(): number {
    return this.weaponSystem.currentProjectileSpeed;
  }

  public get currentProjectileRank(): number {
    return this.weaponSystem.currentProjectileRank;
  }

  public get currentProjectileEvolution(): CombatWeaponSystem['currentProjectileEvolution'] {
    return this.weaponSystem.currentProjectileEvolution;
  }

  public get currentOrbitEvolution(): CombatWeaponSystem['currentOrbitEvolution'] {
    return this.weaponSystem.currentOrbitEvolution;
  }

  public get currentChainEvolution(): CombatWeaponSystem['currentChainEvolution'] {
    return this.weaponSystem.currentChainEvolution;
  }

  public get currentBoomerangEvolution(): CombatWeaponSystem['currentBoomerangEvolution'] {
    return this.weaponSystem.currentBoomerangEvolution;
  }

  public get currentPulseRingEvolution(): CombatWeaponSystem['currentPulseRingEvolution'] {
    return this.weaponSystem.currentPulseRingEvolution;
  }

  public get currentMagneticChargeEvolution(): CombatWeaponSystem['currentMagneticChargeEvolution'] {
    return this.weaponSystem.currentMagneticChargeEvolution;
  }

  public get currentOrbitRadius(): number {
    return this.weaponSystem.currentOrbitRadius;
  }

  public get currentOrbitContactRadius(): number {
    return this.weaponSystem.currentOrbitContactRadius;
  }

  public getWeaponPathRank(path: WeaponPathId): number {
    switch (path) {
      case 'projectile': return this.weaponSystem.currentProjectileRank;
      case 'orbit': return this.weaponSystem.currentOrbitRank;
      case 'chain': return this.weaponSystem.currentChainRank;
      case 'boomerang': return this.weaponSystem.currentBoomerangRank;
      case 'pulse_ring': return this.weaponSystem.currentPulseRingRank;
      case 'magnetic_charge': return this.weaponSystem.currentMagneticChargeRank;
    }
  }

  public get isOrbiterDrill(): boolean {
    return this.orbiterDrill;
  }

  public get isChargerDrill(): boolean { return this.chargerDrill; }

  public get isSplitterDrill(): boolean { return this.splitterDrill; }

  public get isPrismWeaverDrill(): boolean { return this.prismWeaverDrill; }

  public get isPulseRingDrill(): boolean { return this.pulseRingDrill; }

  public get isAngularSweepDrill(): boolean { return this.angularSweepDrill; }

  public get isWardenDrill(): boolean { return this.wardenDrill; }

  public get isPulseRingWeaponDrill(): boolean { return this.pulseRingWeaponDrill; }

  public get isMagneticChargeWeaponDrill(): boolean { return this.magneticChargeWeaponDrill; }

  public get isFractureDrill(): boolean { return this.fractureDrill; }

  public get isEvolutionDrill(): boolean { return this.evolutionDrill !== null; }

  public get evolutionDrillMode(): WeaponEvolutionScenario | null { return this.evolutionDrill; }

  public get isAngularAct(): boolean {
    return this.actDirector.definition.id === 'angular';
  }

  public get isFractureAct(): boolean {
    return this.actDirector.definition.id === 'fracture';
  }

  public get actId(): 'radial' | 'angular' | 'fracture' {
    return this.actDirector.definition.id;
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

  public get currentChainJumpRadius(): number {
    return this.weaponSystem.currentChainJumpRadius;
  }

  public get currentBoomerangDamage(): number {
    return this.weaponSystem.currentBoomerangDamage;
  }

  public get currentBoomerangCooldown(): number {
    return this.weaponSystem.currentBoomerangCooldown;
  }

  public get currentBoomerangOutboundDistance(): number {
    return this.weaponSystem.currentBoomerangOutboundDistance;
  }

  public get currentPulseRingDamage(): number {
    return this.weaponSystem.currentPulseRingDamage;
  }

  public get currentPulseRingCooldown(): number {
    return this.weaponSystem.currentPulseRingCooldown;
  }

  public get currentPulseRingEndRadius(): number {
    return this.weaponSystem.currentPulseRingEndRadius;
  }

  public get currentMagneticChargeDamage(): number {
    return this.weaponSystem.currentMagneticChargeDamage;
  }

  public get currentMagneticChargeCooldown(): number {
    return this.weaponSystem.currentMagneticChargeCooldown;
  }

  public get currentMagneticChargeOuterRadius(): number {
    return this.weaponSystem.currentMagneticChargeOuterRadius;
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

  public getOverdrivePowerMultiplier(family: WeaponPathId): number {
    return this.weaponSystem.getOverdrivePowerMultiplier(family);
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

  public setProjectileRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    return this.weaponSystem.setProjectileRank(rank);
  }

  public setWeaponRank(path: WeaponPathId, rank: WeaponRank): boolean {
    return this.weaponSystem.setWeaponRank(path, rank);
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

  public applyProjectileEvolution(evolution: Parameters<CombatWeaponSystem['applyProjectileEvolution']>[0]): boolean {
    return this.weaponSystem.applyProjectileEvolution(evolution);
  }

  public applyOrbitEvolution(evolution: Parameters<CombatWeaponSystem['applyOrbitEvolution']>[0]): boolean {
    return this.weaponSystem.applyOrbitEvolution(evolution);
  }

  public applyChainEvolution(evolution: Parameters<CombatWeaponSystem['applyChainEvolution']>[0]): boolean {
    return this.weaponSystem.applyChainEvolution(evolution);
  }

  public applyBoomerangEvolution(evolution: Parameters<CombatWeaponSystem['applyBoomerangEvolution']>[0]): boolean {
    return this.weaponSystem.applyBoomerangEvolution(evolution);
  }

  public applyPulseRingEvolution(evolution: Parameters<CombatWeaponSystem['applyPulseRingEvolution']>[0]): boolean {
    return this.weaponSystem.applyPulseRingEvolution(evolution);
  }

  public applyMagneticChargeEvolution(evolution: Parameters<CombatWeaponSystem['applyMagneticChargeEvolution']>[0]): boolean {
    return this.weaponSystem.applyMagneticChargeEvolution(evolution);
  }

  public unlockVectorBoomerang(): boolean {
    return this.weaponSystem.unlockVectorBoomerang();
  }

  public get hasVectorBoomerang(): boolean {
    return this.weaponSystem.hasVectorBoomerang;
  }

  public unlockPulseRing(): boolean {
    return this.weaponSystem.unlockPulseRing();
  }

  public get hasPulseRing(): boolean {
    return this.weaponSystem.hasPulseRing;
  }

  public unlockMagneticCharge(): boolean {
    return this.weaponSystem.unlockMagneticCharge();
  }

  public get hasMagneticCharge(): boolean {
    return this.weaponSystem.hasMagneticCharge;
  }

  public increasePulseRingDamage(amount: number): void {
    this.weaponSystem.increasePulseRingDamage(amount);
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

  public applyWeaponMastery(family: WeaponPathId, channel: WeaponMasteryChannel): boolean {
    return this.weaponSystem.applyWeaponMastery(family, channel);
  }

  public applyOverdrivePower(family: WeaponPathId, amount: number = OVERDRIVE_POWER_INCREMENT): boolean {
    return this.weaponSystem.applyOverdrivePower(family, amount);
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
    this.stageElapsedSeconds += dt;
    this.spawnAccumulator += dt;
    const angularAct = this.isAngularAct;
    const fractureAct = this.isFractureAct;
    const isolatedAngularDrill = this.orbiterDrill || this.chargerDrill || this.splitterDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill
      || this.pulseRingWeaponDrill || this.magneticChargeWeaponDrill || this.evolutionDrill !== null
      || this.fractureDrill;
    if (!isolatedAngularDrill && !angularAct && this.laser.update(
      dt,
      this.stageElapsedSeconds,
      player,
      arenaBoundary,
      !this.isPairedBossHazardWindowBlocked() && this.radialPulse.state.phase === 'idle'
    )) {
      this.stats.damageTaken += LASER_DEFINITION.damage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: LASER_DEFINITION.damage, source: 'laser' });
    }
    if (!isolatedAngularDrill && !angularAct && this.radialPulse.update(
      dt,
      this.stageElapsedSeconds,
      player,
      arenaBoundary,
      !this.isPairedBossHazardWindowBlocked() && this.laser.state.phase === 'idle',
      this.activeBossCount > 0
    )) {
      this.stats.damageTaken += this.actDirector.radialPulseDefinition.damage;
      this.pendingEvents.push({
        type: 'playerDamaged',
        amount: this.actDirector.radialPulseDefinition.damage,
        source: 'radial-pulse'
      });
    }

    if (this.pulseRingDrill || angularAct || fractureAct) {
      const pulse = this.pulseRing.update(
        dt,
        this.stageElapsedSeconds,
        player,
        arenaBoundary,
        !this.isPairedBossHazardWindowBlocked() && !this.boss.state.active,
        this.activeBossCount > 0
      );
      if (pulse.pushX !== 0 || pulse.pushY !== 0) applyHazardPush(player, pulse.pushX, pulse.pushY, arenaBoundary);
      if (pulse.damaged) {
        this.stats.damageTaken += this.actDirector.pulseRingDefinition.damage;
        this.pendingEvents.push({
          type: 'playerDamaged',
          amount: this.actDirector.pulseRingDefinition.damage,
          source: 'pulse-ring'
        });
      }
    }

    if (this.angularSweepDrill || this.wardenDrill || angularAct || fractureAct) {
      const sector = this.angularSweep.update(
        dt,
        this.stageElapsedSeconds,
        player,
        arenaBoundary,
          angularAct || fractureAct
            ? !this.isPairedBossHazardWindowBlocked() && !this.boss.state.active
          : !this.wardenDrill || this.boss.state.phase === 'recovery' || !this.boss.state.active
      );
      if (sector.damaged) {
        this.stats.damageTaken += this.actDirector.angularSweepDefinition.damage;
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
    } else if (this.prismWeaverDrill) {
      if (!this.enemies.states.some((enemy) => enemy.active && enemy.kind === 'prism-weaver')) {
        this.enemySystem.spawnPrismWeaverDrill(arenaRadius);
      }
    } else if (this.pulseRingDrill) {
      // The EX-07c drill isolates the hazard so its opening and push can be
      // read without enemy silhouettes hiding the answer.
    } else if (this.pulseRingWeaponDrill) {
      if (!this.pulseRingWeaponDrillInitialized) {
        this.enemySystem.spawnPulseRingWeaponDrill(arenaRadius);
        this.pulseRingWeaponDrillInitialized = true;
      }
    } else if (this.magneticChargeWeaponDrill) {
      if (!this.magneticChargeWeaponDrillInitialized) {
        this.enemySystem.spawnMagneticChargeWeaponDrill(arenaRadius);
        this.magneticChargeWeaponDrillInitialized = true;
      }
    } else if (this.fractureDrill) {
      if (!this.enemies.states.some((enemy) => enemy.active && enemy.kind === this.fractureEnemyKind)) {
        this.enemySystem.spawnFractureDrill(arenaRadius, this.fractureEnemyKind);
      }
    } else if (this.evolutionDrill !== null) {
      if (!this.evolutionDrillInitialized) {
        this.enemySystem.spawnEvolutionDrill(arenaRadius, this.evolutionDrill);
        this.evolutionDrillInitialized = true;
      }
    } else if (this.angularSweepDrill || this.wardenDrill) {
      // EX-07d keeps the hazard/boss pair readable before campaign composition.
    } else {
      const spawnInterval = this.actDirector.getSpawnIntervalSeconds(this.stageElapsedSeconds);
      const reservedBossSlots = this.stressMode
        ? 0
        : this.actDirector instanceof OverdriveActDirector ? this.bosses.length : 1;
      const normalEnemyCapacity = Math.max(
        0,
        this.enemies.capacity - reservedBossSlots - this.enemySystem.reservedSlots
      );
      while (this.spawnAccumulator >= spawnInterval && this.enemies.activeCount < normalEnemyCapacity) {
        this.spawnAccumulator -= spawnInterval;
        this.enemySystem.spawn(this.stageElapsedSeconds, arenaRadius);
      }
      if (this.enemies.activeCount >= normalEnemyCapacity) {
        this.spawnAccumulator = Math.min(this.spawnAccumulator, spawnInterval);
      }
    }

    if (!this.stressMode && (!isolatedAngularDrill || this.wardenDrill)) {
      this.bossAttackGate?.update(dt);
      for (const bossSystem of this.bosses) {
        const bossDamage = bossSystem.update(dt, this.stageElapsedSeconds, player, arenaRadius);
        if (bossDamage > 0) {
          this.stats.damageTaken += bossDamage;
          this.pendingEvents.push({ type: 'playerDamaged', amount: bossDamage, source: 'boss' });
        }
      }
    }

    const contactDamage = this.enemySystem.update(dt, player, arenaRadius);
    if (contactDamage !== null) {
      this.stats.damageTaken += contactDamage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: contactDamage, source: 'contact' });
    }
    this.enemySystem.rebuildGrid();
    // Orbiter/Charger/Prism teach a committed route and keep their authored
    // target alive. Splitter and Warden deliberately keep autofire: their
    // lessons are the bounded fracture and destructible copies, respectively.
    if (!this.orbiterDrill && !this.chargerDrill && !this.prismWeaverDrill && !this.angularSweepDrill) {
      this.weaponSystem.update(dt, player, this.evolutionDrillWeapon !== null
        ? getEvolutionWeaponUpdateOptions(this.evolutionDrillWeapon, arenaBoundary)
        : this.pulseRingWeaponDrill
        ? {
          projectileEnabled: false,
          orbitEnabled: false,
          chainEnabled: false,
          boomerangEnabled: false,
          pulseRingEnabled: true,
          magneticChargeArena: arenaBoundary,
          pulseRingCooldownSeconds: PULSE_RING_WEAPON_DRILL_COOLDOWN_SECONDS
        }
        : this.magneticChargeWeaponDrill
          ? {
            projectileEnabled: false,
            orbitEnabled: false,
            chainEnabled: false,
            boomerangEnabled: false,
            pulseRingEnabled: false,
            magneticChargeEnabled: true,
            magneticChargeArena: arenaBoundary,
            magneticChargeCooldownSeconds: 1.8
          }
        : { magneticChargeArena: arenaBoundary, arena: arenaBoundary });
    }
    const threatDamage = this.fractureThreats.update(dt, player, arenaBoundary);
    if (threatDamage) {
      this.stats.damageTaken += threatDamage.amount;
      this.pendingEvents.push({
        type: 'playerDamaged',
        amount: threatDamage.amount,
        source: threatDamage.source
      });
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
    this.secondaryBoss.reset();
    this.weaponSystem.reset();
    // Development drills must remain directly playable after restart/pause.
    // `CombatWeaponSystem.reset()` correctly clears run-owned unlocks, so
    // re-apply this drill-only unlock without changing campaign progression.
    if (this.pulseRingWeaponDrill) this.weaponSystem.unlockPulseRing();
    if (this.magneticChargeWeaponDrill) this.weaponSystem.unlockMagneticCharge();
    this.laser.reset();
    this.radialPulse.reset();
    this.pulseRing.reset();
    this.angularSweep.reset();
    this.fractureThreats.reset();
    this.stats.elapsedSeconds = this.initialElapsedSeconds;
    this.stageElapsedSeconds = this.initialElapsedSeconds;
    this.stats.kills = 0;
    this.stats.experience = 0;
    this.stats.shotsFired = 0;
    this.stats.damageTaken = 0;
    this.experienceMultiplier = 1;
    this.pendingEvents.length = 0;
    this.spawnAccumulator = 0;
    this.pulseRingWeaponDrillInitialized = false;
    this.magneticChargeWeaponDrillInitialized = false;
    this.evolutionDrillInitialized = false;
    this.stressInitialized = false;
  }

  /**
   * Clears stage-owned entities and clocks while preserving the run-owned
   * build, XP, modifiers, stats and weapon cooldown accumulators.
   * `OverdriveActDirector.setStage()` must run immediately before this call.
   */
  public reconfigureOverdriveStage(): void {
    this.enemySystem.reset();
    const encounter = this.getOverdriveBossEncounter();
    this.doubleBossEncounter = encounter.length > 1;
    this.bossAttackGate?.configure(encounter.length > 1);
    this.boss.reconfigure(encounter[0] ?? this.actDirector.bossDefinition);
    this.secondaryBoss.reconfigure(encounter[1] ?? encounter[0] ?? this.actDirector.bossDefinition);
    this.secondaryBoss.setEnabled(encounter.length > 1);
    this.weaponSystem.clearTransientState();
    this.laser.reset();
    this.radialPulse.reconfigure(this.createRadialPulseDefinition());
    this.pulseRing.reconfigure(this.actDirector.definition.id === 'angular' || this.actDirector.definition.id === 'fracture'
      ? this.actDirector.pulseRingDefinition
      : PULSE_RING_DEFINITION);
    this.angularSweep.reconfigure(this.actDirector.definition.id === 'angular' || this.actDirector.definition.id === 'fracture'
      ? this.actDirector.angularSweepDefinition
      : ANGULAR_SWEEP_DEFINITION);
    this.fractureThreats.reset();
    this.stageElapsedSeconds = 0;
    this.spawnAccumulator = 0;
    this.pendingEvents.length = 0;
    this.pulseRingWeaponDrillInitialized = false;
    this.magneticChargeWeaponDrillInitialized = false;
    this.evolutionDrillInitialized = false;
    this.stressInitialized = false;
  }

  /**
   * Paired encounters suppress only new arena hazards after the boss window
   * begins. Hazards authored before that window are allowed to finish, which
   * preserves the first-lap timeline and avoids an empty pre-boss stage.
   */
  private isPairedBossHazardWindowBlocked(): boolean {
    return this.doubleBossEncounter
      && this.stageElapsedSeconds + 0.000001 >= this.actDirector.bossStartSeconds;
  }

  private createRadialPulseDefinition(): RadialPulseDefinition {
    return {
      ...this.actDirector.radialPulseDefinition,
      intervalSeconds: this.actDirector.radialPulseDefinition.intervalSeconds
        * getHazardCadenceProfile(this.hazardCadenceMode).radialPulseIntervalMultiplier
    };
  }

  private initializeStress(player: PlayerState, arenaRadius: number): void {
    this.enemySystem.initializeStress(arenaRadius);
    this.weaponSystem.initializeStress(player);
    this.stressInitialized = true;
  }

  private maintainStressEnemies(arenaRadius: number): void {
    if (!this.stressMode || this.orbiterDrill || this.chargerDrill || this.splitterDrill || this.prismWeaverDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill
      || this.pulseRingWeaponDrill || this.magneticChargeWeaponDrill || this.fractureDrill) return;
    this.enemySystem.maintainStress(arenaRadius);
  }

  private maintainStressProjectiles(player: PlayerState): void {
    if (!this.stressMode || this.orbiterDrill || this.chargerDrill || this.splitterDrill || this.prismWeaverDrill
      || this.pulseRingDrill || this.angularSweepDrill || this.wardenDrill
      || this.pulseRingWeaponDrill || this.magneticChargeWeaponDrill || this.fractureDrill) return;
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
      const owner = this.bosses.find((system) => system.ownsEnemy(enemy)) ?? this.boss;
      owner.markDefeated();
      if (owner?.instanceId !== undefined) this.bossAttackGate?.skip(owner.instanceId);
      this.pendingEvents.push({
        type: 'bossDefeated',
        bossId: enemy.bossId,
        instanceId: owner?.instanceId,
        x,
        y,
        radius: enemy.radius
      });
      return;
    }
    if (kind === 'splitter') {
      this.enemySystem.spawnSplitterChildren(x, y, splitterDepth, this.currentArenaRadius);
    }
    this.pendingEvents.push({ type: 'enemyDefeated', x, y, kind, experience });
  }
}

const getEvolutionWeaponUpdateOptions = (
  evolution: WeaponEvolutionId,
  arena: ArenaBoundaryInput
): Parameters<CombatWeaponSystem['update']>[2] => {
  const family = evolution === 'rail_lance' || evolution === 'pulse_volley'
    ? 'projectile'
    : evolution === 'solar_crown' || evolution === 'graviton_halo'
      ? 'orbit'
      : evolution === 'closed_circuit' || evolution === 'thunderhead'
        ? 'chain'
        : evolution === 'twin_comet' || evolution === 'singularity_return'
          ? 'boomerang'
          : evolution === 'echo_shock' || evolution === 'compression_wave'
            ? 'pulse_ring'
            : 'magnetic_charge';
  return {
    projectileEnabled: family === 'projectile',
    orbitEnabled: family === 'orbit',
    chainEnabled: family === 'chain',
    boomerangEnabled: family === 'boomerang',
    pulseRingEnabled: family === 'pulse_ring',
    magneticChargeEnabled: family === 'magnetic_charge',
    magneticChargeArena: arena,
    arena
  };
};
