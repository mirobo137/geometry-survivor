import { WEAPON_DEFINITIONS } from '../../content/weapons/WeaponDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { EnemyState, BoomerangPool, BoomerangState } from './EntityPools';
import type { EnemySystem } from '../enemies/EnemySystem';

const BOOMERANG_DEFINITION = WEAPON_DEFINITIONS.vectorBoomerang;
const TARGET_SEARCH_RADIUS = 960;
const CAPTURE_PADDING = 6;
const EPSILON = 0.000001;

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
  private unlocked = false;
  private damage = BOOMERANG_DEFINITION.damage;
  private permanentDamageMultiplier = 1;

  public constructor(private readonly context: BoomerangBehaviorContext) {
    this.outboundHitGenerations = Array.from(
      { length: context.boomerangs.capacity },
      () => new Uint32Array(context.enemies.pool.capacity)
    );
    this.returnHitGenerations = Array.from(
      { length: context.boomerangs.capacity },
      () => new Uint32Array(context.enemies.pool.capacity)
    );
  }

  public get isUnlocked(): boolean {
    return this.unlocked;
  }

  public get currentDamage(): number {
    return this.damage;
  }

  public unlock(): boolean {
    if (this.unlocked) return false;
    this.unlocked = true;
    return true;
  }

  public increaseDamage(amount: number): void {
    this.damage += Math.max(0, amount);
  }

  public setPermanentDamageMultiplier(multiplier: number): void {
    this.permanentDamageMultiplier = normalizeMultiplier(multiplier);
    this.damage = BOOMERANG_DEFINITION.damage * this.permanentDamageMultiplier;
  }

  public fire(player: PlayerState): void {
    if (!this.unlocked || this.context.boomerangs.activeCount >= BOOMERANG_DEFINITION.maxActive) return;
    const targetIndex = this.context.enemies.findNearestEnemyIndex(player.x, player.y, TARGET_SEARCH_RADIUS);
    if (targetIndex < 0) return;
    const target = this.context.enemies.getState(targetIndex);
    if (!target.active || target.health <= 0) return;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    const state = this.context.boomerangs.acquire();
    if (!state) return;

    state.x = player.x;
    state.y = player.y;
    state.vx = (dx / distance) * BOOMERANG_DEFINITION.speed;
    state.vy = (dy / distance) * BOOMERANG_DEFINITION.speed;
    state.radius = BOOMERANG_DEFINITION.radius;
    state.damage = this.damage;
    state.ageSeconds = 0;
    state.lifetimeSeconds = BOOMERANG_DEFINITION.lifetimeSeconds;
    state.phase = 'outbound';
    state.directionX = dx / distance;
    state.directionY = dy / distance;
    state.distanceTravelled = 0;
    this.outboundHitGenerations[state.slotIndex].fill(0);
    this.returnHitGenerations[state.slotIndex].fill(0);
  }

  public update(dtSeconds: number, player: PlayerState): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return;

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
          const distanceToTurn = Math.max(0, BOOMERANG_DEFINITION.outboundDistance - state.distanceTravelled);
          if (distanceToTurn <= EPSILON) {
            state.phase = 'returning';
            this.setReturnVelocity(state, player);
            continue;
          }

          const travel = Math.min(BOOMERANG_DEFINITION.speed * remaining, distanceToTurn);
          const startX = state.x;
          const startY = state.y;
          state.x += state.directionX * travel;
          state.y += state.directionY * travel;
          state.vx = state.directionX * BOOMERANG_DEFINITION.speed;
          state.vy = state.directionY * BOOMERANG_DEFINITION.speed;
          state.distanceTravelled += travel;
          this.hitAlongSegment(state, startX, startY, state.x, state.y, 'outbound');
          remaining -= travel / BOOMERANG_DEFINITION.speed;
          if (state.distanceTravelled >= BOOMERANG_DEFINITION.outboundDistance - EPSILON) {
            state.phase = 'returning';
            this.setReturnVelocity(state, player);
          }
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
        state.vx = directionX * BOOMERANG_DEFINITION.returnSpeed;
        state.vy = directionY * BOOMERANG_DEFINITION.returnSpeed;
        const travel = Math.min(BOOMERANG_DEFINITION.returnSpeed * remaining, distance);
        const startX = state.x;
        const startY = state.y;
        state.x += directionX * travel;
        state.y += directionY * travel;
        this.hitAlongSegment(state, startX, startY, state.x, state.y, 'returning');
        remaining -= travel / BOOMERANG_DEFINITION.returnSpeed;
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
    }
    for (const ledger of this.outboundHitGenerations) ledger.fill(0);
    for (const ledger of this.returnHitGenerations) ledger.fill(0);
    this.unlocked = false;
    this.damage = BOOMERANG_DEFINITION.damage * this.permanentDamageMultiplier;
  }

  private setReturnVelocity(state: BoomerangState, player: PlayerState): void {
    const dx = player.x - state.x;
    const dy = player.y - state.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    state.vx = (dx / distance) * BOOMERANG_DEFINITION.returnSpeed;
    state.vy = (dy / distance) * BOOMERANG_DEFINITION.returnSpeed;
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
    const ledger = phase === 'outbound'
      ? this.outboundHitGenerations[state.slotIndex]
      : this.returnHitGenerations[state.slotIndex];

    for (const index of candidates) {
      const enemy = this.context.enemies.getState(index);
      if (!enemy.active || enemy.health <= 0 || ledger[index] === enemy.generation) continue;
      if (distanceToSegmentSquared(enemy.x, enemy.y, startX, startY, dx, dy) > (state.radius + enemy.radius) ** 2) continue;
      ledger[index] = enemy.generation;
      enemy.health -= this.context.rollCriticalDamage(state.damage);
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
