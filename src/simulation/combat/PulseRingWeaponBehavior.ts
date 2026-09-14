import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { PulseRingWeaponState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const DEFINITION = WEAPON_DEFINITIONS.pulseRing;
const EPSILON = 0.000001;

export interface PulseRingWeaponBehaviorContext {
  readonly enemies: EnemySystem;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

/**
 * Player-owned radial weapon. Its cast origin is captured at fire time so
 * movement remains a meaningful decision instead of dragging the hitbox.
 * Collision uses a swept annulus and a per-cast ledger to avoid skipped hits
 * and repeated damage while the wave is visible.
 */
export class PulseRingWeaponBehavior {
  public readonly state: PulseRingWeaponState = {
    active: false,
    phase: 'idle',
    originX: 0,
    originY: 0,
    radius: 0,
    startRadius: DEFINITION.startRadius,
    endRadius: DEFINITION.endRadius,
    progress: 0,
    width: DEFINITION.width,
    sequence: 0
  };

  private readonly hitCastMarkers: Uint32Array;
  private readonly hitEnemyGenerations: Uint32Array;
  private phaseTimer = 0;
  private phase: PulseRingWeaponState['phase'] = 'idle';
  private damage = DEFINITION.damage;
  private permanentDamageMultiplier = 1;

  public constructor(private readonly context: PulseRingWeaponBehaviorContext) {
    this.hitCastMarkers = new Uint32Array(context.enemies.pool.capacity);
    this.hitEnemyGenerations = new Uint32Array(context.enemies.pool.capacity);
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    // A sequence of zero means the weapon has never fired. Keep the unlock
    // flag independent from the render sequence so it remains visible in
    // tests and after a reset with permanent bonuses.
    this.unlocked = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public setPermanentDamageMultiplier(multiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(multiplier);
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
  }

  public fire(player: PlayerState): boolean {
    if (!this.unlocked || this.phase !== 'idle') return false;
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.state.originX = player.x;
    this.state.originY = player.y;
    this.state.startRadius = DEFINITION.startRadius;
    this.state.endRadius = DEFINITION.endRadius;
    this.state.width = DEFINITION.width;
    this.state.sequence = this.state.sequence >= 2_000_000_000 ? 1 : this.state.sequence + 1;
    this.syncState();
    return true;
  }

  public update(dtSeconds: number): void {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (!this.unlocked || this.phase === 'idle' || remaining <= 0) return;

    while (remaining > EPSILON && this.phase !== 'idle') {
      const previousRadius = this.state.radius;
      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;
      this.syncState();

      if (this.phase === 'active') this.hitAlongSweep(previousRadius, this.state.radius);

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      if (this.phase === 'telegraph') {
        this.phase = 'active';
      } else if (this.phase === 'active') {
        this.phase = 'recovery';
      } else {
        this.phase = 'idle';
      }
    }
    this.syncState();
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.unlocked = false;
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
    this.hitCastMarkers.fill(0);
    this.hitEnemyGenerations.fill(0);
    Object.assign(this.state, {
      active: false,
      phase: 'idle' as const,
      originX: 0,
      originY: 0,
      radius: 0,
      startRadius: DEFINITION.startRadius,
      endRadius: DEFINITION.endRadius,
      progress: 0,
      width: DEFINITION.width,
      sequence: 0
    });
  }

  private hitAlongSweep(previousRadius: number, currentRadius: number): void {
    const toleranceBase = DEFINITION.width * 0.5;
    const low = Math.min(previousRadius, currentRadius) - toleranceBase - 48;
    const high = Math.max(previousRadius, currentRadius) + toleranceBase + 48;
    const queryRadius = Math.max(Math.abs(low), Math.abs(high));
    const candidates = this.context.enemies.queryCircle(this.state.originX, this.state.originY, queryRadius);
    const cast = this.state.sequence;

    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (this.hitCastMarkers[index] === cast && this.hitEnemyGenerations[index] === enemy.generation) continue;
      const distance = Math.hypot(enemy.x - this.state.originX, enemy.y - this.state.originY);
      const tolerance = toleranceBase + enemy.radius;
      const bandLow = Math.min(previousRadius, currentRadius) - tolerance;
      const bandHigh = Math.max(previousRadius, currentRadius) + tolerance;
      if (distance < bandLow || distance > bandHigh) continue;

      this.hitCastMarkers[index] = cast;
      this.hitEnemyGenerations[index] = enemy.generation;
      enemy.health -= this.context.rollCriticalDamage(this.damage);
      if (enemy.health <= 0) {
        this.context.onEnemyDefeated(enemy);
        continue;
      }
      if (enemy.kind !== 'boss') this.pushEnemy(enemy, distance);
    }
  }

  private pushEnemy(enemy: EnemyState, distance: number): void {
    if (distance <= EPSILON) return;
    // This is an impact impulse, not a velocity. Keeping it independent from
    // frame dt makes the response readable at 30/60/144 Hz and avoids the
    // old 1.5-unit nudge that was technically correct but imperceptible.
    const push = Math.min(24, Math.max(0, DEFINITION.pushDistance));
    enemy.x += ((enemy.x - this.state.originX) / distance) * push;
    enemy.y += ((enemy.y - this.state.originY) / distance) * push;
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return DEFINITION.telegraphSeconds;
    if (this.phase === 'active') return DEFINITION.attackSeconds;
    return DEFINITION.recoverySeconds;
  }

  private syncState(): void {
    const active = this.phase !== 'idle';
    this.state.active = active;
    this.state.phase = this.phase;
    this.state.width = DEFINITION.width;
    this.state.progress = active
      ? Math.min(1, this.phaseTimer / Math.max(EPSILON, this.phaseDuration()))
      : 0;
    if (this.phase === 'idle' || this.phase === 'telegraph') {
      this.state.radius = this.phase === 'telegraph' ? DEFINITION.startRadius : 0;
      return;
    }
    const travelProgress = this.phase === 'active' ? this.state.progress : 1;
    this.state.radius = DEFINITION.startRadius
      + (DEFINITION.endRadius - DEFINITION.startRadius) * smoothstep(travelProgress);
  }

  private unlocked = false;
}

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};
