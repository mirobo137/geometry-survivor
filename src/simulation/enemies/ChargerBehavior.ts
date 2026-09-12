import { CHARGER_DEFINITION } from '../../content/enemies/EnemyDefinitions';
import { ARENA_CENTER } from '../../config/constants';
import type { PlayerState } from '../PlayerModel';
import type { EnemyState } from '../combat/EntityPools';

const EPSILON = 0.001;
const moveToward = (state: EnemyState, x: number, y: number, speed: number, dt: number): boolean => {
  const dx = x - state.x; const dy = y - state.y; const distance = Math.hypot(dx, dy);
  if (distance <= EPSILON) { state.vx = 0; state.vy = 0; state.x = x; state.y = y; return true; }
  const step = Math.min(distance, speed * dt);
  state.vx = dx / distance * speed; state.vy = dy / distance * speed;
  state.x += dx / distance * step; state.y += dy / distance * step;
  return step >= distance - EPSILON;
};

/** Pure fixed-line dash. Player location is sampled once when the warning begins. */
export class ChargerBehavior {
  public configure(state: EnemyState): void {
    state.chargerPhase = 'approach'; state.chargerProgress = 0; state.chargerTimer = 0;
    state.chargerSequence = 0; state.contactEnabled = true;
  }

  public update(state: EnemyState, dt: number, player: PlayerState, arenaRadius: number, allowCharge = true): void {
    state.contactEnabled = true;
    if (state.chargerPhase === 'approach') {
      const dx = state.x - ARENA_CENTER.x; const dy = state.y - ARENA_CENTER.y;
      const length = Math.max(EPSILON, Math.hypot(dx, dy));
      if (!moveToward(state, ARENA_CENTER.x + dx / length * (arenaRadius - CHARGER_DEFINITION.approachInset), ARENA_CENTER.y + dy / length * (arenaRadius - CHARGER_DEFINITION.approachInset), CHARGER_DEFINITION.approachSpeed, dt)) return;
      state.chargerPhase = 'telegraph'; state.chargerTimer = 0; state.chargerProgress = 0; state.chargerSequence += 1;
      const directionX = player.x - state.x; const directionY = player.y - state.y;
      const distance = Math.max(EPSILON, Math.hypot(directionX, directionY));
      state.chargerAimX = state.x + directionX / distance * (arenaRadius * 2 + CHARGER_DEFINITION.exitDistance);
      state.chargerAimY = state.y + directionY / distance * (arenaRadius * 2 + CHARGER_DEFINITION.exitDistance);
      state.chargerEndX = state.chargerAimX; state.chargerEndY = state.chargerAimY;
      return;
    }
    if (state.chargerPhase === 'telegraph') {
      state.vx = 0; state.vy = 0; state.chargerTimer += dt;
      state.chargerProgress = Math.min(1, state.chargerTimer / CHARGER_DEFINITION.telegraphSeconds);
      if (state.chargerTimer >= CHARGER_DEFINITION.telegraphSeconds && allowCharge) { state.chargerPhase = 'charge'; state.chargerTimer = 0; state.chargerProgress = 0; }
      return;
    }
    if (state.chargerPhase === 'charge') {
      state.chargerTimer += dt; state.chargerProgress = Math.min(1, state.chargerTimer / CHARGER_DEFINITION.chargeSeconds);
      moveToward(state, state.chargerEndX, state.chargerEndY, Math.hypot(state.chargerEndX - state.x, state.chargerEndY - state.y) / Math.max(EPSILON, CHARGER_DEFINITION.chargeSeconds - state.chargerTimer + dt), dt);
      if (state.chargerTimer >= CHARGER_DEFINITION.chargeSeconds) { state.chargerPhase = 'recovery'; state.chargerTimer = 0; state.chargerProgress = 0; }
      return;
    }
    state.chargerTimer += dt; state.chargerProgress = Math.min(1, state.chargerTimer / CHARGER_DEFINITION.recoverySeconds);
    if (state.chargerTimer >= CHARGER_DEFINITION.recoverySeconds) this.configure(state);
  }
}
