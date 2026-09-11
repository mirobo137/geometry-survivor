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

const shortestAngularDistance = (from: number, to: number): number => {
  const delta = normalizeAngle(to - from);
  return delta > Math.PI ? delta - FULL_CIRCLE : delta;
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

/**
 * Pure per-enemy Angular movement. A later Angular director chooses when to
 * create Orbiters; this class only executes an already-authored route.
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
    state.orbiterTimer = 0;
    state.orbiterSequence = 0;
    state.contactEnabled = false;
  }

  public update(state: EnemyState, dt: number, player: PlayerState, arenaRadius: number, allowCommit = true): void {
    state.orbiterBandRadius = this.getBandRadius(arenaRadius, state.radius);
    switch (state.orbiterPhase) {
      case 'approach':
        this.updateApproach(state, dt);
        break;
      case 'telegraph':
        this.updateTelegraph(state, dt, player, allowCommit);
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

  private updateApproach(state: EnemyState, dt: number): void {
    state.contactEnabled = false;
    const target = this.getPoint(state.orbiterBandRadius, state.orbiterStartAngle);
    if (!moveToward(state, target.x, target.y, ORBITER_DEFINITION.approachSpeed, dt)) return;
    state.orbiterPhase = 'telegraph';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
    state.orbiterSequence += 1;
  }

  private updateTelegraph(state: EnemyState, dt: number, player: PlayerState, allowCommit: boolean): void {
    state.contactEnabled = false;
    state.vx = 0;
    state.vy = 0;
    if (this.playerOccupiesCommitLane(state, player)) {
      state.orbiterPhase = 'recovery';
      state.orbiterTimer = 0;
      state.orbiterProgress = 0;
      return;
    }
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
    const point = this.getPoint(state.orbiterBandRadius, angle);
    state.x = point.x;
    state.y = point.y;
    state.vx = -Math.sin(angle) * state.orbiterDirection * state.orbiterBandRadius * ORBITER_DEFINITION.commitAngularSpeed;
    state.vy = Math.cos(angle) * state.orbiterDirection * state.orbiterBandRadius * ORBITER_DEFINITION.commitAngularSpeed;
    if (state.orbiterTimer < ORBITER_DEFINITION.commitSeconds) return;
    state.orbiterPhase = 'recovery';
    state.orbiterTimer = 0;
    state.orbiterProgress = 0;
    state.contactEnabled = false;
  }

  private updateRecovery(state: EnemyState, dt: number, arenaRadius: number): void {
    state.contactEnabled = false;
    state.orbiterTimer += dt;
    const radialDistance = Math.hypot(state.x - ARENA_CENTER.x, state.y - ARENA_CENTER.y);
    const angle = radialDistance > EPSILON
      ? Math.atan2(state.y - ARENA_CENTER.y, state.x - ARENA_CENTER.x)
      : state.orbiterStartAngle;
    const target = this.getPoint(Math.max(arenaRadius + 56, state.orbiterBandRadius + 42), angle);
    moveToward(state, target.x, target.y, ORBITER_DEFINITION.approachSpeed, dt);
    state.orbiterProgress = Math.min(1, state.orbiterTimer / ORBITER_DEFINITION.recoverySeconds);
    if (state.orbiterTimer < ORBITER_DEFINITION.recoverySeconds) return;
    state.orbiterSector = (state.orbiterSector + (state.orbiterDirection > 0 ? 3 : 5)) % ORBITER_DEFINITION.sectorCount;
    state.orbiterStartAngle = this.getSectorStartAngle(state.orbiterSector);
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

  private getPoint(radius: number, angle: number): { readonly x: number; readonly y: number } {
    return {
      x: ARENA_CENTER.x + Math.cos(angle) * radius,
      y: ARENA_CENTER.y + Math.sin(angle) * radius
    };
  }

  private playerOccupiesCommitLane(state: EnemyState, player: PlayerState): boolean {
    const dx = player.x - ARENA_CENTER.x;
    const dy = player.y - ARENA_CENTER.y;
    const distance = Math.hypot(dx, dy);
    const laneHalfWidth = player.radius + state.radius + 16;
    if (Math.abs(distance - state.orbiterBandRadius) > laneHalfWidth) return false;
    const playerAngle = Math.atan2(dy, dx);
    const travelCenter = state.orbiterStartAngle
      + state.orbiterDirection * ORBITER_DEFINITION.reservedArcRadians * 0.5;
    return Math.abs(shortestAngularDistance(travelCenter, playerAngle))
      <= ORBITER_DEFINITION.reservedArcRadians * 0.5 + 0.16;
  }
}
