import { OVERDRIVE_POWER_MULTIPLIER_CAP } from '../../content/run/OverdriveDefinitions';
import { getWeaponDamageAtRank, WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { BoomerangPulseState } from './CombatRenderState';
import type { EnemyState, BoomerangPool, BoomerangState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';
import type { BoomerangEvolution } from '../../content/weapons/WeaponEvolutionDefinitions';

const BOOMERANG_DEFINITION = WEAPON_DEFINITIONS.vectorBoomerang;
const TARGET_SEARCH_RADIUS = 960;
const CAPTURE_PADDING = 6;
const EPSILON = 0.000001;
const TWIN_COMET_ANGLES = [-0.64, -0.32, 0, 0.32, 0.64] as const;
const TWIN_COMET_RANGE_MULTIPLIER = 0.85;
const SINGULARITY_RADIUS = 155;
const SINGULARITY_BLAST_DAMAGE_MULTIPLIER = 1.8;
const SINGULARITY_SLOW_SECONDS = 1.5;
const SINGULARITY_SLOW_MULTIPLIER = 0.45;
const SINGULARITY_LIFE_SECONDS = 0.32;

export interface BoomerangBehaviorContext {
  readonly enemies: EnemySystem;
  readonly boomerangs: BoomerangPool;
  readonly rollCriticalDamage: (baseDamage: number) => number;
  readonly onEnemyDefeated: (enemy: EnemyState) => void;
}

/**
 * Owns the authoritative Vector Boomerang path and swept collision ledger.
 * Each pooled slot gets two fixed ledgers so a recycled enemy slot cannot be
 * mistaken for the enemy that was hit earlier in the same cast.
 */
export class BoomerangBehavior {
  private readonly outboundHitGenerations: Uint32Array[];
  private readonly returnHitGenerations: Uint32Array[];
  /** A single five-piece cast shares its per-phase target ledger. */
  private readonly twinOutboundHitGenerations: Uint32Array;
  private readonly twinReturnHitGenerations: Uint32Array;
  private readonly blastTargetIndices: Uint32Array;
  private readonly blastTargetGenerations: Uint32Array;
  private readonly returnCurveComplete: Uint8Array;
  private unlocked = false;
  private damage = BOOMERANG_DEFINITION.damage;
  private overdrivePowerMultiplier = 1;
  private speed = BOOMERANG_DEFINITION.speed;
  private returnSpeed = BOOMERANG_DEFINITION.returnSpeed;
  private radius = BOOMERANG_DEFINITION.radius;
  private outboundDistance = BOOMERANG_DEFINITION.outboundDistance;
  private rank = 1;
  private lastDirectionX = 0;
  private lastDirectionY = -1;
  private permanentDamageMultiplier = 1;
  private evolution: BoomerangEvolution | null = null;
  public readonly pulseState: BoomerangPulseState = {
    active: false,
    x: 0,
    y: 0,
    radius: SINGULARITY_RADIUS,
    progress: 0,
    sequence: 0
  };

  public constructor(private readonly context: BoomerangBehaviorContext) {
    this.outboundHitGenerations = Array.from(
      { length: context.boomerangs.capacity },
      () => new Uint32Array(context.enemies.pool.capacity)
    );
    this.returnHitGenerations = Array.from(
      { length: context.boomerangs.capacity },
      () => new Uint32Array(context.enemies.pool.capacity)
    );
    this.twinOutboundHitGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.twinReturnHitGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.blastTargetIndices = new Uint32Array(context.enemies.pool.capacity);
    this.blastTargetGenerations = new Uint32Array(context.enemies.pool.capacity);
    this.returnCurveComplete = new Uint8Array(context.boomerangs.capacity);
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public get currentEvolution(): BoomerangEvolution | null {
    return this.evolution;
  }

  public get currentRank(): number {
    return this.rank;
  }

  public get currentOutboundDistance(): number {
    return this.outboundDistance;
  }

  public get currentReturnSpeed(): number {
    return this.returnSpeed;
  }

  public get currentRadius(): number {
    return this.radius;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    this.unlocked = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public setOverdrivePowerMultiplier(multiplier: number): void {
    const next = normalizePowerMultiplier(multiplier);
    this.damage *= next / this.overdrivePowerMultiplier;
    this.overdrivePowerMultiplier = next;
  }

  public increaseOutboundDistance(amount: number): void {
    this.outboundDistance += Math.max(0, amount);
  }

  public setPermanentDamageMultiplier(multiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(multiplier);
    this.applyRankTuning();
  }

  /** Applies one focused-path rank; cooldown remains owned by the scheduler. */
  public setRank(rank: 2 | 3 | 4 | 5 | 6 | 7): boolean {
    if (rank !== this.rank + 1) return false;
    this.rank = rank;
    this.applyRankTuning();
    return true;
  }

  public setEvolution(evolution: BoomerangEvolution): boolean {
    if (this.evolution !== null) return false;
    this.evolution = evolution;
    return true;
  }

  public fire(player: PlayerState): void {
    const twinCast = this.evolution === 'twin_comet';
    const pieceCount = twinCast ? TWIN_COMET_ANGLES.length : 1;
    const activeCount = this.context.boomerangs.activeCount;
    if (!this.unlocked || pieceCount > this.context.boomerangs.capacity
      || (twinCast && activeCount > 0)
      || activeCount + pieceCount > (twinCast ? pieceCount : BOOMERANG_DEFINITION.maxActive)) return;
    const targetIndex = this.evolution === 'singularity_return'
      ? this.findDensestTargetIndex(player)
      : this.context.enemies.findNearestEnemyIndex(player.x, player.y, TARGET_SEARCH_RADIUS);
    const target = targetIndex >= 0 ? this.context.enemies.getState(targetIndex) : null;
    const targetIsValid = target?.active === true && target.health > 0;
    if (targetIsValid) {
      const dx = target!.x - player.x;
      const dy = target!.y - player.y;
      const distance = Math.max(EPSILON, Math.hypot(dx, dy));
      this.lastDirectionX = dx / distance;
      this.lastDirectionY = dy / distance;
    }
    const baseDirectionX = this.lastDirectionX;
    const baseDirectionY = this.lastDirectionY;
    if (twinCast) {
      this.twinOutboundHitGenerations.fill(0);
      this.twinReturnHitGenerations.fill(0);
    }
    for (let piece = 0; piece < pieceCount; piece += 1) {
      const state = this.context.boomerangs.acquire();
      if (!state) return;
      const angle = twinCast ? TWIN_COMET_ANGLES[piece] : 0;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const directionX = baseDirectionX * cosine - baseDirectionY * sine;
      const directionY = baseDirectionX * sine + baseDirectionY * cosine;
      state.x = player.x;
      state.y = player.y;
      state.vx = directionX * this.speed;
      state.vy = directionY * this.speed;
      state.radius = this.radius;
      state.damage = this.damage;
      state.ageSeconds = 0;
      state.lifetimeSeconds = BOOMERANG_DEFINITION.lifetimeSeconds;
      state.phase = 'outbound';
      state.directionX = directionX;
      state.directionY = directionY;
      state.distanceTravelled = 0;
      state.travelLimit = twinCast
        ? this.outboundDistance * TWIN_COMET_RANGE_MULTIPLIER
        : this.evolution === 'singularity_return' && targetIsValid
          ? Math.min(this.outboundDistance, Math.hypot(target!.x - player.x, target!.y - player.y))
          : this.outboundDistance;
      state.fanOffset = twinCast ? piece - 2 : 0;
      state.pathProgress = 0;
      state.curveStartX = player.x;
      state.curveStartY = player.y;
      state.curveControlX = 0;
      state.curveControlY = 0;
      state.curveEndX = this.evolution === 'singularity_return' && targetIsValid
        ? target!.x : player.x + directionX * state.travelLimit;
      state.curveEndY = this.evolution === 'singularity_return' && targetIsValid
        ? target!.y : player.y + directionY * state.travelLimit;
      state.returnControlX = 0;
      state.returnControlY = 0;
      state.returnStartX = state.curveEndX;
      state.returnStartY = state.curveEndY;
      state.returnTargetX = player.x;
      state.returnTargetY = player.y;
      this.returnCurveComplete[state.slotIndex] = 0;
      if (twinCast) {
        const normalX = -baseDirectionY;
        const normalY = baseDirectionX;
        state.curveControlX = player.x + directionX * state.travelLimit * 0.52 + normalX * state.fanOffset * 24;
        state.curveControlY = player.y + directionY * state.travelLimit * 0.52 + normalY * state.fanOffset * 24;
        state.curveEndX += normalX * state.fanOffset * 12;
        state.curveEndY += normalY * state.fanOffset * 12;
      }
      state.evolution = this.evolution;
      this.outboundHitGenerations[state.slotIndex].fill(0);
      this.returnHitGenerations[state.slotIndex].fill(0);
    }
  }

  public update(dtSeconds: number, player: PlayerState): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return;

    if (this.pulseState.active) {
      this.pulseState.progress = Math.min(1, this.pulseState.progress + dt / SINGULARITY_LIFE_SECONDS);
      if (this.pulseState.progress >= 1) this.pulseState.active = false;
    }

    for (const state of this.context.boomerangs.states) {
      if (!state.active) continue;
      state.ageSeconds += dt;
      state.lifetimeSeconds -= dt;
      if (state.lifetimeSeconds <= 0) {
        this.context.boomerangs.release(state);
        continue;
      }

      let remaining = dt;
      while (state.active && remaining > EPSILON) {
        if (state.phase === 'outbound') {
          const startX = state.x;
          const startY = state.y;
          if (state.evolution === 'twin_comet') {
            const duration = Math.max(EPSILON, state.travelLimit / this.speed);
            state.pathProgress = Math.min(1, state.pathProgress + remaining / duration);
            this.setQuadraticPosition(state, state.pathProgress, false);
            state.vx = (state.x - startX) / Math.max(EPSILON, remaining);
            state.vy = (state.y - startY) / Math.max(EPSILON, remaining);
            this.hitAlongSegment(state, startX, startY, state.x, state.y, 'outbound');
            remaining = 0;
            if (state.pathProgress >= 1 - EPSILON) this.beginReturn(state, player);
            continue;
          }
          const distanceToTurn = Math.max(0, state.travelLimit - state.distanceTravelled);
          const travel = Math.min(this.speed * remaining, distanceToTurn);
          state.x += state.directionX * travel;
          state.y += state.directionY * travel;
          state.vx = state.directionX * this.speed;
          state.vy = state.directionY * this.speed;
          state.distanceTravelled += travel;
          this.hitAlongSegment(state, startX, startY, state.x, state.y, 'outbound');
          remaining -= travel / this.speed;
          if (state.distanceTravelled >= state.travelLimit - EPSILON) {
            if (state.evolution === 'singularity_return') {
              this.detonateAtRemoteEndpoint(state);
            }
            this.beginReturn(state, player);
          }
          continue;
        }

        if (state.evolution === 'twin_comet' && this.returnCurveComplete[state.slotIndex] === 0) {
          const startX = state.x;
          const startY = state.y;
          const distance = Math.max(EPSILON, Math.hypot(
            state.returnTargetX - state.returnStartX,
            state.returnTargetY - state.returnStartY
          ));
          state.pathProgress = Math.min(1, state.pathProgress + remaining * this.returnSpeed / distance);
          this.setQuadraticPosition(state, state.pathProgress, true);
          state.vx = (state.x - startX) / Math.max(EPSILON, remaining);
          state.vy = (state.y - startY) / Math.max(EPSILON, remaining);
          this.hitAlongSegment(state, startX, startY, state.x, state.y, 'returning');
          remaining = 0;
          if (state.pathProgress >= 1 - EPSILON) this.returnCurveComplete[state.slotIndex] = 1;
          continue;
        }

        const dx = player.x - state.x;
        const dy = player.y - state.y;
        const distance = Math.hypot(dx, dy);
        const captureRadius = player.radius + CAPTURE_PADDING;
        if (distance <= captureRadius) {
          this.context.boomerangs.release(state);
          break;
        }

        const directionX = dx / Math.max(EPSILON, distance);
        const directionY = dy / Math.max(EPSILON, distance);
        state.vx = directionX * this.returnSpeed;
        state.vy = directionY * this.returnSpeed;
        const travel = Math.min(this.returnSpeed * remaining, distance);
        const startX = state.x;
        const startY = state.y;
        state.x += directionX * travel;
        state.y += directionY * travel;
        this.hitAlongSegment(state, startX, startY, state.x, state.y, 'returning');
        remaining -= travel / this.returnSpeed;
        if (Math.hypot(player.x - state.x, player.y - state.y) <= captureRadius) {
          this.context.boomerangs.release(state);
        }
      }
    }
  }

  public reset(): void {
    this.context.boomerangs.reset();
    for (const state of this.context.boomerangs.states) {
      state.x = 0;
      state.y = 0;
      state.vx = 0;
      state.vy = 0;
      state.radius = 0;
      state.damage = 0;
      state.ageSeconds = 0;
      state.lifetimeSeconds = 0;
      state.phase = 'outbound';
      state.directionX = 1;
      state.directionY = 0;
      state.distanceTravelled = 0;
      state.travelLimit = 0;
      state.fanOffset = 0;
      state.curveStartX = 0;
      state.curveStartY = 0;
      state.curveControlX = 0;
      state.curveControlY = 0;
      state.curveEndX = 0;
      state.curveEndY = 0;
      state.returnControlX = 0;
      state.returnControlY = 0;
      state.returnStartX = 0;
      state.returnStartY = 0;
      state.returnTargetX = 0;
      state.returnTargetY = 0;
      state.pathProgress = 0;
      state.evolution = null;
    }
    for (const ledger of this.outboundHitGenerations) ledger.fill(0);
    for (const ledger of this.returnHitGenerations) ledger.fill(0);
    this.twinOutboundHitGenerations.fill(0);
    this.twinReturnHitGenerations.fill(0);
    this.returnCurveComplete.fill(0);
    this.unlocked = false;
    this.rank = 1;
    this.overdrivePowerMultiplier = 1;
    this.damage = BOOMERANG_DEFINITION.damage * this.permanentDamageMultiplier;
    this.speed = BOOMERANG_DEFINITION.speed;
    this.returnSpeed = BOOMERANG_DEFINITION.returnSpeed;
    this.radius = BOOMERANG_DEFINITION.radius;
    this.outboundDistance = BOOMERANG_DEFINITION.outboundDistance;
    this.evolution = null;
    this.pulseState.active = false;
    this.pulseState.progress = 0;
    this.pulseState.sequence = 0;
  }

  /** Releases active boomerangs and FX without resetting the owned build. */
  public clearTransient(): void {
    const snapshot = {
      unlocked: this.unlocked,
      damage: this.damage,
      speed: this.speed,
      returnSpeed: this.returnSpeed,
      radius: this.radius,
      outboundDistance: this.outboundDistance,
      overdrivePowerMultiplier: this.overdrivePowerMultiplier,
      rank: this.rank,
      evolution: this.evolution,
      lastDirectionX: this.lastDirectionX,
      lastDirectionY: this.lastDirectionY,
      pulseSequence: this.pulseState.sequence
    };
    this.reset();
    this.unlocked = snapshot.unlocked;
    this.damage = snapshot.damage;
    this.speed = snapshot.speed;
    this.returnSpeed = snapshot.returnSpeed;
    this.radius = snapshot.radius;
    this.outboundDistance = snapshot.outboundDistance;
    this.overdrivePowerMultiplier = snapshot.overdrivePowerMultiplier;
    this.rank = snapshot.rank;
    this.evolution = snapshot.evolution;
    this.lastDirectionX = snapshot.lastDirectionX;
    this.lastDirectionY = snapshot.lastDirectionY;
    this.pulseState.sequence = snapshot.pulseSequence;
  }

  /** Evaluates the small fixed enemy pool only when a cast begins. */
  private findDensestTargetIndex(player: PlayerState): number {
    const states = this.context.enemies.pool.states;
    const rangeSquared = this.outboundDistance * this.outboundDistance;
    let bestIndex = -1;
    let bestCount = 0;
    let bestDistanceSquared = -1;
    for (let index = 0; index < states.length; index += 1) {
      const candidate = states[index];
      if (!candidate.active || candidate.health <= 0) continue;
      const dx = candidate.x - player.x;
      const dy = candidate.y - player.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > rangeSquared) continue;
      let count = 0;
      for (const other of states) {
        if (!other.active || other.health <= 0) continue;
        const groupDx = other.x - candidate.x;
        const groupDy = other.y - candidate.y;
        const reach = SINGULARITY_RADIUS + other.radius;
        if (groupDx * groupDx + groupDy * groupDy <= reach * reach) count += 1;
      }
      if (count > bestCount || (count === bestCount && distanceSquared > bestDistanceSquared)) {
        bestIndex = index;
        bestCount = count;
        bestDistanceSquared = distanceSquared;
      }
    }
    return bestIndex;
  }

  private detonateAtRemoteEndpoint(state: BoomerangState): void {
    this.triggerSingularityPulse(state.x, state.y);
    const states = this.context.enemies.pool.states;
    let targetCount = 0;
    for (let index = 0; index < states.length; index += 1) {
      const enemy = states[index];
      if (!enemy.active || enemy.health <= 0) continue;
      const dx = enemy.x - state.x;
      const dy = enemy.y - state.y;
      const reach = SINGULARITY_RADIUS + enemy.radius;
      if (dx * dx + dy * dy > reach * reach) continue;
      this.blastTargetIndices[targetCount] = index;
      this.blastTargetGenerations[targetCount] = enemy.generation;
      targetCount += 1;
    }
    for (let index = 0; index < targetCount; index += 1) {
      const enemy = states[this.blastTargetIndices[index]];
      if (!enemy.active || enemy.generation !== this.blastTargetGenerations[index]) continue;
      enemy.health -= this.context.rollCriticalDamage(state.damage * SINGULARITY_BLAST_DAMAGE_MULTIPLIER);
      if (enemy.health <= 0) {
        this.context.onEnemyDefeated(enemy);
      } else if (enemy.kind !== 'boss') {
        enemy.slowSeconds = Math.max(enemy.slowSeconds, SINGULARITY_SLOW_SECONDS);
        enemy.slowMultiplier = Math.min(enemy.slowMultiplier, SINGULARITY_SLOW_MULTIPLIER);
      }
    }
  }

  private triggerSingularityPulse(x: number, y: number): void {
    this.pulseState.active = true;
    this.pulseState.x = x;
    this.pulseState.y = y;
    this.pulseState.radius = SINGULARITY_RADIUS;
    this.pulseState.progress = 0;
    this.pulseState.sequence = this.pulseState.sequence >= 2_000_000_000
      ? 1 : this.pulseState.sequence + 1;
  }

  private beginReturn(state: BoomerangState, player: PlayerState): void {
    state.phase = 'returning';
    state.pathProgress = 0;
    state.returnStartX = state.x;
    state.returnStartY = state.y;
    state.returnTargetX = player.x;
    state.returnTargetY = player.y;
    this.returnCurveComplete[state.slotIndex] = state.evolution === 'twin_comet' ? 0 : 1;
    if (state.evolution === 'twin_comet') {
      const dx = player.x - state.x;
      const dy = player.y - state.y;
      const normalX = -state.directionY;
      const normalY = state.directionX;
      state.returnControlX = state.x + dx * 0.52 - normalX * state.fanOffset * 28;
      state.returnControlY = state.y + dy * 0.52 - normalY * state.fanOffset * 28;
    }
    this.setReturnVelocity(state, player);
  }

  private setReturnVelocity(state: BoomerangState, player: PlayerState): void {
    const dx = player.x - state.x;
    const dy = player.y - state.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    state.vx = (dx / distance) * this.returnSpeed;
    state.vy = (dy / distance) * this.returnSpeed;
  }

  private setQuadraticPosition(state: BoomerangState, progress: number, returning: boolean): void {
    const t = Math.min(1, Math.max(0, progress));
    const startX = returning ? state.returnStartX : state.curveStartX;
    const startY = returning ? state.returnStartY : state.curveStartY;
    const controlX = returning ? state.returnControlX : state.curveControlX;
    const controlY = returning ? state.returnControlY : state.curveControlY;
    const endX = returning ? state.returnTargetX : state.curveEndX;
    const endY = returning ? state.returnTargetY : state.curveEndY;
    const inverse = 1 - t;
    state.x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX;
    state.y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY;
  }

  private hitAlongSegment(
    state: BoomerangState,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    phase: 'outbound' | 'returning'
  ): void {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const midX = (startX + endX) * 0.5;
    const midY = (startY + endY) * 0.5;
    const candidates = this.context.enemies.queryCircle(midX, midY, length * 0.5 + state.radius + 48);
    const ledger = state.evolution === 'twin_comet'
      ? phase === 'outbound' ? this.twinOutboundHitGenerations : this.twinReturnHitGenerations
      : phase === 'outbound' ? this.outboundHitGenerations[state.slotIndex] : this.returnHitGenerations[state.slotIndex];

    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0 || ledger[index] === enemy.generation) continue;
      if (distanceToSegmentSquared(enemy.x, enemy.y, startX, startY, dx, dy) > (state.radius + enemy.radius) ** 2) continue;
      ledger[index] = enemy.generation;
      const phaseMultiplier = state.evolution === 'twin_comet'
        ? 1.1
        : state.evolution === 'singularity_return'
          ? phase === 'outbound' ? 0.5 : 0.8
          : 1;
      enemy.health -= this.context.rollCriticalDamage(state.damage * phaseMultiplier);
      if (enemy.health <= 0) this.context.onEnemyDefeated(enemy);
    }
  }

  private applyRankTuning(): void {
    this.damage = getWeaponDamageAtRank('boomerang', this.rank)
      * this.permanentDamageMultiplier
      * this.overdrivePowerMultiplier;
    this.speed = BOOMERANG_DEFINITION.speed;
    this.returnSpeed = this.rank >= 4 ? 500 : BOOMERANG_DEFINITION.returnSpeed;
    this.radius = this.rank >= 5 ? 13 : BOOMERANG_DEFINITION.radius;
    this.outboundDistance = this.rank >= 3 ? 280 : BOOMERANG_DEFINITION.outboundDistance;
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
  const progress = lengthSquared <= EPSILON
    ? 0
    : Math.min(1, Math.max(0, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  const closestX = startX + deltaX * progress;
  const closestY = startY + deltaY * progress;
  const offsetX = pointX - closestX;
  const offsetY = pointY - closestY;
  return offsetX * offsetX + offsetY * offsetY;
};

const normalizeMultiplier = (value: number): number => (
  Number.isFinite(value) && value > 0 ? value : 1
);

const normalizePowerMultiplier = (value: number): number => (
  Number.isFinite(value) ? Math.min(OVERDRIVE_POWER_MULTIPLIER_CAP, Math.max(1, value)) : 1
);
