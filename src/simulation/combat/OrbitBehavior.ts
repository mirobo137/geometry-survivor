import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { OrbitBladeState } from './CombatRenderState';
import type { OrbitPulseState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { OrbitEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';

const FULL_CIRCLE = Math.PI * 2;
const ORBIT_DEFINITION = WEAPON_DEFINITIONS.orbit;
const SOLAR_CROWN_BLADE_COUNT = 6;
const SOLAR_CROWN_FIXED_RADIUS = 94;
const GRAVITON_AXIS_TURN_SPEED = 2;

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
  private hitCooldownSeconds = ORBIT_DEFINITION.hitCooldownSeconds;
  private rotationSpeed = ORBIT_DEFINITION.rotationSpeed;
  private contactRadiusBonus = 0;
  private rank = 1;
  private permanentDamageMultiplier = 1;
  private permanentCadenceMultiplier = 1;
  private evolution: OrbitEvolution | null = null;
  private solarHasPosition = false;
  private gravitonAxisAngle = -Math.PI / 2;
  private lastPlayerX: number | null = null;
  private lastPlayerY: number | null = null;
  public readonly pulseState: OrbitPulseState = {
    active: false,
    x: 0,
    y: 0,
    radius: 118,
    progress: 0,
    sequence: 0
  };

  public constructor(private readonly context: OrbitBehaviorContext) {}

  public get activeBladeCount(): number {
    return this.bladeCount;
  }

  public get currentRadius(): number {
    return this.radius;
  }

  public get currentContactRadius(): number {
    return ORBIT_DEFINITION.radius + this.contactRadiusBonus;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentHitCooldown(): number {
    return this.hitCooldownSeconds;
  }

  public get currentEvolution(): OrbitEvolution | null {
    return this.evolution;
  }

  public get currentRank(): number {
    return this.rank;
  }

  public addBlade(): boolean {
    if (this.bladeCount >= this.blades.length) return false;
    this.bladeCount += 1;
    return true;
  }

  public increaseRadius(amount: number): void {
    this.radius = Math.max(ORBIT_DEFINITION.orbitRadius, this.radius + Math.max(0, amount));
  }

  /** Expands contact forgiveness without moving Solar Crown off its fixed ring. */
  public increaseContactRadius(amount: number): void {
    this.contactRadiusBonus += Math.max(0, amount);
    for (const blade of this.blades) blade.radius = ORBIT_DEFINITION.radius + this.contactRadiusBonus;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public decreaseHitCooldown(amount: number): void {
    this.hitCooldownSeconds = Math.max(0.08, this.hitCooldownSeconds - Math.max(0, amount));
  }

  /**
   * Cadence changes the per-target hit tick, never the authored orbit
   * rotation. Damage remains a base multiplier before run-card additions.
   */
  public setPermanentBonuses(damageMultiplier: number, cadenceMultiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(damageMultiplier);
    this.permanentCadenceMultiplier = normalizeMultiplier(cadenceMultiplier);
    this.applyRankTuning();
  }

  /** Applies one focused-path rank; the route never skips a transition. */
  public setRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.rank + 1) return false;
    this.rank = rank;
    this.applyRankTuning();
    return true;
  }

  public setEvolution(evolution: OrbitEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    this.solarHasPosition = false;
    this.lastPlayerX = null;
    this.lastPlayerY = null;
    this.applyEvolutionTuning();
    return true;
  }

  public update(dtSeconds: number, player: PlayerState): void {
    if (this.bladeCount <= 0) return;
    this.updateMovementAxis(dtSeconds, player);
    this.angle = (this.angle + this.rotationSpeed * dtSeconds) % FULL_CIRCLE;
    if (this.evolution === 'solar_crown') {
      this.updateSolarCrown(player);
      return;
    }
    for (let index = 0; index < this.blades.length; index += 1) {
      const blade = this.blades[index];
      blade.active = index < this.bladeCount;
      if (!blade.active) continue;
      const angle = this.angle + (index / this.bladeCount) * FULL_CIRCLE;
      blade.angle = angle;
      const previousX = blade.x;
      const previousY = blade.y;
      this.positionOrbitBlade(blade, angle, player);
      this.hitAlongSegment(blade, previousX, previousY, blade.x, blade.y);
    }
  }

  public reset(): void {
    for (const blade of this.blades) {
      blade.active = false;
      blade.x = 0;
      blade.y = 0;
      blade.angle = 0;
      blade.radius = ORBIT_DEFINITION.radius;
    }
    this.bladeCount = 0;
    this.angle = 0;
    this.rank = 1;
    this.radius = ORBIT_DEFINITION.orbitRadius;
    this.damage = ORBIT_DEFINITION.damage * this.permanentDamageMultiplier;
    this.hitCooldownSeconds = Math.max(0.001, ORBIT_DEFINITION.hitCooldownSeconds * this.permanentCadenceMultiplier);
    this.rotationSpeed = ORBIT_DEFINITION.rotationSpeed;
    this.contactRadiusBonus = 0;
    this.evolution = null;
    this.solarHasPosition = false;
    this.gravitonAxisAngle = -Math.PI / 2;
    this.lastPlayerX = null;
    this.lastPlayerY = null;
    this.pulseState.active = false;
    this.pulseState.progress = 0;
    this.pulseState.sequence = 0;
  }

  /** Re-anchors the persistent formation on the next frame without losing upgrades. */
  public clearTransient(): void {
    this.lastPlayerX = null;
    this.lastPlayerY = null;
    this.solarHasPosition = false;
    this.pulseState.active = false;
    this.pulseState.progress = 0;
  }

  private applyEvolutionTuning(): void {
    // Solar Crown is a stable six-blade formation. Its authored radius is
    // intentionally fixed so the evolution reads as persistent coverage,
    // rather than a second, unrelated projectile attack.
    if (this.evolution === 'solar_crown') {
      this.bladeCount = Math.min(this.blades.length, SOLAR_CROWN_BLADE_COUNT);
      this.radius = SOLAR_CROWN_FIXED_RADIUS;
    }
  }

  private applyRankTuning(): void {
    this.radius = this.rank >= 6 ? 94 : this.rank >= 2 ? 76 : ORBIT_DEFINITION.orbitRadius;
    this.damage = (this.rank >= 4 ? 22 : ORBIT_DEFINITION.damage) * this.permanentDamageMultiplier;
    this.hitCooldownSeconds = Math.max(0.001, ORBIT_DEFINITION.hitCooldownSeconds * this.permanentCadenceMultiplier);
    this.rotationSpeed = ORBIT_DEFINITION.rotationSpeed;
    const authoredBladeCount = this.rank >= 7 ? 4 : this.rank >= 5 ? 3 : this.rank >= 3 ? 2 : 1;
    if (this.bladeCount > 0) this.bladeCount = Math.max(this.bladeCount, authoredBladeCount);
    this.applyEvolutionTuning();
  }

  private updateMovementAxis(dtSeconds: number, player: PlayerState): void {
    if (this.lastPlayerX === null || this.lastPlayerY === null) {
      this.lastPlayerX = player.x;
      this.lastPlayerY = player.y;
      return;
    }
    const dx = player.x - this.lastPlayerX;
    const dy = player.y - this.lastPlayerY;
    this.lastPlayerX = player.x;
    this.lastPlayerY = player.y;
    if (this.evolution !== 'graviton_halo' || Math.hypot(dx, dy) <= 0.01) return;
    this.gravitonAxisAngle = approachAngle(
      this.gravitonAxisAngle,
      Math.atan2(dy, dx),
      GRAVITON_AXIS_TURN_SPEED * dtSeconds
    );
  }

  private positionOrbitBlade(blade: OrbitBladeState, angle: number, player: PlayerState): void {
    if (this.evolution !== 'graviton_halo') {
      blade.x = player.x + Math.cos(angle) * this.radius;
      blade.y = player.y + Math.sin(angle) * this.radius;
      return;
    }
    const longRadius = this.radius * 1.9;
    const shortRadius = this.radius * 0.65;
    const localX = Math.cos(angle) * longRadius;
    const localY = Math.sin(angle) * shortRadius;
    const axisCos = Math.cos(this.gravitonAxisAngle);
    const axisSin = Math.sin(this.gravitonAxisAngle);
    blade.x = player.x + localX * axisCos - localY * axisSin;
    blade.y = player.y + localX * axisSin + localY * axisCos;
  }

  private updateSolarCrown(player: PlayerState): void {
    for (let index = 0; index < this.blades.length; index += 1) {
      const blade = this.blades[index];
      blade.active = index < this.bladeCount;
      if (!blade.active) continue;
      blade.angle = this.angle + (index / this.bladeCount) * FULL_CIRCLE;
      const previousX = blade.x;
      const previousY = blade.y;
      this.positionOrbitBladeAt(blade, blade.angle, player.x, player.y);
      // The first placement is visual only. This prevents a freshly evolved
      // formation from damaging along a fake segment from (0, 0).
      if (this.solarHasPosition) this.hitAlongSegment(blade, previousX, previousY, blade.x, blade.y);
    }
    this.solarHasPosition = true;
  }

  private positionOrbitBladeAt(blade: OrbitBladeState, angle: number, centerX: number, centerY: number): void {
    blade.x = centerX + Math.cos(angle) * this.radius;
    blade.y = centerY + Math.sin(angle) * this.radius;
  }

  private hitAlongSegment(blade: OrbitBladeState, startX: number, startY: number, endX: number, endY: number): void {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const candidates = this.context.enemies.queryCircle(
      (startX + endX) * 0.5,
      (startY + endY) * 0.5,
      length * 0.5 + blade.radius + 32
    );
    for (const candidateIndex of candidates) {
      const enemy = this.context.enemies.getState(candidateIndex);
      if (!enemy.active || enemy.health <= 0 || enemy.orbitHitCooldown > 0) continue;
      const hitDistance = blade.radius + enemy.radius;
      if (distanceToSegmentSquared(enemy.x, enemy.y, startX, startY, dx, dy) > hitDistance * hitDistance) continue;
      enemy.health -= this.context.rollCriticalDamage(this.damage);
      enemy.orbitHitCooldown = this.hitCooldownSeconds;
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }
}

const distanceToSegmentSquared = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number
): number => {
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const progress = lengthSquared <= 0.000001
    ? 0
    : Math.min(1, Math.max(0, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  const closestX = startX + deltaX * progress;
  const closestY = startY + deltaY * progress;
  return (pointX - closestX) ** 2 + (pointY - closestY) ** 2;
};

const approachAngle = (current: number, target: number, maxDelta: number): number => {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + Math.max(-maxDelta, Math.min(maxDelta, delta));
};

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);
