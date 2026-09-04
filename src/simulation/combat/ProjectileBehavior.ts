import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH
} from '../../config/constants';
import {
  PROJECTILE_MUZZLE_OFFSETS,
  WEAPON_DEFINITIONS,
  type ProjectileMuzzle
} from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { ShotRenderState } from './CombatRenderState';
import type { EnemyState, ProjectilePool, ProjectileState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;

export interface ProjectileBehaviorContext {
  readonly enemies: EnemySystem;
  readonly projectiles: ProjectilePool;
  readonly isTwinEmitterEnabled: () => boolean;
  readonly getProjectileDamage: () => number;
  readonly getProjectileSpeed: () => number;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

const createShotState = (): ShotRenderState => ({
  sequence: 0,
  directionX: 0,
  directionY: -1,
  muzzleMask: 0,
  leftOriginX: 0,
  leftOriginY: 0,
  rightOriginX: 0,
  rightOriginY: 0
});

/** Projectile firing, muzzle geometry and collision against the enemy query surface. */
export class ProjectileBehavior {
  public readonly lastShot = createShotState();
  private readonly originScratch = { x: 0, y: 0 };
  private nextMuzzle: ProjectileMuzzle = 0;
  private shotsFired = 0;
  private shotSequence = 0;

  public constructor(private readonly context: ProjectileBehaviorContext) {}

  public get totalShotsFired(): number {
    return this.shotsFired;
  }

  public fire(player: PlayerState): void {
    const target = this.findNearestEnemy(player.x, player.y, 960);
    if (!target) return;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / distance;
    const directionY = dy / distance;
    const muzzleCount = this.context.isTwinEmitterEnabled() ? 2 : 1;
    let sequence = 0;
    for (let index = 0; index < muzzleCount; index += 1) {
      const projectile = this.context.projectiles.acquire();
      if (!projectile) break;
      const muzzle = this.context.isTwinEmitterEnabled()
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

  /** Records a stress projectile's muzzle signal without changing its authored state. */
  public recordStressShot(
    player: PlayerState,
    projectile: ProjectileState,
    directionX: number,
    directionY: number,
    muzzle: ProjectileMuzzle
  ): void {
    this.calculateMuzzleOrigin(player, directionX, directionY, muzzle);
    const sequence = this.beginShotBurst(directionX, directionY);
    this.configureProjectile(projectile, this.originScratch.x, this.originScratch.y, directionX, directionY, muzzle);
    this.recordShotOrigin(this.originScratch.x, this.originScratch.y, muzzle, sequence);
    this.shotsFired += 1;
  }

  public update(dtSeconds: number): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return;
    for (const projectile of this.context.projectiles.states) {
      if (!projectile.active) continue;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.ageSeconds += dt;
      projectile.lifetimeSeconds -= dt;
      if (
        projectile.lifetimeSeconds <= 0
        || projectile.x < -100
        || projectile.x > LOGICAL_WIDTH + 100
        || projectile.y < -100
        || projectile.y > LOGICAL_HEIGHT + 100
      ) {
        this.context.projectiles.release(projectile);
        continue;
      }

      const candidates = this.context.enemies.queryCircle(projectile.x, projectile.y, projectile.radius + 32);
      for (const index of candidates) {
        const enemy = this.context.enemies.getState(index);
        if (!enemy.active) continue;
        const hitDistance = projectile.radius + enemy.radius;
        if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) > hitDistance) continue;
        enemy.health -= projectile.damage;
        this.context.projectiles.release(projectile);
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
        break;
      }
    }
  }

  public reset(): void {
    this.nextMuzzle = 0;
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
    projectile.vx = directionX * this.context.getProjectileSpeed();
    projectile.vy = directionY * this.context.getProjectileSpeed();
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.context.rollCriticalDamage(this.context.getProjectileDamage());
    projectile.ageSeconds = 0;
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
    const index = this.context.enemies.findNearestEnemyIndex(x, y, radius);
    return index < 0 ? null : this.context.enemies.getState(index);
  }
}
