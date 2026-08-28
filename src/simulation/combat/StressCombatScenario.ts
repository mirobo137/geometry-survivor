import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import { ProjectilePool } from './EntityPools';

const PROJECTILE_DEFINITION = WEAPON_DEFINITIONS.projectile;
const SPAWN_ANGLE_STEP = 2.399963229728653;

/**
 * Keeps the deterministic full-pool benchmark out of normal weapon rules.
 * It reuses the production projectile pool and stat callbacks, so the stress
 * preset measures the same allocation and update paths as a real run.
 */
export class StressCombatScenario {
  private projectileIndex = 0;

  public constructor(
    private readonly projectiles: ProjectilePool,
    private readonly getProjectileSpeed: () => number,
    private readonly getProjectileDamage: () => number,
    private readonly onShot: () => void
  ) {}

  public reset(): void {
    this.projectileIndex = 0;
  }

  public initialize(player: PlayerState): void {
    for (let index = 0; index < this.projectiles.capacity; index += 1) {
      this.spawn(player, index);
    }
    this.projectileIndex = this.projectiles.capacity;
  }

  public maintain(player: PlayerState): void {
    while (this.projectiles.activeCount < this.projectiles.capacity) {
      const activeCount = this.projectiles.activeCount;
      this.spawn(player, this.projectileIndex);
      this.projectileIndex += 1;
      if (this.projectiles.activeCount === activeCount) break;
    }
  }

  private spawn(player: PlayerState, index: number): void {
    const projectile = this.projectiles.acquire();
    if (!projectile) return;
    const angle = index * SPAWN_ANGLE_STEP;
    projectile.x = player.x;
    projectile.y = player.y;
    projectile.vx = Math.cos(angle) * this.getProjectileSpeed();
    projectile.vy = Math.sin(angle) * this.getProjectileSpeed();
    projectile.radius = PROJECTILE_DEFINITION.radius;
    projectile.damage = this.getProjectileDamage();
    projectile.lifetimeSeconds = PROJECTILE_DEFINITION.lifetimeSeconds;
    this.onShot();
  }
}
