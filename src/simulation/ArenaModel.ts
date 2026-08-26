import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS
} from '../config/constants';

export interface ArenaState {
  readonly elapsedSeconds: number;
  readonly radius: number;
  readonly expansionProgress: number;
}

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * Owns arena timing in simulation space. Rendering can observe this snapshot,
 * but it never decides when the playable boundary changes.
 */
export class ArenaModel {
  public state: ArenaState = {
    elapsedSeconds: 0,
    radius: ARENA_RADIUS,
    expansionProgress: 0
  };

  public update(dtSeconds: number): void {
    const elapsedSeconds = this.state.elapsedSeconds + Math.max(0, dtSeconds);
    const linearProgress = clamp01(
      (elapsedSeconds - ARENA_EXPANSION_START_SECONDS) / ARENA_EXPANSION_DURATION_SECONDS
    );
    // Smooth only the short expansion itself; the arena remains unchanged for
    // the opening minute so the player can learn the initial space first.
    const expansionProgress = linearProgress * linearProgress * (3 - 2 * linearProgress);
    const radius = ARENA_RADIUS + (ARENA_MAX_RADIUS - ARENA_RADIUS) * expansionProgress;

    this.state = { elapsedSeconds, radius, expansionProgress };
  }
}
