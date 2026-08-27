import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import {
  ENEMY_POOL_CAPACITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH
} from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { EnemyPool, type EnemyState } from './EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { LASER_DEFINITION } from '../../content/hazards/LaserDefinition';
import { getSpawnIntervalSeconds } from '../../content/run/DifficultyDefinitions';
import { LaserHazard } from '../hazards/LaserHazard';
import type { CombatRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { CombatWeaponSystem } from './CombatWeaponSystem';

export { selectEnemyKind } from '../enemies/EnemySystem';

export interface CombatSimulationOptions {
  readonly stress?: boolean;
}

export type CombatEvent =
  | {
    readonly type: 'enemyDefeated';
    readonly x: number;
    readonly y: number;
    readonly kind: EnemyKind;
    readonly experience: number;
  }
  | { readonly type: 'playerDamaged'; readonly amount: number };

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
  private readonly enemySystem = new EnemySystem(this.enemies, new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT));
  private readonly weaponSystem = new CombatWeaponSystem(this.enemySystem, (enemy) => this.defeatEnemy(enemy));
  public readonly projectiles = this.weaponSystem.projectiles;
  public readonly laser = new LaserHazard();
  public readonly orbitBlades = this.weaponSystem.orbitBlades;
  public readonly chainSegments = this.weaponSystem.chainSegments;
  public readonly renderState: CombatRenderState = {
    enemies: this.enemies.states,
    projectiles: this.projectiles.states,
    orbitBlades: this.orbitBlades,
    chainSegments: this.chainSegments,
    laser: this.laser.state
  };
  private readonly pendingEvents: CombatEvent[] = [];
  private spawnAccumulator = 0;
  private readonly stressMode: boolean;
  private stressInitialized = false;

  public constructor(options: CombatSimulationOptions = {}) {
    this.stressMode = options.stress === true;
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

  public get currentChainDamage(): number {
    return this.weaponSystem.currentChainDamage;
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

  public addOrbitBlade(): boolean {
    return this.weaponSystem.addOrbitBlade();
  }

  public unlockChainLightning(): boolean {
    return this.weaponSystem.unlockChainLightning();
  }

  public get hasChainLightning(): boolean {
    return this.weaponSystem.hasChainLightning;
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

  public update(dtSeconds: number, player: PlayerState, arenaRadius: number): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    this.pendingEvents.length = 0;
    if (dt === 0) return;

    if (this.stressMode && !this.stressInitialized) {
      this.initializeStress(player, arenaRadius);
    }

    this.stats.elapsedSeconds += dt;
    this.spawnAccumulator += dt;
    if (this.laser.update(dt, this.stats.elapsedSeconds, player, arenaRadius)) {
      this.stats.damageTaken += LASER_DEFINITION.damage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: LASER_DEFINITION.damage });
    }

    const spawnInterval = getSpawnIntervalSeconds(this.stats.elapsedSeconds);
    while (this.spawnAccumulator >= spawnInterval && this.enemies.activeCount < this.enemies.capacity) {
      this.spawnAccumulator -= spawnInterval;
      this.enemySystem.spawn(this.stats.elapsedSeconds, arenaRadius);
    }
    if (this.enemies.activeCount >= this.enemies.capacity) {
      this.spawnAccumulator = Math.min(this.spawnAccumulator, spawnInterval);
    }

    const contactDamage = this.enemySystem.update(dt, player);
    if (contactDamage !== null) {
      this.stats.damageTaken += contactDamage;
      this.pendingEvents.push({ type: 'playerDamaged', amount: contactDamage });
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
    const experience = ENEMY_DEFINITIONS[kind].experience;
    this.enemies.release(enemy);
    this.stats.kills += 1;
    this.stats.experience += experience;
    this.pendingEvents.push({ type: 'enemyDefeated', x, y, kind, experience });
  }
}
