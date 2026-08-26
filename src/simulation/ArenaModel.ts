import {
  ARENA_EXPANSION_DURATION_SECONDS,
  ARENA_INTERMEDIATE_RADIUS,
  ARENA_EXPANSION_START_SECONDS,
  ARENA_MAX_RADIUS,
  ARENA_RADIUS,
  ARENA_RESONANCE_DURATION_SECONDS,
  ARENA_SECOND_EXPANSION_START_SECONDS
} from '../config/constants';

export interface ArenaState {
  readonly elapsedSeconds: number;
  readonly radius: number;
  readonly expansionProgress: number;
  readonly expansionIndex: number;
  readonly resonance: number;
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
    expansionProgress: 0,
    expansionIndex: 0,
    resonance: 0
  };

  public update(dtSeconds: number): void {
    const elapsedSeconds = this.state.elapsedSeconds + Math.max(0, dtSeconds);
    const firstLinearProgress = clamp01(
      (elapsedSeconds - ARENA_EXPANSION_START_SECONDS) / ARENA_EXPANSION_DURATION_SECONDS
    );
    const secondLinearProgress = clamp01(
      (elapsedSeconds - ARENA_SECOND_EXPANSION_START_SECONDS) / ARENA_EXPANSION_DURATION_SECONDS
    );
    // Each expansion is short and eased, with a stable plateau between them.
    const firstProgress = firstLinearProgress * firstLinearProgress * (3 - 2 * firstLinearProgress);
    const secondProgress = secondLinearProgress * secondLinearProgress * (3 - 2 * secondLinearProgress);
    const radius = ARENA_RADIUS
      + (ARENA_INTERMEDIATE_RADIUS - ARENA_RADIUS) * firstProgress
      + (ARENA_MAX_RADIUS - ARENA_INTERMEDIATE_RADIUS) * secondProgress;
    const expansionProgress = (firstProgress + secondProgress) * 0.5;
    const expansionIndex = secondLinearProgress > 0 ? 2 : firstLinearProgress > 0 ? 1 : 0;
    const resonance = Math.max(
      this.expansionResonance(elapsedSeconds, ARENA_EXPANSION_START_SECONDS),
      this.expansionResonance(elapsedSeconds, ARENA_SECOND_EXPANSION_START_SECONDS)
    );

    this.state = { elapsedSeconds, radius, expansionProgress, expansionIndex, resonance };
  }

  private expansionResonance(elapsedSeconds: number, startSeconds: number): number {
    const age = elapsedSeconds - startSeconds;
    if (age < 0 || age >= ARENA_RESONANCE_DURATION_SECONDS) return 0;
    const progress = age / ARENA_RESONANCE_DURATION_SECONDS;
    return Math.sin(progress * Math.PI);
  }
}
