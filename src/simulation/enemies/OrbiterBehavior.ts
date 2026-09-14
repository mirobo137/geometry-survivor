import {
  ORBITER_DEFINITION,
  type OrbiterDirection
} from '../../content/enemies/EnemyDefinitions';
import type { PlayerState } from '../PlayerModel';
import type { EnemyState } from '../combat/EntityPools';

const FULL_CIRCLE = Math.PI * 2;
const EPSILON = 0.001;

const normalizeAngle = (angle: number): number => ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;

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

/**
 * Pure per-enemy Angular movement. The Orbiter chases the player directly for
 * an authored delay, launches from its current position without distance
 * gating, commits that route without homing, and resumes the same direct chase
 * after recovery.
 */
export class OrbiterBehavior {
  public configure(state: EnemyState, spawnIndex: number): void {
    const sector = ((spawnIndex % ORBITER_DEFINITION.sectorCount) + ORBITER_DEFINITION.sectorCount)
      % ORBITER_DEFINITION.sectorCount;
    const direction: OrbiterDirection = spawnIndex % 2 === 0 ? 1 : -1;
    state.orbiterPhase = 'approach';
    state.orbiterDirection = direction;
    state.orbiterSector = sector;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = 0;
    state.orbiterStartAngle = this.getSectorStartAngle(sector);
    state.orbiterRouteCenterX = 0;
    state.orbiterRouteCenterY = 0;
    state.orbiterRouteRadius = 0;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    // Contact remains active through approach, telegraph, commit and recovery.
    state.contactEnabled = true;
  }

  public update(
    state: EnemyState,
    dt: number,
    player: PlayerState,
    allowCommit = true
  ): void {
    switch (state.orbiterPhase) {
      case 'approach':
        this.updateApproach(state, dt, player);
        break;
      case 'telegraph':
        this.updateTelegraph(state, dt, allowCommit);
        break;
      case 'commit':
        this.updateCommit(state, dt);
        break;
      case 'recovery':
        this.updateRecovery(state, dt, player);
        break;
      default:
        this.configure(state, 0);
        break;
    }
  }

  private updateApproach(state: EnemyState, dt: number, player: PlayerState): void {
    state.contactEnabled = true;
    state.orbiterTimer += dt;
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.attackDelaySeconds);
    // Direct pursuit is intentional: no fixed side, arena-center anchor or
    // lateral staging can make the Orbiter appear to flee from the player.
    moveToward(state, player.x, player.y, ORBITER_DEFINITION.approachSpeed, dt);
    if (state.orbiterTimer < ORBITER_DEFINITION.attackDelaySeconds) return;
    this.captureRoute(state, player);
    state.orbiterPhase = 'telegraph';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
    state.orbiterSequence += 1;
  }

  private updateTelegraph(state: EnemyState, dt: number, allowCommit: boolean): void {
    state.contactEnabled = true;
    state.vx = 0;
    state.vy = 0;
    state.orbiterTimer += dt;
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.telegraphSeconds);
    if (state.orbiterTimer < ORBITER_DEFINITION.telegraphSeconds) return;
    if (!allowCommit) {
      state.orbiterTimer = ORBITER_DEFINITION.telegraphSeconds;
      state.orbiterProgress = 1;
      return;
    }
    state.orbiterPhase = 'commit';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
    state.contactEnabled = true;
  }

  private updateCommit(state: EnemyState, dt: number): void {
    state.contactEnabled = true;
    state.orbiterTimer += dt;
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.commitSeconds);
    const angle = state.orbiterStartAngle
      + state.orbiterDirection * ORBITER_DEFINITION.commitAngularSpeed * state.orbiterTimer;
    const radius = state.orbiterRouteRadius;
    state.x = state.orbiterRouteCenterX + Math.cos(angle) * radius;
    state.y = state.orbiterRouteCenterY + Math.sin(angle) * radius;
    state.vx = -Math.sin(angle) * state.orbiterDirection * radius * ORBITER_DEFINITION.commitAngularSpeed;
    state.vy = Math.cos(angle) * state.orbiterDirection * radius * ORBITER_DEFINITION.commitAngularSpeed;
    if (state.orbiterTimer < ORBITER_DEFINITION.commitSeconds) return;
    state.orbiterPhase = 'recovery';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
  }

  private updateRecovery(state: EnemyState, dt: number, player: PlayerState): void {
    state.contactEnabled = true;
    state.orbiterTimer += dt;
    // Recovery keeps the same readable intent as approach: chase the current
    // player position instead of retreating toward an arena-centered exit.
    moveToward(state, player.x, player.y, ORBITER_DEFINITION.approachSpeed, dt);
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.recoverySeconds);
    if (state.orbiterTimer < ORBITER_DEFINITION.recoverySeconds) return;
    state.orbiterSector = (state.orbiterSector + (state.orbiterDirection > 0 ? 3 : 5)) % ORBITER_DEFINITION.sectorCount;
    state.orbiterPhase = 'approach';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
  }

  private getSectorStartAngle(sector: number): number {
    return normalizeAngle(sector * FULL_CIRCLE / ORBITER_DEFINITION.sectorCount);
  }

  private captureRoute(state: EnemyState, player: PlayerState): void {
    const fromPlayerX = state.x - player.x;
    const fromPlayerY = state.y - player.y;
    const fromPlayerDistance = Math.hypot(fromPlayerX, fromPlayerY);
    const radialX = fromPlayerDistance > EPSILON
      ? fromPlayerX / fromPlayerDistance
      : Math.cos(state.orbiterStartAngle);
    const radialY = fromPlayerDistance > EPSILON
      ? fromPlayerY / fromPlayerDistance
      : Math.sin(state.orbiterStartAngle);
    const routeRadius = ORBITER_DEFINITION.attackRadius;
    // The center is placed behind the ship toward the player. The route is
    // therefore local, starts at the actual hull, and remains readable even
    // when the timed cast happens before the Orbiter reaches the player.
    const centerX = state.x - radialX * routeRadius;
    const centerY = state.y - radialY * routeRadius;

    state.orbiterRouteCenterX = centerX;
    state.orbiterRouteCenterY = centerY;
    state.orbiterRouteRadius = routeRadius;
    // Keep the old diagnostic field for debug sheets and authored references.
    state.orbiterBandRadius = routeRadius;
    state.orbiterStartAngle = Math.atan2(state.y - centerY, state.x - centerX);
  }
}
