import {
  PROJECTILE_MUZZLE_OFFSETS,
  WEAPON_DEFINITIONS,
  type ProjectileMuzzle
} from '../../content/weapons/WeaponDefinitions';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, PROJECTILE_POOL_CAPACITY } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import { ProjectilePool, type EnemyState, type ProjectileState } from './EntityPools';
import type { ChainSegmentState, OrbitBladeState, ShotRenderState } from './CombatRenderState';
import { EnemySystem } from '../enemies/EnemySystem';
import { StressCombatScenario } from './StressCombatScenario';

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
  private projectileDamage = PROJECTILE_DEFINITION.damage;
  private projectileSpeed = PROJECTILE_DEFINITION.speed;
  private projectileCooldown = PROJECTILE_DEFINITION.cooldownSeconds;
  private orbitBladeCount = 0;
  private orbitAngle = 0;
  private orbitRadius = ORBIT_DEFINITION.orbitRadius;
  private orbitDamage = ORBIT_DEFINITION.damage;
  private chainLightningUnlocked = false;
  private chainDamage = CHAIN_DEFINITION.damage;
  private twinEmitters = false;
  private nextMuzzle: ProjectileMuzzle = 0;
  private readonly chainHitIndices = Array.from({ length: CHAIN_DEFINITION.maxTargets }, () => -1);
  private shotsFired = 0;
  private shotSequence = 0;
  private readonly originScratch = { x: 0, y: 0 };
  public readonly lastShot: ShotRenderState = {
    sequence: 0,
    directionX: 0,
    directionY: -1,
    muzzleMask: 0,
    leftOriginX: 0,
    leftOriginY: 0,
    rightOriginX: 0,
    rightOriginY: 0
  };
  private readonly stressScenario: StressCombatScenario;

  public constructor(
    private readonly enemies: EnemySystem,
    private readonly onEnemyDefeated: (enemy: EnemyState) => void
  ) {
    this.stressScenario = new StressCombatScenario(
      this.projectiles,
      () => this.projectileSpeed,
      () => this.projectileDamage,
      (player, projectile, directionX, directionY, muzzle) => {
        this.calculateMuzzleOrigin(player, directionX, directionY, muzzle);
        const sequence = this.beginShotBurst(directionX, directionY);
        this.configureProjectile(projectile, this.originScratch.x, this.originScratch.y, directionX, directionY, muzzle);
        this.recordShotOrigin(this.originScratch.x, this.originScratch.y, muzzle, sequence);
        this.shotsFired += 1;
      }
    );
  }

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

  public get hasTwinEmitters(): boolean {
    return this.twinEmitters;
  }

  public get currentOrbitRadius(): number {
    return this.orbitRadius;
  }

  public get currentChainDamage(): number {
    return this.chainDamage;
  }

  public reset(): void {
    this.projectiles.reset();
    for (const blade of this.orbitBlades) {
      blade.active = false;
      blade.x = 0;
      blade.y = 0;
      blade.angle = 0;
    }
    for (const segment of this.chainSegments) {
      segment.active = false;
      segment.x1 = 0;
      segment.y1 = 0;
      segment.x2 = 0;
      segment.y2 = 0;
      segment.lifeSeconds = 0;
    }
    this.attackAccumulator = 0;
    this.chainAccumulator = 0;
    this.stressScenario.reset();
    this.projectileDamage = PROJECTILE_DEFINITION.damage;
    this.projectileSpeed = PROJECTILE_DEFINITION.speed;
    this.projectileCooldown = PROJECTILE_DEFINITION.cooldownSeconds;
    this.orbitBladeCount = 0;
    this.orbitAngle = 0;
    this.orbitRadius = ORBIT_DEFINITION.orbitRadius;
    this.orbitDamage = ORBIT_DEFINITION.damage;
    this.chainLightningUnlocked = false;
    this.chainDamage = CHAIN_DEFINITION.damage;
    this.twinEmitters = false;
    this.nextMuzzle = 0;
    this.chainHitIndices.fill(-1);
    this.shotsFired = 0;
    this.shotSequence = 0;
    this.lastShot.sequence = 0;
    this.lastShot.directionX = 0;
    this.lastShot.directionY = -1;
    this.lastShot.muzzleMask = 0;
    this.lastShot.leftOriginX = 0;
    this.lastShot.leftOriginY = 0;
    this.lastShot.rightOriginX = 0;
    this.lastShot.rightOriginY = 0;
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
    this.stressScenario.initialize(player);
  }

  public maintainStressProjectiles(player: PlayerState): void {
    this.stressScenario.maintain(player);
  }

  private fireProjectile(player: PlayerState): void {
    const target = this.findNearestEnemy(player.x, player.y, 960);
    if (!target) return;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / distance;
    const directionY = dy / distance;
    const muzzleCount = this.twinEmitters ? 2 : 1;
    let sequence = 0;
    for (let index = 0; index < muzzleCount; index += 1) {
      const projectile = this.projectiles.acquire();
      if (!projectile) break;
      const muzzle = this.twinEmitters
        ? index as ProjectileMuzzle
        : this.takeNextMuzzle();
      this.calculateMuzzleOrigin(player, directionX, directionY, muzzle);
      const targetDirectionX = target.x - this.originScratch.x;
      const targetDirectionY = target.y - this.originScratch.y;
      const targetDistance = Math.max(0.001, Math.hypot(targetDirectionX, targetDirectionY));
      const projectileDirectionX = targetDirectionX / targetDistance;
      const projectileDirectionY = targetDirectionY / targetDistance;
      if (sequence === 0) sequence = this.beginShotBurst(projectileDirectionX, projectileDirectionY);
      this.configureProjectile(
        projectile,
        this.originScratch.x,
        this.originScratch.y,
        projectileDirectionX,
        projectileDirectionY,
        muzzle
      );
      this.recordShotOrigin(this.originScratch.x, this.originScratch.y, muzzle, sequence);
      this.shotsFired += 1;
    }
  }

  private takeNextMuzzle(): ProjectileMuzzle {
    const muzzle = this.nextMuzzle;
    this.nextMuzzle = muzzle === 0 ? 1 : 0;
    return muzzle;
  }

  private configureProjectile(
    projectile: ProjectileState,
    originX: number,
    originY: number,
    directionX: number,
    directionY: number,
    muzzle: ProjectileMuzzle
  ): void {
    projectile.active = true;
    projectile.x = originX;
    projectile.y = originY;
    projectile.vx = directionX * this.projectileSpeed;
    projectile.vy = directionY * this.projectileSpeed;
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.projectileDamage;
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    projectile.muzzle = muzzle;
  }

  private beginShotBurst(directionX: number, directionY: number): number {
    this.shotSequence += 1;
    this.lastShot.sequence = this.shotSequence;
    this.lastShot.directionX = directionX;
    this.lastShot.directionY = directionY;
    this.lastShot.muzzleMask = 0;
    return this.shotSequence;
  }

  private recordShotOrigin(
    originX: number,
    originY: number,
    muzzle: ProjectileMuzzle,
    sequence: number
  ): void {
    this.lastShot.sequence = sequence;
    this.lastShot.muzzleMask |= 1 << muzzle;
    if (muzzle === 0) {
      this.lastShot.leftOriginX = originX;
      this.lastShot.leftOriginY = originY;
    } else {
      this.lastShot.rightOriginX = originX;
      this.lastShot.rightOriginY = originY;
    }
  }

  private calculateMuzzleOrigin(
    player: PlayerState,
    directionX: number,
    directionY: number,
    muzzle: ProjectileMuzzle
  ): void {
    const offset = PROJECTILE_MUZZLE_OFFSETS[muzzle];
    const sideX = -directionY;
    const sideY = directionX;
    this.originScratch.x = player.x + sideX * offset.x + directionX * -offset.y;
    this.originScratch.y = player.y + sideY * offset.x + directionY * -offset.y;
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
