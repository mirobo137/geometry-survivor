import { ENEMY_DEFINITIONS, type EnemyKind } from '../../content/enemies/EnemyDefinitions';
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

const PROJECTILE_DAMAGE = 14;
const PROJECTILE_SPEED = 460;
const PROJECTILE_RADIUS = 7;
const PROJECTILE_LIFETIME_SECONDS = 2.5;
const AUTO_ATTACK_COOLDOWN_SECONDS = 0.55;
const CONTACT_COOLDOWN_SECONDS = 0.45;
const SPAWN_RADIUS_PADDING = 80;
const STRESS_ENEMY_KINDS: readonly EnemyKind[] = ['chaser', 'fast', 'tank'];

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

  public constructor(options: CombatSimulationOptions = {}) {
    this.stressMode = options.stress === true;
  }

  public get isStressMode(): boolean {
    return this.stressMode;
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

    while (this.attackAccumulator >= AUTO_ATTACK_COOLDOWN_SECONDS) {
      this.attackAccumulator -= AUTO_ATTACK_COOLDOWN_SECONDS;
      this.fireProjectile(player);
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
    projectile.vx = Math.cos(angle) * PROJECTILE_SPEED;
    projectile.vy = Math.sin(angle) * PROJECTILE_SPEED;
    projectile.radius = PROJECTILE_RADIUS;
    projectile.damage = PROJECTILE_DAMAGE;
    projectile.lifetimeSeconds = PROJECTILE_LIFETIME_SECONDS;
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
    projectile.vx = (dx / distance) * PROJECTILE_SPEED;
    projectile.vy = (dy / distance) * PROJECTILE_SPEED;
    projectile.radius = PROJECTILE_RADIUS;
    projectile.damage = PROJECTILE_DAMAGE;
    projectile.lifetimeSeconds = PROJECTILE_LIFETIME_SECONDS;
    this.stats.shotsFired += 1;
  }

  private findNearestEnemy(x: number, y: number, radius: number): EnemyState | null {
    const candidates = this.enemyGrid.queryCircle(x, y, radius);
    let nearest: EnemyState | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const index of candidates) {
      const enemy = this.enemies.states[index];
      if (!enemy.active) continue;
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    return nearest;
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
