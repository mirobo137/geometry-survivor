import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import {
  ARENA_CENTER,
  ENEMY_POOL_CAPACITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PROJECTILE_POOL_CAPACITY
} from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { EnemyPool, ProjectilePool, type EnemyState } from './EntityPools';
import { SpatialGrid } from '../spatial/SpatialGrid';

const CONTACT_COOLDOWN_SECONDS = 0.45;
const SPAWN_RADIUS_PADDING = 80;
const STRESS_ENEMY_KINDS: readonly EnemyKind[] = ['chaser', 'fast', 'tank'];
const FULL_CIRCLE = Math.PI * 2;
const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const ORBIT_DEFINITION = WEAPON_DEFINITIONS.orbit;
const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;

export interface OrbitBladeState {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface ChainSegmentState {
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lifeSeconds: number;
}

const createOrbitBladeState = (): OrbitBladeState => ({
  active: false,
  x: 0,
  y: 0,
  radius: ORBIT_DEFINITION.radius,
  angle: 0
});

const createChainSegmentState = (): ChainSegmentState => ({
  active: false,
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
  lifeSeconds: 0
});

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
  public readonly projectiles = new ProjectilePool(PROJECTILE_POOL_CAPACITY);
  public readonly orbitBlades = Array.from({ length: ORBIT_DEFINITION.maxBlades }, createOrbitBladeState);
  public readonly chainSegments = Array.from({ length: CHAIN_DEFINITION.maxTargets }, createChainSegmentState);
  public readonly stats: CombatStats = {
    elapsedSeconds: 0,
    kills: 0,
    experience: 0,
    shotsFired: 0,
    damageTaken: 0
  };
  private readonly enemyGrid = new SpatialGrid(LOGICAL_WIDTH, LOGICAL_HEIGHT);
  private readonly pendingEvents: CombatEvent[] = [];
  private spawnAccumulator = 0;
  private attackAccumulator = 0;
  private contactCooldown = 0;
  private spawnIndex = 0;
  private stressProjectileIndex = 0;
  private readonly stressMode: boolean;
  private stressInitialized = false;
  private projectileDamage = PROJECTILE_DEFINITION.damage;
  private orbitBladeCount = 0;
  private orbitAngle = 0;
  private chainLightningUnlocked = false;
  private chainAccumulator = 0;
  private readonly chainHitIndices = Array.from({ length: CHAIN_DEFINITION.maxTargets }, () => -1);

  public constructor(options: CombatSimulationOptions = {}) {
    this.stressMode = options.stress === true;
  }

  public get isStressMode(): boolean {
    return this.stressMode;
  }

  public increaseProjectileDamage(amount: number): void {
    this.projectileDamage += Math.max(0, amount);
  }

  public addOrbitBlade(): boolean {
    if (this.orbitBladeCount >= this.orbitBlades.length) return false;
    this.orbitBladeCount += 1;
    return true;
  }

  public unlockChainLightning(): void {
    this.chainLightningUnlocked = true;
  }

  public get hasChainLightning(): boolean {
    return this.chainLightningUnlocked;
  }

  public get activeOrbitBlades(): number {
    return this.orbitBladeCount;
  }

  public update(dtSeconds: number, player: PlayerState, arenaRadius: number): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    this.pendingEvents.length = 0;
    if (dt === 0) return;

    if (this.stressMode && !this.stressInitialized) {
      this.initializeStress(player, arenaRadius);
    }

    this.stats.elapsedSeconds += dt;
    this.contactCooldown = Math.max(0, this.contactCooldown - dt);
    this.spawnAccumulator += dt;
    this.attackAccumulator += dt;
    this.updateChainSegments(dt);

    const spawnInterval = Math.max(0.28, 0.85 - this.stats.elapsedSeconds * 0.002);
    while (this.spawnAccumulator >= spawnInterval && this.enemies.activeCount < this.enemies.capacity) {
      this.spawnAccumulator -= spawnInterval;
      this.spawnEnemy(arenaRadius);
    }
    if (this.enemies.activeCount >= this.enemies.capacity) {
      this.spawnAccumulator = Math.min(this.spawnAccumulator, spawnInterval);
    }

    this.updateEnemies(dt, player);
    this.rebuildEnemyGrid();
    this.updateOrbit(dt, player);

    while (this.attackAccumulator >= PROJECTILE_DEFINITION.cooldownSeconds) {
      this.attackAccumulator -= PROJECTILE_DEFINITION.cooldownSeconds;
      this.fireProjectile(player);
    }

    if (this.chainLightningUnlocked) {
      this.chainAccumulator += dt;
      while (this.chainAccumulator >= CHAIN_DEFINITION.cooldownSeconds) {
        this.chainAccumulator -= CHAIN_DEFINITION.cooldownSeconds;
        this.fireChainLightning(player);
      }
    }

    this.updateProjectiles(dt);
    this.maintainStressEnemies(arenaRadius);
    this.maintainStressProjectiles(player);
  }

  public get events(): readonly CombatEvent[] {
    return this.pendingEvents;
  }

  private spawnEnemy(arenaRadius: number): void {
    const state = this.enemies.acquire();
    if (!state) return;

    const index = this.spawnIndex;
    this.spawnIndex += 1;
    const kind = this.selectEnemyKind(this.stats.elapsedSeconds, index);
    this.configureEnemy(state, arenaRadius, index, kind);
  }

  private configureEnemy(state: EnemyState, arenaRadius: number, index: number, kind: EnemyKind): void {
    const definition = ENEMY_DEFINITIONS[kind];
    const angle = index * 2.399963229728653;
    const distance = Math.max(arenaRadius + SPAWN_RADIUS_PADDING + (index % 4) * 24, 380);
    state.kind = kind;
    state.x = ARENA_CENTER.x + Math.cos(angle) * distance;
    state.y = ARENA_CENTER.y + Math.sin(angle) * distance;
    state.radius = definition.radius;
    state.speed = definition.speed;
    state.maxHealth = definition.maxHealth;
    state.health = definition.maxHealth;
    state.contactDamage = definition.contactDamage;
    state.orbitHitCooldown = 0;
  }

  private initializeStress(player: PlayerState, arenaRadius: number): void {
    for (let index = 0; index < this.enemies.capacity; index += 1) {
      const state = this.enemies.acquire();
      if (!state) break;
      const kind = STRESS_ENEMY_KINDS[index % STRESS_ENEMY_KINDS.length];
      this.configureEnemy(state, arenaRadius, index, kind);
    }
    this.rebuildEnemyGrid();
    for (let index = 0; index < this.projectiles.capacity; index += 1) {
      this.spawnStressProjectile(player, index);
    }
    this.stressProjectileIndex = this.projectiles.capacity;
    this.stressInitialized = true;
  }

  private maintainStressEnemies(arenaRadius: number): void {
    if (!this.stressMode) return;
    while (this.enemies.activeCount < this.enemies.capacity) {
      const state = this.enemies.acquire();
      if (!state) break;
      const index = this.spawnIndex;
      this.spawnIndex += 1;
      const kind = STRESS_ENEMY_KINDS[index % STRESS_ENEMY_KINDS.length];
      this.configureEnemy(state, arenaRadius, index, kind);
    }
  }

  private spawnStressProjectile(player: PlayerState, index: number): void {
    const projectile = this.projectiles.acquire();
    if (!projectile) return;
    const angle = index * 2.399963229728653;
    projectile.active = true;
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.vx = Math.cos(angle) * PROJECTILE_DEFINITION.speed;
    projectile.vy = Math.sin(angle) * PROJECTILE_DEFINITION.speed;
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.projectileDamage;
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    this.stats.shotsFired += 1;
  }

  private maintainStressProjectiles(player: PlayerState): void {
    if (!this.stressMode) return;
    while (this.projectiles.activeCount < this.projectiles.capacity) {
      const activeCount = this.projectiles.activeCount;
      this.spawnStressProjectile(player, this.stressProjectileIndex);
      this.stressProjectileIndex += 1;
      if (this.projectiles.activeCount === activeCount) break;
    }
  }

  private selectEnemyKind(elapsedSeconds: number, index: number): EnemyKind {
    if (elapsedSeconds < 20) return 'chaser';
    if (elapsedSeconds < 100) return index % 4 === 0 ? 'fast' : 'chaser';
    if (index % 5 === 0) return 'tank';
    return index % 2 === 0 ? 'fast' : 'chaser';
  }

  private updateEnemies(dt: number, player: PlayerState): void {
    for (const enemy of this.enemies.states) {
      if (!enemy.active) continue;
      enemy.orbitHitCooldown = Math.max(0, enemy.orbitHitCooldown - dt);
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.001) {
        const step = Math.min(distance, enemy.speed * dt);
        enemy.x += (dx / distance) * step;
        enemy.y += (dy / distance) * step;
      }
      if (
        this.contactCooldown <= 0
        && Math.hypot(player.x - enemy.x, player.y - enemy.y) <= player.radius + enemy.radius
      ) {
        this.contactCooldown = CONTACT_COOLDOWN_SECONDS;
        this.stats.damageTaken += enemy.contactDamage;
        this.pendingEvents.push({ type: 'playerDamaged', amount: enemy.contactDamage });
      }
    }
  }

  private rebuildEnemyGrid(): void {
    this.enemyGrid.clear();
    for (let index = 0; index < this.enemies.states.length; index += 1) {
      const enemy = this.enemies.states[index];
      if (enemy.active) this.enemyGrid.insert(index, enemy.x, enemy.y);
    }
  }

  private fireProjectile(player: PlayerState): void {
    const target = this.findNearestEnemy(player.x, player.y, 960);
    if (!target) return;
    const projectile = this.projectiles.acquire();
    if (!projectile) return;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    projectile.active = true;
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.vx = (dx / distance) * PROJECTILE_DEFINITION.speed;
    projectile.vy = (dy / distance) * PROJECTILE_DEFINITION.speed;
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.projectileDamage;
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    this.stats.shotsFired += 1;
  }

  private findNearestEnemy(x: number, y: number, radius: number): EnemyState | null {
    const index = this.findNearestEnemyIndex(x, y, radius);
    return index < 0 ? null : this.enemies.states[index];
  }

  private findNearestEnemyIndex(
    x: number,
    y: number,
    radius: number,
    excludedIndices?: readonly number[],
    excludedCount = 0
  ): number {
    const candidates = this.enemyGrid.queryCircle(x, y, radius);
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const index of candidates) {
      const enemy = this.enemies.states[index];
      if (!enemy.active) continue;
      if (excludedIndices) {
        let excluded = false;
        for (let excludedIndex = 0; excludedIndex < excludedCount; excludedIndex += 1) {
          if (excludedIndices[excludedIndex] === index) {
            excluded = true;
            break;
          }
        }
        if (excluded) continue;
      }
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    }
    return nearestIndex;
  }

  private updateChainSegments(dt: number): void {
    for (const segment of this.chainSegments) {
      if (!segment.active) continue;
      segment.lifeSeconds -= dt;
      if (segment.lifeSeconds <= 0) segment.active = false;
    }
  }

  private updateOrbit(dt: number, player: PlayerState): void {
    if (this.orbitBladeCount <= 0) return;
    this.orbitAngle = (this.orbitAngle + ORBIT_DEFINITION.rotationSpeed * dt) % FULL_CIRCLE;
    for (let index = 0; index < this.orbitBlades.length; index += 1) {
      const blade = this.orbitBlades[index];
      blade.active = index < this.orbitBladeCount;
      if (!blade.active) continue;
      const angle = this.orbitAngle + (index / this.orbitBladeCount) * FULL_CIRCLE;
      blade.angle = angle;
      blade.x = player.x + Math.cos(angle) * ORBIT_DEFINITION.orbitRadius;
      blade.y = player.y + Math.sin(angle) * ORBIT_DEFINITION.orbitRadius;
      const candidates = this.enemyGrid.queryCircle(blade.x, blade.y, blade.radius + 32);
      for (const candidateIndex of candidates) {
        const enemy = this.enemies.states[candidateIndex];
        if (!enemy.active || enemy.orbitHitCooldown > 0) continue;
        const hitDistance = blade.radius + enemy.radius;
        if (Math.hypot(blade.x - enemy.x, blade.y - enemy.y) > hitDistance) continue;
        enemy.health -= ORBIT_DEFINITION.damage;
        enemy.orbitHitCooldown = ORBIT_DEFINITION.hitCooldownSeconds;
        if (enemy.health <= 0) this.defeatEnemy(enemy);
        break;
      }
    }
  }

  private fireChainLightning(player: PlayerState): void {
    this.chainHitIndices.fill(-1);
    let currentX = player.x;
    let currentY = player.y;
    for (let targetIndex = 0; targetIndex < CHAIN_DEFINITION.maxTargets; targetIndex += 1) {
      const searchRadius = targetIndex === 0 ? 960 : CHAIN_DEFINITION.jumpRadius;
      const enemyIndex = this.findNearestEnemyIndex(
        currentX,
        currentY,
        searchRadius,
        this.chainHitIndices,
        targetIndex
      );
      if (enemyIndex < 0) break;
      const enemy = this.enemies.states[enemyIndex];
      const segment = this.chainSegments[targetIndex];
      segment.active = true;
      segment.x1 = currentX;
      segment.y1 = currentY;
      segment.x2 = enemy.x;
      segment.y2 = enemy.y;
      segment.lifeSeconds = CHAIN_DEFINITION.segmentLifetimeSeconds;
      this.chainHitIndices[targetIndex] = enemyIndex;
      enemy.health -= CHAIN_DEFINITION.damage;
      if (enemy.health <= 0) this.defeatEnemy(enemy);
      currentX = enemy.x;
      currentY = enemy.y;
    }
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles.states) {
      if (!projectile.active) continue;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.lifetimeSeconds -= dt;
      if (
        projectile.lifetimeSeconds <= 0
        || projectile.x < -100
        || projectile.x > LOGICAL_WIDTH + 100
        || projectile.y < -100
        || projectile.y > LOGICAL_HEIGHT + 100
      ) {
        this.projectiles.release(projectile);
        continue;
      }

      const candidates = this.enemyGrid.queryCircle(projectile.x, projectile.y, projectile.radius + 32);
      for (const index of candidates) {
        const enemy = this.enemies.states[index];
        if (!enemy.active) continue;
        const hitDistance = projectile.radius + enemy.radius;
        if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) > hitDistance) continue;
        enemy.health -= projectile.damage;
        this.projectiles.release(projectile);
        if (enemy.health <= 0) this.defeatEnemy(enemy);
        break;
      }
    }
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
