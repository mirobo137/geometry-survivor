import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { OrbitBladeState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const FULL_CIRCLE = Math.PI * 2;
const ORBIT_DEFINITION = WEAPON_DEFINITIONS.orbit;

export interface OrbitBehaviorContext {
  readonly enemies: EnemySystem;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

const createOrbitBladeState = (): OrbitBladeState => ({
  active: false,
  x: 0,
  y: 0,
  radius: ORBIT_DEFINITION.radius,
  angle: 0
});

/** Owns close-range orbit positioning and its per-target cooldown contract. */
export class OrbitBehavior {
  public readonly blades = Array.from({ length: ORBIT_DEFINITION.maxBlades }, createOrbitBladeState);
  private bladeCount = 0;
  private angle = 0;
  private radius = ORBIT_DEFINITION.orbitRadius;
  private damage = ORBIT_DEFINITION.damage;

  public constructor(private readonly context: OrbitBehaviorContext) {}

  public get activeBladeCount(): number {
    return this.bladeCount;
  }

  public get currentRadius(): number {
    return this.radius;
  }

  public addBlade(): boolean {
    if (this.bladeCount >= this.blades.length) return false;
    this.bladeCount += 1;
    return true;
  }

  public increaseRadius(amount: number): void {
    this.radius = Math.max(ORBIT_DEFINITION.orbitRadius, this.radius + Math.max(0, amount));
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public update(dtSeconds: number, player: PlayerState): void {
    if (this.bladeCount <= 0) return;
    this.angle = (this.angle + ORBIT_DEFINITION.rotationSpeed * dtSeconds) % FULL_CIRCLE;
    for (let index = 0; index < this.blades.length; index += 1) {
      const blade = this.blades[index];
      blade.active = index < this.bladeCount;
      if (!blade.active) continue;
      const angle = this.angle + (index / this.bladeCount) * FULL_CIRCLE;
      blade.angle = angle;
      blade.x = player.x + Math.cos(angle) * this.radius;
      blade.y = player.y + Math.sin(angle) * this.radius;
      const candidates = this.context.enemies.queryCircle(blade.x, blade.y, blade.radius + 32);
      for (const candidateIndex of candidates) {
        const enemy = this.context.enemies.getState(candidateIndex);
        if (!enemy.active || enemy.orbitHitCooldown > 0) continue;
        const hitDistance = blade.radius + enemy.radius;
        if (Math.hypot(blade.x - enemy.x, blade.y - enemy.y) > hitDistance) continue;
        enemy.health -= this.context.rollCriticalDamage(this.damage);
        enemy.orbitHitCooldown = ORBIT_DEFINITION.hitCooldownSeconds;
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
        break;
      }
    }
  }

  public reset(): void {
    for (const blade of this.blades) {
      blade.active = false;
      blade.x = 0;
      blade.y = 0;
      blade.angle = 0;
    }
    this.bladeCount = 0;
    this.angle = 0;
    this.radius = ORBIT_DEFINITION.orbitRadius;
    this.damage = ORBIT_DEFINITION.damage;
  }
}
