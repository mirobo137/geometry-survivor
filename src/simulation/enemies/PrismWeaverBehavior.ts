import { PRISM_WEAVER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import type { EnemyState } from '../combat/EntityPools';

const FULL_CIRCLE = Math.PI * 2;
const SPOKE_SEPARATION = FULL_CIRCLE / PRISM_WEAVER_DEFINITION.spokeCount;
const EPSILON = 0.001;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const normalizeAngle = (angle: number): number => ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
const shortestAngle = (angle: number): number => {
  const normalized = normalizeAngle(angle + Math.PI) - Math.PI;
  return normalized === -Math.PI ? Math.PI : normalized;
};

const moveToward = (state: EnemyState, targetX: number, targetY: number, speed: number, dt: number): boolean => {
  const dx = targetX - state.x;
  const dy = targetY - state.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= EPSILON) {
    state.vx = 0;
    state.vy = 0;
    state.x = targetX;
    state.y = targetY;
    return true;
  }
  const step = Math.min(distance, speed * dt);
  state.vx = dx / distance * (step / dt);
  state.vy = dy / distance * (step / dt);
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  return step >= distance - EPSILON;
};

export interface PrismWeaverUpdateResult {
  readonly damaged: boolean;
}

/**
 * Pure three-spoke control pattern for Act II. The warning samples a fixed
 * anchor, then the active cast rotates as one triangular lattice. No route is
 * cancelled when the player enters it during telegraph; the safe gaps are the
 * player's answer to the committed cast.
 */
export class PrismWeaverBehavior {
  public configure(state: EnemyState, spawnIndex: number, arenaRadius: number): void {
    const anchor = ((spawnIndex % PRISM_WEAVER_DEFINITION.anchorCount)
      + PRISM_WEAVER_DEFINITION.anchorCount) % PRISM_WEAVER_DEFINITION.anchorCount;
    const direction = spawnIndex % 2 === 0 ? 1 : -1;
    const angle = normalizeAngle(anchor * FULL_CIRCLE / PRISM_WEAVER_DEFINITION.anchorCount + Math.PI / 6);
    state.prismWeaverPhase = 'approach';
    state.prismWeaverProgress = 0;
    state.prismWeaverAngle = angle;
    state.prismWeaverStartAngle = angle;
    state.prismWeaverDirection = direction;
    state.prismWeaverRadius = this.getRadius(arenaRadius, state.radius);
    state.prismWeaverTimer = 0;
    state.prismWeaverSequence = 0;
    state.prismWeaverHitApplied = false;
    state.contactEnabled = true;
  }

  public update(
    state: EnemyState,
    dt: number,
    arenaRadius: number,
    player: PlayerState
  ): PrismWeaverUpdateResult {
    state.prismWeaverRadius = this.getRadius(arenaRadius, state.radius);
    switch (state.prismWeaverPhase) {
      case 'approach':
        this.updateApproach(state, dt);
        return { damaged: false };
      case 'telegraph':
        this.updateTelegraph(state, dt);
        return { damaged: false };
      case 'active':
        return { damaged: this.updateActive(state, dt, player) };
      case 'recovery':
        this.updateRecovery(state, dt);
        return { damaged: false };
      default:
        this.configure(state, 0, arenaRadius);
        return { damaged: false };
    }
  }

  public intersectsPlayer(state: EnemyState, player: PlayerState): boolean {
    const dx = player.x - state.x;
    const dy = player.y - state.y;
    const distance = Math.hypot(dx, dy);
    const outerRadius = state.prismWeaverRadius + player.radius;
    if (distance < PRISM_WEAVER_DEFINITION.innerRadius - player.radius || distance > outerRadius) return false;
    const playerAngle = Math.atan2(dy, dx);
    for (let spoke = 0; spoke < PRISM_WEAVER_DEFINITION.spokeCount; spoke += 1) {
      const spokeAngle = state.prismWeaverAngle + spoke * SPOKE_SEPARATION;
      if (Math.abs(shortestAngle(playerAngle - spokeAngle)) <= PRISM_WEAVER_DEFINITION.dangerHalfAngle) return true;
    }
    return false;
  }

  private updateApproach(state: EnemyState, dt: number): void {
    state.contactEnabled = true;
    const target = this.getPoint(state.prismWeaverRadius, state.prismWeaverStartAngle);
    if (!moveToward(state, target.x, target.y, PRISM_WEAVER_DEFINITION.approachSpeed, dt)) return;
    state.prismWeaverPhase = 'telegraph';
    state.prismWeaverTimer = 0;
    state.prismWeaverProgress = 0;
    state.prismWeaverSequence += 1;
    state.prismWeaverAngle = state.prismWeaverStartAngle;
    state.prismWeaverHitApplied = false;
  }

  private updateTelegraph(state: EnemyState, dt: number): void {
    state.contactEnabled = true;
    state.vx = 0;
    state.vy = 0;
    state.prismWeaverTimer += dt;
    state.prismWeaverProgress = clamp01(state.prismWeaverTimer / PRISM_WEAVER_DEFINITION.telegraphSeconds);
    if (state.prismWeaverTimer < PRISM_WEAVER_DEFINITION.telegraphSeconds) return;
    state.prismWeaverPhase = 'active';
    state.prismWeaverTimer = 0;
    state.prismWeaverProgress = 0;
    state.prismWeaverAngle = state.prismWeaverStartAngle;
    state.prismWeaverHitApplied = false;
  }

  private updateActive(state: EnemyState, dt: number, player: PlayerState): boolean {
    state.contactEnabled = true;
    state.vx = 0;
    state.vy = 0;
    state.prismWeaverTimer += dt;
    const progress = clamp01(state.prismWeaverTimer / PRISM_WEAVER_DEFINITION.activeSeconds);
    state.prismWeaverProgress = progress;
    // Smoothstep gives the player a readable opening and a deliberate finish.
    const eased = progress * progress * (3 - 2 * progress);
    state.prismWeaverAngle = normalizeAngle(
      state.prismWeaverStartAngle
      + state.prismWeaverDirection * PRISM_WEAVER_DEFINITION.travelRadians * eased
    );
    let damaged = false;
    if (!state.prismWeaverHitApplied && this.intersectsPlayer(state, player)) {
      state.prismWeaverHitApplied = true;
      damaged = true;
    }
    if (state.prismWeaverTimer < PRISM_WEAVER_DEFINITION.activeSeconds) return damaged;
    state.prismWeaverPhase = 'recovery';
    state.prismWeaverTimer = 0;
    state.prismWeaverProgress = 0;
    state.prismWeaverStartAngle = normalizeAngle(
      state.prismWeaverStartAngle + state.prismWeaverDirection * Math.PI / 3
    );
    return damaged;
  }

  private updateRecovery(state: EnemyState, dt: number): void {
    state.contactEnabled = true;
    state.prismWeaverTimer += dt;
    const target = this.getPoint(state.prismWeaverRadius, state.prismWeaverStartAngle);
    moveToward(state, target.x, target.y, PRISM_WEAVER_DEFINITION.approachSpeed, dt);
    state.prismWeaverProgress = clamp01(state.prismWeaverTimer / PRISM_WEAVER_DEFINITION.recoverySeconds);
    if (state.prismWeaverTimer < PRISM_WEAVER_DEFINITION.recoverySeconds) return;
    state.prismWeaverPhase = 'approach';
    state.prismWeaverTimer = 0;
    state.prismWeaverProgress = 0;
    state.prismWeaverAngle = state.prismWeaverStartAngle;
    state.prismWeaverHitApplied = false;
  }

  private getRadius(arenaRadius: number, bodyRadius: number): number {
    return Math.max(
      PRISM_WEAVER_DEFINITION.innerRadius + 32,
      Math.min(arenaRadius - bodyRadius - 18, PRISM_WEAVER_DEFINITION.maximumRadius)
    );
  }

  private getPoint(radius: number, angle: number): { readonly x: number; readonly y: number } {
    return {
      x: ARENA_CENTER.x + Math.cos(angle) * radius,
      y: ARENA_CENTER.y + Math.sin(angle) * radius
    };
  }
}
