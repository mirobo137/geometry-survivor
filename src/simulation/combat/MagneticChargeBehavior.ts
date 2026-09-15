import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import { clampPointToArena, type ArenaBoundaryInput } from '../ArenaBoundary';
import type { PlayerState } from '../PlayerModel';
import type { MagneticChargeState } from './CombatRenderState';
import type { EnemyState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { MagneticChargeEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';

const DEFINITION = WEAPON_DEFINITIONS.magneticCharge;
const FULL_CIRCLE = Math.PI * 2;
const EPSILON = 0.000001;
const RANDOM_SEED = 0x4d61_676e;
const EVENT_CORE_RADIUS = 64;
const EVENT_FINAL_RADIUS = 110;
const POLAR_TRIANGLE_RADIUS_FACTOR = 0.61;
// Keep the three fronts narrow enough to read as blades, but give their
// collision a stable authored width so a visible front cannot miss an enemy
// because of a one-pixel sampling gap. The final core is intentionally a bit
// larger than the original prototype's 55u so Polar Collapse has a reliable
// damage beat when an enemy reaches the convergence point.
const POLAR_FINAL_RADIUS_FACTOR = 0.43;
const POLAR_FRONT_WIDTH = 24;
const POLAR_FINAL_FIRST_TICK_PROGRESS = 0.18;
const POLAR_FINAL_SECOND_TICK_PROGRESS = 0.68;
const POLAR_COLLAPSE_SECONDS = 0.42;
const POLAR_PULL_STRENGTH = 165;

export type MagneticChargePhase = 'idle' | 'travel' | 'attract' | 'detonate' | 'collapse' | 'recovery';

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
    sequence: 0,
    polarAngle: 0,
    polarRadius: DEFINITION.outerRadius * POLAR_TRIANGLE_RADIUS_FACTOR,
    evolution: null
  };

  private readonly hitCooldowns: Float32Array;
  private readonly hitGenerations: Uint32Array;
  private readonly collapseHitGenerations: Uint32Array;
  private readonly polarFinalHitGenerations: Uint32Array;
  private readonly polarFinalHitCounts: Uint8Array;
  private phase: MagneticChargePhase = 'idle';
  private phaseTimer = 0;
  private cooldownTimer = 0;
  private readyToFire = false;
  private unlocked = false;
  private damage = DEFINITION.damage;
  private cooldownSeconds = DEFINITION.cooldownSeconds;
  private travelSeconds = DEFINITION.travelSeconds;
  private detonateSeconds = DEFINITION.detonateSeconds;
  private pullRadius = DEFINITION.pullRadius;
  private outerRadius = DEFINITION.outerRadius;
  private rank = 1;
  private permanentDamageMultiplier = 1;
  private permanentCadenceMultiplier = 1;
  private evolution: MagneticChargeEvolution | null = null;
  private randomState = RANDOM_SEED;

  public constructor(private readonly context: MagneticChargeBehaviorContext) {
    this.hitCooldowns = new Float32Array(context.enemies.pool.capacity);
    this.hitGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.collapseHitGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.polarFinalHitGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.polarFinalHitCounts = new Uint8Array(context.enemies.pool.capacity);
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

  public get currentEvolution(): MagneticChargeEvolution | null {
    return this.evolution;
  }

  public get currentRank(): number {
    return this.rank;
  }

  public get currentOuterRadius(): number {
    return this.outerRadius;
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
    this.applyRankTuning();
  }

  /** Applies one focused-path rank and preserves the single-cast contract. */
  public setRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.rank + 1) return false;
    this.rank = rank;
    this.applyRankTuning();
    return true;
  }

  public setEvolution(evolution: MagneticChargeEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    this.applyEvolutionTuning();
    return true;
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
      if (this.evolution === 'event_horizon' && this.phase === 'attract') this.hitEventCore();
      else if (this.evolution === 'polar_collapse' && this.phase === 'detonate') this.hitPolarFronts();
      else if (this.phase === 'detonate') this.hitDetonationBand();
      if (this.evolution === 'event_horizon' && this.phase === 'collapse') this.hitEventFinal();
      else if (this.evolution === 'polar_collapse' && this.phase === 'collapse') this.hitPolarFinal();
      else if (this.phase === 'collapse') this.hitDetonationBand(0.55, true);

      if (this.phaseTimer + EPSILON < duration) continue;
      this.phaseTimer = 0;
      if (this.phase === 'travel') {
        this.phase = 'attract';
      } else if (this.phase === 'attract') {
        this.phase = this.evolution === 'event_horizon' ? 'collapse' : 'detonate';
      } else if (this.phase === 'detonate') {
        this.phase = this.evolution === 'polar_collapse' || this.evolution === 'event_horizon'
          ? 'collapse' : 'recovery';
      } else if (this.phase === 'collapse') {
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
    this.rank = 1;
    this.damage = DEFINITION.damage * this.permanentDamageMultiplier;
    this.cooldownSeconds = Math.max(0.45, DEFINITION.cooldownSeconds * this.permanentCadenceMultiplier);
    this.travelSeconds = DEFINITION.travelSeconds;
    this.detonateSeconds = DEFINITION.detonateSeconds;
    this.pullRadius = DEFINITION.pullRadius;
    this.outerRadius = DEFINITION.outerRadius;
    this.randomState = RANDOM_SEED;
    this.hitCooldowns.fill(0);
    this.hitGenerations.fill(0);
    this.collapseHitGenerations.fill(0);
    this.polarFinalHitGenerations.fill(0);
    this.polarFinalHitCounts.fill(0);
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
      sequence: 0,
      polarAngle: 0,
      polarRadius: DEFINITION.outerRadius * POLAR_TRIANGLE_RADIUS_FACTOR,
      evolution: null
    });
  }

  private startCast(player: PlayerState, arena: ArenaBoundaryInput): void {
    const target = this.pickTarget(player, arena);
    // Every remote cast owns a fresh hit ledger. This also protects the
    // collapse phase when a pooled enemy slot is reused between casts.
    this.hitGenerations.fill(0);
    this.collapseHitGenerations.fill(0);
    this.polarFinalHitGenerations.fill(0);
    this.polarFinalHitCounts.fill(0);
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
    this.state.innerRadius = this.effectiveInnerRadius();
    this.state.outerRadius = this.effectiveOuterRadius();
    this.state.pullRadius = this.effectivePullRadius();
    this.state.polarAngle = this.nextRandom() * FULL_CIRCLE;
    this.state.polarRadius = this.effectivePolarRadius();
    this.state.rotation = 0;
    this.state.evolution = this.evolution;
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
        this.evolution === 'polar_collapse' ? 16 + 90 : 16,
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
      this.state.pullRadius + 48
    );
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0 || enemy.kind === 'boss') continue;
      const dx = this.state.targetX - enemy.x;
      const dy = this.state.targetY - enemy.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001 || distance > this.state.pullRadius + enemy.radius) continue;
      // Base/Event Horizon stop short of their damaging centre. Polar Collapse
      // is the deliberate exception: its remote core needs to retain targets
      // long enough to deliver both collapse pulses, away from the player.
      const safeDistance = this.evolution === 'polar_collapse'
        ? this.effectivePolarFinalRadius() + 8
        : this.state.innerRadius + enemy.radius + 8;
      if (distance <= safeDistance) {
        enemy.vx = 0;
        enemy.vy = 0;
        continue;
      }
      const step = Math.min(distance - safeDistance, this.effectivePullStrength() * dtSeconds);
      enemy.x += (dx / distance) * step;
      enemy.y += (dy / distance) * step;
      enemy.vx = (dx / distance) * this.effectivePullStrength();
      enemy.vy = (dy / distance) * this.effectivePullStrength();
    }
  }

  private hitDetonationBand(partialDamage = 1, collapse = false): void {
    const candidates = this.context.enemies.queryCircle(
      this.state.targetX,
      this.state.targetY,
      this.state.outerRadius + 48
    );
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (!collapse && this.hitGenerations[index] === enemy.generation && this.hitCooldowns[index] > 0) continue;
      if (collapse && this.collapseHitGenerations[index] === enemy.generation) continue;
      const distance = Math.hypot(enemy.x - this.state.targetX, enemy.y - this.state.targetY);
      const contraction = collapse ? 1 - Math.sin(this.state.progress * Math.PI) * 0.28 : 1;
      const innerRadius = this.state.innerRadius * contraction;
      const outerRadius = this.state.outerRadius * contraction;
      const insideBand = distance + enemy.radius >= innerRadius
        && distance - enemy.radius <= outerRadius;
      if (!insideBand) continue;
      if (collapse) this.collapseHitGenerations[index] = enemy.generation;
      else {
        this.hitGenerations[index] = enemy.generation;
        this.hitCooldowns[index] = this.currentHitCooldown();
      }
      enemy.health -= this.context.rollCriticalDamage(this.damage * partialDamage);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private hitEventCore(): void {
    const candidates = this.context.enemies.queryCircle(
      this.state.targetX,
      this.state.targetY,
      EVENT_CORE_RADIUS + 48
    );
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (this.hitGenerations[index] === enemy.generation && this.hitCooldowns[index] > 0) continue;
      if (Math.hypot(enemy.x - this.state.targetX, enemy.y - this.state.targetY)
        > EVENT_CORE_RADIUS + enemy.radius) continue;
      this.hitGenerations[index] = enemy.generation;
      this.hitCooldowns[index] = Math.max(0.12, 0.25 * this.permanentCadenceMultiplier);
      enemy.health -= this.context.rollCriticalDamage(this.damage * 0.65 / 6.4);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private hitEventFinal(): void {
    const candidates = this.context.enemies.queryCircle(this.state.targetX, this.state.targetY, EVENT_FINAL_RADIUS + 48);
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (this.collapseHitGenerations[index] === enemy.generation) continue;
      if (Math.hypot(enemy.x - this.state.targetX, enemy.y - this.state.targetY)
        > EVENT_FINAL_RADIUS + enemy.radius) continue;
      this.collapseHitGenerations[index] = enemy.generation;
      enemy.health -= this.context.rollCriticalDamage(this.damage * 0.35);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private hitPolarFronts(): void {
    const progress = this.state.progress;
    for (let spoke = 0; spoke < 3; spoke += 1) {
      const angle = (this.state.polarAngle ?? 0) + spoke * FULL_CIRCLE / 3;
      const vertexX = this.state.targetX + Math.cos(angle) * (this.state.polarRadius ?? 0);
      const vertexY = this.state.targetY + Math.sin(angle) * (this.state.polarRadius ?? 0);
      const startX = vertexX + (this.state.targetX - vertexX) * progress;
      const startY = vertexY + (this.state.targetY - vertexY) * progress;
      const dx = this.state.targetX - startX;
      const dy = this.state.targetY - startY;
      const length = Math.hypot(dx, dy);
      const candidates = this.context.enemies.queryCircle(
        (startX + this.state.targetX) * 0.5,
        (startY + this.state.targetY) * 0.5,
        length * 0.5 + POLAR_FRONT_WIDTH + 48
      );
      for (const index of candidates) {
        const enemy = this.context.enemies.getState(index);
        if (!enemy.active || enemy.health <= 0) continue;
        if (this.collapseHitGenerations[index] === enemy.generation) continue;
        if (distanceToSegmentSquared(enemy.x, enemy.y, startX, startY, dx, dy)
          > (POLAR_FRONT_WIDTH * 0.5 + enemy.radius) ** 2) continue;
        this.collapseHitGenerations[index] = enemy.generation;
        enemy.health -= this.context.rollCriticalDamage(this.damage * 0.2);
        if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
      }
    }
  }

  private hitPolarFinal(): void {
    const radius = this.state.outerRadius * POLAR_FINAL_RADIUS_FACTOR;
    const candidates = this.context.enemies.queryCircle(this.state.targetX, this.state.targetY, radius + 48);
    const targetHitCount = this.state.progress >= POLAR_FINAL_SECOND_TICK_PROGRESS
      ? 2
      : this.state.progress >= POLAR_FINAL_FIRST_TICK_PROGRESS ? 1 : 0;
    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0) continue;
      if (this.polarFinalHitGenerations[index] !== enemy.generation) {
        this.polarFinalHitGenerations[index] = enemy.generation;
        this.polarFinalHitCounts[index] = 0;
      }
      if (Math.hypot(enemy.x - this.state.targetX, enemy.y - this.state.targetY) > radius + enemy.radius) continue;
      while (this.polarFinalHitCounts[index] < targetHitCount) {
        this.polarFinalHitCounts[index] += 1;
        enemy.health -= this.context.rollCriticalDamage(this.damage * 0.2);
        if (enemy.health <= 0) {
          this.context.onEnemyDefeated(enemy);
          break;
        }
      }
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
    if (this.phase === 'travel') return this.travelSeconds;
    if (this.phase === 'attract') return this.evolution === 'event_horizon'
      ? 1.6
      : this.evolution === 'polar_collapse' ? 0.3 : DEFINITION.attractSeconds;
    if (this.phase === 'detonate') return this.evolution === 'polar_collapse' ? 0.45 : this.detonateSeconds;
    if (this.phase === 'collapse') return this.evolution === 'event_horizon' ? 0.2 : this.evolution === 'polar_collapse' ? POLAR_COLLAPSE_SECONDS : 0.55;
    return DEFINITION.recoverySeconds;
  }

  private syncState(): void {
    const active = this.phase !== 'idle';
    this.state.active = active;
    this.state.phase = this.phase;
    this.state.evolution = this.evolution;
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

  private applyEvolutionTuning(): void {
    if (this.evolution === 'event_horizon') {
      this.damage *= 0.85;
      this.cooldownSeconds *= 1.2;
    } else if (this.evolution === 'polar_collapse') {
      this.cooldownSeconds *= 1.25;
    }
  }

  private applyRankTuning(): void {
    this.damage = (this.rank >= 5 ? 22 : DEFINITION.damage) * this.permanentDamageMultiplier;
    this.cooldownSeconds = Math.max(
      0.45,
      (this.rank >= 6 ? 4.6 : DEFINITION.cooldownSeconds) * this.permanentCadenceMultiplier
    );
    this.travelSeconds = this.rank >= 2 ? 0.34 : DEFINITION.travelSeconds;
    this.detonateSeconds = this.rank >= 7 ? 1.6 : DEFINITION.detonateSeconds;
    this.pullRadius = this.rank >= 4 ? 200 : DEFINITION.pullRadius;
    this.outerRadius = this.rank >= 3 ? 166 : DEFINITION.outerRadius;
    this.applyEvolutionTuning();
  }

  private effectivePullRadius(): number {
    return this.pullRadius;
  }

  private effectivePullStrength(): number {
    return this.evolution === 'event_horizon'
      ? 110
      : this.evolution === 'polar_collapse' ? POLAR_PULL_STRENGTH : DEFINITION.pullStrength;
  }

  private effectiveInnerRadius(): number {
    return this.evolution === 'event_horizon' ? EVENT_CORE_RADIUS : DEFINITION.innerRadius;
  }

  private effectiveOuterRadius(): number {
    return this.evolution === 'event_horizon' ? EVENT_FINAL_RADIUS : this.outerRadius;
  }

  private effectivePolarRadius(): number {
    return this.outerRadius * POLAR_TRIANGLE_RADIUS_FACTOR;
  }

  private effectivePolarFinalRadius(): number {
    return this.outerRadius * POLAR_FINAL_RADIUS_FACTOR;
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

const distanceToSegmentSquared = (
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number
): number => {
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const progress = lengthSquared <= EPSILON
    ? 0
    : Math.min(1, Math.max(0, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  const closestX = startX + deltaX * progress;
  const closestY = startY + deltaY * progress;
  return (pointX - closestX) ** 2 + (pointY - closestY) ** 2;
};
