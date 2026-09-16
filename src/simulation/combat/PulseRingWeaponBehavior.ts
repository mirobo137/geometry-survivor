import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { PulseRingWeaponState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { PulseRingEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';

const DEFINITION = WEAPON_DEFINITIONS.pulseRing;
const EPSILON = 0.000001;
const COMPRESSION_WAVE_END_RADIUS = 320;

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
    sequence: 0,
    wave: 0,
    directionX: 0,
    directionY: -1,
    secondaryOriginX: 0,
    secondaryOriginY: 0,
    evolution: null
  };

  private readonly hitCastMarkers: Uint32Array;
  private readonly hitEnemyGenerations: Uint32Array;
  /** Wave marker per cast/pooled enemy slot. Echo may hit once per wave. */
  private readonly hitWaveMarkers: Uint8Array;
  private phaseTimer = 0;
  private phase: PulseRingWeaponState['phase'] = 'idle';
  private damage = DEFINITION.damage;
  private telegraphSeconds = DEFINITION.telegraphSeconds;
  private endRadius = DEFINITION.endRadius;
  private compressionCoverageBonus = 0;
  private pushDistance = DEFINITION.pushDistance;
  private rank = 1;
  private directionX = 0;
  private directionY = -1;
  private castDirectionX = 0;
  private castDirectionY = -1;
  private lastPlayerX: number | null = null;
  private lastPlayerY: number | null = null;
  private permanentDamageMultiplier = 1;
  private evolution: PulseRingEvolution | null = null;

  public constructor(private readonly context: PulseRingWeaponBehaviorContext) {
    this.hitCastMarkers = new Uint32Array(context.enemies.pool.capacity);
    this.hitEnemyGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.hitWaveMarkers = new Uint8Array(context.enemies.pool.capacity);
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentEvolution(): PulseRingEvolution | null {
    return this.evolution;
  }

  public get currentRank(): number {
    return this.rank;
  }

  public get currentEndRadius(): number {
    return this.effectiveEndRadius();
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

  public increaseEndRadius(amount: number): void {
    const increase = Math.max(0, amount);
    this.endRadius += increase;
    if (this.evolution === 'compression_wave') this.compressionCoverageBonus += increase;
  }

  public setPermanentDamageMultiplier(multiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(multiplier);
    this.applyRankTuning();
  }

  /** Applies one focused-path rank; the scheduler owns the cast interval. */
  public setRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.rank + 1) return false;
    this.rank = rank;
    this.applyRankTuning();
    return true;
  }

  public setEvolution(evolution: PulseRingEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    this.applyEvolutionTuning();
    return true;
  }

  public fire(player: PlayerState): boolean {
    if (!this.unlocked || this.phase !== 'idle') return false;
    this.phase = 'telegraph';
    this.phaseTimer = 0;
    this.state.originX = player.x;
    this.state.originY = player.y;
    this.state.startRadius = DEFINITION.startRadius;
    this.state.endRadius = this.effectiveEndRadius();
    this.state.width = DEFINITION.width;
    this.state.wave = 0;
    this.state.secondaryOriginX = player.x;
    this.state.secondaryOriginY = player.y;
    // The telegraph and the damaging front share one captured axis. Player
    // movement can aim the next cast, but cannot rotate an already announced
    // wave away from the hitbox the player just read.
    this.castDirectionX = this.directionX;
    this.castDirectionY = this.directionY;
    this.state.directionX = this.castDirectionX;
    this.state.directionY = this.castDirectionY;
    this.state.evolution = this.evolution;
    this.hitWaveMarkers.fill(0);
    this.state.sequence = this.state.sequence >= 2_000_000_000 ? 1 : this.state.sequence + 1;
    this.syncState();
    return true;
  }

  public update(dtSeconds: number, player?: PlayerState): void {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (!this.unlocked || remaining <= 0) return;
    if (player) this.updateMovementDirection(player);
    if (this.phase === 'idle') return;

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
      } else if (this.phase === 'recovery' && this.evolution === 'echo_shock' && this.state.wave === 0) {
        this.phase = 'active';
        this.state.wave = 1;
        this.state.secondaryOriginX = this.lastPlayerX ?? this.state.originX;
        this.state.secondaryOriginY = this.lastPlayerY ?? this.state.originY;
        this.state.originX = this.state.secondaryOriginX;
        this.state.originY = this.state.secondaryOriginY;
        // A new Echo Shock origin starts from the authored inner radius. Do
        // not sweep the completed radius of wave 0 around this new point.
        this.state.radius = DEFINITION.startRadius;
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
    this.rank = 1;
    this.evolution = null;
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
    this.telegraphSeconds = DEFINITION.telegraphSeconds;
    this.endRadius = DEFINITION.endRadius;
    this.compressionCoverageBonus = 0;
    this.pushDistance = DEFINITION.pushDistance;
    this.directionX = 0;
    this.directionY = -1;
    this.castDirectionX = 0;
    this.castDirectionY = -1;
    this.lastPlayerX = null;
    this.lastPlayerY = null;
    this.hitCastMarkers.fill(0);
    this.hitEnemyGenerations.fill(0);
    this.hitWaveMarkers.fill(0);
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
      sequence: 0,
      wave: 0,
      directionX: 0,
      directionY: -1,
      secondaryOriginX: 0,
      secondaryOriginY: 0,
      evolution: null
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
      const waveMarker = (this.state.wave ?? 0) + 1;
      if (this.hitCastMarkers[index] === cast
        && this.hitEnemyGenerations[index] === enemy.generation
        && this.hitWaveMarkers[index] === waveMarker) continue;
      const distance = Math.hypot(enemy.x - this.state.originX, enemy.y - this.state.originY);
      const tolerance = toleranceBase + enemy.radius;
      const bandLow = Math.min(previousRadius, currentRadius) - tolerance;
      const bandHigh = Math.max(previousRadius, currentRadius) + tolerance;
      if (distance < bandLow || distance > bandHigh) continue;
      if (this.evolution === 'compression_wave' && !this.isInsideCompressionFront(enemy)) continue;

      this.hitCastMarkers[index] = cast;
      this.hitEnemyGenerations[index] = enemy.generation;
      this.hitWaveMarkers[index] = waveMarker;
      const waveMultiplier = this.evolution === 'echo_shock' && this.state.wave === 1 ? 0.45 : 1;
      const damageMultiplier = this.evolution === 'compression_wave' ? 1 : waveMultiplier;
      enemy.health -= this.context.rollCriticalDamage(this.damage * damageMultiplier);
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
    const push = this.evolution === 'compression_wave'
      ? 32
      : Math.min(24, Math.max(0, this.pushDistance));
    enemy.x += ((enemy.x - this.state.originX) / distance) * push;
    enemy.y += ((enemy.y - this.state.originY) / distance) * push;
  }

  private isInsideCompressionFront(enemy: EnemyState): boolean {
    const x = enemy.x;
    const y = enemy.y;
    const distance = Math.hypot(x - this.state.originX, y - this.state.originY);
    if (distance <= EPSILON) return true;
    const dot = ((x - this.state.originX) / distance) * (this.state.directionX ?? this.castDirectionX)
      + ((y - this.state.originY) / distance) * (this.state.directionY ?? this.castDirectionY);
    // The visible 110-degree front collides as a capsule, not as a point
    // sample. Account for the enemy's radius at the edge so a hull that
    // visibly overlaps the front cannot be skipped just because its centre is
    // a few pixels outside the authored cone.
    const angularAllowance = Math.asin(Math.min(0.99, enemy.radius / Math.max(distance, enemy.radius)));
    return dot >= Math.cos(Math.PI * 55 / 180 + angularAllowance);
  }

  private phaseDuration(): number {
    if (this.phase === 'telegraph') return this.evolution === 'compression_wave' ? 0.35 : this.telegraphSeconds;
    if (this.phase === 'active') return this.evolution === 'compression_wave' ? 0.55 : DEFINITION.attackSeconds;
    return this.state.wave === 0 && this.evolution === 'echo_shock' ? 0.45 : DEFINITION.recoverySeconds;
  }

  private syncState(): void {
    const active = this.phase !== 'idle';
    this.state.active = active;
    this.state.phase = this.phase;
    this.state.evolution = this.evolution;
    this.state.wave = this.state.wave;
    this.state.width = DEFINITION.width;
    this.state.directionX = this.phase === 'idle' ? this.directionX : this.castDirectionX;
    this.state.directionY = this.phase === 'idle' ? this.directionY : this.castDirectionY;
    this.state.endRadius = this.effectiveEndRadius();
    this.state.progress = active
      ? Math.min(1, this.phaseTimer / Math.max(EPSILON, this.phaseDuration()))
      : 0;
    if (this.phase === 'idle' || this.phase === 'telegraph') {
      this.state.radius = this.phase === 'telegraph' ? DEFINITION.startRadius : 0;
      return;
    }
    const travelProgress = this.phase === 'active' ? this.state.progress : 1;
    this.state.radius = DEFINITION.startRadius
      + (this.effectiveEndRadius() - DEFINITION.startRadius)
        * smoothstep(travelProgress);
  }

  private applyEvolutionTuning(): void {
    // Evolution-specific geometry is resolved by its behavior branch; rank
    // values remain the source of truth for the base wave.
  }

  private applyRankTuning(): void {
    this.damage = (this.rank >= 5 ? 32 : DEFINITION.damage) * this.permanentDamageMultiplier;
    this.telegraphSeconds = this.rank >= 2 ? 0.5 : DEFINITION.telegraphSeconds;
    this.endRadius = this.rank >= 7 ? 240 : this.rank >= 3 ? 220 : DEFINITION.endRadius;
    this.pushDistance = this.rank >= 4 ? 16 : DEFINITION.pushDistance;
    this.applyEvolutionTuning();
  }

  private effectiveEndRadius(): number {
    return this.evolution === 'compression_wave'
      ? Math.max(this.endRadius, COMPRESSION_WAVE_END_RADIUS + this.compressionCoverageBonus)
      : this.endRadius;
  }

  private updateMovementDirection(player: PlayerState): void {
    if (this.lastPlayerX !== null && this.lastPlayerY !== null) {
      const dx = player.x - this.lastPlayerX;
      const dy = player.y - this.lastPlayerY;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.01) {
        this.directionX = dx / distance;
        this.directionY = dy / distance;
      }
    }
    this.lastPlayerX = player.x;
    this.lastPlayerY = player.y;
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
