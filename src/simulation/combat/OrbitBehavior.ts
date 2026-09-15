import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { OrbitBladeState } from './CombatRenderState';
import type { OrbitPulseState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { OrbitEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';

const FULL_CIRCLE = Math.PI * 2;
const ORBIT_DEFINITION = WEAPON_DEFINITIONS.orbit;
const GRAVITON_PULSE_RADIUS = 118;
const GRAVITON_PULSE_PUSH = 16;
const GRAVITON_PULSE_DURATION = 0.34;

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
  private permanentDamageMultiplier = 1;
  private permanentCadenceMultiplier = 1;
  private evolution: OrbitEvolution | null = null;
  private pulseTimer = 0;
  public readonly pulseState: OrbitPulseState = {
    active: false,
    x: 0,
    y: 0,
    radius: GRAVITON_PULSE_RADIUS,
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

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentHitCooldown(): number {
    return this.hitCooldownSeconds;
  }

  public get currentEvolution(): OrbitEvolution | null {
    return this.evolution;
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

  /**
   * Cadence changes the per-target hit tick, never the authored orbit
   * rotation. Damage remains a base multiplier before run-card additions.
   */
  public setPermanentBonuses(damageMultiplier: number, cadenceMultiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(damageMultiplier);
    this.permanentCadenceMultiplier = normalizeMultiplier(cadenceMultiplier);
    this.damage = ORBIT_DEFINITION.damage * this.permanentDamageMultiplier;
    this.hitCooldownSeconds = Math.max(0.001, ORBIT_DEFINITION.hitCooldownSeconds * this.permanentCadenceMultiplier);
    this.applyEvolutionTuning();
  }

  public setEvolution(evolution: OrbitEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    this.pulseTimer = evolution === 'graviton_halo' ? 3 : 0;
    this.applyEvolutionTuning();
    return true;
  }

  public update(dtSeconds: number, player: PlayerState): void {
    if (this.bladeCount <= 0) return;
    this.angle = (this.angle + this.rotationSpeed * dtSeconds) % FULL_CIRCLE;
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
        enemy.orbitHitCooldown = this.hitCooldownSeconds;
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
        break;
      }
    }
    if (this.evolution === 'graviton_halo') this.updateGravitonPulse(dtSeconds, player);
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
    this.damage = ORBIT_DEFINITION.damage * this.permanentDamageMultiplier;
    this.hitCooldownSeconds = Math.max(0.001, ORBIT_DEFINITION.hitCooldownSeconds * this.permanentCadenceMultiplier);
    this.rotationSpeed = ORBIT_DEFINITION.rotationSpeed;
    this.evolution = null;
    this.pulseTimer = 0;
    this.pulseState.active = false;
    this.pulseState.progress = 0;
    this.pulseState.sequence = 0;
  }

  private applyEvolutionTuning(): void {
    this.radius = ORBIT_DEFINITION.orbitRadius;
    this.damage = ORBIT_DEFINITION.damage * this.permanentDamageMultiplier;
    this.rotationSpeed = ORBIT_DEFINITION.rotationSpeed;
    if (this.evolution === 'solar_crown') {
      this.radius *= 1.2;
      this.damage *= 1.35;
      this.rotationSpeed *= 0.9;
    } else if (this.evolution === 'graviton_halo') {
      this.damage *= 0.85;
    }
  }

  private updateGravitonPulse(dtSeconds: number, player: PlayerState): void {
    if (this.pulseState.active) {
      this.pulseState.progress = Math.min(1, this.pulseState.progress + dtSeconds / GRAVITON_PULSE_DURATION);
      if (this.pulseState.progress >= 1) this.pulseState.active = false;
    }
    this.pulseTimer -= dtSeconds;
    if (this.pulseTimer > 0) return;
    this.pulseTimer += 3;
    this.pulseState.active = true;
    this.pulseState.x = player.x;
    this.pulseState.y = player.y;
    this.pulseState.radius = GRAVITON_PULSE_RADIUS;
    this.pulseState.progress = 0;
    this.pulseState.sequence = this.pulseState.sequence >= 2_000_000_000
      ? 1 : this.pulseState.sequence + 1;
    const candidates = this.context.enemies.queryCircle(player.x, player.y, GRAVITON_PULSE_RADIUS + 48);
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0 || enemy.kind === 'boss') continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > GRAVITON_PULSE_RADIUS + enemy.radius) continue;
      enemy.health -= this.context.rollCriticalDamage(this.damage * 0.5);
      if (enemy.health <= 0) {
        this.context.onEnemyDefeated(enemy);
        continue;
      }
      if (distance > 0.001) {
        enemy.x += dx / distance * GRAVITON_PULSE_PUSH;
        enemy.y += dy / distance * GRAVITON_PULSE_PUSH;
      }
    }
  }
}

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);
