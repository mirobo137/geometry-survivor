import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { clampPointToArena, type ArenaBoundaryInput } from '../ArenaBoundary';
import type { PlayerState } from '../PlayerModel';
import type { MagneticChargeState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const DEFINITION = WEAPON_DEFINITIONS.magneticCharge;
const FULL_CIRCLE = Math.PI * 2;
const EPSILON = 0.000001;
const RANDOM_SEED = 0x4d61_676e;

export type MagneticChargePhase = 'idle' | 'travel' | 'attract' | 'detonate' | 'recovery';

export interface MagneticChargeBehaviorContext {
  readonly enemies: EnemySystem;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

/**
 * Remote, single-instance weapon. A seeded destination is captured at launch,
 * the charge stays there while it pulls non-boss enemies, then its annular
 * detonation ticks independently per target before disappearing.
 */
export class MagneticChargeBehavior {
  public readonly state: MagneticChargeState = {
    active: false,
    phase: 'idle',
    originX: 0,
    originY: 0,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    innerRadius: DEFINITION.innerRadius,
    outerRadius: DEFINITION.outerRadius,
    pullRadius: DEFINITION.pullRadius,
    progress: 0,
    rotation: 0,
    sequence: 0
  };

  private readonly hitCooldowns: Float32Array;
  private readonly hitGenerations: Uint32Array;
  private phase: MagneticChargePhase = 'idle';
  private phaseTimer = 0;
  private cooldownTimer = 0;
  private readyToFire = false;
  private unlocked = false;
  private damage = DEFINITION.damage;
  private cooldownSeconds = DEFINITION.cooldownSeconds;
  private permanentDamageMultiplier = 1;
  private permanentCadenceMultiplier = 1;
  private randomState = RANDOM_SEED;

  public constructor(private readonly context: MagneticChargeBehaviorContext) {
    this.hitCooldowns = new Float32Array(context.enemies.pool.capacity);
    this.hitGenerations = new Uint32Array(context.enemies.pool.capacity);
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentCooldown(): number {
    return this.cooldownSeconds;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    this.unlocked = true;
    this.readyToFire = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public setPermanentBonuses(damageMultiplier: number, cadenceMultiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(damageMultiplier);
    this.permanentCadenceMultiplier = normalizeMultiplier(cadenceMultiplier);
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
    this.cooldownSeconds = Math.max(
      0.45,
      DEFINITION.cooldownSeconds * this.permanentCadenceMultiplier
    );
  }

  /** Allows deterministic tests and the isolated drill to launch immediately. */
  public fire(player: PlayerState, arena: ArenaBoundaryInput): boolean {
    if (!this.unlocked || this.phase !== 'idle') return false;
    this.startCast(player, arena);
    return true;
  }

  public update(
    dtSeconds: number,
    player: PlayerState,
    arena: ArenaBoundaryInput,
    cooldownOverrideSeconds = this.cooldownSeconds
  ): void {
    let remaining = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (!this.unlocked || remaining <= 0) return;

    this.tickHitCooldowns(remaining);
    const frameDelta = remaining;
    if (this.phase !== 'idle') {
      this.state.rotation = (this.state.rotation + frameDelta * 1.8) % FULL_CIRCLE;
    }
    while (remaining > EPSILON) {
      if (this.phase === 'idle') {
        const cooldown = Math.max(0.45, cooldownOverrideSeconds);
        if (this.readyToFire) {
          this.readyToFire = false;
          this.startCast(player, arena);
          continue;
        }
        const untilFire = Math.max(0, cooldown - this.cooldownTimer);
        if (remaining < untilFire) {
          this.cooldownTimer += remaining;
          remaining = 0;
          break;
        }
        this.cooldownTimer = 0;
        remaining -= untilFire;
        this.startCast(player, arena);
        continue;
      }

      const duration = this.phaseDuration();
      const step = Math.min(remaining, Math.max(0, duration - this.phaseTimer));
      this.phaseTimer += step;
      remaining -= step;
      this.syncState();

      if (this.phase === 'attract') this.pullEnemies(step);
      if (this.phase === 'detonate') this.hitDetonationBand();

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      if (this.phase === 'travel') {
        this.phase = 'attract';
      } else if (this.phase === 'attract') {
        this.phase = 'detonate';
      } else if (this.phase === 'detonate') {
        this.phase = 'recovery';
      } else {
        this.phase = 'idle';
        this.cooldownTimer = 0;
      }
    }
    this.syncState();
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseTimer = 0;
    this.cooldownTimer = 0;
    this.readyToFire = false;
    this.unlocked = false;
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
    this.cooldownSeconds = Math.max(0.45, DEFINITION.cooldownSeconds * this.permanentCadenceMultiplier);
    this.randomState = RANDOM_SEED;
    this.hitCooldowns.fill(0);
    this.hitGenerations.fill(0);
    Object.assign(this.state, {
      active: false,
      phase: 'idle' as const,
      originX: 0,
      originY: 0,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      innerRadius: DEFINITION.innerRadius,
      outerRadius: DEFINITION.outerRadius,
      pullRadius: DEFINITION.pullRadius,
      progress: 0,
      rotation: 0,
      sequence: 0
    });
  }

  private startCast(player: PlayerState, arena: ArenaBoundaryInput): void {
    const target = this.pickTarget(player, arena);
    this.phase = 'travel';
    this.phaseTimer = 0;
    this.cooldownTimer = 0;
    this.readyToFire = false;
    this.state.originX = player.x;
    this.state.originY = player.y;
    this.state.x = player.x;
    this.state.y = player.y;
    this.state.targetX = target.x;
    this.state.targetY = target.y;
    this.state.innerRadius = DEFINITION.innerRadius;
    this.state.outerRadius = DEFINITION.outerRadius;
    this.state.pullRadius = DEFINITION.pullRadius;
    this.state.rotation = 0;
    this.state.sequence = this.state.sequence >= 2_000_000_000 ? 1 : this.state.sequence + 1;
    this.syncState();
  }

  private pickTarget(player: PlayerState, arena: ArenaBoundaryInput): { x: number; y: number } {
    let best = { x: player.x, y: player.y };
    let bestDistance = -1;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const angle = this.nextRandom() * FULL_CIRCLE;
      const distance = DEFINITION.minLaunchDistance
        + this.nextRandom() * (DEFINITION.maxLaunchDistance - DEFINITION.minLaunchDistance);
      const candidate = clampPointToArena(
        player.x + Math.cos(angle) * distance,
        player.y + Math.sin(angle) * distance,
        16,
        arena
      );
      const candidateDistance = Math.hypot(candidate.x - player.x, candidate.y - player.y);
      if (candidateDistance > bestDistance) {
        best = candidate;
        bestDistance = candidateDistance;
      }
      if (candidateDistance >= DEFINITION.minLaunchDistance * 0.7) return candidate;
    }
    return best;
  }

  private pullEnemies(dtSeconds: number): void {
    const candidates = this.context.enemies.queryCircle(
      this.state.targetX,
      this.state.targetY,
      DEFINITION.pullRadius + 48
    );
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0 || enemy.kind === 'boss') continue;
      const dx = this.state.targetX - enemy.x;
      const dy = this.state.targetY - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001 || distance > DEFINITION.pullRadius + enemy.radius) continue;
      const step = Math.min(distance, DEFINITION.pullStrength * dtSeconds);
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
      enemy.vx = (dx / distance) * DEFINITION.pullStrength;
      enemy.vy = (dy / distance) * DEFINITION.pullStrength;
    }
  }

  private hitDetonationBand(): void {
    const candidates = this.context.enemies.queryCircle(
      this.state.targetX,
      this.state.targetY,
      DEFINITION.outerRadius + 48
    );
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (this.hitGenerations[index] === enemy.generation && this.hitCooldowns[index] > 0) continue;
      const distance = Math.hypot(enemy.x - this.state.targetX, enemy.y - this.state.targetY);
      const insideBand = distance + enemy.radius >= DEFINITION.innerRadius
        && distance - enemy.radius <= DEFINITION.outerRadius;
      if (!insideBand) continue;
      this.hitGenerations[index] = enemy.generation;
      this.hitCooldowns[index] = this.currentHitCooldown();
      enemy.health -= this.context.rollCriticalDamage(this.damage);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private tickHitCooldowns(dtSeconds: number): void {
    for (let index = 0; index < this.hitCooldowns.length; index += 1) {
      this.hitCooldowns[index] = Math.max(0, this.hitCooldowns[index] - dtSeconds);
    }
  }

  private currentHitCooldown(): number {
    return Math.max(0.12, DEFINITION.hitCooldownSeconds * this.permanentCadenceMultiplier);
  }

  private phaseDuration(): number {
    if (this.phase === 'travel') return DEFINITION.travelSeconds;
    if (this.phase === 'attract') return DEFINITION.attractSeconds;
    if (this.phase === 'detonate') return DEFINITION.detonateSeconds;
    return DEFINITION.recoverySeconds;
  }

  private syncState(): void {
    const active = this.phase !== 'idle';
    this.state.active = active;
    this.state.phase = this.phase;
    this.state.progress = active
      ? Math.min(1, this.phaseTimer / Math.max(EPSILON, this.phaseDuration()))
      : 0;
    if (this.phase === 'travel') {
      const progress = smoothstep(this.state.progress);
      this.state.x = this.state.originX + (this.state.targetX - this.state.originX) * progress;
      this.state.y = this.state.originY + (this.state.targetY - this.state.originY) * progress;
    } else {
      this.state.x = this.state.targetX;
      this.state.y = this.state.targetY;
    }
  }

  private nextRandom(): number {
    let state = this.randomState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.randomState = state >>> 0;
    return this.randomState / 0x1_0000_0000;
  }
}

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);

const smoothstep = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
};
