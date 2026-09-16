import { ARENA_CENTER } from '../../config/constants';
import { getArenaRadiusAtAngle, type ArenaBoundaryInput } from '../ArenaBoundary';
import type { PlayerState } from '../PlayerModel';

export type FractureThreatKind = 'battery' | 'mine';

export interface FractureProjectileState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  ageSeconds: number;
  lifetimeSeconds: number;
  sequence: number;
}

export interface FractureMineState {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  damageRadius: number;
  damage: number;
  ageSeconds: number;
  armSeconds: number;
  detonateSeconds: number;
  sequence: number;
}

export interface FractureThreatUpdate {
  readonly amount: number;
  readonly source: 'fracture-projectile' | 'fracture-mine';
}

export interface FractureThreatEmitter {
  fireProjectile(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    spreadRadians?: number,
    count?: number
  ): number;
  deployMine(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    damage?: number
  ): number;
}

const PROJECTILE_CAPACITY = 48;
const MINE_CAPACITY = 12;
const EPSILON = 0.000001;

const createProjectile = (): FractureProjectileState => ({
  active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 6, damage: 0,
  ageSeconds: 0, lifetimeSeconds: 3, sequence: 0
});

const createMine = (): FractureMineState => ({
  active: false, x: 0, y: 0, radius: 11, damageRadius: 62, damage: 0,
  ageSeconds: 0, armSeconds: 0.72, detonateSeconds: 2.45, sequence: 0
});

/**
 * Bounded Act III hostile ordnance. It owns no rendering and deliberately
 * uses fixed arrays so the Fracture mix stays safe on mobile under pressure.
 */
export class FractureThreatSystem implements FractureThreatEmitter {
  public readonly projectiles = Array.from({ length: PROJECTILE_CAPACITY }, createProjectile);
  public readonly mines = Array.from({ length: MINE_CAPACITY }, createMine);
  private projectileCursor = 0;
  private mineCursor = 0;
  private sequence = 0;

  public fireProjectile(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    spreadRadians = 0,
    count = 1
  ): number {
    let created = 0;
    const total = Math.max(1, Math.floor(count));
    const baseAngle = Math.atan2(targetY - originY, targetX - originX);
    for (let index = 0; index < total; index += 1) {
      const state = this.acquireProjectile();
      if (!state) break;
      const offset = total === 1 ? 0 : (index / (total - 1) - 0.5) * spreadRadians;
      const angle = baseAngle + offset;
      state.x = originX;
      state.y = originY;
      state.vx = Math.cos(angle) * Math.max(1, speed);
      state.vy = Math.sin(angle) * Math.max(1, speed);
      state.radius = 6;
      state.damage = Math.max(0, damage);
      state.ageSeconds = 0;
      state.lifetimeSeconds = 3.1;
      state.sequence = ++this.sequence;
      created += 1;
    }
    return created;
  }

  public deployMine(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    damage = 18
  ): number {
    const state = this.acquireMine();
    if (!state) return 0;
    state.x = targetX;
    state.y = targetY;
    state.radius = 11;
    state.damageRadius = 62;
    state.damage = Math.max(0, damage);
    state.ageSeconds = 0;
    state.armSeconds = 0.72;
    state.detonateSeconds = 2.45;
    state.sequence = ++this.sequence;
    // Keep the origin argument meaningful to callers and make a malformed
    // target harmless without adding allocations to the update loop.
    if (!Number.isFinite(originX + originY)) {
      state.x = ARENA_CENTER.x;
      state.y = ARENA_CENTER.y;
    }
    return 1;
  }

  public update(dtSeconds: number, player: PlayerState, arena: ArenaBoundaryInput): FractureThreatUpdate | null {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return null;
    let amount = 0;
    let source: FractureThreatUpdate['source'] = 'fracture-projectile';
    for (const state of this.projectiles) {
      if (!state.active) continue;
      state.ageSeconds += dt;
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      const distance = Math.hypot(player.x - state.x, player.y - state.y);
      if (distance <= player.radius + state.radius) {
        amount += state.damage;
        source = 'fracture-projectile';
        state.active = false;
        continue;
      }
      const angle = Math.atan2(state.y - ARENA_CENTER.y, state.x - ARENA_CENTER.x);
      if (state.ageSeconds >= state.lifetimeSeconds
        || Math.hypot(state.x - ARENA_CENTER.x, state.y - ARENA_CENTER.y)
          > getArenaRadiusAtAngle(arena, angle) + 80) {
        state.active = false;
      }
    }
    for (const state of this.mines) {
      if (!state.active) continue;
      state.ageSeconds += dt;
      if (state.ageSeconds + EPSILON < state.armSeconds) continue;
      if (state.ageSeconds >= state.detonateSeconds) {
        if (Math.hypot(player.x - state.x, player.y - state.y) <= player.radius + state.damageRadius) {
          amount += state.damage;
          source = 'fracture-mine';
        }
        state.active = false;
      }
    }
    return amount > 0 ? { amount, source } : null;
  }

  public reset(): void {
    for (const state of this.projectiles) state.active = false;
    for (const state of this.mines) state.active = false;
    this.projectileCursor = 0;
    this.mineCursor = 0;
    this.sequence = 0;
  }

  private acquireProjectile(): FractureProjectileState | null {
    for (let offset = 0; offset < this.projectiles.length; offset += 1) {
      const index = (this.projectileCursor + offset) % this.projectiles.length;
      const state = this.projectiles[index];
      if (state.active) continue;
      state.active = true;
      this.projectileCursor = (index + 1) % this.projectiles.length;
      return state;
    }
    return null;
  }

  private acquireMine(): FractureMineState | null {
    for (let offset = 0; offset < this.mines.length; offset += 1) {
      const index = (this.mineCursor + offset) % this.mines.length;
      const state = this.mines[index];
      if (state.active) continue;
      state.active = true;
      this.mineCursor = (index + 1) % this.mines.length;
      return state;
    }
    return null;
  }
}
