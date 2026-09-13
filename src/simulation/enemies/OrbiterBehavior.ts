import {
  ORBITER_DEFINITION,
  type OrbiterDirection
} from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
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
 * Pure per-enemy Angular movement. The Orbiter shadows the player during
 * approach, then captures a local focus and commits a finite arc around it.
 * The focus is authored from the simulation snapshot; it is never the arena
 * center unless the player is actually there.
 */
export class OrbiterBehavior {
  public configure(state: EnemyState, spawnIndex: number, arenaRadius: number): void {
    const sector = ((spawnIndex % ORBITER_DEFINITION.sectorCount) + ORBITER_DEFINITION.sectorCount)
      % ORBITER_DEFINITION.sectorCount;
    const direction: OrbiterDirection = spawnIndex % 2 === 0 ? 1 : -1;
    state.orbiterPhase = 'approach';
    state.orbiterDirection = direction;
    state.orbiterSector = sector;
    state.orbiterProgress = 0;
    state.orbiterBandRadius = this.getBandRadius(arenaRadius, state.radius);
    state.orbiterStartAngle = this.getSectorStartAngle(sector);
    const fromCenterX = state.x - ARENA_CENTER.x;
    const fromCenterY = state.y - ARENA_CENTER.y;
    const fromCenterDistance = Math.hypot(fromCenterX, fromCenterY);
    state.orbiterFollowAngle = fromCenterDistance > EPSILON
      ? Math.atan2(fromCenterY, fromCenterX)
      : state.orbiterStartAngle;
    state.orbiterRouteCenterX = ARENA_CENTER.x;
    state.orbiterRouteCenterY = ARENA_CENTER.y;
    state.orbiterRouteRadius = state.orbiterBandRadius;
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    // The route is a telegraph only. Its physical hull is dangerous through
    // the whole cycle, so a player entering the future route cannot undo it.
    state.contactEnabled = true;
  }

  public update(
    state: EnemyState,
    dt: number,
    arenaRadius: number,
    player: PlayerState,
    allowCommit = true
  ): void {
    switch (state.orbiterPhase) {
      case 'approach':
        this.updateApproach(state, dt, arenaRadius, player);
        break;
      case 'telegraph':
        this.updateTelegraph(state, dt, allowCommit);
        break;
      case 'commit':
        this.updateCommit(state, dt);
        break;
      case 'recovery':
        this.updateRecovery(state, dt, arenaRadius);
        break;
      default:
        this.configure(state, 0, arenaRadius);
        break;
    }
  }

  private updateApproach(state: EnemyState, dt: number, arenaRadius: number, player: PlayerState): void {
    state.contactEnabled = true;
    if (!this.moveTowardFollowPosition(state, player, arenaRadius, dt)) return;
    this.captureRoute(state, player, arenaRadius);
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

  private updateRecovery(state: EnemyState, dt: number, arenaRadius: number): void {
    state.contactEnabled = true;
    state.orbiterTimer += dt;
    const radialDistance = Math.hypot(state.x - ARENA_CENTER.x, state.y - ARENA_CENTER.y);
    const angle = radialDistance > EPSILON
      ? Math.atan2(state.y - ARENA_CENTER.y, state.x - ARENA_CENTER.x)
      : state.orbiterStartAngle;
    const exitRadius = Math.max(arenaRadius + 56, state.orbiterBandRadius + 42);
    moveToward(
      state,
      ARENA_CENTER.x + Math.cos(angle) * exitRadius,
      ARENA_CENTER.y + Math.sin(angle) * exitRadius,
      ORBITER_DEFINITION.approachSpeed,
      dt
    );
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.recoverySeconds);
    if (state.orbiterTimer < ORBITER_DEFINITION.recoverySeconds) return;
    state.orbiterSector = (state.orbiterSector + (state.orbiterDirection > 0 ? 3 : 5)) % ORBITER_DEFINITION.sectorCount;
    state.orbiterStartAngle = this.getSectorStartAngle(state.orbiterSector);
    state.orbiterFollowAngle = angle;
    state.orbiterPhase = 'approach';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
  }

  private getBandRadius(arenaRadius: number, bodyRadius: number): number {
    return Math.max(48 + bodyRadius, Math.min(
      Math.max(0, arenaRadius - ORBITER_DEFINITION.bandInset - bodyRadius - 16),
      ORBITER_DEFINITION.maximumBandRadius
    ));
  }

  private getSectorStartAngle(sector: number): number {
    return normalizeAngle(sector * FULL_CIRCLE / ORBITER_DEFINITION.sectorCount);
  }

  private moveTowardFollowPosition(
    state: EnemyState,
    player: PlayerState,
    arenaRadius: number,
    dt: number
  ): boolean {
    // Keep one authored side for the entire approach. Recomputing this angle
    // from the moving body would make the destination orbit around itself and
    // the ship would never settle into the telegraph phase.
    const radialX = Math.cos(state.orbiterFollowAngle);
    const radialY = Math.sin(state.orbiterFollowAngle);
    const tangentX = -radialY * state.orbiterDirection;
    const tangentY = radialX * state.orbiterDirection;
    let targetX = player.x
      + radialX * ORBITER_DEFINITION.followDistance
      + tangentX * ORBITER_DEFINITION.followLateralOffset;
    let targetY = player.y
      + radialY * ORBITER_DEFINITION.followDistance
      + tangentY * ORBITER_DEFINITION.followLateralOffset;

    const maxDistance = Math.max(0, arenaRadius - state.radius - 18);
    const targetFromCenterX = targetX - ARENA_CENTER.x;
    const targetFromCenterY = targetY - ARENA_CENTER.y;
    const targetFromCenterDistance = Math.hypot(targetFromCenterX, targetFromCenterY);
    if (targetFromCenterDistance > maxDistance && targetFromCenterDistance > EPSILON) {
      const scale = maxDistance / targetFromCenterDistance;
      targetX = ARENA_CENTER.x + targetFromCenterX * scale;
      targetY = ARENA_CENTER.y + targetFromCenterY * scale;
    }

    // Near a wall the incoming side can be outside the arena. Move to an
    // inward staging point instead of collapsing the follow distance to zero.
    const targetDistanceFromPlayer = Math.hypot(targetX - player.x, targetY - player.y);
    if (targetDistanceFromPlayer < ORBITER_DEFINITION.followDistance * 0.65) {
      const inwardX = ARENA_CENTER.x - player.x;
      const inwardY = ARENA_CENTER.y - player.y;
      const inwardDistance = Math.hypot(inwardX, inwardY);
      if (inwardDistance > EPSILON) {
        const unitInwardX = inwardX / inwardDistance;
        const unitInwardY = inwardY / inwardDistance;
        targetX = player.x
          + unitInwardX * ORBITER_DEFINITION.followDistance * 0.82
          + (-unitInwardY * state.orbiterDirection) * ORBITER_DEFINITION.followLateralOffset * 0.5;
        targetY = player.y
          + unitInwardY * ORBITER_DEFINITION.followDistance * 0.82
          + (unitInwardX * state.orbiterDirection) * ORBITER_DEFINITION.followLateralOffset * 0.5;
        const fallbackFromCenterX = targetX - ARENA_CENTER.x;
        const fallbackFromCenterY = targetY - ARENA_CENTER.y;
        const fallbackDistance = Math.hypot(fallbackFromCenterX, fallbackFromCenterY);
        if (fallbackDistance > maxDistance && fallbackDistance > EPSILON) {
          const fallbackScale = maxDistance / fallbackDistance;
          targetX = ARENA_CENTER.x + fallbackFromCenterX * fallbackScale;
          targetY = ARENA_CENTER.y + fallbackFromCenterY * fallbackScale;
        }
      }
    }
    return moveToward(state, targetX, targetY, ORBITER_DEFINITION.approachSpeed, dt);
  }

  private captureRoute(state: EnemyState, player: PlayerState, arenaRadius: number): void {
    const fromPlayerX = state.x - player.x;
    const fromPlayerY = state.y - player.y;
    const fromPlayerDistance = Math.hypot(fromPlayerX, fromPlayerY);
    const radialX = fromPlayerDistance > EPSILON ? fromPlayerX / fromPlayerDistance : Math.cos(state.orbiterStartAngle);
    const radialY = fromPlayerDistance > EPSILON ? fromPlayerY / fromPlayerDistance : Math.sin(state.orbiterStartAngle);
    const inwardX = ARENA_CENTER.x - player.x;
    const inwardY = ARENA_CENTER.y - player.y;
    const inwardDistance = Math.hypot(inwardX, inwardY);
    const unitInwardX = inwardDistance > EPSILON ? inwardX / inwardDistance : 0;
    const unitInwardY = inwardDistance > EPSILON ? inwardY / inwardDistance : 0;
    const tangentX = -radialY * state.orbiterDirection;
    const tangentY = radialX * state.orbiterDirection;
    const sectorBias = (state.orbiterSector % 3) - 1;
    const focusInset = Math.min(ORBITER_DEFINITION.attackFocusInset, inwardDistance);
    let focusX = player.x
      + unitInwardX * focusInset
      + tangentX * sectorBias * ORBITER_DEFINITION.attackFocusLateralOffset;
    let focusY = player.y
      + unitInwardY * focusInset
      + tangentY * sectorBias * ORBITER_DEFINITION.attackFocusLateralOffset;

    const maxFocusDistance = Math.max(0, arenaRadius - state.radius - 22);
    const fromCenterX = focusX - ARENA_CENTER.x;
    const fromCenterY = focusY - ARENA_CENTER.y;
    const focusDistance = Math.hypot(fromCenterX, fromCenterY);
    if (focusDistance > maxFocusDistance && focusDistance > EPSILON) {
      const scale = maxFocusDistance / focusDistance;
      focusX = ARENA_CENTER.x + fromCenterX * scale;
      focusY = ARENA_CENTER.y + fromCenterY * scale;
    }

    const routeX = state.x - focusX;
    const routeY = state.y - focusY;
    const routeRadius = Math.hypot(routeX, routeY);
    state.orbiterRouteCenterX = focusX;
    state.orbiterRouteCenterY = focusY;
    state.orbiterRouteRadius = routeRadius;
    // Keep the old field as a diagnostic alias for existing debug consumers.
    state.orbiterBandRadius = routeRadius;
    state.orbiterStartAngle = routeRadius > EPSILON
      ? Math.atan2(routeY, routeX)
      : state.orbiterStartAngle;
  }

}
