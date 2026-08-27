import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import type { EnemyState } from './EntityPools';
import { ProjectilePool } from './EntityPools';
import type { ChainSegmentState, OrbitBladeState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';

const FULL_CIRCLE = Math.PI * 2;
const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const ORBIT_DEFINITION = WEAPON_DEFINITIONS.orbit;
const CHAIN_DEFINITION = WEAPON_DEFINITIONS.chainLightning;

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

/** Runs authored weapon behavior against the enemy query surface. */
export class CombatWeaponSystem {
  public readonly projectiles = new ProjectilePool(PROJECTILE_POOL_CAPACITY);
  public readonly orbitBlades = Array.from({ length: ORBIT_DEFINITION.maxBlades }, createOrbitBladeState);
  public readonly chainSegments = Array.from({ length: CHAIN_DEFINITION.maxTargets }, createChainSegmentState);
  private attackAccumulator = 0;
  private chainAccumulator = 0;
  private stressProjectileIndex = 0;
  private projectileDamage = PROJECTILE_DEFINITION.damage;
  private projectileSpeed = PROJECTILE_DEFINITION.speed;
  private projectileCooldown = PROJECTILE_DEFINITION.cooldownSeconds;
  private orbitBladeCount = 0;
  private orbitAngle = 0;
  private orbitRadius = ORBIT_DEFINITION.orbitRadius;
  private orbitDamage = ORBIT_DEFINITION.damage;
  private chainLightningUnlocked = false;
  private chainDamage = CHAIN_DEFINITION.damage;
  private readonly chainHitIndices = Array.from({ length: CHAIN_DEFINITION.maxTargets }, () => -1);
  private shotsFired = 0;

  public constructor(
    private readonly enemies: EnemySystem,
    private readonly onEnemyDefeated: (enemy: EnemyState) => void
  ) {}

  public get totalShotsFired(): number {
    return this.shotsFired;
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

  public get currentOrbitRadius(): number {
    return this.orbitRadius;
  }

  public get currentChainDamage(): number {
    return this.chainDamage;
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

  public addOrbitBlade(): boolean {
    if (this.orbitBladeCount >= this.orbitBlades.length) return false;
    this.orbitBladeCount += 1;
    return true;
  }

  public unlockChainLightning(): boolean {
    if (this.chainLightningUnlocked) return false;
    this.chainLightningUnlocked = true;
    return true;
  }

  public get hasChainLightning(): boolean {
    return this.chainLightningUnlocked;
  }

  public get activeOrbitBlades(): number {
    return this.orbitBladeCount;
  }

  public increaseOrbitRadius(amount: number): void {
    this.orbitRadius = Math.max(ORBIT_DEFINITION.orbitRadius, this.orbitRadius + Math.max(0, amount));
  }

  public increaseChainDamage(amount: number): void {
    this.chainDamage += Math.max(0, amount);
  }

  public update(dtSeconds: number, player: PlayerState): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt === 0) return;

    this.attackAccumulator += dt;
    this.updateChainSegments(dt);
    this.updateOrbit(dt, player);

    while (this.attackAccumulator >= this.projectileCooldown) {
      this.attackAccumulator -= this.projectileCooldown;
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
  }

  public initializeStress(player: PlayerState): void {
    for (let index = 0; index < this.projectiles.capacity; index += 1) {
      this.spawnStressProjectile(player, index);
    }
    this.stressProjectileIndex = this.projectiles.capacity;
  }

  public maintainStressProjectiles(player: PlayerState): void {
    while (this.projectiles.activeCount < this.projectiles.capacity) {
      const activeCount = this.projectiles.activeCount;
      this.spawnStressProjectile(player, this.stressProjectileIndex);
      this.stressProjectileIndex += 1;
      if (this.projectiles.activeCount === activeCount) break;
    }
  }

  private spawnStressProjectile(player: PlayerState, index: number): void {
    const projectile = this.projectiles.acquire();
    if (!projectile) return;
    const angle = index * 2.399963229728653;
    projectile.active = true;
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.vx = Math.cos(angle) * this.projectileSpeed;
    projectile.vy = Math.sin(angle) * this.projectileSpeed;
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.projectileDamage;
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    this.shotsFired += 1;
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
    projectile.vx = (dx / distance) * this.projectileSpeed;
    projectile.vy = (dy / distance) * this.projectileSpeed;
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.projectileDamage;
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    this.shotsFired += 1;
  }

  private findNearestEnemy(x: number, y: number, radius: number): EnemyState | null {
    const index = this.enemies.findNearestEnemyIndex(x, y, radius);
    return index < 0 ? null : this.enemies.getState(index);
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
      blade.x = player.x + Math.cos(angle) * this.orbitRadius;
      blade.y = player.y + Math.sin(angle) * this.orbitRadius;
      const candidates = this.enemies.queryCircle(blade.x, blade.y, blade.radius + 32);
      for (const candidateIndex of candidates) {
        const enemy = this.enemies.getState(candidateIndex);
        if (!enemy.active || enemy.orbitHitCooldown > 0) continue;
        const hitDistance = blade.radius + enemy.radius;
        if (Math.hypot(blade.x - enemy.x, blade.y - enemy.y) > hitDistance) continue;
        enemy.health -= this.orbitDamage;
        enemy.orbitHitCooldown = ORBIT_DEFINITION.hitCooldownSeconds;
        if (enemy.health <= 0) this.onEnemyDefeated(enemy);
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
      const enemyIndex = this.enemies.findNearestEnemyIndex(
        currentX,
        currentY,
        searchRadius,
        this.chainHitIndices,
        targetIndex
      );
      if (enemyIndex < 0) break;
      const enemy = this.enemies.getState(enemyIndex);
      const segment = this.chainSegments[targetIndex];
      segment.active = true;
      segment.x1 = currentX;
      segment.y1 = currentY;
      segment.x2 = enemy.x;
      segment.y2 = enemy.y;
      segment.lifeSeconds = CHAIN_DEFINITION.segmentLifetimeSeconds;
      this.chainHitIndices[targetIndex] = enemyIndex;
      enemy.health -= this.chainDamage;
      if (enemy.health <= 0) this.onEnemyDefeated(enemy);
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

      const candidates = this.enemies.queryCircle(projectile.x, projectile.y, projectile.radius + 32);
      for (const index of candidates) {
        const enemy = this.enemies.getState(index);
        if (!enemy.active) continue;
        const hitDistance = projectile.radius + enemy.radius;
        if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) > hitDistance) continue;
        enemy.health -= projectile.damage;
        this.projectiles.release(projectile);
        if (enemy.health <= 0) this.onEnemyDefeated(enemy);
        break;
      }
    }
  }
}
